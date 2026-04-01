/**
 * Wiki記事キュレーション — 統合候補・分割候補の自動検出
 * 
 * バッチ実行時に呼ばれ、以下を自動で行う:
 * 1. 類似タイトル記事の統合（AIが判断 → 自動マージ）
 * 2. 肥大化記事の分割提案（source_count > 15 の記事を分析）
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiFlash } from "@/lib/ai/gemini";
import { mergeContentByCategory, type ArticleCategory } from "@/lib/wiki/article-templates";

/**
 * 類似記事の統合
 * 
 * 同一カテゴリ + 同一アレルゲンタグの記事ペアでタイトルが類似しているものを検出。
 * AIに統合すべきか判断させ、自動でマージする。
 */
export async function detectAndMergeduplicates() {
  const supabase = createAdminClient();
  const model = getGeminiFlash();

  const { data: entries } = await supabase
    .from("wiki_entries")
    .select("id, title, slug, category, allergen_tags, content_json, source_count, avg_trust_score")
    .eq("is_public", true)
    .order("category", { ascending: true });

  if (!entries || entries.length < 2) return { merged: 0, split: 0 };

  // Group by category for comparison
  const byCategory: Record<string, typeof entries> = {};
  for (const e of entries) {
    if (!byCategory[e.category]) byCategory[e.category] = [];
    byCategory[e.category].push(e);
  }

  let mergedCount = 0;

  for (const [, categoryEntries] of Object.entries(byCategory)) {
    if (categoryEntries.length < 2) continue;

    // Check each pair for potential duplicates
    const titles = categoryEntries.map(e => ({ id: e.id, title: e.title, slug: e.slug }));

    // Use AI to find merge candidates (batch all titles in one call)
    const prompt = `以下は同じカテゴリのWiki記事タイトル一覧です。
内容が重複していて統合すべきペアがあれば、JSON配列で返してください。
統合不要なら空配列 [] を返してください。

タイトル一覧:
${titles.map(t => `[${t.id}] ${t.title}`).join("\n")}

出力形式（統合すべきペアのみ）:
[{ "keep_id": "残す記事のUUID", "merge_id": "統合して消す記事のUUID", "reason": "統合理由" }]

判断基準:
- タイトルがほぼ同じ（表記揺れ、同義語）
- 同じ食品・商品・場所について書かれている
- 統合した方が読者にとって有益
- 明確に別トピックならスキップ`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      const pairs: { keep_id: string; merge_id: string; reason: string }[] = JSON.parse(jsonMatch[0]);

      for (const pair of pairs) {
        const keepEntry = categoryEntries.find(e => e.id === pair.keep_id);
        const mergeEntry = categoryEntries.find(e => e.id === pair.merge_id);
        if (!keepEntry || !mergeEntry) continue;

        // Merge content using intelligent category merge
        const category = (keepEntry.category || "story") as ArticleCategory;
        const mergedContent = mergeContentByCategory(
          category,
          keepEntry.content_json as Record<string, unknown>,
          mergeEntry.content_json as Record<string, unknown>
        );

        // Update the "keep" entry with merged content
        await supabase
          .from("wiki_entries")
          .update({
            content_json: mergedContent,
            source_count: (keepEntry.source_count || 0) + (mergeEntry.source_count || 0),
            last_updated_from_batch: new Date().toISOString(),
            // Merge allergen tags (union)
            allergen_tags: [...new Set([
              ...(keepEntry.allergen_tags || []),
              ...(mergeEntry.allergen_tags || []),
            ])],
          })
          .eq("id", keepEntry.id);

        // Move all wiki_sources from merged entry to kept entry
        await supabase
          .from("wiki_sources")
          .update({ wiki_entry_id: keepEntry.id })
          .eq("wiki_entry_id", mergeEntry.id);

        // Delete the merged entry
        await supabase
          .from("wiki_entries")
          .delete()
          .eq("id", mergeEntry.id);

        console.log(`[Curation] Merged "${mergeEntry.title}" → "${keepEntry.title}" (${pair.reason})`);
        mergedCount++;
      }
    } catch (err) {
      console.error("[Curation] Merge detection failed:", err);
    }
  }

  return { merged: mergedCount };
}

