"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Clock, Plus, Loader2, Check, User, MessageCircle, X, BookOpen } from "@/components/icons";
// Users icon (not in shared yet, alias User)
const Users = User;
import { getWikiEntry, contributeToWiki, voteWikiHelpful } from "@/app/actions/wiki";
import { getKnowledgeRipple } from "@/app/actions/discover";

export interface MegaWikiItem {
  title: string;
  content: string;
  mention_count?: number;
  heat_score?: number;
  is_recommended?: boolean;
  [key: string]: unknown;
}

export interface MegaWikiSection {
  heading: string;
  items: MegaWikiItem[];
}

interface WikiSource {
  id: string;
  original_message_snippet: string;
  contributor_trust_score: number;
  extracted_at: string;
}

interface WikiEntryData {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content_json: Record<string, unknown>;
  sections: MegaWikiSection[];
  allergen_tags: string[];
  avg_trust_score: number;
  source_count: number;
  helpful_count: number;
  updated_at: string;
  created_at: string;
  wiki_sources: WikiSource[];
}

function getTrustLevel(score: number) {
  if (score >= 70) return { label: "高信頼", className: "trust-high", desc: "多くの保護者から支持されています" };
  if (score >= 40) return { label: "中信頼", className: "trust-medium", desc: "複数の体験に基づいています" };
  return { label: "新規", className: "trust-low", desc: "まだ情報が少ないです" };
}

function getFreshness(updatedAt: string) {
  const days = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 30) return { label: "最新", className: "fresh" };
  if (days <= 90) return { label: "1-3ヶ月前", className: "aging" };
  return { label: "要更新", className: "stale" };
}

