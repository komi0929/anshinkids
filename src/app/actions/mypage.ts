"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getImpactFeedback, getContributionStreak } from "./discover";
import { getMyBookmarks } from "./wiki";

export async function getFullMyPageData() {
  try {
    const [profileRes, contribRes, impactRes, bookmarksRes, streakRes] = await Promise.all([
      getMyProfile().catch(() => ({ success: false, data: null })),
      getMyContributions().catch(() => ({ success: true, data: [] })),
      getImpactFeedback().catch(() => ({ success: false, data: null })),
      getMyBookmarks().catch(() => ({ success: false, data: [] })),
      getContributionStreak().catch(() => ({ success: false, data: null }))
    ]);
    return {
      success: true,
      data: {
        profile: profileRes.success ? profileRes.data : null,
        contributions: contribRes.success ? contribRes.data : [],
        impact: impactRes.success ? impactRes.data : null,
        bookmarks: bookmarksRes.success ? bookmarksRes.data : [],
        streak: streakRes.success ? streakRes.data : null
      }
    }
  } catch (err) {
    return { success: false, error: "データ一括取得に失敗しました", data: null };
  }
}

export async function getMyProfile() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, trust_score, total_contributions, total_thanks_received, allergen_tags, child_age_months, children_profiles, interests")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile && !error) {
      // Profile not found — create one
      const displayName = user.user_metadata?.full_name
        || user.user_metadata?.name
        || "あんしんユーザー";
      const avatarUrl = user.user_metadata?.avatar_url || null;

      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
        })
        .select("id, display_name, avatar_url, trust_score, total_contributions, total_thanks_received, allergen_tags, child_age_months, children_profiles, interests")
        .maybeSingle();

      if (insertError) throw insertError;
      return { success: true, data: newProfile };
    }

    if (error) throw error;
    
    // Legacy Data Migration on Read (Polyfill for users who haven't updated yet)
    if (profile && profile.allergen_tags && Array.isArray(profile.allergen_tags)) {
      const firstTag = profile.allergen_tags[0];
      if (firstTag && typeof firstTag === "string" && firstTag.startsWith("JSON_PAYLOAD_")) {
        try {
          if (firstTag.startsWith("JSON_PAYLOAD_V3:")) {
            const parsed = JSON.parse(firstTag.replace("JSON_PAYLOAD_V3:", ""));
            // Only polyfill if DB columns are empty
            if (!profile.children_profiles || (profile.children_profiles as unknown[]).length === 0) profile.children_profiles = parsed.children || [];
            if (!profile.interests || (profile.interests as unknown[]).length === 0) profile.interests = parsed.interests || [];
            profile.allergen_tags = profile.allergen_tags.slice(1);
          } else if (firstTag.startsWith("JSON_PAYLOAD_V2:")) {
            if (!profile.children_profiles || (profile.children_profiles as unknown[]).length === 0) profile.children_profiles = JSON.parse(firstTag.replace("JSON_PAYLOAD_V2:", ""));
            profile.allergen_tags = profile.allergen_tags.slice(1);
            if (!profile.interests) profile.interests = [];
          }
        } catch { /* ignore */ }
      }
    }

    return { success: true, data: profile };
  } catch (err) {
    console.error("[getMyProfile]", err);
    return { success: false, error: "プロフィール取得に失敗しました" };
  }
}

export async function updateMyProfile(updates: {
  display_name?: string;
  avatar_url?: string | null;
  allergen_tags?: string[];
  child_age_months?: number | null;
  children_profiles?: Record<string, unknown>[];
  interests?: string[];
}) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const payload = { ...updates };
    if (payload.children_profiles) {
      // Collect all allergens from children into the parent allergen_tags
      const flatAllergens = new Set<string>();
      if (payload.allergen_tags) payload.allergen_tags.forEach(a => flatAllergens.add(a));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload.children_profiles.forEach((c: any) => {
        if (Array.isArray(c.allergens)) c.allergens.forEach((a: string) => flatAllergens.add(a));
        if (Array.isArray(c.customAllergens)) c.customAllergens.forEach((a: string) => flatAllergens.add(a));
      });
      payload.allergen_tags = Array.from(flatAllergens);
    }

    const { error } = await supabase
      .from("profiles")
      .update(payload as any)
      .eq("id", user.id);

    if (error) throw error;
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[updateMyProfile]", err);
    return { success: false, error: "プロフィール更新に失敗しました" };
  }
}

