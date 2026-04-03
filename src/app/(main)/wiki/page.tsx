"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Clock, BookOpen, Sparkles, ArrowRight } from "@/components/icons";
import Link from "next/link";
import { searchWiki } from "@/app/actions/wiki";
import { ALLERGENS_RAW_8, ALLERGENS_EQUIV_20 } from "@/components/onboarding-wizard";

const CATEGORIES = [
  "すべて",
  "毎日のごはん",
  "使ってよかった市販品",
  "外食・おでかけ",
  "園・学校との連携",
  "負荷試験の体験談",
  "肌とからだのケア",
  "気持ち・家族・まわり",
  "食べられた！の記録",
];

const CATEGORY_EMOJI: Record<string, string> = {
  "すべて": "📖",
  "毎日のごはん": "🍚",
  "使ってよかった市販品": "🛒",
  "外食・おでかけ": "🍽️",
  "園・学校との連携": "🏫",
  "負荷試験の体験談": "🧪",
  "肌とからだのケア": "🧴",
  "気持ち・家族・まわり": "👨‍👩‍👧",
  "食べられた！の記録": "🌱",
};

const ALLERGEN_GROUPS = [
  { label: "特定原材料8品目", items: ALLERGENS_RAW_8 },
  { label: "準ずるもの20品目", items: ALLERGENS_EQUIV_20 }
];

interface WikiEntry {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  allergen_tags: string[];
  avg_trust_score: number;
  source_count: number;
  updated_at: string;
}

function getTrustLevel(sourceCount: number) {
  const count = sourceCount || 0;
  if (count >= 10) return { label: "たくさんの声", className: "trust-high" };
  if (count >= 5) return { label: "つながる声", className: "trust-medium" };
  return { label: "はじめの声", className: "trust-low" };
}

function getFreshness(updatedAt: string) {
  const days = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 30) return { label: "最新", className: "fresh" };
  if (days <= 90) return { label: "1-3ヶ月前", className: "aging" };
  return { label: "要更新", className: "stale" };
}

