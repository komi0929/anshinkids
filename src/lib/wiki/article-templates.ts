/**
 * カテゴリ別Wiki記事テンプレート
 * 
 * 各カテゴリに最適なJSONスキーマ・AI抽出プロンプト・表示ラベルを定義。
 * batch-processor と wiki/[slug]/page.tsx の両方から参照される。
 */

// ルームslugからカテゴリへのマッピング
export const ROOM_TO_CATEGORY: Record<string, ArticleCategory> = {
  "daily-food": "recipe",
  "products": "product",
  "eating-out": "restaurant",
  "school-life": "school",
  "challenge": "challenge",
  "skin-body": "skincare",
  "family": "story",
  "milestone": "story",
};

export type ArticleCategory =
  | "recipe"
  | "challenge"
  | "product"
  | "restaurant"
  | "treatment"
  | "skincare"
  | "school"
  | "story";

export interface CategoryTemplate {
  category: ArticleCategory;
  label: string;
  icon: string;
  /** AI抽出プロンプトに追加するカテゴリ専用の指示 */
  extractionHint: string;
  /** content_json の期待されるスキーマ（AIに渡す例） */
  schema: string;
  /** 配列として蓄積すべきフィールド名 */
  arrayFields: string[];
  /** スカラーとして最新値を採用するフィールド名 */
  scalarFields: string[];
}