function renderContentJson(content: Record<string, unknown>, category?: string): React.ReactNode {
  if (!content || Object.keys(content).length === 0) {
    return <p className="text-[13px] text-[var(--color-subtle)] italic">まだ詳細な情報はありません。「情報を追加」から体験を共有してください。</p>;
  }

  const sections: React.ReactNode[] = [];

  // raw_summary (all categories)
  if (content.raw_summary && typeof content.raw_summary === "string") {
    sections.push(
      <div key="summary" className="mb-5">
        <p className="text-[14px] leading-[1.9] text-[var(--color-text)]">{content.raw_summary}</p>
      </div>
    );
  }

  // === RECIPE ===
  if (category === "レシピ" || content.ingredients || content.steps) {
    // Meta badges
    const meta = [content.difficulty, content.prep_time, Array.isArray(content.allergen_free) ? `${(content.allergen_free as string[]).join("・")}不使用` : null].filter(Boolean);
    if (meta.length > 0) {
      sections.push(
        <div key="recipe-meta" className="flex flex-wrap gap-2 mb-4">
          {meta.map((m, i) => <span key={i} className="px-2.5 py-1 bg-[var(--color-surface-warm)] rounded-full text-[11px] font-semibold text-[var(--color-text-secondary)]">{String(m)}</span>)}
        </div>
      );
    }
    // Ingredients
    if (Array.isArray(content.ingredients) && content.ingredients.length > 0) {
      sections.push(
        <div key="ingredients" className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-200/30">
          <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2"><span>🥄</span> 材料</h3>
          <ul className="space-y-1.5">
            {(content.ingredients as Array<Record<string, unknown>>).map((ing, i) => (
              <li key={i} className="flex items-center justify-between text-[13px] py-1.5 border-b border-amber-100 last:border-0">
                <span className="text-[var(--color-text)]">{String(ing.name || ing)}</span>
                {ing.amount ? <span className="text-[var(--color-subtle)] text-[12px] font-medium">{String(ing.amount)}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    // Steps
    if (Array.isArray(content.steps) && content.steps.length > 0) {
      sections.push(
        <div key="steps" className="mb-5">
          <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2"><span>👨‍🍳</span> 作り方</h3>
          <ol className="space-y-3">
            {(content.steps as string[]).map((step, i) => (
              <li key={i} className="flex gap-3 p-3 rounded-xl bg-[var(--color-surface-warm)]">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-[13px] text-[var(--color-text)] leading-relaxed">{typeof step === "string" ? step : JSON.stringify(step)}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    }
  }

  // === CHALLENGE (負荷試験) ===
  if (category === "負荷試験" || content.timeline) {
    const challengeMeta = [content.allergen, content.child_age, content.hospital, content.result].filter(Boolean);
    if (challengeMeta.length > 0) {
      sections.push(
        <div key="challenge-meta" className="flex flex-wrap gap-2 mb-4">
          {content.allergen ? <span className="px-2.5 py-1 bg-red-50 rounded-full text-[11px] font-bold text-red-600 border border-red-200/40">🎯 {String(content.allergen)}</span> : null}
          {content.child_age ? <span className="px-2.5 py-1 bg-blue-50 rounded-full text-[11px] font-semibold text-blue-600">👶 {String(content.child_age)}</span> : null}
          {content.result ? <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${content.result === "陰性" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{String(content.result)}</span> : null}
        </div>
      );
    }
    if (Array.isArray(content.timeline)) {
      sections.push(
        <div key="timeline" className="mb-5">
          <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2"><span>📅</span> 経過タイムライン</h3>
          <div className="relative pl-6 border-l-2 border-[var(--color-primary)]/20">
            {(content.timeline as Array<Record<string, unknown>>).map((event, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-[var(--color-primary)] border-2 border-white" style={{ top: `${i * 80 + 4}px` }} />
                <span className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wide">{String(event.phase || `Phase ${i + 1}`)}</span>
                <p className="text-[13px] text-[var(--color-text)] leading-relaxed mt-1">{String(event.description || JSON.stringify(event))}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (content.doctor_comment) {
      sections.push(
        <div key="doctor" className="mb-5 p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/30">
          <p className="text-[12px] font-bold text-blue-700 mb-1">🩺 医師のコメント</p>
          <p className="text-[13px] text-blue-900 leading-relaxed">{String(content.doctor_comment)}</p>
        </div>
      );
    }
  }

  // === PRODUCT (商品) ===
  if (category === "商品情報" || content.product_name || content.brand) {
    if (content.product_name || content.brand) {
      sections.push(
        <div key="product-card" className="mb-4 p-4 rounded-2xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)]">
          {content.product_name ? <p className="text-[15px] font-extrabold text-[var(--color-text)]">{String(content.product_name)}</p> : null}
          {content.brand ? <p className="text-[12px] text-[var(--color-subtle)] mt-0.5">{String(content.brand)}</p> : null}
          <div className="flex flex-wrap gap-2 mt-2">
            {content.price_range ? <span className="text-[11px] text-[var(--color-text-secondary)]">💰 {String(content.price_range)}</span> : null}
            {Array.isArray(content.where_to_buy) ? <span className="text-[11px] text-[var(--color-text-secondary)]">🛒 {(content.where_to_buy as string[]).join(", ")}</span> : null}
          </div>
        </div>
      );
    }
    if (Array.isArray(content.reviews)) {
      sections.push(
        <div key="reviews" className="mb-5">
          <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2"><span>💬</span> みんなのクチコミ ({(content.reviews as unknown[]).length}件)</h3>
          <div className="space-y-2.5">
            {(content.reviews as Array<Record<string, unknown>>).map((review, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)]">
                {review.rating ? <div className="text-[12px] text-amber-500 mb-1">{"★".repeat(Number(review.rating))}{"☆".repeat(5 - Number(review.rating))}</div> : null}
                <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{String(review.comment || review)}</p>
                {review.child_age ? <p className="text-[10px] text-[var(--color-muted)] mt-1">お子さま: {String(review.child_age)}</p> : null}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // === RESTAURANT (外食) ===
  if (category === "外食" || content.restaurant_name || content.chain_name) {
    if (content.restaurant_name || content.chain_name) {
      sections.push(
        <div key="restaurant-card" className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50/50 to-amber-50/30 border border-orange-200/30">
          <p className="text-[15px] font-extrabold text-[var(--color-text)]">🍽️ {String(content.restaurant_name || content.chain_name)}</p>
          {content.allergy_menu !== undefined && (
            <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${content.allergy_menu ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {content.allergy_menu ? "✅ アレルギー対応メニューあり" : "❌ アレルギー対応メニューなし"}
            </span>
          )}
          {content.staff_response ? <p className="text-[12px] text-[var(--color-text-secondary)] mt-2">👤 {String(content.staff_response)}</p> : null}
        </div>
      );
    }
    if (Array.isArray(content.safe_items)) {
      sections.push(
        <div key="safe-items" className="mb-4">
          <h3 className="text-[13px] font-bold text-[var(--color-text)] mb-2">✅ 安全に食べられたメニュー</h3>
          <div className="flex flex-wrap gap-2">
            {(content.safe_items as string[]).map((item, i) => <span key={i} className="px-3 py-1 bg-green-50 rounded-full text-[12px] text-green-700 border border-green-200/40">{item}</span>)}
          </div>
        </div>
      );
    }
  }

  // === TREATMENT (対処法) ===
  if (category === "対処法" || content.actions) {
    if (Array.isArray(content.symptoms)) {
      sections.push(
        <div key="symptoms" className="mb-4">
          <h3 className="text-[13px] font-bold text-[var(--color-text)] mb-2">⚠️ 症状</h3>
          <div className="flex flex-wrap gap-2">
            {(content.symptoms as string[]).map((s, i) => <span key={i} className="px-3 py-1 bg-red-50 rounded-full text-[12px] text-red-600 border border-red-200/30">{s}</span>)}
          </div>
        </div>
      );
    }
    if (Array.isArray(content.actions)) {
      sections.push(
        <div key="actions" className="mb-5">
          <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2"><span>🚑</span> 対処ステップ</h3>
          <ol className="space-y-2.5">
            {(content.actions as Array<Record<string, unknown>>).map((action, i) => (
              <li key={i} className="flex gap-3 p-3.5 rounded-xl bg-gradient-to-r from-red-50/30 to-transparent border border-red-100/30">
                <span className="w-7 h-7 rounded-lg bg-red-500 text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">{Number(action.order) || i + 1}</span>
                <div>
                  <p className="text-[13px] font-bold text-[var(--color-text)]">{String(action.action || action)}</p>
                  {action.detail ? <p className="text-[12px] text-[var(--color-subtle)] mt-0.5">{String(action.detail)}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      );
    }
    if (content.when_to_hospital) {
      sections.push(
        <div key="hospital" className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200/40">
          <p className="text-[12px] font-bold text-red-700 mb-1">🏥 こんな時は病院へ</p>
          <p className="text-[13px] text-red-800 leading-relaxed">{String(content.when_to_hospital)}</p>
        </div>
      );
    }
  }

  // === SCHOOL (園・学校) ===
  if (Array.isArray(content.success_stories)) {
    sections.push(
      <div key="stories" className="mb-5">
        <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2"><span>📝</span> 成功事例</h3>
        <div className="space-y-3">
          {(content.success_stories as Array<Record<string, unknown>>).map((story, i) => (
            <div key={i} className="p-4 rounded-2xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)]">
              {story.situation ? <p className="text-[12px] font-bold text-[var(--color-primary)] mb-1">📍 {String(story.situation)}</p> : null}
              {story.approach ? <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-1">💡 {String(story.approach)}</p> : null}
              {story.result ? <p className="text-[12px] text-[var(--color-success)] font-semibold">→ {String(story.result)}</p> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // === STORY (体験談) ===
  if (Array.isArray(content.stories)) {
    sections.push(
      <div key="exp-stories" className="mb-5">
        <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2"><span>💚</span> みんなの声</h3>
        <div className="space-y-3">
          {(content.stories as Array<Record<string, unknown>>).map((story, i) => (
            <div key={i} className="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
              {story.situation ? <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-1">{String(story.situation)}</p> : null}
              {story.feeling ? <p className="text-[12px] text-[var(--color-primary)] italic">「{String(story.feeling)}」</p> : null}
              {story.outcome ? <p className="text-[12px] text-[var(--color-success)] font-semibold mt-1">→ {String(story.outcome)}</p> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (Array.isArray(content.encouraging_words) && content.encouraging_words.length > 0) {
    sections.push(
      <div key="encouragement" className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-pink-50/50 to-purple-50/30 border border-pink-200/20">
        <h3 className="text-[13px] font-bold text-[var(--color-text)] mb-2">🌈 みんなからの励まし</h3>
        <div className="space-y-1.5">
          {(content.encouraging_words as string[]).map((word, i) => (
            <p key={i} className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">「{word}」</p>
          ))}
        </div>
      </div>
    );
  }

  // === GENERIC fallbacks (items, tips) ===
  if (Array.isArray(content.items) && !content.ingredients && !content.reviews) {
    sections.push(
      <div key="items" className="mb-5">
        <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2"><span>📋</span> 情報一覧</h3>
        <ul className="space-y-2.5">
          {(content.items as Array<Record<string, unknown>>).map((item, i) => (
            <li key={i} className="p-3.5 rounded-2xl bg-[var(--color-surface-warm)] text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              {typeof item === "string" ? item : (
                <>
                  {item.name && <span className="font-bold text-[var(--color-text)] block mb-0.5">{String(item.name)}</span>}
                  {item.text && <span>{String(item.text)}</span>}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Tips (all categories)
  if (Array.isArray(content.tips) && content.tips.length > 0) {
    sections.push(
      <div key="tips" className="mb-5">
        <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2"><span>💡</span> みんなの工夫</h3>
        <ul className="space-y-2.5">
          {(content.tips as Array<Record<string, unknown>>).map((tip, i) => (
            <li key={i} className="flex gap-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-success-light)]/30 to-transparent text-[13px] text-[var(--color-text-secondary)] leading-relaxed border border-[var(--color-success)]/10">
              <span className="text-[var(--color-success)] font-bold flex-shrink-0">✓</span>
              <span>{typeof tip === "string" ? tip : String((tip as Record<string, unknown>).text || JSON.stringify(tip))}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Prevention tips / negotiation tips / coping strategies / documents
  const extraArrays: [string, string, string][] = [
    ["prevention_tips", "🛡️", "予防のポイント"],
    ["negotiation_tips", "💬", "交渉のコツ"],
    ["coping_strategies", "🧘", "対処法"],
    ["documents_needed", "📄", "必要な書類"],
  ];
  for (const [field, icon, label] of extraArrays) {
    if (Array.isArray(content[field]) && (content[field] as unknown[]).length > 0) {
      sections.push(
        <div key={field} className="mb-4">
          <h3 className="text-[13px] font-bold text-[var(--color-text)] mb-2">{icon} {label}</h3>
          <ul className="space-y-1.5">
            {(content[field] as string[]).map((item, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-muted)]">•</span>{typeof item === "string" ? item : JSON.stringify(item)}
              </li>
            ))}
          </ul>
        </div>
      );
    }
  }

  return sections.length > 0 ? sections : (
    <p className="text-[13px] text-[var(--color-subtle)] italic">情報は整理中です。</p>
  );
}

export default function WikiDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [entry, setEntry] = useState<WikiEntryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContrib, setShowContrib] = useState(false);
  const [contribText, setContribText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ripple, setRipple] = useState<{
    maturityLabel: string;
    maturityLevel: string;
    sourceCount: number;
    trustScore: number;
    ageInDays: number;
    contributors: Array<{ displayName: string; extractedAt: string }>;
  } | null>(null);

  const [hasVotedHelpful, setHasVotedHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(0);

  useEffect(() => {
    loadEntry();
    getKnowledgeRipple(slug).then(r => {
      if (r.success && r.data) setRipple(r.data as typeof ripple);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const talkSlug = slug.replace("mega-", "");

  async function loadEntry() {
    const result = await getWikiEntry(slug);
    if (result.success && result.data) {
      const data = result.data as unknown as WikiEntryData;
      setEntry(data);
      setHelpfulCount(data.helpful_count || 0);
    }
    setIsLoading(false);
  }

  async function handleVoteHelpful() {
    if (hasVotedHelpful || !entry) return;
    setHasVotedHelpful(true);
    setHelpfulCount(c => c + 1);
    const res = await voteWikiHelpful(entry.id);
    if (!res.success && res.error === "ログインが必要です") {
      alert("「役に立った」を送信するにはログインが必要です");
      setHasVotedHelpful(false);
      setHelpfulCount(c => Math.max(0, c - 1));
    }
  }

  if (isLoading) {
    return (
      <div className="fade-in">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface)]">
          <Link href="/wiki" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </Link>
          <div className="shimmer h-5 w-40 rounded-lg" />
        </div>
        <div className="p-4 space-y-4">
          <div className="shimmer h-8 rounded-xl" />
          <div className="shimmer h-4 w-3/4 rounded-lg" />
          <div className="shimmer h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="fade-in">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface)]">
          <Link href="/wiki" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </Link>
          <h1 className="text-[15px] font-bold text-[var(--color-text)]">記事が見つかりません</h1>
        </div>
        <div className="empty-state">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-primary)]/10 flex items-center justify-center mb-2">
            <BookOpen className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h3>この記事はまだ存在しません</h3>
          <p>みんなの声で体験を共有すると、AIが自動的に記事を作成します。</p>
          <Link href="/talk" className="btn-primary mt-6 inline-flex items-center gap-2" id="go-to-talk-from-wiki-detail">
            💬 みんなの声で話してみる
          </Link>
        </div>
      </div>
    );
  }

  const trust = getTrustLevel(entry.avg_trust_score);
  const freshness = getFreshness(entry.updated_at);

  return (
    <div className="fade-in pb-24">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface)]/95 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/wiki" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors" id="back-to-wiki">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold text-[var(--color-text)] truncate">{entry.title}</h1>
          <p className="text-[10px] text-[var(--color-subtle)]">{entry.category}</p>
        </div>
      </div>

      {/* Meta badges */}
      <div className="px-4 py-5">
        <div className="flex items-center flex-wrap gap-2 mb-4">
          <span className={`trust-badge ${trust.className}`}>
            <Shield className="w-3 h-3" />
            {trust.label}
          </span>
          <span className={`freshness-badge ${freshness.className}`}>
            <Clock className="w-3 h-3" />
            {freshness.label}
          </span>
          {entry.allergen_tags?.map((tag) => (
            <span key={tag} className="px-2.5 py-0.5 bg-[var(--color-surface-warm)] rounded-full text-[11px] font-medium text-[var(--color-text-secondary)]">
              {tag}
            </span>
          ))}
        </div>

        {/* Trust explanation */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[var(--color-surface-warm)] to-[var(--color-bg-warm)] border border-[var(--color-border-light)] mb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            </div>
            <span className="text-[12px] font-bold text-[var(--color-text)]">
              {entry.source_count}件の体験にもとづく情報です
            </span>
          </div>
          <p className="text-[10px] text-[var(--color-muted)] ml-9 leading-relaxed">{trust.desc}</p>
        </div>

        {/* Knowledge Ripple: Article Maturity */}
        {ripple && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-warm)] border border-[var(--color-border-light)] mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-[var(--color-text)]">{ripple.maturityLabel}</span>
              <span className="text-[10px] text-[var(--color-subtle)]">{ripple.ageInDays}日前に作成</span>
            </div>
            {/* Maturity bar */}
            <div className="h-1.5 rounded-full bg-[var(--color-border-light)] mb-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  ripple.maturityLevel === 'authoritative' ? 'bg-gradient-to-r from-amber-400 to-amber-500 w-full' :
                  ripple.maturityLevel === 'established' ? 'bg-gradient-to-r from-[var(--color-success)] to-emerald-400 w-3/4' :
                  ripple.maturityLevel === 'growing' ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] w-1/2' :
                  'bg-[var(--color-muted)] w-1/4'
                }`}
              />
            </div>
            {/* Contributors timeline */}
            {ripple.contributors.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[9px] text-[var(--color-subtle)] mr-1">貢献者:</span>
                {ripple.contributors.slice(0, 5).map((c, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-[var(--color-surface-warm)] rounded text-[9px] text-[var(--color-text-secondary)]">
                    {c.displayName}
                  </span>
                ))}
                {ripple.contributors.length > 5 && (
                  <span className="text-[9px] text-[var(--color-subtle)]">+{ripple.contributors.length - 5}人</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {entry.summary && (
          <p className="text-[14px] leading-[1.9] text-[var(--color-text-secondary)] mb-6">
            {entry.summary}
          </p>
        )}

        {/* Content */}
        {entry.sections && entry.sections.length > 0 ? (
          <div className="space-y-6 mb-6">
            {entry.sections.map((sec, i) => (
              <div key={i} className="card-elevated p-5">
                <h2 className="text-[16px] font-black tracking-tight mb-4 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                  <span className="w-1.5 h-4 bg-[var(--color-primary)] rounded-full inline-block"></span>
                  {sec.heading}
                </h2>
                <div className="space-y-4">
                  {sec.items.map((item, j) => (
                    <div key={j} className="p-4 rounded-2xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)]">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-[14px] font-bold text-[var(--color-text)] leading-tight">{item.title}</h3>
                        {item.is_recommended && (
                          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-1 rounded-full flex-shrink-0 shadow-sm">
                            👑 定番
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[var(--color-subtle)] leading-relaxed whitespace-pre-wrap">{item.content}</p>
                      
                      {/* Meta stats */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border-light)]/50">
                        {item.mention_count ? (
                          <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
                            <span className="text-[12px]">👥</span> {item.mention_count}人の声
                          </span>
                        ) : null}
                        {item.heat_score ? (
                          <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
                            <span className="text-[12px]">❤️</span> {item.heat_score}
                          </span>
                        ) : null}
                      </div>

                      {/* Extra context (Tips, reviews) */}
                      {Object.keys(item).map(k => {
                        if (['title', 'content', 'mention_count', 'heat_score', 'is_recommended'].includes(k)) return null;
                        const val = item[k];
                        if (Array.isArray(val) && val.length > 0) {
                           return (
                             <div key={k} className="mt-3 flex flex-wrap gap-2">
                               {val.map((v, tagIdx) => (
                                  <span key={tagIdx} className="px-2 py-1 bg-white rounded-md text-[11px] text-[var(--color-text-secondary)] border border-[var(--color-border-light)]">
                                    {String(v)}
                                  </span>
                               ))}
                             </div>
                           )
                        }
                        if (typeof val === 'string' || typeof val === 'number') {
                          return (
                            <p key={k} className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
                              <strong className="text-[var(--color-muted)] capitalize">{k.replace(/_/g, ' ')}:</strong> {String(val)}
                            </p>
                          )
                        }
                        return null;
                      })}
                      
                      {/* Topic Summoning Button */}
                      <Link 
                        href={`/talk/${talkSlug}?summon=${encodeURIComponent("【知恵袋から】" + sec.heading + "の「" + item.title + "」について、最新の体験や工夫を教えてください！")}`}
                        className="mt-4 block w-full py-2.5 rounded-xl bg-white text-[12px] font-bold text-center text-[var(--color-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors shadow-sm"
                      >
                        💬 この項目について最新の体験を聞く
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-elevated p-5 mb-6">
            {renderContentJson(entry.content_json, entry.category)}
          </div>
        )}

        {/* === Helpful Vote Button === */}
        <div className="mb-8 flex flex-col items-center">
          <button
            onClick={handleVoteHelpful}
            disabled={hasVotedHelpful}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold shadow-sm transition-all ${
              hasVotedHelpful
                ? "bg-rose-50 text-rose-500 border border-rose-200"
                : "bg-white text-[var(--color-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-warm)] active:scale-95"
            }`}
          >
            <span className="text-lg leading-none mt-[-2px]">👍</span>
            {hasVotedHelpful ? "役に立った！" : "この記事は役に立ちましたか？"}
            <span className={`ml-1 px-2.5 py-0.5 rounded-full text-[11px] ${hasVotedHelpful ? 'bg-rose-100 text-rose-600' : 'bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)]'}`}>
              {helpfulCount}
            </span>
          </button>
          {!hasVotedHelpful && (
            <p className="text-[10px] text-[var(--color-subtle)] mt-2.5">
              「役に立った」を押すと、情報を提供してくれた保護者のトラストスコアに還元されます ✨
            </p>
          )}
        </div>

        {/* Medical Disclaimer */}
        <div className="p-3.5 rounded-2xl bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20 mb-6">
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            ⚠️ この情報は保護者の体験に基づく参考情報です。<strong>医療的な判断は必ず主治医にご相談ください。</strong>
          </p>
        </div>

        {/* Sources Traceability */}
        {entry.wiki_sources && entry.wiki_sources.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[var(--color-subtle)]" />
              この知恵のもとになった声
            </h3>
            <div className="space-y-3">
              {entry.wiki_sources.map((src, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)]">
                   <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{src.original_message_snippet}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Summoning: Redirect explicitly to talk room */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[var(--color-surface-warm)] to-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div className="flex-1">
              <p className="text-[12px] text-[var(--color-text)] font-bold leading-snug">
                この知恵をもっと充実させませんか？
              </p>
              <p className="text-[10px] text-[var(--color-subtle)] mt-0.5">
                トークルームで体験をシェアすると、あなたの声がここに抽出されてみんなの役に立ちます。
              </p>
            </div>
          </div>
          <Link
            href={`/talk/${talkSlug}`}
            className="block mt-4 w-full text-center btn-primary !text-[13px] font-black !py-3 flex items-center justify-center gap-2"
            id="summon-topic"
          >
            <MessageCircle className="w-4 h-4" />
            このテーマについて話す
          </Link>
        </div>
      </div>
    </div>
  );
}
