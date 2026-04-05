"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Bookmark, MessageCircle } from "@/components/icons";
import { getWikiEntry, voteWikiHelpful, toggleSnippetBookmark, checkBookmarkedSnippets, getRelatedWikiEntries } from "@/app/actions/wiki";
import { getKnowledgeRipple } from "@/app/actions/discover";
import { Haptics } from "@/lib/haptics";
import { AudioHaptics } from "@/lib/audio-haptics";
import { triggerSensoryBurst } from "@/components/ui/SensoryEffects";
import { motion, useScroll, useSpring } from "framer-motion";

const FIELD_LABELS: Record<string, { label: string; icon: string; type: "tags" | "text" | "skip" }> = {
  allergen_free: { label: "除去", icon: "", type: "tags" },
  where_to_buy: { label: "買える場所", icon: "", type: "tags" },
  safe_items: { label: "安全", icon: "", type: "tags" },
  tips: { label: "工夫", icon: "", type: "tags" },
  brand: { label: "メーカー", icon: "", type: "text" },
  reviews: { label: "レビュー", icon: "", type: "skip" },
  child_age: { label: "年齢", icon: "", type: "text" },
  result: { label: "結果", icon: "", type: "text" },
  skin_type: { label: "肌質", icon: "", type: "text" },
  usage: { label: "使い方", icon: "", type: "text" },
  duration: { label: "期間", icon: "", type: "text" },
  allergen: { label: "対象", icon: "", type: "text" },
  allergy_menu: { label: "メニュー", icon: "", type: "text" },
  negotiation_phrases: { label: "フレーズ", icon: "", type: "tags" },
  documents_needed: { label: "書類", icon: "", type: "tags" },
  coping_strategies: { label: "対処法", icon: "", type: "tags" },
  encouraging_words: { label: "励まし", icon: "", type: "tags" },
  timeline: { label: "経過", icon: "", type: "skip" },
};

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

