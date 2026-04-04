"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, BookOpen, MessageCircle, Bookmark } from "@/components/icons";

/**
 * 🧪 シミュレーション結果プレビューページ
 * 
 * ダミー会話から生成されたWiki記事JSONを、
 * 実際のWiki記事UIでプレビューできるページ。
 */

// シミュレーション結果データ（simulation-output の結果を埋め込み）
const SIMULATION_DATA: Record<string, { theme: string; input_messages: number; generated_sections: Section[] }> = {
  "daily-food": {
    theme: "毎日のごはん",
    input_messages: 12,
    generated_sections: [
      {
        heading: "おやつ",
        items: [
          { title: "米粉とバナナのパンケーキ", content: "米粉とバナナだけで作るパンケーキは、卵アレルギーの子どもにも好評というケースが報告されています。", allergen_free: ["卵"], mention_count: 2, heat_score: 0, tips: ["豆乳ヨーグルトを加えると、しっとりして美味しくなる", "ココナッツオイルで焼くとサクサクになる", "冷凍保存可能"], is_recommended: true },
          { title: "タピオカ粉のポンデケージョ", content: "タピオカ粉で作るポンデケージョは、チーズアレルギーがなければ、もちもちして美味しいという声があります。小麦粉不使用。", allergen_free: ["卵", "小麦"], mention_count: 1, heat_score: 0, tips: [], is_recommended: true },
        ],
      },
      {
        heading: "弁当",
        items: [
          { title: "かぼちゃの茶巾", content: "卵焼きの代わりにかぼちゃの茶巾を入れるという声があります。見た目も黄色で卵焼きっぽく、子供にも好評。ラップで包んで絞るだけで簡単に作れる。", allergen_free: ["卵"], mention_count: 1, heat_score: 0, tips: [], is_recommended: true },
          { title: "さつまいもスティック", content: "さつまいもスティックは、オーブンで焼くだけで甘くて子供が喜ぶという声があります。", allergen_free: [], mention_count: 1, heat_score: 0, tips: [], is_recommended: true },
          { title: "ツナとコーンのおにぎり", content: "ツナとコーンのおにぎりは定番化しているという声があります。マヨネーズはキューピーのエッグケアを使用。", allergen_free: ["卵"], mention_count: 1, heat_score: 0, tips: [], is_recommended: false },
        ],
      },
      {
        heading: "朝食",
        items: [
          { title: "オーバーナイトオーツ", content: "オートミールに豆乳をかけて一晩冷蔵庫に入れておくオーバーナイトオーツは、手軽でおすすめという声があります。", allergen_free: [], mention_count: 1, heat_score: 0, tips: [], is_recommended: true },
          { title: "納豆ごはん", content: "納豆ごはんに海苔を巻くだけでも栄養が摂れるという声があります。味噌汁があれば完璧。", allergen_free: [], mention_count: 1, heat_score: 0, tips: [], is_recommended: false },
          { title: "米粉と豆乳の蒸しパン", content: "米粉と豆乳で蒸した蒸しパンを冷凍ストックしておくと、レンチンですぐ食べられるので便利という声があります。", allergen_free: ["卵"], mention_count: 1, heat_score: 0, tips: [], is_recommended: true },
        ],
      },
      {
        heading: "夕食",
        items: [
          { title: "れんこんハンバーグ", content: "ハンバーグのつなぎに卵の代わりとして、れんこんのすりおろしを入れるという声があります。もちもちして美味しいという感想も。", allergen_free: ["卵"], mention_count: 1, heat_score: 0, tips: [], is_recommended: false },
        ],
      },
    ],
  },
  "products": {
    theme: "使ってよかった市販品",
    input_messages: 10,
    generated_sections: [
      {
        heading: "パン",
        items: [
          { title: "みんなの食卓 米粉パン", content: "トーストするとサクサクになり、普通のパンのような食感を楽しめるという声があります。冷凍保存も可能。", brand: "日本ハム", allergen_free: [], where_to_buy: ["イオン"], mention_count: 2, heat_score: 0, reviews: [], is_recommended: true },
          { title: "お米のパン", content: "もっちりとした食感が特徴の米粉パン。Amazonで購入可能。", brand: "タイナイ", allergen_free: [], where_to_buy: ["Amazon"], mention_count: 1, heat_score: 0, reviews: [], is_recommended: false },
          { title: "シャールの食パン", content: "卵・乳不使用の食パン。ドイツの会社が製造しており、品質が高いという声があります。", brand: "シャール", allergen_free: ["卵", "乳"], where_to_buy: ["カルディ"], mention_count: 1, heat_score: 0, reviews: [], is_recommended: false },
        ],
      },
      {
        heading: "おやつ",
        items: [
          { title: "クッキー類", content: "28品目不使用で、アレルギーを持つ子供でも安心して食べられるクッキー。", brand: "辻安全食品", allergen_free: [], where_to_buy: [], mention_count: 1, heat_score: 0, reviews: [], is_recommended: false },
          { title: "ハイハイン", content: "国産米100%使用の赤ちゃん向けおせんべい。安心して与えられ、コスパが良いという声があります。", brand: "亀田", allergen_free: [], where_to_buy: [], mention_count: 1, heat_score: 0, reviews: [], is_recommended: false },
          { title: "アンパンマンのおせんべい", content: "28品目不使用で、子供に人気のおせんべい。スーパーで手軽に購入できる。", brand: null, allergen_free: [], where_to_buy: ["スーパー"], mention_count: 1, heat_score: 0, reviews: [], is_recommended: false },
          { title: "ノンアレクッキー", content: "素朴な味わいのクッキー。楽天で箱買いする人がいるという情報があります。", brand: "太田油脂", allergen_free: [], where_to_buy: ["楽天"], mention_count: 1, heat_score: 0, reviews: [], is_recommended: false },
        ],
      },
      {
        heading: "調味料",
        items: [
          { title: "エッグケア", content: "味は普通のマヨネーズとほぼ変わらず、サラダやお弁当など様々な用途に使える。", brand: "キューピー", allergen_free: [], where_to_buy: [], mention_count: 1, heat_score: 0, reviews: [], is_recommended: false },
          { title: "有機みそ", content: "添加物を使用していない味噌。大豆アレルギーの場合は使用できない。", brand: "創健社", allergen_free: [], where_to_buy: [], mention_count: 1, heat_score: 0, reviews: [], is_recommended: false },
        ],
      },
    ],
  },
  "eating-out": {
    theme: "外食・おでかけ",
    input_messages: 10,
    generated_sections: [
      {
        heading: "ファミレス",
        items: [
          { title: "ココス", content: "アレルギー対応メニューが充実しており、低アレルゲンメニューとして卵・乳・小麦・えび・かに・そば・落花生不使用のキッズプレートが提供されているという報告があります。", safe_items: ["低アレルゲンキッズプレート"], mention_count: 1, heat_score: 0, is_recommended: true },
          { title: "ガスト", content: "アレルギー情報をタブレットで確認でき、店員に伝えると厨房で別調理してくれるという報告があります。", safe_items: [], mention_count: 1, heat_score: 0, is_recommended: true },
          { title: "サイゼリヤ", content: "アレルゲン表が充実しており、ドリアやグラタンを避ければ食べられるものが多いという報告があります。コスパが良い点も評価されています。", safe_items: [], mention_count: 1, heat_score: 0, is_recommended: false },
        ],
      },
      {
        heading: "回転寿司",
        items: [
          { title: "くら寿司", content: "皿ごとのアレルゲン情報がアプリで見られるため安心という声があります。ネタによっては卵不使用の握りも選択可能。", safe_items: ["卵不使用の握り"], mention_count: 1, heat_score: 0, is_recommended: false },
          { title: "スシロー", content: "アレルゲン表を入手可能。刺身のみを食べるという人もいますが、同じ場所で食事できることが嬉しいという声があります。", safe_items: ["刺身"], mention_count: 1, heat_score: 0, is_recommended: false },
        ],
      },
      {
        heading: "テーマパーク",
        items: [
          { title: "ディズニーランド", content: "アレルギー対応レストランが複数あり、事前にキャストに伝えれば個別対応してくれるという報告があります。低アレルゲンメニューも用意されています。", safe_items: ["低アレルゲンメニュー"], mention_count: 1, heat_score: 0, is_recommended: true },
          { title: "USJ", content: "アレルギー対応が改善され、アレルギー対応セットがいくつか用意されており、Webで事前確認も可能という報告があります。", safe_items: ["アレルギー対応セット"], mention_count: 1, heat_score: 0, is_recommended: false },
        ],
      },
      {
        heading: "ファストフード",
        items: [
          { title: "モスバーガー", content: "低アレルゲンメニューがあり、専用の調理エリアで作ってくれるため安心感があるという声があります。", safe_items: ["低アレルゲンメニュー"], mention_count: 1, heat_score: 0, is_recommended: true },
          { title: "マクドナルド", content: "アレルゲン表はあるものの、フライヤーが共有であるため、厳密な除去を行っている家庭は注意が必要です。ポテトのみであれば大丈夫かもしれないという意見があります。", safe_items: ["ポテト"], mention_count: 1, heat_score: 0, is_recommended: false },
        ],
      },
      {
        heading: "旅行先",
        items: [
          { title: "ルネッサンスリゾートオキナワ", content: "沖縄旅行において、アレルギー対応のホテルが増えており、事前に相談すると個別対応してくれるという報告があります。", safe_items: [], mention_count: 1, heat_score: 0, is_recommended: true },
        ],
      },
    ],
  },
};

