import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiFlash, SYSTEM_PROMPTS } from "@/lib/ai/gemini";
import { getExtractionPrompt, mergeMegaWikiSections } from "@/lib/wiki/article-templates";
import { THEME_BY_SLUG, MegaWikiSection } from "@/lib/themes";

export async function runBatchExtraction() {
  const supabase = createAdminClient();
  
  if (!process.env.GOOGLE_API_KEY) {
    console.warn("[Batch] GOOGLE_API_KEY is not configured. Skipping extraction.");
    // Log batch as skipped due to config
    await supabase.from("batch_logs").insert({
      batch_type: "extraction",
      status: "error",
      error_log: "GOOGLE_API_KEY is missing",
      completed_at: new Date().toISOString(),
    });
    return { processed: 0, reason: "missing_api_key" };
  }

  const model = getGeminiFlash(SYSTEM_PROMPTS.batchExtractor);

  // Mutex: Check if another batch is already running (prevent concurrency dupes)
  // To prevent deadlocks from crashed batches, we only consider it "running" if started within the last 15 mins.
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("batch_logs")
    .select("id", { count: "exact" })
    .eq("batch_type", "extraction")
    .eq("status", "running")
    .gte("started_at", fifteenMinsAgo);

  if (count && count > 0) {
    console.log("[Batch] Mutex Locked: Another extraction is currently running.");
    return { processed: 0, reason: "mutex_locked_already_running" };
  }

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
    // 1. Fetch unextracted messages that are still alive (not expired)
    // created_atによる3日間のハードコード制限を撤廃し、expires_atによる「生存期間の連鎖延長ルール」に完全追従
    const now = new Date().toISOString();
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*, profiles:user_id(trust_score, display_name)")
      .gt("expires_at", now)
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

    // 文字のみ・顔文字判定
    const EMOJI_ONLY_REGEX = /^[\p{Emoji}\p{Emoji_Component}\s]+$/u;
    const allMessages = (messages as Record<string, unknown>[]).filter(
      (m) => !EMOJI_ONLY_REGEX.test(String(m.content).trim()) && String(m.content).trim().length > 0
    );

    const emojiOnlyIds = (messages as Record<string, unknown>[])
      .filter((m) => EMOJI_ONLY_REGEX.test(String(m.content).trim()) || String(m.content).trim().length === 0)
      .map((m) => m.id);
    
    if (emojiOnlyIds.length > 0) {
      await supabase.from("messages").update({ ai_extracted: true }).in("id", emojiOnlyIds);
    }

    if (allMessages.length === 0) {
      await supabase
        .from("batch_logs")
        .update({ status: "completed", messages_processed: 0, completed_at: new Date().toISOString() })
        .eq("id", batchLog?.id);
      return { processed: 0 };
    }

    // 2. ルームIDごとのグルーピング
    const messageTexts = allMessages.map((m: Record<string, unknown>) => ({
      id: String(m.id),
      user_id: String(m.user_id),
      content: String(m.content),
      room_id: String(m.room_id),
      trust_score: (m.profiles as Record<string, unknown>)?.trust_score || 0,
    }));

    const roomIds = [...new Set(messageTexts.map(m => m.room_id))];
    const { data: rooms } = await supabase.from("talk_rooms").select("id, slug").in("id", roomIds);
    const roomIdToSlug: Record<string, string> = {};
    if (rooms) {
      for (const r of rooms) roomIdToSlug[r.id] = r.slug;
    }

    const messagesByRoom: Record<string, typeof messageTexts> = {};
    for (const m of messageTexts) {
      const slug = roomIdToSlug[m.room_id];
      if (!slug || !THEME_BY_SLUG[slug]) continue; // 既存の8テーマ以外は除外
      if (!messagesByRoom[slug]) messagesByRoom[slug] = [];
      messagesByRoom[slug].push(m);
    }

    let totalUpdated = 0;

    // 3. ルーム別にMega-Wikiへ抽出
    const chunkSize = 50;

    for (const [roomSlug, roomMessages] of Object.entries(messagesByRoom)) {
      const megaWikiSlug = `mega-${roomSlug}`;
      
      const { data: existingEntry } = await supabase
        .from("wiki_entries")
        .select("id, sections, source_count")
        .eq("slug", megaWikiSlug)
        .maybeSingle();
        
      if (!existingEntry) {
        console.warn(`[Batch] Mega-Wiki for ${roomSlug} not found. Ensure seed is run.`);
        continue;
      }

      let currentSections: MegaWikiSection[] = (existingEntry.sections || []) as unknown as MegaWikiSection[];
      const entryId = existingEntry.id;
      let roomUpdated = false;

      for (let i = 0; i < roomMessages.length; i += chunkSize) {
        const chunk = roomMessages.slice(i, i + chunkSize);
        
        // RAG Limit: Truncate existing headings to max 150 items to prevent context bloom
        const existingHeadings = currentSections.slice(0, 150).map(s => `- ${s.heading} (${s.items.length}件のアイテム)`).join("\n");
        // RAG Limit: strictly limit message bounds (Gemini flash supports 1M, but keep it tight for RAG coherence)
        let messagesText = chunk.map(m => `[ID:${m.id}] ${m.content}`).join("\n");
        if (messagesText.length > 50000) messagesText = messagesText.slice(0, 50000) + "\n...[TRUNCATED]";

        const prompt = getExtractionPrompt(roomSlug, messagesText, existingHeadings);
        if (!prompt) continue;

          try {
            const result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.2 
              }
            });
            const responseText = result.response.text();
          
          let extractionSuccess = false;
          let incomingSections: MegaWikiSection[] = [];
          
          try {
             const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
             incomingSections = JSON.parse(cleanJson) as MegaWikiSection[];
          } catch {
             try {
               const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
               incomingSections = JSON.parse(cleanJson + ']') as MegaWikiSection[];
             } catch {
               try {
                 const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
                 incomingSections = JSON.parse(cleanJson + '}]') as MegaWikiSection[];
               } catch (e3) {
                 console.warn("[Batch] JSON parse error, even with fallback.", e3);
               }
             }
          }
          
          if (incomingSections && Array.isArray(incomingSections) && incomingSections.length > 0) {
            currentSections = mergeMegaWikiSections(currentSections, incomingSections);
            totalUpdated++;
            roomUpdated = true;
            extractionSuccess = true;
          }

          if (extractionSuccess) {
            // 貢献ソースをDBに記録（抽出成功時のみ）
            for (const m of chunk) {
              await supabase.from("wiki_sources").insert({
                wiki_entry_id: entryId,
                original_message_snippet: String(m.content).slice(0, 500),
                contributor_id: m.user_id || null,
                contributor_trust_score: m.trust_score,
              });
            }

            // Mark as extracted
            await supabase
              .from("messages")
              .update({ ai_extracted: true })
              .in("id", chunk.map(m => m.id));
          } else {
             console.warn(`[Batch] Extraction failed for chunk in ${roomSlug}. Will retry next batch.`);
          }
        } catch (err) {
          console.error(`[Batch] Parse failed for ${roomSlug}`, err);
        }
      }

      // 4. Update Mega-Wiki in DB (source_count uses actual chunks that were successfully extracted)
      const actualSourcesAdded = roomUpdated ? roomMessages.length : 0;
      await supabase
        .from("wiki_entries")
        .update({
          sections: currentSections,
          last_updated_from_batch: new Date().toISOString(),
          source_count: (existingEntry.source_count || 0) + actualSourcesAdded,
        })
        .eq("id", entryId);

      // 4.5. AI自律的ファシリテーション (Proactive Topic Summoning)
      // 抽出があったら、部屋に感謝と「次のお題」を投下する (空転防止: 3件以上の実質的な抽出があった時のみ)
      if (roomUpdated && actualSourcesAdded >= 3) {
        try {
           const facPrompt = `あなたは活発な保護者コミュニティのファシリテーターです。先ほど参加者の会話から新しい知恵を抽出しました。
以下の「現在の知恵袋の見出し」を見て、参加者への短い感謝と、『次に聞きたい関連の話題（まだ不足していそうなもの）」を1〜2文で投げかけてください。

ルール:
・100〜150文字以内で、短く、温かい保護者目線のトーンにする
・「先ほど皆さんのお話をまとめました！」のように報告をいれる
・必ず最後は「〇〇について工夫していることはありますか？」のように質問で終わる

直近の知恵袋の見出し:
${currentSections.slice(0, 10).map(s => `・${s.heading}`).join("\n")}`;

           const facResult = await model.generateContent({
             contents: [{ role: "user", parts: [{ text: facPrompt }] }],
             generationConfig: { temperature: 0.7 }
           });
           const facMessage = facResult.response.text();

           const roomId = Object.keys(roomIdToSlug).find(id => roomIdToSlug[id] === roomSlug);
           if (roomId) {
             await supabase.from("messages").insert({
               room_id: roomId,
               content: `📖 知恵袋を更新しました！\n${facMessage}`,
               is_system_bot: true,
             });

             // 部屋の寿命を延長（ファシリテーションによって復活させる）
             const newExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
             await supabase.from("messages").update({ expires_at: newExpiry }).eq("room_id", roomId);
           }
        } catch (facErr) {
           console.error(`[Batch] Facilitator error for ${roomSlug}`, facErr);
        }
      }
    }

    // 5. Update Log
    await supabase
      .from("batch_logs")
      .update({
        status: "completed",
        messages_processed: allMessages.length,
        wiki_entries_updated: totalUpdated,
        completed_at: new Date().toISOString(),
      })
      .eq("id", batchLog?.id);

    // 6. Trust Score recalculation is delegated to trust-calculator.ts (called by /api/batch?type=all)
    // No inline trust calculation here — SSoT is trust-calculator.ts

    return {
      processed: allMessages.length,
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

