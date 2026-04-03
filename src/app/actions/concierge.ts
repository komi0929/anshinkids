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

          // 3. コミュニティ参加情報（ランク付けしない）
          const memberStatus = (profile.trust_score || 0) > 0 ? "体験を共有してくれている参加者" : "コミュニティ参加者";
          
          finalPayload = `【相談者のコンテキスト】\n- 対象: ${childrenStr}\n- アレルゲン: ${allergens.length > 0 ? allergens.join("・") : "登録なし"}\n- アカウント状態: ${memberStatus}`;
        }
      }
    }

    // Check if API key is configured
    if (!process.env.GOOGLE_API_KEY) {
      return { success: false, error: "AI機能は現在メンテナンス中です。しばらくしてからお試しください。" };
    }
    if (!userId) {
      return { success: false, error: "AI個別相談はログインが必要です" };
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
      .maybeSingle();

    if (!room) return { success: false, error: "該当ルームが見つかりません" };

    const { error: insertError } = await supabase.from("messages").insert({
      room_id: room.id,
      content: `【AI相談室からの匿名ヒント共有】\n${questionText.slice(0, 1000)}`,
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
          .maybeSingle();
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
