"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Trending Topics — 直近24hの投稿数・ありがとう数から「盛り上がっているテーマ」を検出
 * 
 * ✅ RLS対応: messages の SELECT ポリシーは expires_at > now() だが、
 *    24h以内のメッセージは expires_at が未来なので正常にクエリ可能。
 */
export async function getTrendingTopics() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, data: [] };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // messages の RLS は expires_at > now() でフィルタ。
    // 24h以内の投稿は expires_at(= created_at + 24h) がまだ未来なので取得できる。
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("room_id, thanks_count")
      .gte("created_at", oneDayAgo)
      .eq("is_system_bot", false)
      .limit(1000); // Added limit to prevent OOM on viral scaling

    if (!recentMessages || recentMessages.length === 0) {
      return { success: true, data: [] };
    }

    // Aggregate by room
    const roomStats: Record<string, { messageCount: number; thanksTotal: number }> = {};
    for (const msg of recentMessages) {
      const rid = msg.room_id;
      if (!roomStats[rid]) roomStats[rid] = { messageCount: 0, thanksTotal: 0 };
      roomStats[rid].messageCount += 1;
      roomStats[rid].thanksTotal += msg.thanks_count || 0;
    }

    // Score: messages * 1 + thanks * 2
    const scored = Object.entries(roomStats)
      .map(([roomId, stats]) => ({
        roomId,
        score: stats.messageCount + stats.thanksTotal * 2,
        messageCount: stats.messageCount,
        thanksTotal: stats.thanksTotal,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Fetch room details
    const roomIds = scored.map((s) => s.roomId);
    const { data: rooms } = await supabase
      .from("talk_rooms")
      .select("id, slug, name, icon_emoji")
      .in("id", roomIds);

    const trending = scored.map((s) => {
      const room = rooms?.find((r) => r.id === s.roomId);
      return {
        roomId: s.roomId,
        slug: room?.slug || "",
        name: room?.name || "",
        icon_emoji: room?.icon_emoji || "💬",
        messageCount: s.messageCount,
        thanksTotal: s.thanksTotal,
        score: s.score,
      };
    });

    return { success: true, data: trending };
  } catch (err) {
    console.error("[getTrendingTopics]", err);
    return { success: false, error: err instanceof Error ? err.message : String(err), data: [] };
  }
}

/**
 * パーソナライズドフィード — ユーザーのアレルゲン・年齢に基づく関連Wiki記事
 * 
 * ✅ RLS対応: wiki_entries の SELECT は is_public=true またはauthenticated。
 *    is_public=true のみクエリしているので問題なし。
 * ✅ F1: データ活用による「なぜこの情報が出たのか」の納得感を高めるフルパーソナライズ
 */
export async function getPersonalizedWikiEntries() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, data: [] };

    const { data: { user } } = await supabase.auth.getUser();

    let allergenTags: string[] = [];
    let ageGroups: string[] = [];

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("allergen_tags, children_profiles")
        .eq("id", user.id)
        .maybeSingle();
        
      if (profile) {
        allergenTags = profile.allergen_tags || [];
        const cProfile = profile.children_profiles as { ageGroup?: string }[];
        if (cProfile && Array.isArray(cProfile)) {
           ageGroups = Array.from(new Set(cProfile.map(c => c.ageGroup).filter(Boolean))) as string[];
        }
      }
    }

    // Decode age contextual keywords
    const keywords: string[] = [];
    let ageLabel = "";

    if (ageGroups.length > 0) {
      if (ageGroups.includes("0-1")) {
        keywords.push("離乳食", "赤ちゃん", "ベビー", "ミルク", "初めて", "授乳");
        ageLabel = "離乳食期";
      }
      if (ageGroups.includes("1-3")) {
        keywords.push("幼児", "保育園", "1歳", "2歳", "3歳", "おやつ", "イヤイヤ");
        ageLabel = ageLabel ? "離乳食/幼児期" : "幼児期";
      }
      if (ageGroups.includes("3-6")) {
        keywords.push("幼稚園", "こども園", "給食", "お弁当", "先生", "遠足");
        ageLabel = ageLabel ? "乳幼児/園児" : "園児（3-6歳）";
      }
      if (ageGroups.includes("6-12")) {
        keywords.push("小学生", "学童", "入学", "学校", "宿泊", "ランドセル");
        ageLabel = ageLabel ? "園児/小学生" : "小学生";
      }
    }

    // Build personalization label
    let personalizationLabel = "";
    const tagLabel = allergenTags.length > 0 
      ? (allergenTags.length <= 2 ? allergenTags.join("・") : allergenTags[0] + "など") + "アレルギー" 
      : "";
      
    if (tagLabel && ageLabel) {
      personalizationLabel = `✨ ${tagLabel} × ${ageLabel} をもつ方へ`;
    } else if (tagLabel) {
      personalizationLabel = `✨ ${tagLabel} をもつ方へ`;
    } else if (ageLabel) {
      personalizationLabel = `✨ ${ageLabel} のヒント（一部抜粋）`;
    }

    // Type for our queried data
    interface WikiEntryData {
      id: string;
      title: string;
      slug: string;
      category: string;
      summary: string;
      allergen_tags: string[];
      avg_trust_score: number;
      source_count: number;
      updated_at: string;
      sections?: Record<string, unknown>[]; // Mega-Wiki sections array
    }

    let matched: WikiEntryData[] = [];

    // Stage 1: Try finding by allergens first (Primary axis)
    if (allergenTags.length > 0) {
      const { data: allergenMatched } = await supabase
        .from("wiki_entries")
        .select("id, title, slug, category, summary, allergen_tags, avg_trust_score, source_count, updated_at, sections")
        .eq("is_public", true)
        .overlaps("allergen_tags", allergenTags as string[])
        .order("avg_trust_score", { ascending: false })
        .limit(8);
      
      if (allergenMatched) matched = allergenMatched as WikiEntryData[];
    }

    // Stage 2: Enhance with Age Keywords
    if (keywords.length > 0) {
      if (matched.length === 0) {
        // No allergens matches (or no allergens set), find purely by keywords
        const orConditions: string[] = [];
        keywords.forEach(kw => {
          orConditions.push(`summary.ilike.%${kw}%`);
          orConditions.push(`sections::text.ilike.%${kw}%`);
        });
        
        const { data: kwMatched } = await supabase
          .from("wiki_entries")
          .select("id, title, slug, category, summary, allergen_tags, avg_trust_score, source_count, updated_at, sections")
          .eq("is_public", true)
          .or(orConditions.join(","))
          .order("avg_trust_score", { ascending: false })
          .limit(8);
          
        if (kwMatched) matched = kwMatched as WikiEntryData[];
      } else {
        // We have matching allergens. Boost the ones that also match the age keywords.
        matched.sort((a, b) => {
          let aScore = a.avg_trust_score || 0;
          let bScore = b.avg_trust_score || 0;
          const aText = (a.title + " " + a.summary + " " + JSON.stringify(a.sections)).toLowerCase();
          const bText = (b.title + " " + b.summary + " " + JSON.stringify(b.sections)).toLowerCase();
          // Boost significantly if the age context matches anywhere in the article
          if (keywords.some(kw => aText.includes(kw))) aScore += 1000;
          if (keywords.some(kw => bText.includes(kw))) bScore += 1000;
          return bScore - aScore; // Descending
        });
      }
    }

    if (matched && matched.length > 0) {
      const isPersonalized = true;
      const finalLabel = personalizationLabel || "✨ あなたへの特別なおすすめ";
      
      // Feature: "Extract specific snippets instead of generic article summaries"
      // Mega-Wikis are large (1 of 8). We should show the EXACT relevant sub-section.
      const searchTerms = [...keywords, ...(allergenTags as string[])];
      
      const enhancedMatches = matched.slice(0, 5).map(entry => {
        let bestSnippet = entry.summary;
        // Search through the sections to find a hyper-relevant snippet
        if (entry.sections && Array.isArray(entry.sections)) {
          for (const section of entry.sections) {
            const heading = (section.heading as string) || "";
            const items = (section.items as Record<string, unknown>[]) || [];
            
            // Does this section heading or items contain our keywords?
            const sectionText = (heading + " " + JSON.stringify(items)).toLowerCase();
            if (searchTerms.some(term => sectionText.includes(term.toLowerCase()))) {
              // Find the specific item that matched
              const matchedItem = items.find((item: Record<string, unknown>) => {
                const content = item.content as string | undefined;
                return searchTerms.some(term => content && content.toLowerCase().includes(term.toLowerCase()));
              });
              
              if (matchedItem) {
                 bestSnippet = `💡 ${heading}: ${(matchedItem.content as string).substring(0, 50)}...`;
              } else {
                 bestSnippet = `💡 見出し: ${heading}`;
              }
              break; // Found the best snippet for this entry
            }
          }
        }
        
        return {
          ...entry,
          summary: bestSnippet,
          sections: undefined // do not send heavy json to client
        };
      });

      return { success: true, data: enhancedMatches, isPersonalized, personalizationLabel: finalLabel };
    }

    // Fallback: top entries by trust
    const { data: top } = await supabase
      .from("wiki_entries")
      .select("id, title, slug, category, summary, allergen_tags, avg_trust_score, source_count, updated_at")
      .eq("is_public", true)
      .order("avg_trust_score", { ascending: false })
      .limit(5);

    return { success: true, data: top || [], isPersonalized: false, personalizationLabel: "📖 人気のまとめ記事" };
  } catch (err) {
    console.error("[getPersonalizedWikiEntries]", err);
    return { success: false, data: [] };
  }
}

