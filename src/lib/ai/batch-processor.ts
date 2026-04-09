import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiFlash, SYSTEM_PROMPTS } from "@/lib/ai/gemini";
import { getExtractionPrompt, mergeMegaWikiSections } from "@/lib/wiki/article-templates";
import { THEME_BY_SLUG, MegaWikiSection } from "@/lib/themes";
import { revalidateTag, revalidatePath } from "next/cache";

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
  // To prevent deadlocks from crashed batches, we only consider it "running" if started within the last 7 mins (Vercel maxDuration is 5m).
  const sevenMinsAgo = new Date(Date.now() - 7 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("batch_logs")
    .select("id", { count: "exact" })
    .eq("batch_type", "extraction")
    .eq("status", "running")
    .gte("started_at", sevenMinsAgo);

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
    // 期限切れかどうかにかかわらず、全未抽出投稿を対象にする（期限切れを抽出せずに無視すると、永遠に削除されないPoison Pill化するため）
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*, profiles:user_id(trust_score, display_name)")
      .eq("ai_extracted", false)
      .eq("is_system_bot", false)
      .order("created_at", { ascending: true })
      .limit(500);

    if (error) throw error;
    if (!messages || messages.length === 0) {
      if (batchLog?.id) {
        await supabase
          .from("batch_logs")
          .update({ status: "completed", messages_processed: 0, completed_at: new Date().toISOString() })
          .eq("id", batchLog.id);
      }
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
      if (batchLog?.id) {
        await supabase
          .from("batch_logs")
          .update({ status: "completed", messages_processed: 0, completed_at: new Date().toISOString() })
          .eq("id", batchLog.id);
      }
      return { processed: 0 };
    }

    // 2. ルームIDごと→トピックIDごとのグルーピング
    const messageTexts = allMessages.map((m: Record<string, unknown>) => ({
      id: String(m.id),
      user_id: String(m.user_id),
      content: String(m.content),
      room_id: String(m.room_id),
      topic_id: m.topic_id ? String(m.topic_id) : null,
      trust_score: (m.profiles as Record<string, unknown>)?.trust_score || 0,
    }));

    const roomIds = [...new Set(messageTexts.map(m => m.room_id))];
    const { data: rooms } = await supabase.from("talk_rooms").select("id, slug").in("id", roomIds);
    const roomIdToSlug: Record<string, string> = {};
    if (rooms) {
      for (const r of rooms) roomIdToSlug[r.id] = r.slug;
    }

    // トピック名を取得してコンテキストに付与
    const topicIds = [...new Set(messageTexts.map(m => m.topic_id).filter(Boolean))] as string[];
    const topicTitles: Record<string, string> = {};
    if (topicIds.length > 0) {
      // Chunk topicIds to avoid "URI Too Long" (HTTP 414) on Supabase GET requests
      for (let i = 0; i < topicIds.length; i += 50) {
        const idChunk = topicIds.slice(i, i + 50);
        const { data: topics } = await supabase.from("talk_topics").select("id, title").in("id", idChunk);
        if (topics) {
          for (const t of topics) topicTitles[t.id] = t.title;
        }
      }
    }

    const messagesByRoom: Record<string, typeof messageTexts> = {};
    const orphanedMessageIds: string[] = [];
    for (const m of messageTexts) {
      const slug = roomIdToSlug[m.room_id];
      if (!slug || !THEME_BY_SLUG[slug]) {
         orphanedMessageIds.push(m.id);
         continue;
      }
      if (!messagesByRoom[slug]) messagesByRoom[slug] = [];
      messagesByRoom[slug].push(m);
    }

    if (orphanedMessageIds.length > 0) {
      // Orphaned messages will be permanently ignored by AI but must be marked as extracted to clear the queue
      await supabase.from("messages").update({ ai_extracted: true }).in("id", orphanedMessageIds);
    }

    let totalUpdated = 0;
    let totalProcessedAcrossRooms = 0;

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
      let processedMessagesCount = 0;

      for (let i = 0; i < roomMessages.length; i += chunkSize) {
        // Rate limit mitigation: sleep briefly between chunks if not first
        if (i > 0) await new Promise(r => setTimeout(r, 1500));

        const chunk = roomMessages.slice(i, i + chunkSize);
        
        // RAG Limit: Truncate existing headings to max 150 items to prevent context bloom
        const existingHeadings = (currentSections || []).slice(0, 150).map(s => `- ${s.heading} (${s.items?.length || 0}件のアイテム)`).join("\n");
        // RAG Limit: strictly limit message bounds (Gemini flash supports 1M, but keep it tight for RAG coherence)
        let messagesText = chunk.map(m => {
          const topicLabel = m.topic_id && topicTitles[m.topic_id] ? `[話題ID:${m.topic_id}][話題:${topicTitles[m.topic_id]}]` : '';
          return `[発言ID:${m.id}] ${topicLabel} ${m.content}`;
        }).join("\n");
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
            // JSON配列、もしくはJSONオブジェクトか調べる
            let parsed: unknown;
            try {
               parsed = JSON.parse(responseText);
            } catch {
               const startIndex = responseText.indexOf('[');
               const endIndex = responseText.lastIndexOf(']');
               if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
                  const cleanJson = responseText.substring(startIndex, endIndex + 1);
                  parsed = JSON.parse(cleanJson);
               } else {
                 // Try block object extracting
                 const startObj = responseText.indexOf('{');
                 const endObj = responseText.lastIndexOf('}');
                 if (startObj !== -1 && endObj !== -1 && endObj >= startObj) {
                    const cleanObj = responseText.substring(startObj, endObj + 1);
                    parsed = JSON.parse(cleanObj);
                 } else {
                   throw new Error("No JSON structure found in response");
                 }
               }
            }

            if (parsed) {
               if (Array.isArray(parsed)) {
                 incomingSections = parsed;
               } else {
                 const parsedObj = parsed as Record<string, unknown>;
                 if (parsedObj.heading && Array.isArray(parsedObj.items)) {
                   // オブジェクト単体が返ってきた場合
                   incomingSections = [parsedObj as unknown as MegaWikiSection];
                 } else if (parsedObj.sections && Array.isArray(parsedObj.sections)) {
                   incomingSections = parsedObj.sections as MegaWikiSection[];
                 } else {
                   incomingSections = Object.values(parsedObj).filter(Array.isArray).flat() as MegaWikiSection[];
                 }
               }
            } else {
               throw new Error("Could not parse JSON from response");
            }
          } catch (e) {
             console.error("[Batch] JSON parser error (ignoring and considering failure for this chunk):", e);
             // エラー時は抽出失敗とするが、ログは残す
          }
          
          if (incomingSections && Array.isArray(incomingSections) && incomingSections.length > 0) {
            currentSections = mergeMegaWikiSections(currentSections || [], incomingSections);
            totalUpdated++;
            roomUpdated = true;
            extractionSuccess = true;
            processedMessagesCount += chunk.length;
          }

          if (extractionSuccess) {
            // 貢献ソースをバルクでDBに記録（抽出成功時のみ）
            try {
              const sourcesToInsert = chunk.map(m => ({
                wiki_entry_id: entryId,
                original_message_snippet: String(m.content).slice(0, 500),
                contributor_id: m.user_id || null,
                contributor_trust_score: m.trust_score,
              }));
              if (sourcesToInsert.length > 0) {
                await supabase.from("wiki_sources").insert(sourcesToInsert);
              }
            } catch (err) {
              console.warn("[Batch] Failed to log wiki_sources (ignoring):", err);
            }

            let saveSuccessful = false;
            try {
              const { error: markErr } = await supabase
                .from("messages")
                .update({ ai_extracted: true })
                .in("id", chunk.map(m => m.id));
              if (markErr) throw markErr;
              saveSuccessful = true;
            } catch (err) {
               console.error("[Batch] Failed to mark messages as extracted:", err);
               // Fatal error for this chunk: rollback currentSections mutation to prevent infinite duplicate extraction loops
               currentSections = existingEntry.sections as unknown as MegaWikiSection[] || [];
               roomUpdated = false;
               extractionSuccess = false;
               processedMessagesCount -= chunk.length;
               break; 
            }

            // リビングナレッジ: トピック↔記事アイテムの双方向リンクを記録 (非同期処理・失敗無視)
            try {
              const uniqueTopicIds = [...new Set(chunk.map(m => m.topic_id).filter(Boolean))] as string[];
              for (const topicId of uniqueTopicIds) {
                const { data: topic } = await supabase
                  .from("talk_topics")
                  .select("id, linked_wiki_entry_id")
                  .eq("id", topicId)
                  .maybeSingle();

                if (topic && !topic.linked_wiki_entry_id) {
                  const firstItemTitle = incomingSections[0]?.items?.[0]?.title || null;
                  await supabase
                    .from("talk_topics")
                    .update({
                      linked_wiki_entry_id: entryId,
                      linked_wiki_item_title: firstItemTitle,
                    })
                    .eq("id", topicId);
                }
              }
            } catch (err) {
              console.warn("[Batch] Failed to link talk_topics (ignoring):", err);
            }
          } else {
              console.warn(`[Batch] Extraction failed for chunk in ${roomSlug}. Will retry next batch.`);
              // Don't abort the whole batch — continue with the next room
              break; // break the chunk loop for this room, try next room
           }
        } catch (err) {
          console.error(`[Batch] Parse failed for ${roomSlug}`, err);
          // Don't abort the batch — continue with next room
          break; // break the chunk loop for this room
        }
      }

      // 4. Update Mega-Wiki in DB (source_count uses actual chunks that were successfully extracted)
      const actualSourcesAdded = processedMessagesCount;
      totalProcessedAcrossRooms += processedMessagesCount;
      if (roomUpdated) {
        await supabase
          .from("wiki_entries")
          .update({
            sections: currentSections,
            last_updated_from_batch: new Date().toISOString(),
            source_count: (existingEntry.source_count || 0) + actualSourcesAdded,
          })
          .eq("id", entryId);
      }

      // Invalidate Next.js cache so the Wiki updates instantly in the UI
      if (roomUpdated) {
        try {
          revalidatePath("/", "layout");
          console.log(`[Batch] Cache busted for ${megaWikiSlug}`);
        } catch (cacheErr) {
          console.error("[Batch] Cache invalidation failed", cacheErr);
        }
      }

      // 4.5. AI自律的ファシリテーション (Proactive Topic Summoning)
      // 抽出があったら、部屋に感謝と「次のお題」を投下する (空転防止: 3件以上の実質的な抽出があった時のみ)
      if (roomUpdated && actualSourcesAdded >= 3) {
        try {
          // ファシリテーションは同期的に実行（Serverlessのコンテキスト破棄によるクラッシュを防ぐため）
          const facPrompt = `あなたは活発な保護者コミュニティのファシリテーターです。先ほど参加者の会話から新しいヒントを抽出しました。
以下の「現在の記事の見出し」を見て、参加者への短い感謝と、『次に聞きたい関連の話題（まだ不足していそうなもの）」を1〜2文で投げかけてください。

ルール:
・100〜150文字以内で、短く、温かい保護者目線のトーンにする
・「先ほど皆さんのお話をまとめました！」のように報告をいれる
・必ず最後は「〇〇について工夫していることはありますか？」のように質問で終わる

直近の記事の見出し:
${currentSections.slice(0, 10).map(s => `・${s.heading}`).join("\n")}`;

          const facResult = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: facPrompt }] }],
            generationConfig: { temperature: 0.7 }
          });
          const facMessage = facResult.response.text();

              const roomId = Object.keys(roomIdToSlug).find(id => roomIdToSlug[id] === roomSlug);
              if (roomId) {
                 // 最も活発なトピックにファシリテーションメッセージを投下
                 const topicCounts: Record<string, number> = {};
                 for (const m of roomMessages) {
                   if (m.topic_id) topicCounts[m.topic_id] = (topicCounts[m.topic_id] || 0) + 1;
                 }
                 const bestTopicId = Object.entries(topicCounts)
                   .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

                 await supabase.from("messages").insert({
                   room_id: roomId,
                   topic_id: bestTopicId,
                   content: `📖 まとめ記事を更新しました！\n${facMessage}`,
                   is_system_bot: true,
                 });

                 const newExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
                 if (bestTopicId) {
                   await supabase.from("messages").update({ expires_at: newExpiry }).eq("topic_id", bestTopicId);
                 } else {
                   await supabase.from("messages").update({ expires_at: newExpiry }).eq("room_id", roomId);
                 }
               }
           } catch (facErr) {
              console.error(`[Batch] Facilitator error for ${roomSlug}`, facErr);
           }
      }
    }

    // 5. Update Log
    if (batchLog?.id) {
      await supabase
        .from("batch_logs")
        .update({
          status: "completed",
          messages_processed: totalProcessedAcrossRooms,
          wiki_entries_updated: totalUpdated,
          completed_at: new Date().toISOString(),
        })
        .eq("id", batchLog.id);
    }

    // 6. Trust Score recalculation is delegated to trust-calculator.ts (called by /api/batch?type=all)
    // No inline trust calculation here — SSoT is trust-calculator.ts

    return {
      processed: totalProcessedAcrossRooms,
      updated: totalUpdated,
      debug_final: {
        roomKeys: Object.keys(messagesByRoom),
        roomIds: roomIds,
        slugsMap: roomIdToSlug
      }
    };
  } catch (err) {
    console.error("[Batch] Error:", err);
    if (batchLog?.id) {
      await supabase
        .from("batch_logs")
        .update({
          status: "error",
          error_log: String(err),
          completed_at: new Date().toISOString(),
        })
        .eq("id", batchLog.id);
    }
    throw err;
  }
}