export const CATEGORY_TEMPLATES: Record<ArticleCategory, CategoryTemplate> = {
  recipe: {
    category: "recipe",
    label: "レシピ",
    icon: "🍳",
    extractionHint: `このカテゴリは「レシピ・代替食材」に関する体験です。
材料、作り方の手順、どのアレルゲンを除去しているか、調理の工夫を構造化してください。`,
    schema: `{
  "raw_summary": "概要（1-2文）",
  "allergen_free": ["卵", "乳"],
  "difficulty": "簡単 | 普通 | 上級",
  "prep_time": "所要時間（例: 20分）",
  "ingredients": [
    { "name": "材料名", "amount": "分量", "note": "代替の工夫等" }
  ],
  "steps": ["手順1", "手順2", "手順3"],
  "tips": ["工夫やコツ"]
}`,
    arrayFields: ["ingredients", "steps", "tips"],
    scalarFields: ["raw_summary", "allergen_free", "difficulty", "prep_time"],
  },

  challenge: {
    category: "challenge",
    label: "負荷試験",
    icon: "🧪",
    extractionHint: `このカテゴリは「食物アレルギーの負荷試験（経口負荷試験）」に関する体験です。
検査の時系列（準備→当日→結果→その後）、お子さまの年齢、ターゲット食材、医師のコメントを構造化してください。`,
    schema: `{
  "raw_summary": "概要（1-2文）",
  "allergen": "対象アレルゲン（例: 卵白）",
  "child_age": "検査時の年齢（例: 3歳2ヶ月）",
  "hospital": "病院名（匿名化した地域名でもOK）",
  "timeline": [
    { "phase": "準備 | 当日 | 結果 | その後", "description": "詳細" }
  ],
  "result": "陽性 | 陰性 | 部分的に可 | 経過観察中",
  "doctor_comment": "医師の所見やアドバイス",
  "tips": ["準備のコツや心構え"]
}`,
    arrayFields: ["timeline", "tips"],
    scalarFields: ["raw_summary", "allergen", "child_age", "hospital", "result", "doctor_comment"],
  },

  product: {
    category: "product",
    label: "商品情報",
    icon: "🛒",
    extractionHint: `このカテゴリは「アレルギー対応の市販品」に関するクチコミです。
商品名、メーカー、対応アレルゲン、味や使い勝手の評価、購入先を構造化してください。
同じ商品の複数のレビューはreviews配列に蓄積してください。`,
    schema: `{
  "raw_summary": "概要（1-2文）",
  "product_name": "商品名",
  "brand": "メーカー名",
  "allergen_free": ["卵", "乳"],
  "price_range": "価格帯（例: 300-500円）",
  "where_to_buy": ["購入先（例: イオン, ネット通販）"],
  "reviews": [
    { "rating": 4, "comment": "レビューコメント", "child_age": "3歳" }
  ],
  "tips": ["活用のコツ"]
}`,
    arrayFields: ["reviews", "where_to_buy", "tips"],
    scalarFields: ["raw_summary", "product_name", "brand", "allergen_free", "price_range"],
  },

  restaurant: {
    category: "restaurant",
    label: "外食",
    icon: "🍽️",
    extractionHint: `このカテゴリは「外食・テイクアウト」に関する体験です。
店名、チェーン名、アレルギー対応メニューの有無、スタッフの対応、実際の体験を構造化してください。`,
    schema: `{
  "raw_summary": "概要（1-2文）",
  "restaurant_name": "店名",
  "chain_name": "チェーン名（あれば）",
  "allergy_menu": true,
  "staff_response": "スタッフの対応についての評価",
  "safe_items": ["安全に食べられたメニュー"],
  "reviews": [
    { "rating": 4, "comment": "体験コメント" }
  ],
  "tips": ["注文時のコツ"]
}`,
    arrayFields: ["safe_items", "reviews", "tips"],
    scalarFields: ["raw_summary", "restaurant_name", "chain_name", "allergy_menu", "staff_response"],
  },

  treatment: {
    category: "treatment",
    label: "対処法",
    icon: "💊",
    extractionHint: `このカテゴリは「症状への対処法」に関する体験です。
症状の種類、対処ステップ、病院に行くべきタイミング、予防策を構造化してください。`,
    schema: `{
  "raw_summary": "概要（1-2文）",
  "symptoms": ["症状1", "症状2"],
  "actions": [
    { "order": 1, "action": "やるべきこと", "detail": "詳細" }
  ],
  "prevention_tips": ["予防のコツ"],
  "when_to_hospital": "こんな時は病院へ",
  "tips": ["その他の工夫"]
}`,
    arrayFields: ["symptoms", "actions", "prevention_tips", "tips"],
    scalarFields: ["raw_summary", "when_to_hospital"],
  },

  skincare: {
    category: "skincare",
    label: "スキンケア",
    icon: "🧴",
    extractionHint: `このカテゴリは「肌のケア・アトピー対策」に関する体験です。
使用している製品、肌質、使い方、効果の感想を構造化してください。`,
    schema: `{
  "raw_summary": "概要（1-2文）",
  "product_name": "製品名",
  "skin_type": "肌質（乾燥肌、敏感肌など）",
  "usage": "使い方",
  "reviews": [
    { "rating": 4, "comment": "使用感コメント", "duration": "使用期間" }
  ],
  "tips": ["ケアのコツ"]
}`,
    arrayFields: ["reviews", "tips"],
    scalarFields: ["raw_summary", "product_name", "skin_type", "usage"],
  },

  school: {
    category: "school",
    label: "園・学校",
    icon: "🏫",
    extractionHint: `このカテゴリは「園や学校との連携」に関する体験です。
どのように園・学校と交渉したか、必要だった書類、成功事例、困った点を構造化してください。`,
    schema: `{
  "raw_summary": "概要（1-2文）",
  "school_type": "保育園 | 幼稚園 | 小学校 | 中学校",
  "negotiation_tips": ["交渉のコツ"],
  "documents_needed": ["必要だった書類"],
  "success_stories": [
    { "situation": "状況", "approach": "アプローチ", "result": "結果" }
  ],
  "tips": ["その他の工夫"]
}`,
    arrayFields: ["negotiation_tips", "documents_needed", "success_stories", "tips"],
    scalarFields: ["raw_summary", "school_type"],
  },

  story: {
    category: "story",
    label: "体験談",
    icon: "💚",
    extractionHint: `このカテゴリは「気持ち・家族の関わり・成長の記録」に関する体験です。
エピソード、対処法、励ましの言葉を構造化してください。個人を特定できる情報は除去してください。`,
    schema: `{
  "raw_summary": "概要（1-2文）",
  "stories": [
    { "situation": "状況", "feeling": "気持ち", "outcome": "結果・学び" }
  ],
  "coping_strategies": ["対処法や心の持ちよう"],
  "encouraging_words": ["励ましの言葉"],
  "tips": ["その他の工夫"]
}`,
    arrayFields: ["stories", "coping_strategies", "encouraging_words", "tips"],
    scalarFields: ["raw_summary"],
  },
};

