"use client";

import { useState } from "react";
import { Search, Filter, Shield, Clock } from "lucide-react";

const CATEGORIES = [
  "すべて",
  "市販品",
  "外食",
  "負荷試験",
  "レシピ",
  "病院",
  "スキンケア",
];

const ALLERGENS = ["卵", "乳", "小麦", "そば", "落花生", "えび", "かに"];

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

// Demo data for initial display
const DEMO_ENTRIES: WikiEntry[] = [
  {
    id: "1",
    title: "卵不使用の市販おやつリスト 2026年版",
    slug: "egg-free-snacks-2026",
    category: "市販品",
    summary: "卵アレルギーの子どもでも安心して食べられる市販おやつを、複数の保護者の体験に基づいてまとめました。",
    allergen_tags: ["卵"],
    avg_trust_score: 78.5,
    source_count: 23,
    updated_at: "2026-03-25T10:00:00Z",
  },
  {
    id: "2",
    title: "乳・卵不使用のケーキ専門店まとめ",
    slug: "dairy-egg-free-cake-shops",
    category: "外食",
    summary: "誕生日やイベント時に利用できる、アレルギー対応ケーキを提供する専門店のリストです。",
    allergen_tags: ["卵", "乳"],
    avg_trust_score: 65.2,
    source_count: 15,
    updated_at: "2026-03-20T10:00:00Z",
  },
  {
    id: "3",
    title: "卵アレルギーの負荷試験の進め方ガイド",
    slug: "egg-challenge-guide",
    category: "負荷試験",
    summary: "実際に負荷試験を経験した保護者の声をもとに、準備から当日の流れ、注意点をまとめました。",
    allergen_tags: ["卵"],
    avg_trust_score: 85.0,
    source_count: 42,
    updated_at: "2026-03-18T10:00:00Z",
  },
  {
    id: "4",
    title: "小麦フリーの代替パスタ比較レビュー",
    slug: "wheat-free-pasta-reviews",
    category: "市販品",
    summary: "米粉パスタやとうもろこしパスタなど、小麦不使用の代替パスタの食感・味を比較した保護者のレビュー集。",
    allergen_tags: ["小麦"],
    avg_trust_score: 58.3,
    source_count: 18,
    updated_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "5",
    title: "保育園でのアレルギー給食対応事例集",
    slug: "nursery-allergy-meal-cases",
    category: "病院",
    summary: "保育園入園時の除去食対応、栄養士との面談、代替メニューの交渉テクニックなどの実例。",
    allergen_tags: ["卵", "乳", "小麦"],
    avg_trust_score: 72.0,
    source_count: 31,
    updated_at: "2026-03-12T10:00:00Z",
  },
];

function getTrustLevel(score: number) {
  if (score >= 70) return { label: "高信頼", className: "trust-high" };
  if (score >= 40) return { label: "中信頼", className: "trust-medium" };
  return { label: "新規", className: "trust-low" };
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredEntries = DEMO_ENTRIES.filter((entry) => {
    if (
      searchQuery &&
      !entry.title.includes(searchQuery) &&
      !entry.summary.includes(searchQuery)
    )
      return false;
    if (selectedCategory !== "すべて" && entry.category !== selectedCategory)
      return false;
    if (
      selectedAllergens.length > 0 &&
      !selectedAllergens.some((a) => entry.allergen_tags.includes(a))
    )
      return false;
    return true;
  });

  return (
    <div className="fade-in">
      <div className="px-5 pt-8 pb-5">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] leading-tight">
          みんなの知恵 📖
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
          ママ・パパの体験をAIが整理した、みんなでつくる知恵袋
        </p>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--color-subtle)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="商品名、症状、病院名で検索..."
            className="input-field pl-11 pr-12"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
              showFilters || selectedAllergens.length > 0
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-subtle)] hover:bg-[var(--color-surface-warm)]"
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 mb-4 slide-up">
          <div className="card p-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                カテゴリー
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                アレルゲン
              </p>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map((allergen) => (
                  <button
                    key={allergen}
                    onClick={() =>
                      setSelectedAllergens((prev) =>
                        prev.includes(allergen)
                          ? prev.filter((a) => a !== allergen)
                          : [...prev, allergen]
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedAllergens.includes(allergen)
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {allergen}
                  </button>
                ))}
              </div>
            </div>
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
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 space-y-3 pb-4">
        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            <div className="text-5xl mb-2">🌱</div>
            <h3>まだここは育ち中です</h3>
            <p>「みんなの声」で体験を共有すると、AIが自動的にここに知恵を集めます。<br/>あなたの一言が、次のページになります。</p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const trust = getTrustLevel(entry.avg_trust_score);
            const freshness = getFreshness(entry.updated_at);

            return (
              <div key={entry.id} className="card p-4 slide-up">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[15px] text-[var(--color-text)] flex-1 pr-2">
                    {entry.title}
                  </h3>
                </div>
                <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-3">
                  {entry.summary}
                </p>
                <div className="flex items-center flex-wrap gap-2">
                  <span className={`trust-badge ${trust.className}`}>
                    <Shield className="w-3 h-3" />
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
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {entry.allergen_tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-[var(--color-surface-warm)] rounded-full text-[11px] text-[var(--color-text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
