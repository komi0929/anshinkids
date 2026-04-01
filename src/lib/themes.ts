/**
 * Phase 3: 8テーマ Hub — Single Source of Truth
 * 
 * すべてのトークルーム・Mega-Wiki・AIパイプラインが参照する唯一の定義。
 */

export interface ThemeDefinition {
  slug: string;
  name: string;
  description: string;
  icon_emoji: string;
  sort_order: number;
  /** Mega-Wiki の動的セクション分類軸 */
  indexingAxis: string;
  /** AI抽出時のスコアリング方針 */
  scoringHint: string;
  /** AI抽出のカテゴリ専用指示 */
  extractionHint: string;
  /** 出力スキーマ */
  sectionSchema: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    slug: "daily-food",
    name: "毎日のごはん",
    description: "献立・代替食材・お弁当のリアルな工夫",
    icon_emoji: "🍚",
    sort_order: 1,
    indexingAxis: "場面別（朝食・昼食・弁当・夕食・おやつ）→ レシピ/食材名",
    scoringHint: "再現しやすさ × 言及数 × 感謝数",
    extractionHint: "レシピ・代替食材・お弁当の工夫を構造化。材料、手順、どのアレルゲン除去かを記録。",
    sectionSchema: `{
  "heading": "場面名（朝食・弁当など）",
  "items": [{
    "title": "レシピ/食材名",
    "content": "具体的な情報",
    "allergen_free": ["卵", "乳"],
    "mention_count": 1,
    "heat_score": 0,
    "tips": ["工夫やコツ"],
    "is_recommended": false
  }]
}`,
  },
  {
    slug: "products",
    name: "使ってよかった市販品",
    description: "おやつ・パン・調味料のクチコミ",
    icon_emoji: "🛒",
    sort_order: 2,
    indexingAxis: "カテゴリ（パン・おやつ・調味料・冷凍食品等）→ 商品名",
    scoringHint: "言及数 × レビュー評価 × 感謝数",
    extractionHint: "商品名、メーカー、対応アレルゲン、味・使い勝手の評価、購入先を構造化。",
    sectionSchema: `{
  "heading": "カテゴリ名（パン・おやつなど）",
  "items": [{
    "title": "商品名",
    "brand": "メーカー名",
    "content": "レビュー要約",
    "allergen_free": ["卵"],
    "where_to_buy": ["購入先"],
    "mention_count": 1,
    "heat_score": 0,
    "reviews": [{"rating": 4, "comment": "コメント"}],
    "is_recommended": false
  }]
}`,
  },
  {
    slug: "eating-out",
    name: "外食・おでかけ",
    description: "チェーン店・旅行・イベントの対応",
    icon_emoji: "🍽️",
    sort_order: 3,
    indexingAxis: "ジャンル（ファストフード・ファミレス・和食・旅行先等）→ 店名/場所",
    scoringHint: "言及数 × ポジティブな文脈 × 感謝数 → 👑みんなのおすすめ上位",
    extractionHint: "店名、チェーン名、アレルギー対応メニュー有無、スタッフ対応、安全に食べられたメニューを構造化。",
    sectionSchema: `{
  "heading": "ジャンル名（ファストフードなど）",
  "items": [{
    "title": "店名/チェーン名",
    "content": "対応の詳細",
    "allergy_menu": true,
    "safe_items": ["安全メニュー"],
    "mention_count": 1,
    "heat_score": 0,
    "reviews": [{"rating": 4, "comment": "体験"}],
    "is_recommended": false
  }]
}`,
  },
  {
    slug: "school-life",
    name: "園・学校との連携",
    description: "給食・面談・行事の乗り切り方",
    icon_emoji: "🏫",
    sort_order: 4,
    indexingAxis: "シチュエーション別（入園前準備・給食・遠足・面談・進学等）",
    scoringHint: "具体的交渉フレーズの有無 × 感謝数",
    extractionHint: "園/学校との交渉方法、必要書類、成功事例、具体的なフレーズを構造化。",
    sectionSchema: `{
  "heading": "シチュエーション名（入園前・給食など）",
  "items": [{
    "title": "トピック名",
    "content": "具体的な体験・アドバイス",
    "negotiation_phrases": ["使えるフレーズ"],
    "documents_needed": ["必要書類"],
    "mention_count": 1,
    "heat_score": 0,
    "is_recommended": false
  }]
}`,
  },
  {
    slug: "challenge",
    name: "負荷試験の体験談",
    description: "準備・当日の流れ・結果後の変化",
    icon_emoji: "🧪",
    sort_order: 5,
    indexingAxis: "アレルゲン別（卵・乳・小麦等）→ 年齢帯別",
    scoringHint: "信頼度（詳細さ）× 感謝数",
    extractionHint: "検査の時系列（準備→当日→結果→その後）、子どもの年齢、ターゲット食材、結果を構造化。",
    sectionSchema: `{
  "heading": "アレルゲン名（卵・乳など）",
  "items": [{
    "title": "体験タイトル（例: 3歳・卵白負荷試験）",
    "content": "体験の詳細",
    "child_age": "年齢",
    "result": "結果（陽性/陰性/部分可）",
    "timeline": [{"phase": "準備", "description": "詳細"}],
    "mention_count": 1,
    "heat_score": 0,
    "tips": ["準備のコツ"],
    "is_recommended": false
  }]
}`,
  },
  {
    slug: "skin-body",
    name: "肌とからだのケア",
    description: "アトピー・保湿・スキンケアの工夫",
    icon_emoji: "🧴",
    sort_order: 6,
    indexingAxis: "製品カテゴリ（保湿剤・入浴剤・洗剤等）→ 製品名",
    scoringHint: "レビュー評価 × 使用期間 × 感謝数",
    extractionHint: "製品名、肌質、使い方、効果の感想を構造化。",
    sectionSchema: `{
  "heading": "カテゴリ名（保湿剤・入浴剤など）",
  "items": [{
    "title": "製品名",
    "content": "使用感レビュー",
    "skin_type": "肌質",
    "usage": "使い方",
    "mention_count": 1,
    "heat_score": 0,
    "reviews": [{"rating": 4, "duration": "使用期間", "comment": "コメント"}],
    "is_recommended": false
  }]
}`,
  },
  {
    slug: "family",
    name: "気持ち・家族・まわり",
    description: "不安・理解・パートナーや祖父母との関わり",
    icon_emoji: "👨‍👩‍👧",
    sort_order: 7,
    indexingAxis: "シチュエーション別（診断直後・祖父母対応・パートナー・ママ友等）",
    scoringHint: "共感数（感謝数）× 言及数",
    extractionHint: "エピソード、対処法、励ましの言葉を構造化。個人特定情報は除去。",
    sectionSchema: `{
  "heading": "シチュエーション名",
  "items": [{
    "title": "トピック名",
    "content": "体験・アドバイス",
    "coping_strategies": ["対処法"],
    "encouraging_words": ["励ましの言葉"],
    "mention_count": 1,
    "heat_score": 0,
    "is_recommended": false
  }]
}`,
  },
  {
    slug: "milestone",
    name: "食べられた！の記録",
    description: "克服・成長のうれしい報告",
    icon_emoji: "🌱",
    sort_order: 8,
    indexingAxis: "アレルゲン別（卵・乳・小麦等）→ 時系列",
    scoringHint: "言及数 × ポジティブ度 × 感謝数",
    extractionHint: "克服したアレルゲン、年齢、きっかけ、経過期間を構造化。",
    sectionSchema: `{
  "heading": "アレルゲン名",
  "items": [{
    "title": "克服記録タイトル",
    "content": "体験の詳細",
    "allergen": "克服アレルゲン",
    "child_age": "年齢",
    "duration": "経過期間",
    "mention_count": 1,
    "heat_score": 0,
    "is_recommended": false
  }]
}`,
  },
];

export const THEME_SLUGS = new Set(THEMES.map(t => t.slug));
export const THEME_BY_SLUG = Object.fromEntries(THEMES.map(t => [t.slug, t]));

/** Mega-Wiki のセクション型定義 */
export interface MegaWikiSection {
  heading: string;
  items: MegaWikiItem[];
}

export interface MegaWikiItem {
  title: string;
  content: string;
  mention_count: number;
  heat_score: number;
  is_recommended: boolean;
  [key: string]: unknown;
}
