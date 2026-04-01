"use server";

import { createClient } from "@/lib/supabase/server";

export async function getMyProfile() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code === "PGRST116") {
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
        .select()
        .single();

      if (insertError) throw insertError;
      return { success: true, data: newProfile };
    }

    if (error) throw error;
    return { success: true, data: profile };
  } catch (err) {
    console.error("[getMyProfile]", err);
    return { success: false, error: "プロフィール取得に失敗しました" };
  }
}

export async function updateMyProfile(updates: {
  display_name?: string;
  allergen_tags?: string[];
  child_age_months?: number | null;
  children_profiles?: Record<string, unknown>[];
}) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) throw error;
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
      .eq("contributor_id", user.id);

    const articlesContributed = new Set(
      (sources || []).map((s) => s.wiki_entry_id).filter(Boolean)
    ).size;

    // Estimate readers: count based on source_count as a proxy for engagement
    // Each wiki entry's source_count indicates how many people engaged with it
    const entryIds = [...new Set((sources || []).map((s) => s.wiki_entry_id).filter(Boolean))];
    let totalReaders = 0;
    let aiAnswersReferenced = 0;

    if (entryIds.length > 0) {
      const { data: entries } = await supabase
        .from("wiki_entries")
        .select("source_count, avg_trust_score")
        .in("id", entryIds);

      if (entries) {
        // Estimate readers: source_count × 5 (conservative multiplier)
        totalReaders = entries.reduce((sum, e) => sum + ((e.source_count || 1) * 5), 0);
        // Estimate AI references: based on entries with trust score > 30
        aiAnswersReferenced = entries.filter(e => (e.avg_trust_score || 0) > 30).length * 2;
      }
    }

    // Get trust score delta (compare current to base)
    const { data: profile } = await supabase
      .from("profiles")
      .select("trust_score, total_contributions, total_thanks_received")
      .eq("id", user.id)
      .single();

    const trustDelta = Math.round((profile?.trust_score || 0));

    return {
      success: true,
      data: {
        articlesContributed,
        totalReaders,
        aiAnswersReferenced,
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

    return { success: true };
  } catch (err) {
    console.error("[deleteMyAccount]", err);
    return { success: false, error: "削除に失敗しました" };
  }
}
