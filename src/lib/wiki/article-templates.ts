/**
 * Phase 3: Mega-Wiki AI Templates & Section Merger
 * 
 * 8本のMega-Wikiのセクションごとの階層JSONを推論・マージするロジック。
 */

import { THEME_BY_SLUG, MegaWikiSection, MegaWikiItem } from "@/lib/themes";

export function getExtractionPrompt(themeSlug: string, messagesText: string, existingSectionsTitleList: string): string {
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
  incomingSections: MegaWikiSection[]
): MegaWikiSection[] {
  const merged = [...existingSections];

  for (const incSec of incomingSections) {
    // 既存セクションを探す
    const existingSecIndex = merged.findIndex(s => s.heading === incSec.heading);
    
    if (existingSecIndex === -1) {
      // 新規セクションならそのまま追加
      merged.push({ ...incSec, items: incSec.items.map(ensureItemDefaults) });
    } else {
      // 既存セクション内でのアイテムマージ
      const existingSec = merged[existingSecIndex];
      const mergedItems = [...existingSec.items];

      for (const incItem of incSec.items) {
        const existingItemIndex = mergedItems.findIndex(i => i.title === incItem.title);
        if (existingItemIndex === -1) {
          // 新規アイテム
          mergedItems.push(ensureItemDefaults(incItem));
        } else {
          // 既存アイテムとの結合・スコア加算
          const extItem = mergedItems[existingItemIndex];
          
          mergedItems[existingItemIndex] = {
            ...extItem, // 既存のフィールドを保持
            ...incItem, // 新しいスカラー値を上書き
            content: mergeText(extItem.content, incItem.content),
            mention_count: (extItem.mention_count || 1) + (incItem.mention_count || 1),
            heat_score: (extItem.heat_score || 0) + (incItem.heat_score || 0),
            // 配列系の結合
            tips: mergeArrays(extItem.tips, incItem.tips),
            reviews: mergeArrays(extItem.reviews, incItem.reviews),
            is_recommended: (extItem.heat_score || 0) + (incItem.heat_score || 0) > 10 || extItem.is_recommended || incItem.is_recommended,
          };
        }
      }
      
      // アイテムをスコア順（熱量）でソート
      mergedItems.sort((a, b) => (b.heat_score || 0) - (a.heat_score || 0));
      merged[existingSecIndex] = { ...existingSec, items: mergedItems };
    }
  }

  // セクション自体は名前でソート（または定義順）
  merged.sort((a, b) => a.heading.localeCompare(b.heading, 'ja'));
  return merged;
}

function ensureItemDefaults(item: Record<string, unknown>): MegaWikiItem {
  return {
    ...item,
    title: String(item.title || ""),
    content: String(item.content || ""),
    mention_count: Number(item.mention_count || 1),
    heat_score: Number(item.heat_score || 0),
    is_recommended: !!item.is_recommended,
  };
}

function mergeText(a: string, b: string): string {
  if (!a) return b || "";
  if (!b) return a || "";
  
  // Clean, split, and deduplicate sentences
  const sentences = [...a.split(/[。\n]+/), ...b.split(/[。\n]+/)].map(s => s.trim()).filter(Boolean);
  const uniqueSentences = Array.from(new Set(sentences));
  
  // Cap length to prevent infinite growth (max ~3-4 key sentences)
  const capped = uniqueSentences.slice(0, 4);
  return capped.join("。") + (capped.length > 0 ? "。" : "");
}

function mergeArrays(a: unknown, b: unknown): unknown[] {
  const arrA = Array.isArray(a) ? a : [];
  const arrB = Array.isArray(b) ? b : [];
  // 重複排除（JSON比較）
  const extSet = new Set(arrA.map(v => typeof v === 'string' ? v : JSON.stringify(v)));
  const merged = [...arrA];
  for (const item of arrB) {
    const key = typeof item === 'string' ? item : JSON.stringify(item);
    if (!extSet.has(key)) {
      merged.push(item);
    }
  }
  return merged;
}