/**
 * ストリーク情報の取得 — 連続貢献日数
 * 
 * ✅ RLS対応: contribution_days テーブルから取得。
 *    このテーブルはDBトリガーでメッセージ投稿時に自動記録され、
 *    メッセージが期限切れ・削除されても永続的に残る。
 *    RLSポリシー: auth.uid() = user_id (自分のデータのみ閲覧可)
 * 
 * ⚠️ 以前の実装は messages テーブルを使っていたが、messagesは：
 *    - RLS: expires_at > now() (24h後に見えなくなる)
 *    - バッチ: 48h後に物理削除
 *    → ストリーク計算が常に最大1日にしかならない致命的バグがあった
 */
export async function getContributionStreak() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, data: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: null };

    // contribution_days テーブルから取得（永続データ）
    const { data: days } = await supabase
      .from("contribution_days")
      .select("active_date")
      .eq("user_id", user.id)
      .order("active_date", { ascending: false })
      .limit(90);

    if (!days || days.length === 0) {
      return { success: true, data: { currentStreak: 0, longestStreak: 0, totalDays: 0, lastActiveDate: null } };
    }

    const totalDays = days.length;
    const activeDates = days.map(d => d.active_date as string); // YYYY-MM-DD format from DB

    // Calculate current streak
    let currentStreak = 0;
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const today = jstNow.toISOString().split("T")[0];
    const yesterday = new Date(jstNow.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Check if active today or yesterday (allow 1 day grace)
    if (activeDates[0] === today || activeDates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < activeDates.length; i++) {
        const prevDate = new Date(activeDates[i - 1] + "T00:00:00Z");
        const currDate = new Date(activeDates[i] + "T00:00:00Z");
        const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    const sorted = [...activeDates].sort();
    let longestStreak = 1;
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + "T00:00:00Z");
      const curr = new Date(sorted[i] + "T00:00:00Z");
      const diff = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
      if (diff === 1) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 1;
      }
    }

    return {
      success: true,
      data: {
        currentStreak,
        longestStreak,
        totalDays,
        lastActiveDate: activeDates[0],
      },
    };
  } catch (err) {
    console.error("[getContributionStreak]", err);
    return { success: false, data: null };
  }
}

