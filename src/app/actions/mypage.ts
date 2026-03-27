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
