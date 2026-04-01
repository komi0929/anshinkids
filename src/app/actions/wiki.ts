"use server";

import { createClient } from "@/lib/supabase/server";

export async function searchWiki(query: string, filters?: { category?: string; allergens?: string[] }) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: [] };

    let queryBuilder = supabase
      .from("wiki_entries")
      .select("id, title, slug, category, summary, allergen_tags, avg_trust_score, source_count, updated_at")
      .order("avg_trust_score", { ascending: false });

    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,summary.ilike.%${query}%`);
    }

    if (filters?.category) {
      queryBuilder = queryBuilder.eq("category", filters.category);
    }

    if (filters?.allergens && filters.allergens.length > 0) {
      queryBuilder = queryBuilder.overlaps("allergen_tags", filters.allergens);
    }

    const { data, error } = await queryBuilder.limit(50);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    console.error("[searchWiki]", err);
    return { success: true, data: [] };
  }
}

export async function getWikiEntry(slug: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data, error } = await supabase
      .from("wiki_entries")
      .select(`
        *,
        wiki_sources (
          id,
          original_message_snippet,
          contributor_trust_score,
          extracted_at
        )
      `)
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("[getWikiEntry]", err);
    return { success: false, error: "記事が見つかりません" };
  }
}


export async function voteWikiHelpful(entryId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { error } = await supabase
      .from("wiki_helpful_votes")
      .insert({
        wiki_entry_id: entryId,
        user_id: user.id,
      });

    // code 23505 is unique violation (already voted)
    if (error && error.code === '23505') {
      return { success: false, error: "既に「役に立った」を押しています" };
    }
    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error("[voteWikiHelpful]", err);
    return { success: false, error: "投票に失敗しました" };
  }
}

export async function toggleSnippetBookmark(entryId: string, snippetTitle: string, snippetContent: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    // Check if it already exists
    const { data: existing } = await supabase
      .from("user_bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("wiki_entry_id", entryId)
      .eq("snippet_title", snippetTitle)
      .single();

    if (existing) {
      await supabase.from("user_bookmarks").delete().eq("id", existing.id);
      return { success: true, bookmarked: false };
    } else {
      await supabase.from("user_bookmarks").insert({
        user_id: user.id,
        wiki_entry_id: entryId,
        snippet_title: snippetTitle,
        snippet_content: snippetContent,
      });
      return { success: true, bookmarked: true };
    }
  } catch (err) {
    console.error("[toggleSnippetBookmark]", err);
    return { success: false, error: "ブックマークの切り替えに失敗しました" };
  }
}

export async function checkBookmarkedSnippets(entryId: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, data: [] }; // Not logged in -> no bookmarks

    const { data, error } = await supabase
      .from("user_bookmarks")
      .select("snippet_title")
      .eq("user_id", user.id)
      .eq("wiki_entry_id", entryId);

    if (error) throw error;
    
    return { success: true, data: data.map(d => d.snippet_title) };
  } catch (err) {
    console.error("[checkBookmarkedSnippets]", err);
    return { success: false, error: "ブックマークの取得に失敗しました" };
  }
}

export async function getMyBookmarks() {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    const { data, error } = await supabase
      .from("user_bookmarks")
      .select(`
        id,
        snippet_title,
        snippet_content,
        created_at,
        wiki_entries!inner (
          id,
          title,
          slug,
          category
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("[getMyBookmarks]", err);
    return { success: false, error: "ブックマーク一覧の取得に失敗しました" };
  }
}
