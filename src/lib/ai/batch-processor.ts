import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiFlash, SYSTEM_PROMPTS } from "@/lib/ai/gemini";

interface ExtractedInfo {
  title: string;
  category: string;
  allergen_tags: string[];
  content: {
    product_name?: string;
    brand?: string;
    allergens?: string[];
    symptoms?: string[];
    hospital?: string;
    recipe?: string;
    restaurant?: string;
    challenge_progress?: string;
    tips?: string[];
    raw_summary: string;
  };
}

export async function runBatchExtraction() {
  const supabase = createAdminClient();
  const model = getGeminiFlash();

  // Log batch start
  const { data: batchLog } = await supabase
    .from("batch_logs")
    .insert({
      batch_type: "extraction",
      status: "running",
    })
    .select()
    .single();

  try {
    // Fetch all messages from last 24h that haven't been extracted
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*, profiles:user_id(trust_score, display_name)")
      .gte("created_at", oneDayAgo)
      .eq("ai_extracted", false)
      .eq("is_system_bot", false)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!messages || messages.length === 0) {
      await supabase
        .from("batch_logs")
        .update({ status: "completed", messages_processed: 0, completed_at: new Date().toISOString() })
        .eq("id", batchLog?.id);
      return { processed: 0 };
    }

    // Group messages by room for context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageTexts = (messages as any[]).map((m) => ({
      id: String(m.id),
      content: String(m.content),
      room_id: String(m.room_id),
    }));

    // Process in chunks of 50
    const chunkSize = 50;
    let totalCreated = 0;
    let totalUpdated = 0;

    for (let i = 0; i < messageTexts.length; i += chunkSize) {
      const chunk = messageTexts.slice(i, i + chunkSize);
      const prompt = `${SYSTEM_PROMPTS.batchExtractor}

以下のトーク投稿を解析し、一次情報を抽出してJSON配列で返してください。
情報が含まれていない投稿（挨拶のみ等）はスキップしてください。

投稿一覧:
${chunk.map((m) => `[ID:${m.id}] ${m.content}`).join("\n---\n")}

出力形式:
[{
  "source_message_id": "uuid",
  "title": "記事タイトル",
  "category": "カテゴリー",
  "allergen_tags": ["卵", "乳"],
  "content": {
    "raw_summary": "要約テキスト",
    "tips": ["工夫1", "工夫2"]
  }
}]`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Parse JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const extracted: (ExtractedInfo & { source_message_id: string })[] = JSON.parse(jsonMatch[0]);

          for (const item of extracted) {
            const slug = item.title
              .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, "-")
              .replace(/-+/g, "-")
              .toLowerCase()
              .slice(0, 100);

            // Upsert wiki entry
            const { data: existing } = await supabase
              .from("wiki_entries")
              .select("id, content_json, source_count")
              .eq("slug", slug)
              .single();

            if (existing) {
              // Merge content
              const mergedContent = {
                ...(existing.content_json as Record<string, unknown>),
                ...item.content,
              };
              await supabase
                .from("wiki_entries")
                .update({
                  content_json: mergedContent,
                  source_count: (existing.source_count || 0) + 1,
                  last_updated_from_batch: new Date().toISOString(),
                  allergen_tags: item.allergen_tags,
                })
                .eq("id", existing.id);
              totalUpdated++;
            } else {
              const { data: newEntry } = await supabase
                .from("wiki_entries")
                .insert({
                  title: item.title,
                  slug,
                  category: item.category,
                  content_json: item.content,
                  allergen_tags: item.allergen_tags,
                  source_count: 1,
                  last_updated_from_batch: new Date().toISOString(),
                  is_public: false,
                })
                .select()
                .single();

              if (newEntry) totalCreated++;
            }

            // Record source
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sourceMsg = (messages as any[]).find((m) => m.id === item.source_message_id);
            if (sourceMsg) {
              await supabase.from("wiki_sources").insert({
                wiki_entry_id: slug,
                original_message_snippet: String(sourceMsg.content).slice(0, 200),
                contributor_id: sourceMsg.user_id || null,
                contributor_trust_score: sourceMsg.profiles?.trust_score || 0,
              });
            }
          }
        } catch {
          console.error("[Batch] Failed to parse AI response chunk");
        }
      }

      // Mark messages as extracted
      const chunkIds = chunk.map((m) => m.id);
      await supabase
        .from("messages")
        .update({ ai_extracted: true })
        .in("id", chunkIds);
    }

    // Update batch log
    await supabase
      .from("batch_logs")
      .update({
        status: "completed",
        messages_processed: messages.length,
        wiki_entries_created: totalCreated,
        wiki_entries_updated: totalUpdated,
        completed_at: new Date().toISOString(),
      })
      .eq("id", batchLog?.id);

    return {
      processed: messages.length,
      created: totalCreated,
      updated: totalUpdated,
    };
  } catch (err) {
    console.error("[Batch] Error:", err);
    await supabase
      .from("batch_logs")
      .update({
        status: "error",
        error_log: String(err),
        completed_at: new Date().toISOString(),
      })
      .eq("id", batchLog?.id);
    throw err;
  }
}
