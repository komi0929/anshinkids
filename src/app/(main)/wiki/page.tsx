"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Clock, BookOpen, MessageCircle, Bookmark } from "@/components/icons";
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

const SORT_OPTIONS = [
  { key: "popular", label: "人気順" },
  { key: "latest", label: "新しい順" },
] as const;
type SortKey = typeof SORT_OPTIONS[number]["key"];

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
  helpful_count: number;
  updated_at: string;
}

export default function WikiPage() {
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("popular");
  const [searchQuery, setSearchQuery] = useState("");

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    const result = await searchWiki(searchQuery, {
      category: selectedCategory === "すべて" ? undefined : selectedCategory,
      allergens: selectedAllergens.length > 0 ? selectedAllergens : undefined,
      sortBy,
    });
    if (result.success) {
      setEntries(result.data as WikiEntry[]);
    }
    setIsLoading(false);
  }, [selectedCategory, selectedAllergens, sortBy, searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadEntries();
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [loadEntries, searchQuery]);

  return (
    <div className="fade-in pb-28 min-h-[100dvh] bg-[var(--color-bg-warm)]">
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[24px] font-black text-[var(--color-text)] tracking-tight">
            みんなのまとめ
          </h1>
          <Link
            href="/mypage#bookmarks"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-[var(--color-border-light)] text-[var(--color-text-secondary)]"
          >
            <Bookmark className="w-5 h-5" />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="レシピ、商品名、お店の名前を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border-none shadow-[0_2px_12px_rgba(0,0,0,0.03)] text-[14px] font-medium text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 mb-4">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${sortBy === opt.key ? "bg-[var(--color-text)] text-white shadow-sm" : "bg-white text-[var(--color-text-secondary)] shadow-sm"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Slider */}
      <div className="px-0 mb-6 sticky top-0 z-30 bg-gradient-to-b from-[var(--color-bg-warm)] via-[var(--color-bg-warm)] to-transparent pt-2 pb-4">
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide px-5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full transition-all ${showFilters || selectedAllergens.length > 0 ? "bg-[var(--color-primary)] text-white shadow-md" : "bg-white text-[var(--color-text-secondary)] shadow-sm"}`}
          >
            <Filter className="w-5 h-5" />
            {selectedAllergens.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-heart)] rounded-full border-2 border-white text-[8px] font-bold text-white flex items-center justify-center">
                {selectedAllergens.length}
              </span>
            )}
          </button>
          <div className="w-[1px] h-6 bg-[var(--color-border)] mx-1 flex-shrink-0"></div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-full text-[14px] font-bold transition-all ${selectedCategory === cat ? "bg-[var(--color-primary)] text-white shadow-md transform -translate-y-0.5" : "bg-white text-[var(--color-text-secondary)] shadow-sm"}`}
            >
              {CATEGORY_EMOJI[cat]} <span className="ml-1">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Allergen Filters Overlay */}
      {showFilters && (
        <div className="px-5 mb-6 slide-up relative z-20">
          <div className="p-5 rounded-[24px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] font-black text-[var(--color-text)]">アレルゲンフィルター</p>
              <button onClick={() => setSelectedAllergens([])} className="text-[12px] font-bold text-[var(--color-primary)]">
                クリア
              </button>
            </div>
            {ALLERGEN_GROUPS.map((group, groupIdx) => (
              <div key={group.label} className={groupIdx > 0 ? "mt-5" : ""}>
                <p className="text-[11px] font-bold text-[var(--color-subtle)] mb-2 uppercase tracking-wider">
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
                      className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${selectedAllergens.includes(allergen.label) ? "bg-[var(--color-primary)] text-white shadow-md scale-[1.02]" : "bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)]"}`}
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

      {/* Results List */}
      <div className="px-5 space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-[28px] p-6 shadow-sm border border-[var(--color-border-light)] slide-up">
              <div className="flex gap-2 mb-3">
                <div className="shimmer w-16 h-6 rounded-lg"></div>
                <div className="shimmer w-12 h-6 rounded-lg"></div>
              </div>
              <div className="shimmer w-3/4 h-6 rounded-md mb-3"></div>
              <div className="shimmer w-full h-4 rounded-md mb-2"></div>
              <div className="shimmer w-5/6 h-4 rounded-md mb-4"></div>
              <div className="shimmer w-1/3 h-4 rounded-md mt-4 border-t border-gray-100 pt-4"></div>
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="pt-4 text-center slide-up">
            <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
              <BookOpen className="w-7 h-7 text-[var(--color-muted)]" />
            </div>
            <h3 className="text-[18px] font-black text-[var(--color-text)] mb-2">
              記事がありません
            </h3>
            <p className="text-[13px] text-[var(--color-subtle)] leading-relaxed mb-6 max-w-[260px] mx-auto">
              このカテゴリにはまだまとめ記事が存在しません。トークルームで実体験を持ち寄りましょう。
            </p>
            <Link href="/talk" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white border border-[var(--color-border-light)] shadow-sm text-[13px] font-bold text-[var(--color-primary)] hover:bg-[var(--color-surface-warm)] transition-all">
               <MessageCircle className="w-4 h-4" />
               トークルームで体験を共有する
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[12px] font-bold text-[var(--color-subtle)] pl-1 mb-1">
              {entries.length}件の記事
            </p>
            {entries.map((entry) => (
              <Link
                key={entry.id}
                href={`/wiki/${entry.slug}`}
                className="block relative bg-white rounded-[28px] p-6 shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-transparent hover:border-[var(--color-primary)]/20 hover:shadow-[0_8px_32px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 text-[10px] font-bold">
                    <span className="text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-lg">
                      {entry.category}
                    </span>
                    {entry.source_count >= 5 && (
                      <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center">
                        ⭐ 注目
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.updated_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}更新
                  </div>
                </div>
                <h3 className="font-extrabold text-[18px] text-[var(--color-text)] mb-2.5 leading-tight tracking-tight text-balance">
                  {entry.title}
                </h3>
                <p className="text-[13px] text-[var(--color-text-secondary)] leading-[1.7] line-clamp-2 opacity-90">
                  {entry.summary}
                </p>
                <div className="flex items-center justify-between border-t border-[var(--color-border-light)] pt-4 mt-4">
                  <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--color-subtle)]">
                    <MessageCircle className="w-4 h-4" />
                    {entry.source_count}件の実体験
                  </div>
                  <div className="flex text-[18px] -space-x-1.5">
                    {Array.from({ length: Math.min(entry.source_count, 3) }).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-[var(--color-surface-warm)] flex items-center justify-center">
                        <span className="text-[10px]">👶</span>
                      </div>
                    ))}
                    {entry.source_count > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-gray-500">+{entry.source_count - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