interface Item {
  title: string;
  content: string;
  mention_count?: number;
  heat_score?: number;
  is_recommended?: boolean;
  tips?: string[];
  allergen_free?: string[];
  where_to_buy?: string[];
  safe_items?: string[];
  brand?: string | null;
  reviews?: { rating?: number; comment?: string }[];
  [key: string]: unknown;
}

interface Section {
  heading: string;
  items: Item[];
}

const THEME_EMOJIS: Record<string, string> = {
  "daily-food": "🍚",
  products: "🛒",
  "eating-out": "🍽️",
};

export default function SimulationPreview() {
  const [selectedTheme, setSelectedTheme] = useState<string>("daily-food");
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  const data = SIMULATION_DATA[selectedTheme];
  const sections = data.generated_sections;

  const totalItems = sections.reduce((sum, sec) => sum + sec.items.length, 0);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[var(--color-surface)]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <Link href="/wiki" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white bg-gradient-to-r from-orange-400 to-pink-500 px-2.5 py-1 rounded-full">🧪 シミュレーション</span>
          </div>
          <h1 className="text-[15px] font-bold text-[var(--color-text)] truncate break-keep text-balance mt-1">
            {THEME_EMOJIS[selectedTheme]} 【総合】{data.theme}
          </h1>
          <p className="text-[10px] text-[var(--color-subtle)]">{data.theme}</p>
        </div>
      </div>

      {/* Theme Selector */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Object.entries(SIMULATION_DATA).map(([slug, d]) => (
            <button
              key={slug}
              onClick={() => setSelectedTheme(slug)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold transition-all border ${
                selectedTheme === slug
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md"
                  : "bg-white text-[var(--color-text)] border-[var(--color-border-light)] hover:border-[var(--color-primary)]/30"
              }`}
            >
              <span className="text-lg">{THEME_EMOJIS[slug]}</span>
              {d.theme}
            </button>
          ))}
        </div>
      </div>

      {/* Simulation Info Banner */}
      <div className="px-4 pb-3">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🧪</span>
            <span className="text-[13px] font-bold text-orange-900">シミュレーション結果</span>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-[20px] font-black text-orange-600">{data.input_messages}</p>
              <p className="text-[10px] font-semibold text-orange-500">入力会話数</p>
            </div>
            <div className="w-px bg-orange-200" />
            <div>
              <p className="text-[20px] font-black text-orange-600">{sections.length}</p>
              <p className="text-[10px] font-semibold text-orange-500">生成セクション</p>
            </div>
            <div className="w-px bg-orange-200" />
            <div>
              <p className="text-[20px] font-black text-orange-600">{totalItems}</p>
              <p className="text-[10px] font-semibold text-orange-500">抽出アイテム</p>
            </div>
          </div>
          <p className="text-[11px] text-orange-700 mt-3 leading-relaxed">
            ↑ {data.input_messages}件のダミー会話から、本番と同じAIプロンプトで生成した結果です。実際のバッチ処理と同一の記事が生成されます。
          </p>
        </div>
      </div>

      {/* Trust & Source Badges */}
      <div className="px-4 pb-4">
        <div className="flex items-center flex-wrap gap-2 mb-4">
          <span className="trust-badge trust-low">
            <Shield className="w-3 h-3" />
            新しい声
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-surface-warm)] to-[var(--color-bg-warm)] border border-[var(--color-border-light)] mb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            </div>
            <span className="text-[12px] font-bold text-[var(--color-text)]">
              {data.input_messages}件の体験にもとづく情報です
            </span>
          </div>
          <p className="text-[10px] text-[var(--color-muted)] ml-9 leading-relaxed">まだ体験が集まりはじめたばかりです</p>
        </div>

        {/* Sections */}
        <div className="space-y-6 mb-6">
          {sections.map((sec, i) => (
            <div key={i} className="card-elevated p-5">
              <h2 className="text-[16px] font-black tracking-tight mb-4 flex items-center gap-2 break-keep text-balance" style={{ color: 'var(--color-primary)' }}>
                <span className="w-1.5 h-4 bg-[var(--color-primary)] rounded-full inline-block" />
                {sec.heading}
              </h2>
              <div className="space-y-4">
                {sec.items.map((item, j) => (
                  <div key={j} className="p-4 rounded-2xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)]">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-[14px] font-bold text-[var(--color-text)] leading-tight flex-1 pr-2 break-keep text-balance">{item.title}</h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.is_recommended && (
                          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-1 rounded-full shadow-sm mr-1">
                            👑 定番
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setBookmarked(prev => {
                              const next = new Set(prev);
                              if (next.has(item.title)) next.delete(item.title);
                              else next.add(item.title);
                              return next;
                            });
                          }}
                          className={`p-1.5 rounded-full transition-colors ${
                            bookmarked.has(item.title)
                              ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                              : "bg-white text-[var(--color-subtle)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] border border-[var(--color-border-light)]"
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${bookmarked.has(item.title) ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[13px] text-[var(--color-subtle)] leading-relaxed whitespace-pre-wrap">{item.content}</p>

                    {/* Brand */}
                    {item.brand && (
                      <p className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
                        <strong className="text-[var(--color-muted)]">メーカー:</strong> {item.brand}
                      </p>
                    )}

                    {/* Tips */}
                    {item.tips && item.tips.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.tips.map((tip, tidx) => (
                          <span key={tidx} className="px-2.5 py-1.5 bg-white rounded-lg text-[11px] text-[var(--color-text-secondary)] border border-[var(--color-border-light)] flex items-center gap-1">
                            <span className="text-amber-500">💡</span> {tip}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Allergen Free */}
                    {item.allergen_free && item.allergen_free.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.allergen_free.map((a, aidx) => (
                          <span key={aidx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                            🏷️ {a}不使用
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Where to Buy */}
                    {item.where_to_buy && item.where_to_buy.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.where_to_buy.map((w, widx) => (
                          <span key={widx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-200">
                            🛒 {w}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Safe Items */}
                    {item.safe_items && item.safe_items.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.safe_items.map((s, sidx) => (
                          <span key={sidx} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-bold border border-green-200">
                            ✅ {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta Stats */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border-light)]/50">
                      {item.mention_count && (
                        <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
                          <span className="text-[12px]">👥</span> {item.mention_count}人の声
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Medical Disclaimer */}
        <div className="p-3.5 rounded-2xl bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20 mb-6">
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            ⚠️ この情報は保護者の体験に基づく参考情報です。<strong>医療的な判断は必ず主治医にご相談ください。</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
