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

export async function contributeToWiki(entryId: string, rawText: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "ログインが必要です" };

    // Get current wiki entry
    const { data: entry, error: fetchError } = await supabase
      .from("wiki_entries")
      .select("*")
      .eq("id", entryId)
      .single();

    if (fetchError || !entry) return { success: false, error: "記事が見つかりません" };

    // Use AI to structure the raw input and merge with existing content
    const apiKey = process.env.GOOGLE_API_KEY;
    const currentContent = entry.content_json || {};

    let structuredAddition: Record<string, unknown>;

    if (apiKey) {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const prompt = `あなたは食物アレルギー情報の整理AIです。

既存の記事:
タイトル: ${entry.title}
カテゴリ: ${entry.category}
現在の内容: ${JSON.stringify(currentContent)}

ユーザーからの新しい情報（カジュアルに書かれた生テキスト）:
「${rawText}」

タスク:
1. ユーザーの生テキストから有用な情報を抽出してください
2. 既存の内容と重複しない新しい情報を特定してください
3. 既存のcontent_jsonの構造に合わせて、新しい情報をマージした完全なJSONを返してください

ルール:
- 既存の情報は絶対に消さない（追加のみ）
- ユーザーの言葉を尊重しつつ、読みやすく整理する
- 新しい項目は "items" 配列や "tips" 配列に追加する
- 情報源として「ユーザー投稿」であることを明記する
- 必ず有効なJSONオブジェクトのみを返す（説明不要）`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        structuredAddition = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: append as a new tip
        const tips = (currentContent as Record<string, unknown[]>).tips || [];
        structuredAddition = {
          ...currentContent,
          tips: [...(tips as unknown[]), { text: rawText, source: "ユーザー投稿", added_at: new Date().toISOString() }],
        };
      }
    } else {
      const tips = (currentContent as Record<string, unknown[]>).tips || [];
      structuredAddition = {
        ...currentContent,
        tips: [...(tips as unknown[]), { text: rawText, source: "ユーザー投稿", added_at: new Date().toISOString() }],
      };
    }

    // Update wiki entry
    const { error: updateError } = await supabase
      .from("wiki_entries")
      .update({
        content_json: structuredAddition,
        source_count: (entry.source_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entryId);

    if (updateError) throw updateError;

    // Add wiki source record
    await supabase.from("wiki_sources").insert({
      wiki_entry_id: entryId,
      original_message_snippet: rawText.slice(0, 500),
      contributor_id: user.id,
      contributor_trust_score: 0,
    });

    // Increment user contributions (best effort)
    try {
      await supabase
        .from("profiles")
        .update({ total_contributions: (entry.source_count || 0) + 1 })
        .eq("id", user.id);
    } catch {
      // ignore
    }

    return { success: true };
  } catch (err) {
    console.error("[contributeToWiki]", err);
    return { success: false, error: "情報の追加に失敗しました" };
  }
}
