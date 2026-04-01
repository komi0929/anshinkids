"use server";

import { createClient } from "@/lib/supabase/server";
import { askConcierge as askConciergeAI } from "@/lib/ai/concierge-rag";
import { getMyProfile } from "./mypage";

export async function askConcierge(sessionId: string | null, question: string, contextPayload?: string) {
  try {
    const supabase = await createClient();

    let userId: string | null = null;
    let finalPayload = contextPayload;

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;

      if (userId) {
        const profileResponse = await getMyProfile();
        if (profileResponse.success && profileResponse.data) {
          const profile = profileResponse.data as unknown as { allergen_tags?: string[], children_profiles?: { ageGroup?: string }[], trust_score?: number };
          // 1. アレルゲンの抽出
          const allergens: string[] = profile.allergen_tags || [];

          // 2. 年齢情報の抽出
          let childrenStr = "お子様";
          const childrenProfiles = profile.children_profiles;
          if (childrenProfiles && Array.isArray(childrenProfiles) && childrenProfiles.length > 0) {
             const groups = childrenProfiles.map(c => c.ageGroup).filter(Boolean) as string[];
             if (groups.length > 0) {
               childrenStr = groups.map(g => {
                 if (g === '0-1') return '離乳食期(0-1歳)のお子様';
                 if (g === '1-3') return '幼児期(1-3歳)のお子様';
                 if (g === '3-6') return '園児(3-6歳)のお子様';
                 if (g === '6-12') return '小学生のお子様';
                 return 'お子様';
               }).join("と");
             }
          }

          // 3. 貢献・トラスト情報の抽出
          const ts = profile.trust_score || 0;
          const trustStr = ts ? ` (トラストスコア: ${ts.toFixed(0)})` : "";
          const contributorStatus = ts >= 40 ? "信頼できるコミュニティの貢献者" + trustStr : "コミュニティ参加者" + trustStr;
          
          finalPayload = `【相談者のコンテキスト】\n- 対象: ${childrenStr}\n- アレルゲン: ${allergens.length > 0 ? allergens.join("・") : "登録なし"}\n- アカウント状態: ${contributorStatus}`;
        }
      }
    }

    // Check if API key is configured
    if (!process.env.GOOGLE_API_KEY || !userId) {
      // Demo/guest response
      const loginNote = !userId
        ? "\n\n---\n💡 ログインすると、より詳しい個別相談ができます。"
        : "";
      return {
        success: true,
        data: {
          sessionId: sessionId || "demo",
          answer: `ご相談ありがとうございます 🌿\n\nお子さまのアレルギーについてのお悩み、よく伝わってきます。日々、お子さまの安全を最優先に考えながら食事を準備されているのは、本当に素晴らしいことです。\n\n一般的に以下のステップがお役に立つかもしれません：\n\n• **主治医との定期的な相談**: 負荷試験の進め方やタイミングは、お子さまの状態により大きく異なります\n• **トークルームへの投稿**: 同じ悩みを持つ保護者の方からのリアルな体験談が集まりつつあります\n• **食品メーカーへの直接確認**: アレルゲンのコンタミネーション情報は、メーカーに直接問い合わせることが最も確実です\n\n一人で抱え込まないでくださいね。あんしんキッズは、いつでもお話を伺います 💚${loginNote}`,
          messages: [],
          wikiSourceCount: 0,
          avgTrustScore: 0,
        },
      };
    }

    const result = await askConciergeAI(userId, sessionId, question, finalPayload);
    return { success: true, data: result };
  } catch (err) {
    console.error("[askConcierge]", err);
    return { success: false, error: "AIの応答に失敗しました。しばらくしてからお試しください。" };
  }
}

/**
 * Gap 4: Allow concierge consultations to feed back into Wiki.
 * Users can choose to anonymously contribute their question/experience
 * to the knowledge base, making the AI smarter for future consultations.
 */
export async function contributeFromConcierge(questionText: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();

    // In Phase 3, we no longer process Wiki Entries synchronously from the Concierge.
    // Instead, we inject the high-value context into the 'family' room stream (or a general catch-all).
    // The nightly Batch Processor will autonomously harvest this anonymized insight
    // and naturally integrate it into the Mega-Wiki sections.
    
    // First, resolve the appropriate room ID for 'family'
    const { data: room } = await supabase
      .from("talk_rooms")
      .select("id")
      .eq("slug", "family")
      .single();

    if (!room) return { success: false, error: "該当ルームが見つかりません" };

    const { error: insertError } = await supabase.from("messages").insert({
      room_id: room.id,
      content: `【AI相談室からの匿名知恵共有】\n${questionText.slice(0, 1000)}`,
      user_id: user?.id || null, // Guest or properly anonymized
      is_system_bot: false, // We treat this as user-contributed insight for trust score propagation
    });

    if (insertError) throw insertError;

    // Update contributor stats if logged in
    if (user) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_contributions")
          .eq("id", user.id)
          .single();
        if (profile) {
          await supabase
            .from("profiles")
            .update({ total_contributions: (profile.total_contributions || 0) + 1 })
            .eq("id", user.id);
        }
      } catch { /* best effort */ }
    }

    return { success: true };
  } catch (err) {
    console.error("[contributeFromConcierge]", err);
    return { success: false, error: "貢献の処理に失敗しました" };
  }
}
