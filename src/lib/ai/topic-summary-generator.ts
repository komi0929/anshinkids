/**
 * Topic Summary Generator
 * トピック単位でAI要約を生成・更新するパイプライン。
 * 
 * トリガー条件:
 * - トピック内のメッセージが5件以上に達した時
 * - 前回生成から新規メッセージが追加された時
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiFlash } from "@/lib/ai/gemini";
import { SchemaType } from "@google/generative-ai";
import { revalidateTag } from "next/cache";
import { THEMES } from "@/lib/themes";

const SUMMARY_THRESHOLD = 1; // 開発・テスト用にすぐに要約されるようしきい値を1に短縮

interface TopicForSummary {
  id: string;
  title: string;
  room_id: string;
  message_count: number;
}

export async function generateTopicSummary(topicId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // 1. トピック情報を取得
    const { data: topic, error: topicErr } = await supabase
      .from("talk_topics")
      .select("id, title, room_id, message_count")
      .eq("id", topicId)
      .single();

    if (topicErr || !topic) {
      return { success: false, error: "Topic not found" };
    }

    if ((topic as TopicForSummary).message_count < SUMMARY_THRESHOLD) {
      return { success: false, error: `Not enough messages (${(topic as TopicForSummary).message_count}/${SUMMARY_THRESHOLD})` };
    }

    // 2. メッセージ一覧を取得
    const { data: messages, error: msgsErr } = await supabase
      .from("messages")
      .select("content, created_at, is_system_bot")
      .eq("topic_id", topicId)
      .eq("is_system_bot", false)
      .order("created_at", { ascending: true })
      .limit(100);

    if (msgsErr || !messages || messages.length === 0) {
      return { success: false, error: "No messages found" };
    }

    // 3. ルーム情報を取得（テーマ名）
    const { data: room } = await supabase
      .from("talk_rooms")
      .select("name, slug")
      .eq("id", (topic as TopicForSummary).room_id)
      .single();

    const themeName = room?.name || "不明";
    const themeSlug = room?.slug || "";
    const themeDef = THEMES.find(t => t.slug === themeSlug) || THEMES[0];
    const topicTitle = (topic as TopicForSummary).title;

    // 4. メッセージを結合
    const conversationText = messages
      .map((m, i) => `[${i + 1}] ${m.content}`)
      .join("\n");

    // 5. Gemini で要約生成
    const model = getGeminiFlash(
      `あなたは食物アレルギーの親コミュニティ「あんしんキッズ」のAI要約エディターです。
トークルームの会話から、読者にとって有益な知恵を簡潔に構造化してまとめます。

ルール:
- 個人を特定できる情報は除去すること
- 医療的断定は避け、「〜という体験が共有されています」のように記述
- 具体的な商品名・店名・コツは積極的に残す
- 指定されたフォーマット（スキーマ）に厳守すること

テーマ専用の抽出ヒント:
${themeDef.extractionHint}`
    );

    let result = null;
    let lastError = null;

    // Build the dynamic schema based on the Theme
    // We parse the string JSON from sectionSchema to create Gemini generic schema shape
    const rootProperties: Record<string, any> = {
      summary_snippet: {
        type: SchemaType.STRING,
        description: "2〜3行の会話要約テキスト（一覧表示用、80文字以内）",
      },
    };

    // The sectionSchema defines "items" as an array of objects. We extract the keys of that object to ask the AI for it, but flatly for this Talk Room topic summary.
    let parsedHintSchema: any = null;
    try {
      parsedHintSchema = JSON.parse(themeDef.sectionSchema);
    } catch { }

    if (parsedHintSchema && parsedHintSchema.items && parsedHintSchema.items[0]) {
      const itemKeys = Object.keys(parsedHintSchema.items[0]);
      for (const k of itemKeys) {
        if (["mention_count", "heat_score", "source_topics", "is_recommended"].includes(k)) continue;
        if (k === "content") {
           rootProperties["key_points"] = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "主要なポイント（3〜5個）" };
        } else {
           const val = parsedHintSchema.items[0][k];
           if (Array.isArray(val)) {
             rootProperties[k] = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: `抽出する ${k}` };
           } else if (typeof val === "string") {
             rootProperties[k] = { type: SchemaType.STRING, description: `抽出する ${k}` };
           } else if (typeof val === "boolean") {
             rootProperties[k] = { type: SchemaType.BOOLEAN };
           }
        }
      }
    } else {
       rootProperties["key_points"] = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } };
       rootProperties["tips"] = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } };
    }

    const requiredKeys = Object.keys(rootProperties).filter(k => k === "summary_snippet" || k === "key_points" || k === "title");

    for (let retry = 0; retry < 3; retry++) {
      try {
        result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: `以下の会話を要約・構造化してください。

テーマ: ${themeName}
話題: ${topicTitle}
投稿数: ${messages.length}件

--- 会話内容 ---
${conversationText}
--- 会話ここまで ---

JSON形式で出力してください:` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: rootProperties,
              required: requiredKeys,
            },
            temperature: 0.3,
          },
        });
        break;
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("503") || msg.includes("429") || msg.includes("UNAVAILABLE") || msg.includes("CAPACITY")) {
          console.log(`[TopicSummary] LLM Capacity Exhausted/Timeout. Retrying ${retry + 1}/3...`);
          await new Promise(r => setTimeout(r, 2000 * Math.pow(2, retry)));
        } else {
          throw err;
        }
      }
    }

    if (!result) throw lastError || new Error("Max LLM retries reached.");

    let parsed: {
      summary_snippet: string;
      key_points: string[];
      recommended_products?: string[];
      tips?: string[];
      allergen_tags: string[];
    };

    try {
      let rawText = result.response.text().trim();
      // Auto-repair markdown codeblock wraps
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/```[\s\n]*$/, "").trim();
      }
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        // Fallback: forcefully extract JSON if Gemini generated conversational text wrapping the object
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw e; // Rethrow if completely unrecoverable
        }
      }
    } catch {
      console.error("[generateTopicSummary] Auto-repair failed for output:", result.response.text());
      return { success: false, error: "Failed to parse AI response" };
    }

    // 6. topic_summaries テーブルに upsert
    // Extract everything except summary_snippet as the full_summary
    const extractedData: any = { ...parsed };
    const safeSnippet = extractedData.summary_snippet || "要約を生成しました。";
    delete extractedData.summary_snippet;
    
    // Allergen Tags fall-back logic from the schema
    const safeAllergens = Array.isArray(extractedData.allergen_free) ? extractedData.allergen_free : 
                         Array.isArray((extractedData as any).allergen_tags) ? (extractedData as any).allergen_tags : [];

    const summaryData = {
      topic_id: topicId,
      summary_snippet: safeSnippet,
      full_summary: extractedData,
      allergen_tags: safeAllergens,
      source_count: messages.length,
      last_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Use raw SQL-style upsert since topic_summaries isn't in generated types
    // Use properly typed db client if available, or direct insert
    const { error: upsertErr } = await supabase
      .from("topic_summaries")
      .upsert(summaryData, { onConflict: "topic_id" });

    if (upsertErr) {
      console.error("[generateTopicSummary] Upsert error:", upsertErr);
      return { success: false, error: "DB upsert failed" };
    }

    console.log(`[TopicSummary] Generated summary for topic "${topicTitle}" (${messages.length} messages)`);
    try {
      revalidateTag("talk-rooms", undefined as any);
      revalidateTag("wiki-entries", undefined as any);
    } catch {
      // ignore
    }
    return { success: true };
  } catch (err) {
    console.error("[generateTopicSummary] Error:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * 全トピックをスキャンして、サマリーが必要なものを自動生成する
 */
