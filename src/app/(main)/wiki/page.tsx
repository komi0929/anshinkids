"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Clock, BookOpen } from "@/components/icons";
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
    <div className="fade-in">
      <div className="px-5 pt-7 pb-4">
        <h1 className="text-[24px] font-extrabold text-[var(--color-text)] tracking-tight leading-tight">
          知恵袋 📖
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
          同じ悩みを持つ親御さんたちの実体験が集まった、みんなの知恵袋です
        </p>
      </div>

      {/* Search — 現在データ蓄積中のため一時停止 */}
      <div className="px-4 mb-3">
        <div className="relative opacity-50 pointer-events-none select-none">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-subtle)]" />
          <input
            type="text"
            value=""
            readOnly
            placeholder="AI検索（データ蓄積中...まもなく使えるようになります）"
            className="input-field pl-11 pr-12 cursor-not-allowed"
            id="wiki-search"
            disabled
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white bg-[var(--color-subtle)]">
            準備中
          </span>
        </div>
      </div>
      {/* Filter toggle — still works for category/allergen filtering */}
      <div className="px-4 mb-1 flex justify-end">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
            showFilters || selectedAllergens.length > 0
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "bg-[var(--color-surface)] text-[var(--color-subtle)] border border-[var(--color-border)] hover:bg-[var(--color-surface-warm)]"
          }`}
          id="toggle-filters"
        >
          <Filter className="w-3.5 h-3.5" />
          絞り込み
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 mb-4 slide-up">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-extrabold text-[var(--color-text)]">アレルゲンで絞り込み</p>
              {selectedAllergens.length > 0 && (
                <button onClick={() => setSelectedAllergens([])} className="text-[11px] font-bold text-[var(--color-subtle)] hover:text-[var(--color-primary)] transition-colors">クリア</button>
              )}
            </div>
            
            {ALLERGEN_GROUPS.map((group, groupIdx) => (
              <div key={group.label} className={groupIdx > 0 ? "mt-4" : ""}>
                <p className="text-[11px] font-semibold text-[var(--color-subtle)] mb-2 flex items-center gap-1.5">
                  <span className={`w-1.5 h-3 rounded-full block ${groupIdx === 0 ? "bg-[var(--color-primary)]" : "bg-[var(--color-accent)]"}`}></span>
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((allergen) => (
                    <button
                      key={allergen.id}
                      onClick={() =>
                        setSelectedAllergens((prev) =>
                          prev.includes(allergen.label) ? prev.filter((a) => a !== allergen.label) : [...prev, allergen.label]
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                        selectedAllergens.includes(allergen.label)
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                          : "bg-white text-[var(--color-text-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-primary)]/50"
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

      {/* Category tabs */}
      <div className="px-4 mb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-[var(--color-primary)] text-white shadow-md"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30"
              }`}
              id={`category-${cat}`}
            >
              {CATEGORY_EMOJI[cat] || ""} {cat}
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
          <div className="empty-state">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-success-light)] flex items-center justify-center mb-2 shadow-sm">
              <BookOpen className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <h3>まだ記事がありません</h3>
            <p>
              トークルームで体験を共有すると、
              <br/>AIが自動的に知恵袋の記事を作成します。
            </p>
            <Link
              href="/talk"
              className="btn-primary mt-6 inline-flex items-center gap-2"
              id="go-to-talk-from-wiki"
            >
              💬 みんなの声で話してみる
            </Link>

            {/* Placeholder themes */}
            <div className="mt-8 w-full max-w-sm">
              <p className="text-[11px] text-[var(--color-subtle)] mb-3 font-medium">今後こんな情報が集まる予定です</p>
              <div className="space-y-2">
                {["卵不使用のおすすめ市販おやつまとめ", "乳アレルギー対応の外食チェーン情報", "保育園への生活管理指導表の書き方", "米粉でつくる簡単パンケーキレシピ"].map((theme, i) => (
                  <div key={theme} className="card p-3.5 text-left opacity-60 stagger-item">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-bg-warm)] flex items-center justify-center text-sm">
                        {["🛒", "🍽️", "🏫", "👩‍🍳"][i]}
                      </div>
                      <span className="text-[13px] text-[var(--color-text-secondary)]">{theme}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          entries.map((entry) => {
            const trust = getTrustLevel(entry.source_count);
            const freshness = getFreshness(entry.updated_at);
            return (
              <div key={entry.id} className="card overflow-hidden stagger-item">
                <Link href={`/wiki/${entry.slug}`} className="block p-4 hover:bg-[var(--color-surface-warm)]/30 transition-colors" id={`wiki-entry-${entry.slug}`}>
                  <h3 className="font-bold text-[15px] text-[var(--color-text)] mb-2">{entry.title}</h3>
                  <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-3 line-clamp-2">{entry.summary}</p>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`trust-badge ${trust.className}`}>
                      <span className="text-[10px] font-bold opacity-80 mr-1">💬</span>
                      {trust.label}
                    </span>
                    <span className={`freshness-badge ${freshness.className}`}>
                      <Clock className="w-3 h-3" />
                      {freshness.label}
                    </span>
                    <span className="text-[11px] text-[var(--color-subtle)]">
                      {entry.source_count}件の体験にもとづく
                    </span>
                  </div>
                </Link>
                <div className="px-4 pb-3 flex items-center justify-between border-t border-[var(--color-border-light)]/50 pt-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {entry.allergen_tags?.map((tag) => (
                      <span key={tag} className="px-2.5 py-0.5 bg-[var(--color-surface-warm)] rounded-full text-[11px] font-medium text-[var(--color-text-secondary)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
