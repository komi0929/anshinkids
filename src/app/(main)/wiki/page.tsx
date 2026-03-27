"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Shield, Clock, Plus, Loader2, Check, X } from "lucide-react";
import Link from "next/link";
import { searchWiki, contributeToWiki } from "@/app/actions/wiki";

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
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [contribText, setContribText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, [searchQuery, selectedCategory, selectedAllergens]);

  async function loadEntries() {
    setIsLoading(true);
    const result = await searchWiki(searchQuery, {
      category: selectedCategory === "すべて" ? undefined : selectedCategory,
      allergens: selectedAllergens.length > 0 ? selectedAllergens : undefined,
    });
    if (result.success) {
      setEntries(result.data as WikiEntry[]);
    }
    setIsLoading(false);
  }

  async function handleContribute(entryId: string) {
    if (!contribText.trim()) return;
    setIsSubmitting(true);
    const result = await contributeToWiki(entryId, contribText);
    if (result.success) {
      setSubmitted(entryId);
      setContribText("");
      setTimeout(() => { setSubmitted(null); setExpandedEntry(null); loadEntries(); }, 2500);
    }
    setIsSubmitting(false);
  }

  return (
    <div className="fade-in">
      <div className="px-5 pt-8 pb-5">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] leading-tight">みんなの知恵 📖</h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
          ママ・パパの体験をAIが整理した、みんなでつくる知恵袋
        </p>
      </div>

      {/* Contribution CTA */}
      <div className="mx-4 mb-4 p-3 rounded-xl bg-gradient-to-r from-[var(--color-surface-warm)] to-[var(--color-success-light)]/50 border border-[var(--color-border-light)]">
        <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
          ✍️ 各記事の「<strong>情報を追加</strong>」から、あなたの知識をざざっと書くだけ。AIが整理してマージします。
        </p>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-subtle)]" />
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
          <div className="card p-4">
            <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">アレルゲン</p>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((allergen) => (
                <button
                  key={allergen}
                  onClick={() =>
                    setSelectedAllergens((prev) =>
                      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
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
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-32 rounded-2xl" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <div className="text-5xl mb-2">🌱</div>
            <h3>まだここは育ち中です</h3>
            <p>
              「みんなの声」で体験を共有すると、AIが自動的にここに知恵を集めます。
              <br/>あなたの一言が、次のページになります。
            </p>
            <Link
              href="/talk"
              className="btn-primary mt-6 inline-flex items-center gap-2"
            >
              💬 みんなの声で話してみる
            </Link>
          </div>
        ) : (
          entries.map((entry) => {
            const trust = getTrustLevel(entry.avg_trust_score);
            const freshness = getFreshness(entry.updated_at);
            const isExpanded = expandedEntry === entry.id;
            const isSubmittedEntry = submitted === entry.id;

            return (
              <div key={entry.id} className="card slide-up overflow-hidden">
                <Link href={`/wiki/${entry.slug}`} className="block p-4 hover:bg-[var(--color-surface-warm)]/30 transition-colors">
                  <h3 className="font-semibold text-[15px] text-[var(--color-text)] mb-2">{entry.title}</h3>
                  <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-3">{entry.summary}</p>
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
                </Link>
                <div className="px-4 pb-3 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {entry.allergen_tags?.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-[var(--color-surface-warm)] rounded-full text-[11px] text-[var(--color-text-secondary)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); setExpandedEntry(isExpanded ? null : entry.id); setContribText(""); }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      isExpanded
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "text-[var(--color-subtle)] hover:bg-[var(--color-surface-warm)] hover:text-[var(--color-primary)]"
                    }`}
                  >
                    {isExpanded ? (<><X className="w-3 h-3" /> とじる</>) : (<><Plus className="w-3 h-3" /> 情報を追加</>)}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-[var(--color-border-light)]">
                    <div className="pt-3">
                      {isSubmittedEntry ? (
                        <div className="flex items-center gap-2 justify-center py-4 text-[var(--color-success)]">
                          <Check className="w-5 h-5" />
                          <span className="text-[13px] font-medium">情報をいただきました！AIが整理して反映します 🌿</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] text-[var(--color-subtle)] mb-2">
                            知っていることをざざっと書くだけでOK。AIが整理します ✨
                          </p>
                          <textarea
                            value={contribText}
                            onChange={(e) => setContribText(e.target.value)}
                            placeholder="例: 西松屋で売ってるアンパンマンのせんべいも卵不使用だったよ！あと成城石井のグラノーラもおすすめ"
                            className="input-field resize-none w-full"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-[var(--color-muted)]">きれいに書かなくて大丈夫です</span>
                            <button
                              onClick={() => handleContribute(entry.id)}
                              disabled={!contribText.trim() || isSubmitting}
                              className="btn-primary !py-1.5 !px-4 !text-[12px] disabled:opacity-40 flex items-center gap-1.5"
                            >
                              {isSubmitting ? (<><Loader2 className="w-3 h-3 animate-spin" /> AIが整理中...</>) : (<><Plus className="w-3 h-3" /> 追加する</>)}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
