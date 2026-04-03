/**
 * Safety Guard — 投稿の安全性チェック & 緊急ワード検出
 * 
 * 失敗シナリオ対策:
 * - #2: 医療事故 — 危険な医療アドバイスの検出
 * - #5: コミュニティ崩壊 — 否定的・攻撃的表現の検出  
 * - #8: 緊急対応 — アナフィラキシー等の緊急ワード検出
 */

// === 緊急ワード（アナフィラキシー等 → 即座に医療情報を表示） ===
const EMERGENCY_KEYWORDS = [
  "アナフィラキシー", "ショック", "呼吸困難", "呼吸が",
  "意識がない", "意識が薄", "ぐったり", "顔が腫れ",
  "全身じんましん", "エピペン", "救急車", "119",
  "アレルギー反応", "喉が腫れ", "声が出な",
];

// === 危険な医療アドバイスパターン ===
const DANGEROUS_ADVICE_PATTERNS = [
  /アレルゲンを.*食べさせ(れば|たら|て).*治る/,
  /自己判断で.*負荷/,
  /医者.*いらない/,
  /ステロイド.*やめ(て|た方|ろ|な)/,
  /薬.*飲まなくて.*いい/,
  /ワクチン.*危険/,
  /民間療法.*で.*治/,
  /除去食.*必要ない/,
  /アレルギー.*気のせい/,
];

// === ネガティブ・攻撃的表現 ===
const NEGATIVE_PATTERNS = [
  /バカ|アホ|死ね/,
  /ダメな親/,
  /育て方が悪い/,
  /甘やかし/,
  /過保護すぎ/,
  /大げさ/,
  /普通.*食べられる/,
];

export interface SafetyCheckResult {
  isEmergency: boolean;
  emergencyKeywords: string[];
  hasDangerousAdvice: boolean;
  dangerousPatterns: string[];
  hasNegativeContent: boolean;
  isSafe: boolean;
}

export function checkContentSafety(content: string): SafetyCheckResult {
  const normalized = content.trim();
  
  // Emergency check
  const emergencyKeywords = EMERGENCY_KEYWORDS.filter(keyword => 
    normalized.includes(keyword)
  );
  const isEmergency = emergencyKeywords.length > 0;

  // Dangerous advice check
  const dangerousPatterns = DANGEROUS_ADVICE_PATTERNS
    .filter(pattern => pattern.test(normalized))
    .map(p => p.source);
  const hasDangerousAdvice = dangerousPatterns.length > 0;

  // Negative content check
  const hasNegativeContent = NEGATIVE_PATTERNS.some(pattern => 
    pattern.test(normalized)
  );

  return {
    isEmergency,
    emergencyKeywords,
    hasDangerousAdvice,
    dangerousPatterns,
    hasNegativeContent,
    isSafe: !hasDangerousAdvice && !hasNegativeContent,
  };
}

// === 緊急時の案内テキスト ===
export const EMERGENCY_GUIDANCE = {
  title: "🚨 アレルギー緊急時の対応",
  steps: [
    "① エピペン（処方されている場合）を太ももに注射",
    "② すぐに119番（救急車）を呼ぶ",
    "③ 仰向けに寝かせ、足を高くする",
    "④ 意識がある場合は楽な姿勢にする",
    "⑤ 食べたものと時間を記録しておく",
  ],
  important: "※ 迷ったらすぐに119番。「アレルギーのアナフィラキシーです」と伝えてください。",
};

// === コンシェルジュ回答の信頼度計算 ===
export interface AnswerConfidence {
  level: "high" | "medium" | "low" | "insufficient";
  sourceCount: number;
  label: string;
  color: string;
}

export function calculateAnswerConfidence(wikiSourceCount: number, avgTrustScore: number): AnswerConfidence {
  if (wikiSourceCount === 0) {
    return {
      level: "insufficient",
      sourceCount: 0,
      label: "⚠️ データ不足 — 一般的な回答です",
      color: "var(--color-warning)",
    };
  }
  
  const score = (wikiSourceCount * 0.4) + (avgTrustScore * 0.6);
  
  if (score >= 60) {
    return {
      level: "high",
      sourceCount: wikiSourceCount,
      label: `✅ ${wikiSourceCount}件の体験に基づく回答`,
      color: "var(--color-success)",
    };
  }
  
  if (score >= 30) {
    return {
      level: "medium",
      sourceCount: wikiSourceCount,
      label: `📊 ${wikiSourceCount}件の体験を参照（情報収集中）`,
      color: "var(--color-accent)",
    };
  }
  
  return {
    level: "low",
    sourceCount: wikiSourceCount,
    label: `📝 ${wikiSourceCount}件の体験を参照（まだ少ないです）`,
    color: "var(--color-muted)",
  };
}

// === マイクロ貢献リアクション定義 ===
export const MICRO_REACTIONS = [
  { emoji: "❤️", label: "ありがとう", key: "thanks", weight: 3.0 },
  { emoji: "🙋", label: "うちも同じ！", key: "same", weight: 1.5 },
  { emoji: "📝", label: "参考になった", key: "helpful", weight: 2.0 },
  { emoji: "💪", label: "試してみる", key: "will_try", weight: 2.5 },
] as const;

export type ReactionKey = typeof MICRO_REACTIONS[number]["key"];

// === コミュニティガイドライン ===
export const COMMUNITY_GUIDELINES = {
  title: "あんしんキッズのお約束 🌿",
  rules: [
    {
      emoji: "💚",
      title: "やさしい言葉で",
      description: "みんな同じ悩みを持つ仲間です。相手の気持ちを想像して書きましょう。",
    },
    {
      emoji: "🏥",
      title: "医療判断はお医者さんに",
      description: "「こうすべき」ではなく「うちはこうだった」という体験談として共有しましょう。",
    },
    {
      emoji: "🔒",
      title: "個人情報に気をつけて",
      description: "病院名や子どもの名前など、個人が特定される情報は避けましょう。",
    },
    {
      emoji: "🌱",
      title: "正解はひとつじゃない",
      description: "アレルギーの対応はお子さまによって異なります。他の方法を否定しないでください。",
    },
  ],
  agreement: "この場は「批判」ではなく「共感」の場です。みんなで温かいヒントをつくりましょう 💚",
};