/**
 * Weekly Digest — 今週のハイライト生成
 * 
 * ✅ RLS対応: adminClient (service_role) を使用してRLSをバイパス。
 *    通常クライアントでは messages の RLS (expires_at > now()) により
 *    24h以上前のメッセージが見えず、週間統計が不正確になるため。
 * 
 * ⚠️ 以前の実装は通常クライアントを使っていたため：
 *    - messageCount は直近24h分しか返らなかった（1週間分ではなく）
 *    - uniqueContributors も同様に不正確だった
 * 
 * 代替データソース:
 *    - 投稿数: contribution_days テーブルの post_count 合計（永続）
 *    - 参加者数: contribution_days テーブルの DISTINCT user_id（永続）
 *    - Wiki記事: wiki_entries は is_public で永続なので通常クライアントでOK
 */
export async function getWeeklyDigest() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, data: null };

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgoDate = new Date(Date.now() + 9 * 60 * 60 * 1000 - 7 * 24 * 60 * 60 * 1000)
      .toISOString().split("T")[0];

    // New wiki entries this week (永続データ、RLS問題なし)
    const { data: newWiki, count: wikiCount } = await supabase
      .from("wiki_entries")
      .select("title, slug, category, summary", { count: "exact" })
      .eq("is_public", true)
      .gte("created_at", oneWeekAgo)
      .order("avg_trust_score", { ascending: false })
      .limit(3);

    // 投稿数と参加者数: contribution_days テーブルから取得（永続データ）
    // adminClient を使ってRLSをバイパス（全ユーザーの統計を集計するため）
    let messageCount = 0;
    let uniqueContributors = 0;

    try {
      const admin = createAdminClient();
      const { data: weekDays } = await admin
        .from("contribution_days")
        .select("user_id, post_count")
        .gte("active_date", oneWeekAgoDate)
        .limit(3000);

      if (weekDays && weekDays.length > 0) {
        messageCount = weekDays.reduce((sum, d) => sum + (d.post_count || 0), 0);
        uniqueContributors = new Set(weekDays.map(d => d.user_id)).size;
      }
    } catch {
      // Admin client not available (env missing), fall back to 0
    }

    return {
      success: true,
      data: {
        newArticles: newWiki || [],
        newArticleCount: wikiCount || 0,
        messageCount,
        uniqueContributors,
        weekStarting: oneWeekAgo,
      },
    };
  } catch (err) {
    console.error("[getWeeklyDigest]", err);
    return { success: false, data: null };
  }
}