/**
 * 肥大化記事の分割提案
 * 
 * source_count > 15 の記事を分析し、サブトピックに分割すべきか検討。
 * 分割が適切と判断された場合、新しい記事を作成してソースを再配分する。
 */
export async function detectSplitCandidates() {
  const supabase = createAdminClient();
  const model = getGeminiFlash();

  const { data: largeEntries } = await supabase
    .from("wiki_entries")
    .select("id, title, slug, category, content_json, source_count, allergen_tags")
    .eq("is_public", true)
    .gte("source_count", 15)
    .order("source_count", { ascending: false })
    .limit(5);

  if (!largeEntries || largeEntries.length === 0) return { split: 0 };

  let splitCount = 0;

  for (const entry of largeEntries) {
    const contentStr = JSON.stringify(entry.content_json).slice(0, 3000);

    const prompt = `以下のWiki記事は${entry.source_count}件のソースに基づいており、情報が多くなっています。
この記事を2-3個のサブトピック記事に分割すべきか判断してください。

タイトル: ${entry.title}
カテゴリ: ${entry.category}
内容（抜粋）: ${contentStr}

分割すべき場合はJSON配列で各サブトピックの情報を返してください。
分割不要なら空配列 [] を返してください。

出力形式:
[{
  "title": "新しい記事タイトル",
  "content_keys": ["この記事に移すべきcontent_jsonのキー"],
  "reason": "分割理由"
}]

判断基準:
- 明確に異なるサブトピックが混在している場合のみ分割
- 単に情報量が多いだけなら分割不要
- 分割後の各記事が独立して有用である必要がある`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      const subTopics: { title: string; content_keys: string[]; reason: string }[] = JSON.parse(jsonMatch[0]);
      if (subTopics.length === 0) continue;

      const originalContent = entry.content_json as Record<string, unknown>;

      for (const sub of subTopics) {
        // Extract content for the new sub-article
        const subContent: Record<string, unknown> = {};
        for (const key of sub.content_keys) {
          if (originalContent[key]) {
            subContent[key] = originalContent[key];
          }
        }

        if (Object.keys(subContent).length === 0) continue;

        // Create new slug
        const newSlug = sub.title
          .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, "-")
          .replace(/-+/g, "-")
          .toLowerCase()
          .slice(0, 100);

        // Create the new sub-article
        const firstValue = Object.values(subContent)[0];
        const summary = typeof firstValue === "string" 
          ? firstValue.slice(0, 200) 
          : sub.title;

        await supabase
          .from("wiki_entries")
          .insert({
            title: sub.title,
            slug: newSlug,
            category: entry.category,
            content_json: subContent,
            summary: String(summary).slice(0, 300),
            allergen_tags: entry.allergen_tags,
            source_count: Math.floor((entry.source_count || 0) / subTopics.length),
            is_public: true,
            last_updated_from_batch: new Date().toISOString(),
          });

        console.log(`[Curation] Split from "${entry.title}" → "${sub.title}" (${sub.reason})`);
        splitCount++;
      }

      // Remove extracted keys from original (keep what wasn't split out)
      const extractedKeys = new Set(subTopics.flatMap(s => s.content_keys));
      const remainingContent: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(originalContent)) {
        if (!extractedKeys.has(key)) {
          remainingContent[key] = val;
        }
      }

      await supabase
        .from("wiki_entries")
        .update({
          content_json: remainingContent,
          last_updated_from_batch: new Date().toISOString(),
        })
        .eq("id", entry.id);

    } catch (err) {
      console.error("[Curation] Split detection failed:", err);
    }
  }

  return { split: splitCount };
}