export async function getMyContributions() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    // Get wiki sources where this user contributed
    const { data, error } = await supabase
      .from("wiki_sources")
      .select(`
        id,
        original_message_snippet,
        extracted_at,
        wiki_entries:wiki_entry_id (
          id,
          title,
          slug,
          category
        )
      `)
      .eq("contributor_id", user.id)
      .order("extracted_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    console.error("[getMyContributions]", err);
    return { success: true, data: [] };
  }
}

/**
 * Gap 5: Calculate the user's impact metrics.
 * Shows how their contributions are helping others.
 */
export async function getMyImpact() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    // Count wiki entries the user contributed to
    const { data: sources } = await supabase
      .from("wiki_sources")
      .select("wiki_entry_id")
      .eq("contributor_id", user.id)
      .limit(2000);

    const articlesContributed = new Set(
      (sources || []).map((s) => s.wiki_entry_id).filter(Boolean)
    ).size;

    // True compound impact: real helpful votes
    const { data: profile } = await supabase
      .from("profiles")
      .select("trust_score, total_contributions, total_thanks_received, total_helpful_votes")
      .eq("id", user.id)
      .maybeSingle();

    const totalHelpfulVotes = profile?.total_helpful_votes || 0;
    const trustDelta = Math.round((profile?.trust_score || 0));

    return {
      success: true,
      data: {
        articlesContributed,
        totalHelpfulVotes,
        trustDelta,
      },
    };
  } catch (err) {
    console.error("[getMyImpact]", err);
    return { success: true, data: null };
  }
}

/**
 * F6: Complete account deletion.
 * Removes all user data while preserving anonymized wiki contributions.
 */
export async function deleteMyAccount() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    // Sever contributor links (anonymize wiki_sources)
    await supabase
      .from("wiki_sources")
      .update({ contributor_id: null })
      .eq("contributor_id", user.id);

    // Delete concierge sessions
    await supabase
      .from("concierge_sessions")
      .delete()
      .eq("user_id", user.id);

    // Delete isolated related row data (Prevents FK Violations)
    await supabase.from("message_thanks").delete().eq("user_id", user.id);
    await supabase.from("wiki_helpful_votes").delete().eq("user_id", user.id);
    await supabase.from("user_bookmarks").delete().eq("user_id", user.id);
    await supabase.from("contribution_days").delete().eq("user_id", user.id);

    // 安全対策: Pending raw messages are immediately wiped
    await supabase
      .from("messages")
      .delete()
      .eq("user_id", user.id);

    // Delete profile
    await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    // Sign out first
    await supabase.auth.signOut();

    // Delete auth.users record using admin client
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminClient = createAdminClient();
      await adminClient.auth.admin.deleteUser(user.id);
    } catch (adminErr) {
      console.error("[deleteMyAccount] Admin deletion failed:", adminErr);
      // Profile and data are already deleted, so this is best-effort
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("[deleteMyAccount]", err);
    return { success: false, error: "削除に失敗しました" };
  }
}

/**
 * Phase 9: 300-point Utility-Led Growth
 * Fetch public allergy passport safely for sharing.
 */
export async function getPublicAllergyCard(profileId: string) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    // Only fetch safe, essential data needed for the amulet card.
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("id, display_name, allergen_tags, child_age_months, children_profiles")
      .eq("id", profileId)
      .maybeSingle();

    if (error) throw error;
    if (!profile) return { success: false, error: "カードが見つかりません" };

    return { success: true, data: profile };
  } catch (err) {
    console.error("[getPublicAllergyCard]", err);
    return { success: false, error: "カードの読み込みに失敗しました" };
  }
}