/**
 * Impact Feedback — 投稿後に「あなたの過去の貢献がどう役立ったか」を表示
 * 
 * ✅ データソース: wiki_sources (永続) + wiki_entries (永続)
 *    RLSの影響なし。contributor_id で自分のソースのみ取得。
 */
export async function getImpactFeedback() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, data: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: null };

    // Count how many wiki articles reference this user's contributions
    const { data: allSources } = await supabase
      .from("wiki_sources")
      .select("wiki_entry_id")
      .eq("contributor_id", user.id);

    let uniqueArticles = 0;
    let totalSourcesInArticles = 0;
    const entryIds = new Set<string>();

    if (allSources && allSources.length > 0) {
      allSources.forEach(s => entryIds.add(s.wiki_entry_id as string));
      uniqueArticles = entryIds.size;
      totalSourcesInArticles = allSources.length;
    }

    // NEW: Get the detailed recent impact history (for Visual Bento UI)
    interface ImpactItem {
      title: string;
      slug: string;
      category: string;
      snippet: string;
      trustScore: number;
      extractedAt: string;
    }
    const recentImpacts: ImpactItem[] = [];

    if (entryIds.size > 0) {
      // Get the latest distinct sources from this user
      const { data: recentSources } = await supabase
        .from("wiki_sources")
        .select("wiki_entry_id, original_message_snippet, extracted_at")
        .eq("contributor_id", user.id)
        .order("extracted_at", { ascending: false })
        .limit(10);

      if (recentSources && recentSources.length > 0) {
        const recentEntryIds = [...new Set(recentSources.map(s => String(s.wiki_entry_id)))];
        const { data: entries } = await supabase
          .from("wiki_entries")
          .select("id, title, slug, category, avg_trust_score")
          .in("id", recentEntryIds);

        if (entries) {
          const entryMap = new Map(entries.map(e => [e.id, e]));
          const added = new Set<string>();
          for (const src of recentSources) {
            const eid = String(src.wiki_entry_id);
            if (!added.has(eid)) {
              added.add(eid);
              const entry = entryMap.get(eid);
              if (entry) {
                recentImpacts.push({
                  title: entry.title,
                  slug: entry.slug,
                  category: entry.category,
                  snippet: (src.original_message_snippet as string) || "コミュニティへの体験の共有が役立ちました",
                  trustScore: entry.avg_trust_score || 0,
                  extractedAt: String(src.extracted_at),
                });
              }
            }
            if (recentImpacts.length >= 3) break; // Only showcase top 3 in Bento
          }
        }
      }
    }

    // Get the user's profile stats
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_thanks_received, trust_score")
      .eq("id", user.id)
      .maybeSingle();

    const thanks = profile?.total_thanks_received || 0;
    const trustScore = profile?.trust_score || 0;

    // Generate contextual impact message  
    let message: string;
    if (uniqueArticles >= 5 && thanks >= 10) {
      message = `🌟 あなたのヒントは${uniqueArticles}件の記事に反映され、${thanks}人に感謝されています`;
    } else if (uniqueArticles >= 3) {
      message = `📖 あなたの体験が${uniqueArticles}件のまとめ記事に活かされています`;
    } else if (uniqueArticles >= 1) {
      message = `💚 あなたの大切な体験が、みんなのヒントとして役立っています！`;
    } else if (thanks > 0) {
      message = `❤️ ${thanks}人のパパ・ママがあなたのお声に「ありがとう」を送りました`;
    } else {
      message = `🌱 あなたの体験は、みんなの資産としてあと少しでまとめ記事に整理されます`;
    }

    return {
      success: true,
      data: {
        articlesHelped: uniqueArticles,
        totalSourcesInArticles,
        thanks,
        trustScore: Math.round(trustScore),
        message,
        recentImpacts,
      },
    };
  } catch (err) {
    console.error("[getImpactFeedback]", err);
    return { success: false, data: null };
  }
}

