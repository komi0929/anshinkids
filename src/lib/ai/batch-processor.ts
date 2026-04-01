import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiFlash, SYSTEM_PROMPTS } from "@/lib/ai/gemini";
import { CATEGORY_TEMPLATES, ROOM_TO_CATEGORY, inferCategory, mergeContentByCategory } from "@/lib/wiki/article-templates";
import { detectAndMergeduplicates, detectSplitCandidates } from "@/lib/wiki/wiki-curation";

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

    // === 全メッセージをAIに渡す ===
    // 「○○のパンは最高」のような短い発言も商品への支持票として重要。
    // 文字数フィルタではなく、AI自身が情報/ノイズを判別する。
    // 純粋な絵文字のみ（👍😊など）やスタンプだけの投稿のみ除外。
    const EMOJI_ONLY_REGEX = /^[\p{Emoji}\p{Emoji_Component}\s]+$/u;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allMessages = (messages as any[]).filter(
      (m) => !EMOJI_ONLY_REGEX.test(String(m.content).trim()) && String(m.content).trim().length > 0
    );

    // Mark emoji-only messages as extracted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emojiOnlyIds = (messages as any[])
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

    // Group messages by room for category-aware extraction
    const messageTexts = allMessages.map((m: Record<string, unknown>) => ({
      id: String(m.id),
      content: String(m.content),
      room_id: String(m.room_id),
    }));

    // Get room slugs for category inference
    const roomIds = [...new Set(messageTexts.map(m => m.room_id))];
    const { data: rooms } = await supabase
      .from("talk_rooms")
      .select("id, slug")
      .in("id", roomIds);
    const roomIdToSlug: Record<string, string> = {};
    if (rooms) {
      for (const r of rooms) roomIdToSlug[r.id] = r.slug;
    }

    // Group messages by room for category-specific extraction
    const messagesByRoom: Record<string, typeof messageTexts> = {};
    for (const m of messageTexts) {
      const slug = roomIdToSlug[m.room_id] || "unknown";
      if (!messagesByRoom[slug]) messagesByRoom[slug] = [];
      messagesByRoom[slug].push(m);
    }

    // Process each room group with category-specific prompts
    const chunkSize = 50;
    let totalCreated = 0;
    let totalUpdated = 0;

    // 既存のwiki記事タイトル・slug一覧を取得（重複記事の防止）
    const { data: existingWikiEntries } = await supabase
      .from("wiki_entries")
      .select("id, title, slug, category, content_json, source_count")
      .limit(200);
    const existingTitles = (existingWikiEntries || []).map(e => `- 「${e.title}」(slug: ${e.slug})`).join("\n");

    for (const [roomSlug, roomMessages] of Object.entries(messagesByRoom)) {
      const category = inferCategory(roomSlug);
      const template = CATEGORY_TEMPLATES[category];

      for (let i = 0; i < roomMessages.length; i += chunkSize) {
        const chunk = roomMessages.slice(i, i + chunkSize);

        // === 会話認識型の抽出プロンプト ===
        const prompt = `${SYSTEM_PROMPTS.batchExtractor}

## カテゴリ: ${template.label} (${template.icon})
${template.extractionHint}

## 以下は同じトークルーム内の会話です（時系列順）。
**個別のメッセージではなく、会話の流れを理解してください。**
- 質問 → 回答は1つのトピックとしてまとめる
- 「うちも○○！」のような共感は、直前の発言への支持票
- 短い発言（「○○は最高」）も商品/食品への支持票として必ず記録

会話:
${chunk.map((m) => `[ID:${m.id}] ${m.content}`).join("\n")}

## 既存のWiki記事一覧（重複を避けるため確認してください）:
${existingTitles || "(まだ記事がありません)"}

## 出力ルール:
1. **具体的な体験・商品名・レシピ・対処法が含まれるトピックのみ** 抽出すること
2. **質問のみ（回答がない）は抽出しないこと** — 質問は別途ナレッジギャップとして記録される
3. 既存記事と同じトピックの場合は、**既存のslugをそのまま使うこと**（新しいタイトルを作らない）
4. 1つのトピックに貢献した**全メッセージのIDを source_message_ids に列挙**すること
5. 情報がゼロの場合は空配列 [] を返すこと

出力形式:
[{
  "source_message_ids": ["uuid1", "uuid2", "uuid3"],
  "title": "記事タイトル（既存記事と同じなら既存のタイトルを使用）",
  "slug": "既存記事のslugがあればそれを使用。なければ空文字",
  "category": "${template.label}",
  "allergen_tags": ["卵", "乳"],
  "content": ${template.schema}
}]`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const extracted: (ExtractedInfo & { source_message_ids?: string[]; source_message_id?: string; slug?: string })[] = JSON.parse(jsonMatch[0]);

            for (const item of extracted) {
              // slug: AIが既存slugを指定した場合はそれを使用
              const slug = (item.slug && item.slug.length > 0)
                ? item.slug
                : item.title
                    .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, "-")
                    .replace(/-+/g, "-")
                    .toLowerCase()
                    .slice(0, 100);

              // 貢献メッセージID一覧（後方互換）
              const contributingIds: string[] = item.source_message_ids ||
                (item.source_message_id ? [item.source_message_id] : []);

              const { data: existing } = await supabase
                .from("wiki_entries")
                .select("id, content_json, source_count, category")
                .eq("slug", slug)
                .single();

              let entryUUID: string | null = null;

              if (existing) {
                entryUUID = existing.id;
                // === AI Editorial Resynthesis ===
                const { data: allSources } = await supabase
                  .from("wiki_sources")
                  .select("original_message_snippet, extracted_at, contributor_trust_score")
                  .eq("wiki_entry_id", existing.id)
                  .order("extracted_at", { ascending: true });

                const sourceSnippets = [
                  ...(allSources || []).map(s => s.original_message_snippet),
                  String((item.content as Record<string, unknown>).raw_summary || JSON.stringify(item.content).slice(0, 500)),
                ];

                const existingContent = existing.content_json as Record<string, unknown>;
                const resynthesisPrompt = `あなたは食物アレルギー知恵袋の編集者です。
以下のソース（保護者の投稿）を元に、この記事を再構成してください。

## 記事タイトル: ${item.title}
## カテゴリ: ${template.label}

## 既存の記事内容（ベース — ここに含まれる情報は絶対に削除しないこと）:
${JSON.stringify(existingContent).slice(0, 2000)}

## 全ソース一覧（${sourceSnippets.length}件の投稿に基づく）:
${sourceSnippets.map((s, i) => `[${i + 1}] ${s}`).join("\n")}

## 編集方針（厳守）:
1. **既存情報の保護**: 既存の記事内容に含まれる情報は絶対に削除しない。追加・強化のみ行う。
2. **傾斜をつける**: 言及回数が多いもの = 「特に好評」「多くの方が推薦」と明記。
3. **新着情報を目立たせる**: 最新ソースで追加された内容には「🆕」マーク。
4. **信頼度の重み**: 言及多 = 自信を持って記述。1件 = 「〜というケースもあります」。
5. **実用的な構成**: 「結局どれがいいの？」にすぐ答えが見つかる構成。

カテゴリ専用スキーマで出力:
${template.schema}`;

                try {
                  const resynthResult = await model.generateContent(resynthesisPrompt);
                  const resynthText = resynthResult.response.text();
                  const resynthJson = resynthText.match(/\{[\s\S]*\}/);
                  if (resynthJson) {
                    const newContent = JSON.parse(resynthJson[0]);
                    await supabase
                      .from("wiki_entries")
                      .update({
                        content_json: newContent,
                        summary: String(newContent.raw_summary || "").slice(0, 300),
                        source_count: (existing.source_count || 0) + contributingIds.length,
                        last_updated_from_batch: new Date().toISOString(),
                        allergen_tags: item.allergen_tags,
                      })
                      .eq("id", existing.id);
                  }
                } catch {
                  const mergedContent = mergeContentByCategory(
                    ROOM_TO_CATEGORY[roomSlug] || inferCategory(undefined, JSON.stringify(existingContent)),
                    existingContent,
                    item.content as Record<string, unknown>
                  );
                  await supabase
                    .from("wiki_entries")
                    .update({
                      content_json: mergedContent,
                      source_count: (existing.source_count || 0) + contributingIds.length,
                      last_updated_from_batch: new Date().toISOString(),
                      allergen_tags: item.allergen_tags,
                    })
                    .eq("id", existing.id);
                }
                totalUpdated++;
              } else {
                // 新記事作成
                const contentObj = item.content as Record<string, unknown>;
                const summary = (contentObj.raw_summary as string) ||
                  (Array.isArray(contentObj.tips) ? contentObj.tips.slice(0, 2).join('。') : "") ||
                  item.title;

                const { data: newEntry } = await supabase
                  .from("wiki_entries")
                  .insert({
                    title: item.title,
                    slug,
                    category: item.category || template.label,
                    content_json: item.content,
                    summary: String(summary).slice(0, 300),
                    allergen_tags: item.allergen_tags,
                    source_count: contributingIds.length || 1,
                    last_updated_from_batch: new Date().toISOString(),
                    is_public: true,
                  })
                  .select()
                  .single();

                if (newEntry) {
                  totalCreated++;
                  entryUUID = newEntry.id;
                }
              }

              // Record ALL contributing messages as sources
              if (entryUUID && contributingIds.length > 0) {
                for (const msgId of contributingIds) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const sourceMsg = (messages as any[]).find((m) => m.id === msgId);
                  if (sourceMsg) {
                    await supabase.from("wiki_sources").insert({
                      wiki_entry_id: entryUUID,
                      original_message_snippet: String(sourceMsg.content).slice(0, 500),
                      contributor_id: sourceMsg.user_id || null,
                      contributor_trust_score: sourceMsg.profiles?.trust_score || 0,
                    });
                  }
                }
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
    }

    // Update batch log
    console.log(`[Batch] Complete: processed=${allMessages.length}, created=${totalCreated}, updated=${totalUpdated}, emoji_only=${emojiOnlyIds.length}`);
    await supabase
      .from("batch_logs")
      .update({
        status: "completed",
        messages_processed: allMessages.length,
        wiki_entries_created: totalCreated,
        wiki_entries_updated: totalUpdated,
        completed_at: new Date().toISOString(),
      })
      .eq("id", batchLog?.id);

    // === Wiki Curation: 記事の統合・分割 ===
    // 抽出完了後に類似記事の統合と肥大化記事の分割を実行
    try {
      const mergeResult = await detectAndMergeduplicates();
      const splitResult = await detectSplitCandidates();
      console.log(`[Curation] Merged: ${mergeResult.merged}, Split: ${splitResult.split}`);
    } catch (err) {
      console.error("[Curation] Failed:", err);
    }

    // === Compound Trust Score Evolution ===
    // ユーザーのtrust_scoreを「ありがとう数 × 貢献数 × ストリーク」の複合指標で再計算
    // → 高信頼ユーザーの投稿がWiki記事の信頼度をさらに上げる複利ループ
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, total_contributions, total_thanks_received");

    // Get streak data for all users from contribution_days (scope outside if for wiki recalc)
    const userStreaks: Record<string, number> = {};
    {
      const { data: streakData } = await supabase
        .from("contribution_days")
        .select("user_id, active_date")
        .gte("active_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("active_date", { ascending: false });
      if (streakData) {
        // Group by user and calculate recent active days (last 30 days)
        const userDays: Record<string, Set<string>> = {};
        for (const row of streakData) {
          if (!userDays[row.user_id]) userDays[row.user_id] = new Set();
          userDays[row.user_id].add(row.active_date);
        }
        for (const [userId, days] of Object.entries(userDays)) {
          userStreaks[userId] = days.size; // Active days in last 30 days
        }
      }
    }

    if (allProfiles) {
      for (const profile of allProfiles) {
        const contribs = profile.total_contributions || 0;
        const thanks = profile.total_thanks_received || 0;
        const activeDays = userStreaks[profile.id] || 0;

        // Compound trust formula:
        // - Base: contributions * 2 (each contribution is valuable)
        // - Thanks multiplier: thanks * 3 (peer validation is strongest signal)
        // - Consistency bonus: active_days * 1.5 (regular users are more trustworthy)
        // - Cap at 100
        const rawScore = (contribs * 2) + (thanks * 3) + (activeDays * 1.5);
        const trustScore = Math.min(100, Math.round(rawScore * 100) / 100);

        await supabase
          .from("profiles")
          .update({ trust_score: trustScore })
          .eq("id", profile.id);
      }
    }

    // Recalculate avg_trust_score for wiki entries (now reflecting updated user trust scores)
    // userStreaks is accessible here because it was declared outside the if block
    const { data: allEntries } = await supabase
      .from("wiki_entries")
      .select("id");
    if (allEntries) {
      for (const entry of allEntries) {
        const { data: sources } = await supabase
          .from("wiki_sources")
          .select("id, contributor_id, contributor_trust_score")
          .eq("wiki_entry_id", entry.id);
        if (sources && sources.length > 0) {
          // Update each source's trust score from profile (compound effect)
          for (const source of sources) {
            if (source.contributor_id) {
              const profile = allProfiles?.find(p => p.id === source.contributor_id);
              if (profile) {
                const newTrust = Math.min(100,
                  ((profile.total_contributions || 0) * 2) +
                  ((profile.total_thanks_received || 0) * 3) +
                  ((userStreaks[profile.id] || 0) * 1.5)
                );
                await supabase
                  .from("wiki_sources")
                  .update({ contributor_trust_score: Math.round(newTrust * 100) / 100 })
                  .eq("id", source.id);
              }
            }
          }
          // Recalculate article average
          const { data: updatedSources } = await supabase
            .from("wiki_sources")
            .select("contributor_trust_score")
            .eq("wiki_entry_id", entry.id);
          if (updatedSources && updatedSources.length > 0) {
            const avg = updatedSources.reduce((sum, s) => sum + (Number(s.contributor_trust_score) || 0), 0) / updatedSources.length;
            await supabase
              .from("wiki_entries")
              .update({
                avg_trust_score: Math.round(avg * 100) / 100,
                source_count: updatedSources.length,
              })
              .eq("id", entry.id);
          }
        }
      }
    }

    // === Knowledge Freshness Alerts ===
    // 90日以上更新されていないWiki記事を検出し、関連トークルームに「この記事を更新しませんか？」プロンプトを追加
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: staleEntries } = await supabase
      .from("wiki_entries")
      .select("id, title, category, allergen_tags")
      .eq("is_public", true)
      .lt("updated_at", ninetyDaysAgo)
      .limit(5);

    if (staleEntries && staleEntries.length > 0) {
      // Map categories to room slugs
      const categoryToRoom: Record<string, string> = {
        "商品情報": "products", "体験記": "challenge", "対処法": "daily-food",
        "レシピ": "daily-food", "基礎知識": "family", "スキンケア": "skin-body",
        "外食": "eating-out", "園・学校": "school-life",
      };

      for (const stale of staleEntries) {
        const roomSlug = categoryToRoom[stale.category] || "daily-food";
        const promptText = `📋 「${stale.title}」の情報が古くなっています。最近の体験をお持ちの方、ぜひ教えてください！`;

        const { data: room } = await supabase
          .from("talk_rooms")
          .select("id, conversation_prompts")
          .eq("slug", roomSlug)
          .single();

        if (room) {
          const existingPrompts = (room.conversation_prompts || []) as string[];
          if (!existingPrompts.some(p => p.includes(stale.title))) {
            const updated = [...existingPrompts, promptText].slice(-6);
            await supabase.from("talk_rooms").update({ conversation_prompts: updated }).eq("id", room.id);
          }
        }

        // Update freshness_checked_at to avoid re-flagging
        await supabase.from("wiki_entries").update({ freshness_checked_at: new Date().toISOString() }).eq("id", stale.id);
      }
    }

    // Cleanup expired messages — 抽出済みのメッセージのみ削除
    // 未抽出メッセージは何日経っても保護する（バッチ失敗時のデータ保護）
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("messages")
      .delete()
      .lt("expires_at", twoDaysAgo)
      .eq("ai_extracted", true);

    // === Self-Healing KB: Knowledge Gap Detection ===
    try {
      // Analyze recent concierge questions to find unanswered topics
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: sessions } = await supabase
        .from("concierge_sessions")
        .select("messages_json")
        .gte("updated_at", oneWeekAgo)
        .limit(50);

      if (sessions && sessions.length > 0) {
        // Extract user questions from session logs
        const questions: string[] = [];
        for (const session of sessions) {
          const msgs = (session.messages_json || []) as Array<{ role: string; content: string }>;
          for (const msg of msgs) {
            if (msg.role === "user" && msg.content.length > 10) {
              questions.push(msg.content);
            }
          }
        }

        if (questions.length >= 3) {
          // Get existing wiki titles for comparison
          const { data: existingWiki } = await supabase
            .from("wiki_entries")
            .select("title, category")
            .eq("is_public", true);

          const existingTitles = (existingWiki || []).map(w => w.title).join(", ");

          // Use AI to find gaps
          const gapPrompt = `あなたは食物アレルギー知識ベースの管理AIです。

## 最近のユーザーの質問（直近1週間）:
${questions.slice(0, 20).map((q, i) => `${i + 1}. ${q}`).join("\n")}

## 既存のWiki記事タイトル:
${existingTitles || "（まだ記事がありません）"}

## タスク:
ユーザーの質問を分析し、既存のWiki記事ではカバーされていない重要なトピックを3つ特定してください。
トークルームで投げかけるプロンプト（質問文）として、JSONで返してください:

[
  {"topic": "トピック名", "prompt": "トークルームに投げかける質問文", "suggested_room": "daily-food|products|eating-out|school-life|challenge|skin-body|family|milestone"}
]`;

          const gapResult = await model.generateContent(gapPrompt);
          const gapText = gapResult.response.text();
          const jsonMatch = gapText.match(/\[[\s\S]*\]/);

          if (jsonMatch) {
            const gaps = JSON.parse(jsonMatch[0]) as Array<{
              topic: string;
              prompt: string;
              suggested_room: string;
            }>;

            // Update conversation_prompts for relevant rooms
            for (const gap of gaps) {
              const { data: room } = await supabase
                .from("talk_rooms")
                .select("id, conversation_prompts")
                .eq("slug", gap.suggested_room)
                .single();

              if (room) {
                const existingPrompts = (room.conversation_prompts || []) as string[];
                // Don't add duplicates
                if (!existingPrompts.includes(gap.prompt)) {
                  // Keep max 6 prompts, removing oldest if needed
                  const updated = [...existingPrompts, gap.prompt].slice(-6);
                  await supabase
                    .from("talk_rooms")
                    .update({ conversation_prompts: updated })
                    .eq("id", room.id);
                }
              }
            }
            console.log(`[Batch] Knowledge gap detection: found ${gaps.length} gaps`);
          }
        }
      }
    } catch (gapErr) {
      console.warn("[Batch] Knowledge gap detection failed (non-critical):", gapErr);
    }

    return {
      processed: allMessages.length,
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
