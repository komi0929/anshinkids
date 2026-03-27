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
