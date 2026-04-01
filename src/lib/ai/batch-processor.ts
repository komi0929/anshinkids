import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiFlash } from "@/lib/ai/gemini";
import { getExtractionPrompt, mergeMegaWikiSections } from "@/lib/wiki/article-templates";
import { THEME_BY_SLUG, MegaWikiSection } from "@/lib/themes";

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
    // 1. Fetch unextracted messages from last 72 hours
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*, profiles:user_id(trust_score, display_name)")
      .gte("created_at", threeDaysAgo)
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
          
          if (jsonMatch) {
            const incomingSections = JSON.parse(jsonMatch[0]) as MegaWikiSection[];
            if (incomingSections.length > 0) {
              currentSections = mergeMegaWikiSections(currentSections, incomingSections);
              totalUpdated++;
            }
          }
        } catch (err) {
          console.error(`[Batch] Parse failed for ${roomSlug}`, err);
        }

        // 貢献ソースをDBに記録
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
    const { data: allProfiles } = await supabase.from("profiles").select("id, total_contributions, total_thanks_received");
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
        const activeDays = userStreaks[profile.id] || 0;
        const rawScore = (contribs * 2) + (thanks * 3) + (activeDays * 1.5);
        const trustScore = Math.min(100, Math.round(rawScore * 100) / 100);

        await supabase.from("profiles").update({ trust_score: trustScore }).eq("id", profile.id);
      }
    }

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

