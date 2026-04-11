"use client";

import { useMemo } from "react";
import { ThemeDefinition } from "@/lib/themes";

interface TopicSummaryData {
  summary_snippet: string | null;
  full_summary: any;
}

interface ThemeSummaryRendererProps {
  theme: ThemeDefinition;
  topicSummary: TopicSummaryData;
  roomSlug: string;
  topicId: string;
}

export function ThemeSummaryRenderer({ theme, topicSummary, roomSlug, topicId }: ThemeSummaryRendererProps) {
  const data = topicSummary.full_summary;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  // Define beautiful mapping for generic keys commonly produced by AI
  const keyLabelMap: Record<string, { label: string; icon: string }> = {
    key_points: { label: "重要ポイント", icon: "💡" },
    recommended_products: { label: "おすすめ商品", icon: "🛒" },
    tips: { label: "工夫やコツ", icon: "✨" },
    allergen_free: { label: "対応アレルゲン", icon: "🛡️" },
    brand: { label: "ブランド/メーカー", icon: "🏷️" },
    where_to_buy: { label: "購入先", icon: "🏬" },
    reviews: { label: "口コミ・評価", icon: "⭐" },
    allergy_menu: { label: "アレルギー対応メニュー", icon: "📋" },
    safe_items: { label: "安全に食べられたもの", icon: "🍽️" },
    caution: { label: "注意点", icon: "⚠️" },
    negotiation_phrases: { label: "役立つ伝え方", icon: "💬" },
    documents_needed: { label: "必要な準備・書類", icon: "📁" },
    child_age: { label: "お子さんの年齢", icon: "👧" },
    result: { label: "結果", icon: "📊" },
    timeline: { label: "時系列", icon: "⏱️" },
    symptoms: { label: "症状の様子", icon: "🤒" },
    action_taken: { label: "とった行動", icon: "🏃" },
    hospital_visit: { label: "受診の目安", icon: "🏥" },
    emotions: { label: "その時の感情", icon: "💭" },
    coping_methods: { label: "乗り越え方", icon: "🌈" },
    advice: { label: "もらったアドバイス", icon: "🤝" },
    questions: { label: "疑問点", icon: "❓" },
    answers: { label: "解決策・ヒント", icon: "✅" },
    useful_links: { label: "参考リンク", icon: "🔗" },
  };

  const getLabel = (key: string) => keyLabelMap[key] || { label: key, icon: "📌" };

  const sourceIds = data.source_message_ids as string[] | undefined;

  return (
    <div className="space-y-4 pt-1 relative pb-2">
      {Object.entries(data).map(([key, val]) => {
        if (!val || key === "title" || key === "source_message_ids") return null;
        const config = getLabel(key);

        if (typeof val === "string" || typeof val === "boolean" || typeof val === "number") {
          return (
            <div key={key} className="bg-white/60 p-3 rounded-xl border border-[var(--color-border-light)]">
              <h4 className="text-[12px] font-black text-[var(--color-primary-dark)] mb-1.5 flex items-center gap-1.5">
                <span className="text-[14px]">{config.icon}</span>
                {config.label}
              </h4>
              <p className="text-[14px] font-medium text-[var(--color-text)] leading-relaxed pl-1">{typeof val === "boolean" ? (val ? "あり / 対応可能" : "なし") : String(val)}</p>
            </div>
          );
        }

        if (Array.isArray(val) && val.length > 0) {
          return (
            <div key={key} className="bg-white/60 p-3.5 rounded-xl border border-[var(--color-border-light)]">
              <h4 className="text-[12px] font-black text-[var(--color-primary-dark)] mb-2 flex items-center gap-1.5">
                <span className="text-[14px]">{config.icon}</span>
                {config.label}
              </h4>
              <ul className="space-y-2 pl-1">
                {val.map((item, i) => (
                  <li key={i} className="flex gap-2 text-[13px] font-medium text-[var(--color-text)] leading-relaxed">
                    <span className="text-[var(--color-primary-light)] mt-0.5">•</span>
                    <span>{String(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return null;
      })}

      {sourceIds && sourceIds.length > 0 && (
        <div className="mt-5 pt-3 border-t border-[var(--color-border-light)] flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-bold text-[var(--color-muted)] flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            情報元へジャンプ
          </span>
          {sourceIds.slice(0, 3).map((id, idx) => (
             <a
               key={idx}
               href={`/talk/${roomSlug}/${topicId}#msg-${id}`}
               className="inline-flex items-center justify-center bg-[var(--color-surface-warm)] hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[11px] font-bold px-2 py-1 rounded border border-[var(--color-primary)]/20 transition-colors"
             >
               発言 {idx + 1}
             </a>
          ))}
          {sourceIds.length > 3 && (
            <span className="text-[11px] font-bold text-[var(--color-muted)]">他 {sourceIds.length - 3} 件</span>
          )}
        </div>
      )}
    </div>
  );
}
