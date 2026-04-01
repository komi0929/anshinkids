import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiFlash } from "@/lib/ai/gemini";
import { getExtractionPrompt, mergeMegaWikiSections } from "@/lib/wiki/article-templates";
import { THEME_BY_SLUG, MegaWikiSection } from "@/lib/themes";

export async function runBatchExtraction() {
  const supabase = createAdminClient();
  const model = getGeminiFlash();

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
        .single();
        
      if (!existingEntry) {
        console.warn(`[Batch] Mega-Wiki for ${roomSlug} not found. Ensure seed is run.`);
        continue;
      }

      let currentSections: MegaWikiSection[] = (existingEntry.sections || []) as unknown as MegaWikiSection[];
      const entryId = existingEntry.id;
      let roomUpdated = false;

      for (let i = 0; i < roomMessages.length; i += chunkSize) {
        const chunk = roomMessages.slice(i, i + chunkSize);
        
        // 直近の既存セクション一覧を見出し化
        const existingHeadings = currentSections.map(s => `- ${s.heading} (${s.items.length}件のアイテム)`).join("\n");
        const messagesText = chunk.map(m => `[ID:${m.id}] ${m.content}`).join("\n");

        const prompt = getExtractionPrompt(roomSlug, messagesText, existingHeadings);
        if (!prompt) continue;

        try {
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          
          let extractionSuccess = false;
          
          if (jsonMatch) {
            const incomingSections = JSON.parse(jsonMatch[0]) as MegaWikiSection[];
            if (incomingSections.length > 0) {
              currentSections = mergeMegaWikiSections(currentSections, incomingSections);
              totalUpdated++;
              roomUpdated = true;
            }
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

      // 4. Update Mega-Wiki in DB
      await supabase
        .from("wiki_entries")
        .update({
          sections: currentSections,
          last_updated_from_batch: new Date().toISOString(),
          source_count: (existingEntry.source_count || 0) + roomMessages.length,
        })
        .eq("id", entryId);

      // 4.5. AI自律的ファシリテーション (Proactive Topic Summoning)
      // 抽出があったら、部屋に感謝と「次のお題」を投下する
      if (roomUpdated) {
        try {
           const facPrompt = `あなたは活発な保護者コミュニティのファシリテーターです。先ほど参加者の会話から新しい知恵を抽出しました。
以下の「現在の知恵袋の見出し」を見て、参加者への短い感謝と、『次に聞きたい関連の話題（まだ不足していそうなもの）」を1〜2文で投げかけてください。

ルール:
・100〜150文字以内で、短く、温かい保護者目線のトーンにする
・「先ほど皆さんのお話をまとめました！」のように報告をいれる
・必ず最後は「〇〇について工夫していることはありますか？」のように質問で終わる

直近の知恵袋の見出し:
${currentSections.slice(0, 10).map(s => `・${s.heading}`).join("\n")}`;

           const facResult = await model.generateContent(facPrompt);
           const facMessage = facResult.response.text();

           const roomId = Object.keys(roomIdToSlug).find(id => roomIdToSlug[id] === roomSlug);
           if (roomId) {
             await supabase.from("messages").insert({
               room_id: roomId,
               content: `【AIファシリテーターより】\n${facMessage}`,
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

    // 6. Compound Trust Scores
    const { data: allProfiles } = await supabase.from("profiles").select("id, total_contributions, total_thanks_received, total_helpful_votes");
    const userStreaks: Record<string, number> = {};
    const { data: streakData } = await supabase
      .from("contribution_days")
      .select("user_id, active_date")
      .gte("active_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

    if (streakData) {
      const userDays: Record<string, Set<string>> = {};
      for (const row of streakData) {
        if (!userDays[row.user_id]) userDays[row.user_id] = new Set();
        userDays[row.user_id].add(row.active_date);
      }
      for (const [userId, days] of Object.entries(userDays)) {
        userStreaks[userId] = days.size;
      }
    }

    if (allProfiles) {
      for (const profile of allProfiles) {
        const contribs = profile.total_contributions || 0;
        const thanks = profile.total_thanks_received || 0;
        const helpfulVotes = profile.total_helpful_votes || 0;
        const activeDays = userStreaks[profile.id] || 0;
        const rawScore = (contribs * 2) + (thanks * 3) + (helpfulVotes * 5) + (activeDays * 1.5);
        const trustScore = Math.min(100, Math.round(rawScore * 100) / 100);

        await supabase.from("profiles").update({ trust_score: trustScore }).eq("id", profile.id);
      }
    }

    // 7. Data Privacy Safety measure: Purge Expired Data
    // 期限切れ（72時間経過）の生メッセージを物理削除（プライバシー配慮）
    let purgedCount = 0;
    try {
      // Get count first (optional, but good for logs if needed)
      const purgeResult = await supabase
        .from("messages")
        .delete()
        .lt("expires_at", new Date().toISOString());
      purgedCount = purgeResult.count || 0;
      console.log(`[Batch] Purged ${purgedCount} expired messages.`);
    } catch (purgeErr) {
      console.error("[Batch] Failed to purge expired messages", purgeErr);
    }

    return {
      processed: allMessages.length,
      updated: totalUpdated,
      purged: purgedCount,
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

