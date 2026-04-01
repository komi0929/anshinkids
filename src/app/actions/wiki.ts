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

    // Gather all existing sources for full resynthesis
    const { data: allSources } = await supabase
      .from("wiki_sources")
      .select("original_message_snippet")
      .eq("wiki_entry_id", entryId)
      .order("extracted_at", { ascending: true });

    const sourceSnippets = [
      ...(allSources || []).map(s => s.original_message_snippet),
      rawText, // New contribution
    ];

    // AI resynthesis with all sources + new contribution
    const apiKey = process.env.GOOGLE_API_KEY;
    const currentContent = entry.content_json || {};

    let newContent: Record<string, unknown>;

    if (apiKey) {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const prompt = `あなたは食物アレルギー知恵袋の編集者です。
以下のソース（保護者の投稿）を元に、この記事を再構成してください。

## 記事タイトル: ${entry.title}
## カテゴリ: ${entry.category}

## 既存の記事内容:
${JSON.stringify(currentContent).slice(0, 1500)}

## 全ソース一覧（${sourceSnippets.length}件の投稿に基づく）:
${sourceSnippets.map((s, i) => `[${i + 1}] ${s}`).join("\n")}

## 編集方針:
1. 傾斜をつける: 複数の言及がある情報を優先表示
2. 新着情報: 最後のソース（[${sourceSnippets.length}]）の情報に「🆕」マークをつける
3. 信頼度: 言及が多い情報ほど自信を持って記述
4. 既存の情報は消さない（追加・更新のみ）
5. 読者が「結局どれがいいの？」にすぐ答えが見つかる構成にする

JSON形式で出力（説明不要）:
${JSON.stringify(currentContent).slice(0, 500)}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        newContent = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: append as tip
        const tips = Array.isArray((currentContent as Record<string, unknown[]>).tips) 
          ? (currentContent as Record<string, unknown[]>).tips 
          : [];
        newContent = {
          ...currentContent,
          tips: [...tips, `🆕 ${rawText}`],
        };
      }
    } else {
      const tips = Array.isArray((currentContent as Record<string, unknown[]>).tips) 
        ? (currentContent as Record<string, unknown[]>).tips 
        : [];
      newContent = {
        ...currentContent,
        tips: [...tips, `🆕 ${rawText}`],
      };
    }

    // Update wiki entry
    const { error: updateError } = await supabase
      .from("wiki_entries")
      .update({
        content_json: newContent,
        summary: String((newContent as Record<string, string>).raw_summary || entry.summary || "").slice(0, 300),
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

    // Increment user contributions
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
    } catch {
      // Non-critical
    }

    return { success: true };
  } catch (err) {
    console.error("[contributeToWiki]", err);
    return { success: false, error: "情報の追加に失敗しました" };
  }
}
