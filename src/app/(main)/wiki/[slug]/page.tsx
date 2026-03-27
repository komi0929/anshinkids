"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Clock, Plus, Loader2, Check, Users, MessageCircle, X } from "lucide-react";
import { getWikiEntry, contributeToWiki } from "@/app/actions/wiki";

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
  allergen_tags: string[];
  avg_trust_score: number;
  source_count: number;
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

function renderContentJson(content: Record<string, unknown>): React.ReactNode {
  if (!content || Object.keys(content).length === 0) {
    return <p className="text-[13px] text-[var(--color-subtle)] italic">まだ詳細な情報はありません。「情報を追加」から体験を共有してください。</p>;
  }

  const sections: React.ReactNode[] = [];

  // Render raw_summary
  if (content.raw_summary && typeof content.raw_summary === "string") {
    sections.push(
      <div key="summary" className="mb-4">
        <p className="text-[14px] leading-relaxed text-[var(--color-text)]">{content.raw_summary}</p>
      </div>
    );
  }

  // Render items array
  if (Array.isArray(content.items)) {
    sections.push(
      <div key="items" className="mb-4">
        <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2">📋 情報一覧</h3>
        <ul className="space-y-2">
          {(content.items as Array<Record<string, unknown>>).map((item, i) => (
            <li key={i} className="p-3 rounded-xl bg-[var(--color-surface-warm)] text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              {typeof item === "string" ? item : (
                <>
                  {item.name && <span className="font-medium text-[var(--color-text)]">{String(item.name)}</span>}
                  {item.text && <span>{String(item.text)}</span>}
                  {item.description && <span className="block mt-0.5 text-[12px]">{String(item.description)}</span>}
                  {item.source && <span className="block mt-0.5 text-[10px] text-[var(--color-muted)]">出典: {String(item.source)}</span>}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Render tips array
  if (Array.isArray(content.tips)) {
    sections.push(
      <div key="tips" className="mb-4">
        <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2">💡 みんなの工夫</h3>
        <ul className="space-y-2">
          {(content.tips as Array<Record<string, unknown>>).map((tip, i) => (
            <li key={i} className="flex gap-2 p-3 rounded-xl bg-[var(--color-success-light)]/30 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              <span className="text-[var(--color-success)] flex-shrink-0">✓</span>
              <span>{typeof tip === "string" ? tip : String(tip.text || JSON.stringify(tip))}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Fallback for other keys
  const renderedKeys = new Set(["raw_summary", "items", "tips"]);
  const otherKeys = Object.keys(content).filter(k => !renderedKeys.has(k) && content[k]);
  if (otherKeys.length > 0 && sections.length === 0) {
    sections.push(
      <div key="other" className="mb-4">
        <pre className="text-[12px] text-[var(--color-text-secondary)] whitespace-pre-wrap bg-[var(--color-surface-warm)] p-3 rounded-xl overflow-x-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    );
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

  useEffect(() => {
    loadEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function loadEntry() {
    const result = await getWikiEntry(slug);
    if (result.success && result.data) {
      setEntry(result.data as unknown as WikiEntryData);
    }
    setIsLoading(false);
  }

  async function handleContribute() {
    if (!contribText.trim() || !entry) return;
    setIsSubmitting(true);
    const result = await contributeToWiki(entry.id, contribText);
    if (result.success) {
      setSubmitted(true);
      setContribText("");
      setTimeout(() => { setSubmitted(false); setShowContrib(false); loadEntry(); }, 2500);
    }
    setIsSubmitting(false);
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
          <div className="shimmer h-8 rounded-lg" />
          <div className="shimmer h-4 w-3/4 rounded-lg" />
          <div className="shimmer h-40 rounded-2xl" />
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
          <div className="text-5xl mb-2">📖</div>
          <h3>この記事はまだ存在しません</h3>
          <p>みんなの声で体験を共有すると、AIが自動的に記事を作成します。</p>
          <Link href="/talk" className="btn-primary mt-6 inline-flex items-center gap-2">
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
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface)] sticky top-0 z-40">
        <Link href="/wiki" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold text-[var(--color-text)] truncate">{entry.title}</h1>
          <p className="text-[10px] text-[var(--color-subtle)]">{entry.category}</p>
        </div>
      </div>

      {/* Meta badges */}
      <div className="px-4 py-4">
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
            <span key={tag} className="px-2 py-0.5 bg-[var(--color-surface-warm)] rounded-full text-[11px] text-[var(--color-text-secondary)]">
              {tag}
            </span>
          ))}
        </div>

        {/* Trust explanation */}
        <div className="p-3 rounded-xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)] mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3.5 h-3.5 text-[var(--color-subtle)]" />
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
              {entry.source_count}件の体験にもとづく情報です
            </span>
          </div>
          <p className="text-[10px] text-[var(--color-muted)]">{trust.desc}</p>
        </div>

        {/* Summary */}
        {entry.summary && (
          <p className="text-[14px] leading-relaxed text-[var(--color-text-secondary)] mb-6">
            {entry.summary}
          </p>
        )}

        {/* Content */}
        <div className="card p-5 mb-6">
          {renderContentJson(entry.content_json)}
        </div>

        {/* Medical Disclaimer */}
        <div className="p-3 rounded-xl bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20 mb-6">
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            ⚠️ この情報は保護者の体験に基づく参考情報です。<strong>医療的な判断は必ず主治医にご相談ください。</strong>
          </p>
        </div>

        {/* Sources Traceability */}
        {entry.wiki_sources && entry.wiki_sources.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[var(--color-subtle)]" />
              この知恵のもとになった声
            </h3>
            <div className="space-y-2">
              {entry.wiki_sources.slice(0, 5).map((source) => (
                <div key={source.id} className="p-3 rounded-xl bg-[var(--color-surface-warm)] text-[12px] text-[var(--color-text-secondary)]">
                  <p className="leading-relaxed line-clamp-2">「{source.original_message_snippet}」</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-1">
                    {new Date(source.extracted_at).toLocaleDateString("ja-JP")}に抽出
                  </p>
                </div>
              ))}
              {entry.wiki_sources.length > 5 && (
                <p className="text-[11px] text-[var(--color-subtle)] text-center">
                  他 {entry.wiki_sources.length - 5} 件の体験
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contribute */}
        {showContrib ? (
          <div className="card p-4 slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-[var(--color-text)]">✍️ 情報を追加する</h3>
              <button onClick={() => setShowContrib(false)} className="text-[var(--color-subtle)] hover:text-[var(--color-text)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            {submitted ? (
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
                  placeholder="例: うちの子は3歳で卵ボーロ1/8から始めました。最初は…"
                  className="input-field resize-none w-full"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-[var(--color-muted)]">きれいに書かなくて大丈夫です</span>
                  <button
                    onClick={handleContribute}
                    disabled={!contribText.trim() || isSubmitting}
                    className="btn-primary !py-1.5 !px-4 !text-[12px] disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (<><Loader2 className="w-3 h-3 animate-spin" /> AIが整理中...</>) : (<><Plus className="w-3 h-3" /> 追加する</>)}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowContrib(true)}
            className="w-full p-4 rounded-2xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-warm)] transition-all group"
          >
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 text-[var(--color-subtle)] group-hover:text-[var(--color-primary)] transition-colors" />
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors">
                この記事に情報を追加する ✨
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
