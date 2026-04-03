"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Clock, User, MessageCircle, BookOpen, Bookmark, ArrowRight } from "@/components/icons";
// Users icon (not in shared yet, alias User)
const Users = User;
import { getWikiEntry, voteWikiHelpful, toggleSnippetBookmark, checkBookmarkedSnippets } from "@/app/actions/wiki";
import { getKnowledgeRipple } from "@/app/actions/discover";
import { Haptics } from "@/lib/haptics";
import { AudioHaptics } from "@/lib/audio-haptics";
import { triggerSensoryBurst } from "@/components/ui/SensoryEffects";
import { motion, useScroll, useSpring } from "framer-motion";

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
  if (score >= 70) return { label: "定番情報", className: "trust-high", desc: "たくさんの保護者から共感されています" };
  if (score >= 40) return { label: "役立つヒント", className: "trust-medium", desc: "複数の体験からまとまりました" };
  return { label: "新しい声", className: "trust-low", desc: "まだ体験が集まりはじめたばかりです" };
}

function getFreshness(updatedAt: string) {
  const days = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 30) return { label: "最新", className: "fresh" };
  if (days <= 90) return { label: "1-3ヶ月前", className: "aging" };
  return { label: "要更新", className: "stale" };
}


export default function WikiDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [entry, setEntry] = useState<WikiEntryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

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
  const [bookmarkedSnippets, setBookmarkedSnippets] = useState<Set<string>>(new Set());

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

      const bookmarksRes = await checkBookmarkedSnippets(data.id);
      if (bookmarksRes.success && bookmarksRes.data) {
        setBookmarkedSnippets(new Set(bookmarksRes.data));
      }
    }
    setIsLoading(false);
  }

  async function handleVoteHelpful(event?: React.MouseEvent) {
    if (hasVotedHelpful || !entry) return;
    Haptics.success();
    if (event) {
      AudioHaptics.playPop();
      triggerSensoryBurst(event);
    }
    setHasVotedHelpful(true);
    setHelpfulCount(c => c + 1);
    const res = await voteWikiHelpful(entry.id);
    if (!res.success && res.error === "ログインが必要です") {
      alert("「役に立った」を送信するにはログインが必要です");
      setHasVotedHelpful(false);
      setHelpfulCount(c => Math.max(0, c - 1));
    }
  }

  async function handleToggleBookmark(title: string, content: string, event?: React.MouseEvent) {
    Haptics.light();
    if (event && !bookmarkedSnippets.has(title)) {
      AudioHaptics.playTink();
      triggerSensoryBurst(event);
    }
    if (!entry) return;
    
    const isBookmarked = bookmarkedSnippets.has(title);
    
    setBookmarkedSnippets(prev => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(title);
      else next.add(title);
      return next;
    });

    const res = await toggleSnippetBookmark(entry.id, title, content);
    if (!res.success) {
      if (res.error === "ログインが必要です") {
        alert("ブックマークするにはログインが必要です");
      }
      setBookmarkedSnippets(prev => {
        const next = new Set(prev);
        if (isBookmarked) next.add(title);
        else next.delete(title);
        return next;
      });
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
          <h1 className="text-[15px] font-bold text-[var(--color-text)] break-keep text-balance">記事が見つかりません</h1>
        </div>
        <div className="empty-state">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--color-surface-warm)] to-[var(--color-primary)]/10 flex items-center justify-center mb-2">
            <BookOpen className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h3>この記事はまだ存在しません</h3>
          <p>トークルームで体験を共有すると、AIが自動的に記事を作成します。</p>
          <Link href="/talk" className="btn-primary mt-6 inline-flex items-center gap-2" id="go-to-talk-from-wiki-detail">
            💬 トークルームで話してみる
          </Link>
        </div>
      </div>
    );
  }

  const trust = getTrustLevel(entry.avg_trust_score);
  const freshness = getFreshness(entry.updated_at);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[var(--color-surface)]">
      {/* Scroll Progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-success)] origin-left z-[100]"
        style={{ scaleX }}
      />
      {/* FAQSchema JSON-LD for AI Search & Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": entry.sections?.flatMap(sec => 
              sec.items.map(item => ({
                "@type": "Question",
                "name": item.title,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": item.content
                }
              }))
            ) || []
          })
        }}
      />
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-40">
        <Link href="/wiki" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors" id="back-to-wiki">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-bold text-[var(--color-text)] truncate break-keep text-balance">{entry.title}</h1>
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
                <span className="text-[9px] text-[var(--color-subtle)] mr-1">情報を提供してくれたママ・パパ:</span>
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

        {/* F10: Official Compass Widget (Static Baseline) */}
        <div className="p-4 rounded-[20px] bg-blue-50 border border-blue-100 flex flex-col gap-2 mb-5 fade-in shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-2 -translate-y-2">
            <span className="text-6xl">🏥</span>
          </div>
          <div className="flex items-center gap-1.5 relative z-10 mb-1">
            <span className="text-[16px]">👩‍⚕️</span>
            <h3 className="text-[13px] font-extrabold text-blue-900 tracking-tight break-keep text-balance">公式からの道しるべ</h3>
            <span className="ml-auto text-[9px] font-bold bg-white text-blue-600 px-2 py-0.5 rounded-full shadow-sm">最新ガイドライン</span>
          </div>
          <p className="text-[10px] text-blue-800 leading-relaxed font-medium relative z-10 mb-1">
            ※みんなの体験談を見る前に、国や学会が提供する基礎知識を確認できます。
          </p>
          <div className="relative z-10 flex flex-col gap-2 mt-1">
            <a href="https://allergyportal.jp/knowledge/food/" target="_blank" rel="noopener noreferrer" className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold text-blue-900 group-hover:text-blue-700 transition-colors">食物アレルギーの基礎知識</p>
                <p className="text-[10px] text-blue-500 mt-0.5">アレルギーポータル（日本アレルギー学会）</p>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

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
                <h2 className="text-[16px] font-black tracking-tight mb-4 flex items-center gap-2 break-keep text-balance" style={{ color: 'var(--color-primary)' }}>
                  <span className="w-1.5 h-4 bg-[var(--color-primary)] rounded-full inline-block"></span>
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
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={(e: React.MouseEvent) => handleToggleBookmark(item.title, item.content, e)}
                            className={`p-1.5 rounded-full transition-colors ${
                              bookmarkedSnippets.has(item.title)
                                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                : "bg-white text-[var(--color-subtle)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] border border-[var(--color-border-light)]"
                            }`}
                            aria-label="ブックマーク"
                          >
                            <Bookmark className={`w-4 h-4 ${bookmarkedSnippets.has(item.title) ? "fill-current" : ""}`} />
                          </motion.button>
                        </div>
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
                        href={`/talk/${talkSlug}?summon=${encodeURIComponent("【まとめ記事から】" + sec.heading + "の「" + item.title + "」について、最新の体験や工夫を教えてください！")}`}
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
          <div className="card-elevated p-5 mb-6 text-center">
            <p className="text-[13px] text-[var(--color-subtle)] italic leading-relaxed">
              情報は整理中です。<br/>トークルームで体験をお話しすると、AIがまとめ記事を作成してくれます。
            </p>
          </div>
        )}

        {/* === Helpful Vote Button === */}
        <div className="mb-8 flex flex-col items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e: React.MouseEvent) => handleVoteHelpful(e)}
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
          </motion.button>
          {!hasVotedHelpful && (
            <p className="text-[10px] text-[var(--color-subtle)] mt-2.5 px-4 text-center">
              「役に立った」を押すと、情報を提供してくれた保護者のマイページに「ありがとう」として届きます ✨
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
            <h3 className="text-[14px] font-extrabold text-[var(--color-text)] mb-3 flex items-center gap-2 break-keep text-balance">
              <MessageCircle className="w-4 h-4 text-[var(--color-subtle)]" />
              このヒントのもとになった声
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
                このヒントをもっと充実させませんか？
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
