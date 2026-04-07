/**
 * Phase 3: Mega-Wiki AI Templates & Section Merger
 *
 * 8本のMega-Wikiのセクションごとの階層JSONを推論・マージするロジック。
 */

import { THEME_BY_SLUG, MegaWikiSection, MegaWikiItem } from "@/lib/themes";

export function getExtractionPrompt(
  themeSlug: string,
  messagesText: string,
  existingSectionsTitleList: string,
): string {
  const theme = THEME_BY_SLUG[themeSlug];
  if (!theme) return "";

  return `あなたは体験まとめ記事の専門編集AIです。
以下のトークルーム「${theme.name}」の直近の会話内容から、保護者にとって価値のある実体験（ナレッジ）を抽出し、Mega-Wiki（総合まとめ記事）の該当セクションへ格納するためのJSONを生成してください。

## テーマ: ${theme.name}
${theme.extractionHint}
分類軸: ${theme.indexingAxis}

## 会話（時系列順）:
${messagesText}

## 既存のセクションとアイテム一覧（重複アイテムを作らないための参考）:
${existingSectionsTitleList || "（まだアイテムがありません）"}

## 出力ルール
1. 以下の出力スキーマに厳格に沿ったJSON配列（[]）を返してください。
2. JSON以外のテキストやMarkdownの装飾（\`\`\`jsonなど）は絶対に含めないでください。
3. すでに既存の「見出し(heading)」や「アイテム(title)」と同じ意味のものがあれば、表記揺れを整えて同じタイトルを出力してください。
4. 情報がない場合、またはノイズのみの場合は空の配列 [] を返してください。
5. 【プライバシー保護】個人名・病院名・地名・SNSアカウント等の個人特定情報は絶対に含めないでください。「ある病院で」「知人が」のように匿名化して記録してください。
6. 【医療的断定の禁止】「〜すべき」「〜が正しい」等の断定表現は使わず、「〜という体験がある」「〜という声が多い」のように体験談として記録してください。

## 出力スキーマ:
[
${theme.sectionSchema}
]`;
}

/**
 * 抽出された新規セクション配列を既存の sections[] へインテリジェントにマージする
 */
export function mergeMegaWikiSections(
  existingSections: MegaWikiSection[],
  incomingSections: MegaWikiSection[],
): MegaWikiSection[] {
  const merged = Array.isArray(existingSections) ? [...existingSections] : [];

  for (const incSec of (Array.isArray(incomingSections) ? incomingSections : [])) {
    if (!incSec || typeof incSec !== 'object') continue;
    const heading = String(incSec.heading || "その他");
    const incItems = Array.isArray(incSec.items) ? incSec.items : [];

    // 既存セクションを探す
    const existingSecIndex = merged.findIndex(
      (s) => (s.heading || "その他") === heading,
    );

    if (existingSecIndex === -1) {
      // 新規セクションならそのまま追加
      merged.push({ ...incSec, heading, items: incItems.map(ensureItemDefaults) });
    } else {
      // 既存セクション内でのアイテムマージ
      const existingSec = merged[existingSecIndex];
      const mergedItems = Array.isArray(existingSec.items) ? [...existingSec.items] : [];

      for (const incItem of incItems) {
        if (!incItem || typeof incItem !== 'object') continue;
        const incTitle = String((incItem as Record<string, unknown>).title || "");
        if (!incTitle) continue;

        const existingItemIndex = mergedItems.findIndex(
          (i) => i.title === incTitle,
        );
        if (existingItemIndex === -1) {
          // 新規アイテム
          mergedItems.push(ensureItemDefaults(incItem as Record<string, unknown>));
        } else {
          // 既存アイテムとの結合・スコア加算
          const extItem = mergedItems[existingItemIndex];
          const extItemRec = extItem as Record<string, unknown>;
          const incItemRec = incItem as Record<string, unknown>;

          mergedItems[existingItemIndex] = {
            ...extItem, // 既存のフィールドを保持
            ...incItem, // 新しいスカラー値を上書き
            title: incTitle,
            content: mergeText(String(extItem.content || ""), String(incItemRec.content || "")),
            mention_count:
              (Number(extItem.mention_count) || 1) + (Number(incItemRec.mention_count) || 1),
            heat_score: (Number(extItem.heat_score) || 0) + (Number(incItemRec.heat_score) || 0),
            // 配列系の結合
            tips: mergeArrays(extItemRec.tips, incItemRec.tips),
            reviews: mergeArrays(extItemRec.reviews, incItemRec.reviews),
            is_recommended:
              (Number(extItem.heat_score) || 0) + (Number(incItemRec.heat_score) || 0) > 10 ||
              !!extItem.is_recommended ||
              !!incItemRec.is_recommended,
          };
        }
      }

      // アイテムをスコア順（熱量）でソート
      mergedItems.sort((a, b) => (Number(b.heat_score) || 0) - (Number(a.heat_score) || 0));
      merged[existingSecIndex] = { ...existingSec, heading, items: mergedItems };
    }
  }

  // セクション自体は名前でソート（または定義順）
  merged.sort((a, b) => String(a.heading || "").localeCompare(String(b.heading || ""), "ja"));
  return merged;
}

function ensureItemDefaults(item: unknown): MegaWikiItem {
  const rec = (item || {}) as Record<string, unknown>;
  return {
    ...rec,
    title: String(rec.title || "無題"),
    content: String(rec.content || ""),
    mention_count: Number(rec.mention_count || 1),
    heat_score: Number(rec.heat_score || 0),
    is_recommended: !!rec.is_recommended,
  };
}

function mergeText(a: string, b: string): string {
  const strA = String(a || "");
  const strB = String(b || "");
  if (!strA) return strB;
  if (!strB) return strA;

  // Clean, split, and deduplicate sentences
  const sentences = [...strA.split(/[。\n]+/), ...strB.split(/[。\n]+/)]
    .map((s) => s.trim())
    .filter(Boolean);
  const uniqueSentences = Array.from(new Set(sentences));

  // Cap length to prevent infinite growth (max ~3-4 key sentences)
  const capped = uniqueSentences.slice(0, 4);
  return capped.join("。") + (capped.length > 0 ? "。" : "");
}

function mergeArrays(a: unknown, b: unknown): unknown[] {
  const arrA = Array.isArray(a) ? a : [];
  const arrB = Array.isArray(b) ? b : [];
  // 重複排除（JSON比較）
  const extSet = new Set(
    arrA.map((v) => (typeof v === "string" ? v : JSON.stringify(v))),
  );
  const merged = [...arrA];
  for (const item of arrB) {
    const key = typeof item === "string" ? item : JSON.stringify(item);
    if (!extSet.has(key)) {
      merged.push(item);
    }
  }
  return merged;
}