export default function WikiPage() {
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);




  const loadEntries = async () => {
    setIsLoading(true);
    const result = await searchWiki("", {
      category: selectedCategory === "すべて" ? undefined : selectedCategory,
      allergens: selectedAllergens.length > 0 ? selectedAllergens : undefined,
    });
    if (result.success) {
      setEntries(result.data as WikiEntry[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedAllergens]);



  return (
    <div className="fade-in pb-28">
      {/* プレミアムヒーローヘッダー (Glassmorphism & Gradient) */}
      <div className="relative pt-6 pb-8 mb-6 overflow-hidden rounded-b-[40px] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-bg)] via-[var(--color-surface)] to-[var(--color-accent)]/10 z-0"></div>
        
        {/* 背景の装飾オブジェクト */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--color-primary)]/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
        <div className="absolute top-10 -left-10 w-32 h-32 bg-[var(--color-accent)]/10 rounded-full blur-2xl z-0 pointer-events-none"></div>

        <div className="relative z-10 px-5 text-center mt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-md border border-white/50 mb-3 bg-opacity-80 backdrop-blur-md">
            <BookOpen className="w-7 h-7 text-[var(--color-primary)]" />
          </div>
          <h1 className="text-[26px] font-black text-[var(--color-text)] tracking-tight leading-tight mb-2" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            みんなのまとめ
          </h1>
          <p className="text-[13px] font-medium text-[var(--color-text-secondary)] leading-relaxed max-w-[280px] mx-auto opacity-90">
            同じ悩みを持つ親御さんたちの実体験から生まれた、知識のライブラリ
          </p>
        </div>
      </div>

      {/* Filters (Glassmorphic Window) */}
      {showFilters && (
        <div className="px-5 mb-5 slide-up z-20 relative">
          <div className="p-5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] font-black text-[var(--color-text)] tracking-tight">アレルゲンで絞り込み</p>
              {selectedAllergens.length > 0 && (
                <button onClick={() => setSelectedAllergens([])} className="text-[12px] font-bold text-[var(--color-primary)] hover:opacity-70 transition-opacity bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">
                  すべてクリア
                </button>
              )}
            </div>
            
            {ALLERGEN_GROUPS.map((group, groupIdx) => (
              <div key={group.label} className={groupIdx > 0 ? "mt-5" : ""}>
                <p className="text-[11px] font-bold text-[var(--color-subtle)] mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className={`w-1.5 h-3 rounded-full block ${groupIdx === 0 ? "bg-[var(--color-primary)]" : "bg-[var(--color-accent)]"}`}></span>
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((allergen) => (
                    <button
                      key={allergen.id}
                      onClick={() =>
                        setSelectedAllergens((prev) =>
                          prev.includes(allergen.label) ? prev.filter((a) => a !== allergen.label) : [...prev, allergen.label]
                        )
                      }
                      className={`px-3.5 py-2 rounded-2xl text-[12px] font-bold transition-all ${
                        selectedAllergens.includes(allergen.label)
                          ? "bg-[var(--color-primary)] text-white shadow-md transform scale-[1.02]"
                          : "bg-white text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-warm)]"
                      }`}
                    >
                      {allergen.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Neumorphic Category Slider */}
      <div className="px-0 mb-6">
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide pb-3 pt-1 px-5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 ${
              showFilters || selectedAllergens.length > 0
                ? "bg-[var(--color-primary)] text-white shadow-[0_4px_12px_rgba(24,144,136,0.3)] transform scale-105"
                : "bg-white text-[var(--color-text-secondary)] shadow-sm border border-[var(--color-border-light)] hover:bg-[var(--color-surface-warm)] hover:shadow-md"
            }`}
            aria-label="アレルゲンで絞り込む"
          >
            <Filter className="w-4.5 h-4.5" />
            {(selectedAllergens.length > 0) && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--color-heart)] rounded-full border-2 border-white"></span>
            )}
          </button>
          
          <div className="w-[1.5px] h-7 bg-[var(--color-border-light)] mx-1 flex-shrink-0 rounded-full"></div>

          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-[20px] text-[13.5px] font-bold whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat
                  ? "bg-[var(--color-text)] text-white shadow-[0_8px_16px_rgba(0,0,0,0.12)] transform -translate-y-0.5"
                  : "bg-white text-[var(--color-text-secondary)] shadow-sm border border-[var(--color-border-light)] hover:border-[var(--color-border)] hover:bg-[#FAFAFA] hover:-translate-y-0.5 hover:shadow-md"
              }`}
              id={`category-${cat}`}
            >
              {CATEGORY_EMOJI[cat] || ""} <span className="ml-1.5">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 space-y-3 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-36 rounded-2xl" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-2 slide-up px-2">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white to-[var(--color-surface-warm)] border border-[var(--color-border-light)] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-7 text-center">
              
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--color-primary)]/10 rounded-full blur-2xl animate-pulse z-0"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-[24px] bg-white flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(24,144,136,0.15)] border border-[var(--color-primary)]/10">
                  <div className="relative">
                    <BookOpen className="w-8 h-8 text-[var(--color-primary)]" />
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-[var(--color-primary)] rounded-full animate-ping opacity-75"></span>
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--color-primary)] rounded-full z-10"></span>
                  </div>
                </div>

                <h3 className="text-[19px] font-black text-[var(--color-text)] tracking-tight mb-2.5">
                  AIがヒントを抽出しています
                </h3>
                
                <p className="text-[13.5px] font-medium text-[var(--color-text-secondary)] leading-[1.8] max-w-[260px] mb-6">
                  トークルームに投稿された様々な体験から、役立つ情報だけを整理してWiki記事を自動生成します。
                </p>

                <Link
                  href="/talk"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[var(--color-subtle)] text-white text-[14px] font-bold shadow-md hover:bg-black transition-all transform hover:scale-105 active:scale-95"
                  id="go-to-talk-from-wiki"
                >
                  <Sparkles className="w-4.5 h-4.5" />
                  トークルームを見てみる
                </Link>
              </div>

              {/* Premium Bento Placeholder themes */}
              <div className="mt-10 relative z-10">
                <div className="flex items-center gap-3 justify-center mb-5">
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent to-[var(--color-border)] opacity-50"></div>
                  <p className="text-[10px] text-[var(--color-subtle)] font-black tracking-[0.2em] whitespace-nowrap opacity-60">NEXT COMING</p>
                  <div className="h-[1px] w-full bg-gradient-to-l from-transparent to-[var(--color-border)] opacity-50"></div>
                </div>
                
                <div className="grid grid-cols-2 gap-3.5">
                  {[
                    { label: "卵不使用おやつ", icon: "🛒", bg: "from-orange-50 to-orange-100/50" },
                    { label: "外食チェーン情報", icon: "🍽️", bg: "from-blue-50 to-blue-100/50" },
                    { label: "保育園の管理表", icon: "🏫", bg: "from-green-50 to-green-100/50" },
                    { label: "米粉の簡単レシピ", icon: "👩‍🍳", bg: "from-yellow-50 to-yellow-100/50" }
                  ].map((theme) => (
                    <div key={theme.label} className={`relative overflow-hidden rounded-[20px] p-4 text-left stagger-item bg-gradient-to-br ${theme.bg} border border-white/50 shadow-sm backdrop-blur-sm opacity-60`}>
                      <div className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-[16px] shadow-sm mb-2.5 backdrop-blur-md">
                        {theme.icon}
                      </div>
                      <span className="text-[12px] font-bold text-[var(--color-text)] leading-tight block">{theme.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          entries.map((entry) => {
            const trust = getTrustLevel(entry.source_count);
            const freshness = getFreshness(entry.updated_at);
            return (
              <div key={entry.id} className="relative group stagger-item slide-up">
                <Link href={`/wiki/${entry.slug}`} className="block rounded-3xl bg-white border border-[var(--color-border-light)] p-5 shadow-sm transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:border-[var(--color-border)]" id={`wiki-entry-${entry.slug}`}>
                  
                  {/* Title and summary */}
                  <div className="mb-4">
                    <h3 className="font-extrabold text-[16.5px] text-[var(--color-text)] mb-2.5 break-keep text-balance leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                      {entry.title}
                    </h3>
                    <p className="text-[13.5px] font-medium text-[var(--color-text-secondary)] leading-[1.7] line-clamp-2 opacity-90">
                      {entry.summary}
                    </p>
                  </div>
                  
                  {/* Metrics Row */}
                  <div className="flex items-center flex-wrap gap-2 mb-4">
                    <span className={`trust-badge ${trust.className} scale-100 origin-left`}>
                      <span className="text-[10px] font-black opacity-80 mr-1.5">💬</span>
                      {trust.label}
                    </span>
                    <span className={`freshness-badge ${freshness.className}`}>
                      <Clock className="w-3 h-3" />
                      {freshness.label}
                    </span>
                  </div>
                  
                  {/* Tags & Meta */}
                  <div className="flex items-center justify-between border-t border-[var(--color-border-light)]/60 pt-3.5 mt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {entry.allergen_tags?.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-[var(--color-surface-warm)] rounded-md text-[11px] font-bold text-[var(--color-text-secondary)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex-shrink-0 text-[11px] font-semibold text-[var(--color-subtle)] flex items-center gap-1">
                      {entry.source_count}件の体験 <ArrowRight className="w-3.5 h-3.5 text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