export default function WikiDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [entry, setEntry] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVotedHelpful, setHasVotedHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [bookmarkedSnippets, setBookmarkedSnippets] = useState<Set<string>>(new Set());
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [showSourcesFor, setShowSourcesFor] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    getWikiEntry(slug).then(result => {
      if (result.success && result.data) {
        setEntry(result.data);
        setHelpfulCount(result.data.helpful_count || 0);
        checkBookmarkedSnippets(result.data.id).then(b => {
          if (b.success && b.data) setBookmarkedSnippets(new Set(b.data));
        });
      }
      setIsLoading(false);
    });
  }, [slug]);

  const scrollToSection = useCallback((heading: string) => {
    const el = sectionRefs.current[heading];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleItemLike = useCallback((itemTitle: string) => {
    if (likedItems.has(itemTitle)) return;
    Haptics.light();
    setLikedItems(prev => new Set(prev).add(itemTitle));
  }, [likedItems]);

  async function handleToggleBookmark(title: string, content: string, event?: React.MouseEvent) {
    Haptics.light();
    const isBookmarked = bookmarkedSnippets.has(title);
    if (event && !isBookmarked) {
      AudioHaptics.playTink();
      triggerSensoryBurst(event);
    }
    
    setBookmarkedSnippets(prev => {
      const next = new Set(prev);
      isBookmarked ? next.delete(title) : next.add(title);
      return next;
    });
    await toggleSnippetBookmark(entry.id, title, content);
  }

  if (isLoading) return <div className="p-8 text-center text-[var(--color-muted)]">Now Loading...</div>;
  if (!entry) return <div className="p-8 text-center text-[var(--color-muted)]">Not Found</div>;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FDFCFB] selection:bg-rose-100">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-[var(--color-primary)] origin-left z-50" style={{ scaleX }} />
      
      {/* Minimal Header */}
      <div className="px-5 py-4 flex items-center justify-between sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <Link href="/wiki" className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">{entry.category}</span>
        <div className="w-10"></div>
      </div>

      <main className="px-5 py-8 max-w-2xl mx-auto w-full">
        {/* Title Area */}
        <h1 className="text-[28px] font-black tracking-tight text-gray-900 leading-tight mb-4 break-keep text-balance">
          {entry.title}
        </h1>
        <p className="text-[15px] leading-relaxed text-gray-600 mb-8">
          {entry.summary}
        </p>

        {/* Official Guideline Minimal Banner */}
        <a href="https://allergyportal.jp/knowledge/food/" target="_blank" rel="noopener noreferrer" className="block mb-10 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-[13px] font-bold text-blue-800 hover:bg-blue-50 transition-colors flex items-center justify-between group">
          <span className="flex items-center gap-2">
            🏥 <span className="group-hover:underline">国や学会が提供する基礎知識はこちら</span>
          </span>
        </a>

        {/* Table of Contents */}
        {entry.sections && entry.sections.length > 1 && (
          <div className="mb-12">
            <p className="text-[12px] font-bold text-gray-400 mb-3">目次</p>
            <div className="flex flex-col gap-2">
              {entry.sections.map((sec: any, i: number) => (
                <button onClick={() => scrollToSection(sec.heading)} key={i} className="text-left text-[15px] font-bold text-gray-700 hover:text-[var(--color-primary)] transition-colors py-1">
                  {i + 1}. {sec.heading}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actual Content Document */}
        <div className="space-y-16">
          {entry.sections?.map((sec: any, i: number) => (
            <section key={i} ref={(el) => { sectionRefs.current[sec.heading] = el; }} className="scroll-mt-24">
              <h2 className="text-[22px] font-black text-gray-900 mb-8 pb-4 border-b-2 border-gray-100 break-keep leading-tight">
                {sec.heading}
              </h2>
              
              <div className="space-y-10">
                {sec.items.map((item: any, j: number) => (
                  <article key={j} className="group relative pl-4 border-l-2 border-gray-100 hover:border-[var(--color-primary)]/40 transition-colors">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-[17px] font-bold text-gray-900 leading-snug break-keep text-balance">
                        {item.title}
                      </h3>
                      {item.is_recommended && (
                         <span className="px-2 py-0.5 text-[9px] font-black text-rose-600 bg-rose-50 rounded uppercase tracking-wider mb-0.5">定番</span>
                      )}
                    </div>
                    
                    <p className="text-[15px] font-medium text-gray-700 leading-[1.8] whitespace-pre-wrap">
                      {item.content}
                    </p>

                    {/* Minimal Metadata Tags */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.keys(item).map(k => {
                        if (['title', 'content', 'mention_count', 'heat_score', 'is_recommended', 'allergen_free', 'source_topics'].includes(k)) return null;
                        const fieldMeta = FIELD_LABELS[k];
                        const val = item[k];
                        if (!fieldMeta || fieldMeta.type === 'skip' || !val) return null;
                        if (fieldMeta.type === 'tags' && Array.isArray(val) && val.length > 0) {
                          return val.map((v: unknown, tagIdx: number) => (
                            <span key={`${k}-${tagIdx}`} className="px-2 py-1 bg-gray-100 rounded text-[11px] font-bold text-gray-500">
                              {fieldMeta.label}: {String(v)}
                            </span>
                          ));
                        }
                        if (fieldMeta.type === 'text') {
                          const displayVal = typeof val === 'boolean' ? (val ? 'あり' : 'なし') : String(val);
                          return (
                            <span key={k} className="px-2 py-1 bg-gray-100 rounded text-[11px] font-bold text-gray-500">
                              {fieldMeta.label}: {displayVal}
                            </span>
                          );
                        }
                        return null;
                      })}
                      {Array.isArray(item.allergen_free) && (item.allergen_free as string[]).length > 0 && (
                        (item.allergen_free as string[]).map((tag: string) => (
                          <span key={`allergen-${tag}`} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[11px] font-bold">
                            {tag}不使用
                          </span>
                        ))
                      )}
                    </div>

                    {/* Minimal Actions */}
                    <div className="mt-4 flex items-center justify-between">
                       <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                         {Array.isArray(item.source_topics) && item.source_topics.length > 0 && (
                           <button 
                             onClick={() => setShowSourcesFor(showSourcesFor === item.title ? null : item.title)}
                             className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-gray-600 bg-gray-50 px-2 py-1 rounded"
                           >
                             <MessageCircle className="w-3 h-3" /> 元の話題
                           </button>
                         )}
                       </div>
                       <div className="flex items-center gap-2">
                         <button
                            onClick={() => handleItemLike(item.title)}
                            className={`text-[12px] font-bold flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${likedItems.has(item.title) ? 'text-rose-500 bg-rose-50' : 'text-gray-400 hover:bg-gray-50'}`}
                         >
                            {likedItems.has(item.title) ? "❤️ 共感した" : "🤍 共感"}
                         </button>
                         <button
                            onClick={(e) => handleToggleBookmark(item.title, item.content, e)}
                            className={`p-1.5 rounded-full transition-colors ${bookmarkedSnippets.has(item.title) ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-gray-400 hover:bg-gray-50'}`}
                         >
                            <Bookmark className={`w-4 h-4 ${bookmarkedSnippets.has(item.title) ? 'fill-current' : ''}`} />
                         </button>
                       </div>
                    </div>

                    {/* Sources Expanded State */}
                    {showSourcesFor === item.title && Array.isArray(item.source_topics) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                         <p className="text-[10px] font-bold text-gray-400 mb-2">この体験が話されたトークルーム</p>
                         {item.source_topics.map((topic: any, idx: number) => (
                           <Link key={idx} href={`/talk/${slug.replace('mega-', '')}/${topic.id}`} className="block text-[12px] font-bold text-[var(--color-primary)] hover:underline truncate">
                             ↳ {topic.title}
                           </Link>
                         ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-[12px] font-bold text-gray-400 mb-4">この記事が役に立ちましたか？</p>
          <button
            disabled={hasVotedHelpful}
            onClick={(e) => { setHasVotedHelpful(true); voteWikiHelpful(entry.id); Haptics.success(); }}
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all ${hasVotedHelpful ? 'bg-rose-50 text-rose-500' : 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-105 active:scale-95'}`}
          >
            👍 {hasVotedHelpful ? "投票しました！" : "役に立った！"}
          </button>
          <p className="text-[11px] text-gray-400 mt-6 leading-relaxed max-w-sm mx-auto">
            ※このWikiは保護者の実体験をもとにAIが抽出した情報です。医療的な判断は必ず主治医にご相談ください。
          </p>
        </div>
      </main>
    </div>
  );
}