export async function generateAllPendingSummaries(): Promise<{ generated: number; errors: number }> {
  const supabase = createAdminClient();
  let generated = 0;
  let errors = 0;

  // メッセージがSUMMARY_THRESHOLD以上あるトピックを取得
  const { data: topics } = await supabase
    .from("talk_topics")
    .select("id, title, message_count")
    .gte("message_count", SUMMARY_THRESHOLD)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (!topics || topics.length === 0) {
    console.log("[TopicSummary] No topics need summaries.");
    return { generated: 0, errors: 0 };
  }

  // 既存のサマリーを取得して、更新が必要なものだけ処理
  const topicIds = topics.map(t => t.id);
  const { data: existingSummaries } = await supabase
    .from("topic_summaries")
    .select("topic_id, source_count")
    .in("topic_id", topicIds);

  const existingMap = new Map<string, number>();
  if (existingSummaries) {
    for (const s of existingSummaries) {
      existingMap.set(s.topic_id, s.source_count);
    }
  }

  for (const topic of topics) {
    const existingCount = existingMap.get(topic.id) || 0;
    // FORCE REGEN: if (existingCount >= topic.message_count) continue;

    const result = await generateTopicSummary(topic.id);
    if (result.success) {
      generated++;
    } else {
      errors++;
      console.warn(`[TopicSummary] Failed for "${topic.title}": ${result.error}`);
    }

    // Rate limiting: wait 1s between API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[TopicSummary] Batch complete: ${generated} generated, ${errors} errors`);
  return { generated, errors };
}