/**
 * Knowledge Ripple — Wiki記事の成長履歴（Wikipedia的 "この記事のヒストリー"）
 * 
 * ✅ データソース: wiki_sources (永続) — 記事に紐づくソース一覧
 */
export async function getKnowledgeRipple(wikiSlug: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, data: null };

    const { data: entry } = await supabase
      .from("wiki_entries")
      .select("id, title, source_count, avg_trust_score, created_at, updated_at")
      .eq("slug", wikiSlug)
      .eq("is_public", true)
      .maybeSingle();

    if (!entry) return { success: true, data: null };

    // Get contributors to this article
    const { data: sources } = await supabase
      .from("wiki_sources")
      .select(`
        id,
        extracted_at,
        contributor_trust_score,
        profiles:contributor_id (
          display_name,
          trust_score
        )
      `)
      .eq("wiki_entry_id", entry.id)
      .order("extracted_at", { ascending: true });

    const contributors = (sources || []).map(s => {
      const prof = s.profiles as unknown as { display_name?: string, trust_score?: number };
      return {
        extractedAt: s.extracted_at,
        trustScore: s.contributor_trust_score,
        displayName: prof?.display_name || "匿名",
      };
    });

    // Calculate article "maturity" (how evolved this knowledge is)
    const sourceCount = entry.source_count || 0;
    const trustScore = entry.avg_trust_score || 0;
    const ageInDays = Math.floor((Date.now() - new Date(entry.created_at).getTime()) / (24 * 60 * 60 * 1000));

    let maturityLevel: "seedling" | "growing" | "established" | "authoritative";
    let maturityLabel: string;
    if (sourceCount >= 10 && trustScore >= 60) {
      maturityLevel = "authoritative";
      maturityLabel = "🏆 権威あるヒント";
    } else if (sourceCount >= 5 && trustScore >= 30) {
      maturityLevel = "established";
      maturityLabel = "🌳 確立されたヒント";
    } else if (sourceCount >= 2) {
      maturityLevel = "growing";
      maturityLabel = "🌿 成長中のヒント";
    } else {
      maturityLevel = "seedling";
      maturityLabel = "🌱 芽生えのヒント";
    }

    return {
      success: true,
      data: {
        title: entry.title,
        sourceCount,
        trustScore: Math.round(trustScore),
        ageInDays,
        maturityLevel,
        maturityLabel,
        contributors,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      },
    };
  } catch (err) {
    console.error("[getKnowledgeRipple]", err);
    return { success: false, data: null };
  }
}

/**
 * ユーザーのエンゲージメント・ティアを取得 (Tiered Dashboard 用)
 */
export async function getEngagementTier(): Promise<{ success: boolean; error?: string; data?: { tier: "guest" | "reader" | "contributor", postCount: number } }> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, data: { tier: "guest", postCount: 0 } };

    const { data: profile } = await supabase
      .from("profiles")
      .select("total_contributions")
      .eq("id", user.id)
      .maybeSingle();

    const postCount = profile?.total_contributions || 0;
    const tier = postCount > 0 ? "contributor" : "reader";

    return { success: true, data: { tier, postCount } };
  } catch (err) {
    console.error("[getEngagementTier]", err);
    return { success: false, error: err instanceof Error ? err.message : String(err), data: { tier: "guest" as const, postCount: 0 } };
  }
}

export async function getCommunityStats() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: { totalMembers: 0, totalExperiences: 0, totalWikiEntries: 0 } };

    const [profilesRes, sourcesRes, wikiRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("wiki_sources").select("id", { count: "exact", head: true }),
      supabase.from("wiki_entries").select("id", { count: "exact", head: true }),
    ]);

    return {
      success: true,
      data: {
        totalMembers: profilesRes.count || 0,
        totalExperiences: sourcesRes.count || 0,
        totalWikiEntries: wikiRes.count || 0,
      },
    };
  } catch (err) {
    console.error("[getCommunityStats]", err);
    return { success: true, data: { totalMembers: 0, totalExperiences: 0, totalWikiEntries: 0 } };
  }
}