/**
 * カテゴリに応じたインテリジェントマージ
 * 
 * 配列フィールド: 新しい要素を追加（重複排除、最大件数管理）
 * スカラーフィールド: 新しい値があれば上書き（空でなければ）
 */
export function mergeContentByCategory(
  category: ArticleCategory,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const template = CATEGORY_TEMPLATES[category];
  if (!template) {
    // フォールバック: 汎用マージ（tipsは配列追加）
    return mergeGeneric(existing, incoming);
  }

  const merged = { ...existing };

  // 配列フィールド: 蓄積型マージ
  for (const field of template.arrayFields) {
    const existingArr = Array.isArray(existing[field]) ? (existing[field] as unknown[]) : [];
    const incomingArr = Array.isArray(incoming[field]) ? (incoming[field] as unknown[]) : [];

    if (incomingArr.length > 0) {
      // 重複排除 (文字列はそのまま比較、オブジェクトはJSON比較)
      const existingSet = new Set(existingArr.map(item =>
        typeof item === "string" ? item : JSON.stringify(item)
      ));
      const newItems = incomingArr.filter(item => {
        const key = typeof item === "string" ? item : JSON.stringify(item);
        return !existingSet.has(key);
      });

      // 最大件数: reviews/stories は20件、tips は15件、その他は30件
      const maxItems = ["reviews", "stories"].includes(field) ? 20
        : field === "tips" ? 15
        : 30;

      merged[field] = [...existingArr, ...newItems].slice(-maxItems);
    }
  }

  // スカラーフィールド: 新しい値があれば上書き
  for (const field of template.scalarFields) {
    if (incoming[field] !== undefined && incoming[field] !== null && incoming[field] !== "") {
      merged[field] = incoming[field];
    }
  }

  // テンプレートにないフィールドも保持
  for (const key of Object.keys(incoming)) {
    if (!merged[key] && incoming[key]) {
      merged[key] = incoming[key];
    }
  }

  return merged;
}

/** 汎用マージ（テンプレートがないカテゴリ用） */
function mergeGeneric(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (Array.isArray(value) && Array.isArray(existing[key])) {
      // 配列は追加（重複排除）
      const existingSet = new Set((existing[key] as unknown[]).map(v =>
        typeof v === "string" ? v : JSON.stringify(v)
      ));
      const newItems = value.filter(v => {
        const k = typeof v === "string" ? v : JSON.stringify(v);
        return !existingSet.has(k);
      });
      merged[key] = [...(existing[key] as unknown[]), ...newItems].slice(-20);
    } else if (value !== undefined && value !== null && value !== "") {
      merged[key] = value;
    }
  }

  return merged;
}

/**
 * カテゴリを推定（ルームslug → カテゴリ or テキスト内容から推定）
 */
export function inferCategory(roomSlug?: string, content?: string): ArticleCategory {
  if (roomSlug && ROOM_TO_CATEGORY[roomSlug]) {
    return ROOM_TO_CATEGORY[roomSlug];
  }

  // テキストからキーワードベースで推定
  if (content) {
    const text = content.toLowerCase();
    if (/レシピ|材料|手順|作り方|調理/.test(text)) return "recipe";
    if (/負荷試験|経口負荷|検査/.test(text)) return "challenge";
    if (/商品|おやつ|パン|お菓子|市販/.test(text)) return "product";
    if (/外食|レストラン|チェーン|ファミレス/.test(text)) return "restaurant";
    if (/症状|蕁麻疹|アナフィラキシー|対処/.test(text)) return "treatment";
    if (/肌|保湿|アトピー|スキンケア/.test(text)) return "skincare";
    if (/園|学校|給食|先生|担任/.test(text)) return "school";
  }

  return "story"; // デフォルト
}
