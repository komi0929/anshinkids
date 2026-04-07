"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bookmark, MessageCircle } from "@/components/icons";
import { getWikiEntry, voteWikiHelpful, toggleSnippetBookmark, checkBookmarkedSnippets } from "@/app/actions/wiki";
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
  const [bookmarkedSnippets, setBookmarkedSnippets] = useState<Set<string>>(new Set());
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [showSourcesFor, setShowSourcesFor] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    getWikiEntry(slug).then(result => {
      if (result.success && result.data) {
        setEntry(result.data);
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
      if (isBookmarked) {
        next.delete(title);
      } else {
        next.add(title);
      }
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
          {entry.title.replace("【みんなの知恵袋】", "").trim()}
        </h1>
        <p className="text-[15px] leading-relaxed text-gray-600 mb-8">
          {entry.summary}
        </p>



        {/* Sticky Section Navigation */}
        {entry.sections && entry.sections.length > 1 && (
          <div className="sticky top-[73px] z-30 -mx-5 px-5 py-3 mb-8 bg-white/95 backdrop-blur-md border-b border-gray-100 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-2">
            {entry.sections.map((sec: any, i: number) => (
              <button 
                onClick={() => scrollToSection(sec.heading)} 
                key={i} 
                className="px-4 py-2 rounded-full bg-gray-50 hover:bg-[var(--color-primary)]/10 text-[13px] font-bold text-gray-600 hover:text-[var(--color-primary)] transition-colors border border-gray-200"
              >
                {sec.heading}
              </button>
            ))}
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
                {sec.items.map((item: any, j: number) => {
                  const cleanTitle = typeof item.title === 'string' ? item.title.replace(/\[NEW\]|🆕/ig, '').trim() : item.title;
                  const cleanContent = typeof item.content === 'string' ? item.content.replace(/\[NEW\]|🆕/ig, '').trim() : item.content;
                  
                  const isValidData = (v: any) => v && v !== "null" && v !== "なし" && v !== "不明" && v !== "N/A";
                  
                  const tipsArray = Array.isArray(item.tips) ? item.tips.filter(isValidData) : [];
                  const timelineArray = Array.isArray(item.timeline) ? item.timeline : [];
                  const reviewsArray = Array.isArray(item.reviews) ? item.reviews : [];
                  const phrasesArray = Array.isArray(item.negotiation_phrases) ? item.negotiation_phrases.filter(isValidData) : (Array.isArray(item.encouraging_words) ? item.encouraging_words.filter(isValidData) : []);
                  const documentsArray = Array.isArray(item.documents_needed) ? item.documents_needed.filter(isValidData) : [];
                  
                  const hasSummaryBadge = isValidData(item.result) || isValidData(item.duration) || isValidData(item.child_age) || isValidData(item.allergen);

                  // Keep track of keys we've rendered specially so they don't appear in the generic tags
                  const handledKeys = ['title', 'content', 'mention_count', 'heat_score', 'is_recommended', 'allergen_free', 'source_topics', 'tips', 'timeline', 'reviews', 'negotiation_phrases', 'encouraging_words', 'documents_needed', 'result', 'duration', 'child_age', 'allergen'];

                  return (
                    <article key={j} className="group relative bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:border-[var(--color-primary)]/30 transition-all flex flex-col gap-5">
                      
                      {/* Milestone & Challenge Top Summary */}
                      {hasSummaryBadge && (
                        <div className="flex flex-wrap gap-2 text-[12px] font-black items-center mb-1">
                          {isValidData(item.allergen) && <span className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full flex gap-1 items-center">🎉 {item.allergen}</span>}
                          {isValidData(item.child_age) && <span className="bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full">👦 年齢: {item.child_age}</span>}
                          {isValidData(item.duration) && <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">⏱️ 期間: {item.duration}</span>}
                          {isValidData(item.result) && <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full">📝 結果: {item.result}</span>}
                        </div>
                      )}

                      {/* Allergen Free Badges */}
                      {Array.isArray(item.allergen_free) && item.allergen_free.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.allergen_free.filter(isValidData).map((tag: string) => (
                            <span key={`allergen-${tag}`} className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-bold border border-emerald-100">
                              ✅ {tag}不使用
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <h3 className="text-[18px] font-black text-gray-900 leading-[1.4] break-keep text-balance">
                          {cleanTitle}
                        </h3>
                        {item.is_recommended && (
                           <span className="px-2 py-1 text-[10px] font-black text-rose-600 bg-rose-50 rounded-lg uppercase tracking-wider mt-0.5 shrink-0 border border-rose-100">⭐ 定番</span>
                        )}
                      </div>
                      
                      {cleanContent && (
                        <p className="text-[15px] font-medium text-gray-700 leading-[1.8] whitespace-pre-wrap">
                          {cleanContent}
                        </p>
                      )}

                      {/* Timeline UI for Challenges */}
                      {timelineArray.length > 0 && (
                        <div className="bg-gray-50/80 rounded-2xl p-5 mt-2">
                          <p className="text-[12px] font-black text-gray-400 mb-4 tracking-wider uppercase">経過タイムライン</p>
                          <div className="flex flex-col gap-4 relative">
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
                            {timelineArray.map((step: any, idx: number) => (
                              <div key={idx} className="relative pl-8 flex flex-col">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-emerald-400 z-10 shadow-sm"></div>
                                <span className="text-[13px] font-black text-gray-800 mb-0.5">{step.phase}</span>
                                <span className="text-[13px] font-medium text-gray-600 leading-relaxed">{step.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reviews UI for Products / Eating Out */}
                      {reviewsArray.length > 0 && (
                        <div className="flex flex-col gap-3 mt-2">
                          {reviewsArray.map((rev: any, idx: number) => (
                            <div key={idx} className="bg-white border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-2xl p-4 flex flex-col gap-2">
                              <div className="flex items-center gap-1 text-[13px]">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className={i < (rev.rating || 4) ? "text-amber-400" : "text-gray-200"}>★</span>
                                ))}
                                {isValidData(rev.duration) && <span className="ml-2 text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">使用: {rev.duration}</span>}
                              </div>
                              {isValidData(rev.comment) && <p className="text-[13px] font-bold text-gray-700 leading-relaxed">{rev.comment}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Speech Bubbles for Phrases / Encouraging Words */}
                      {phrasesArray.length > 0 && (
                        <div className="flex flex-col gap-3 mt-2 pl-2">
                          {phrasesArray.map((phrase: string, idx: number) => (
                            <div key={idx} className="relative bg-sky-50 text-sky-800 p-4 rounded-b-2xl rounded-tr-2xl text-[14px] font-bold leading-relaxed shadow-sm max-w-[90%] self-start">
                               <div className="absolute top-0 -left-2 w-3 h-3 bg-sky-50" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}></div>
                               💬 「{phrase}」
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Checklist for Documents */}
                      {documentsArray.length > 0 && (
                        <div className="bg-white border border-violet-100 shadow-sm rounded-2xl p-4 mt-2">
                           <p className="text-[12px] font-black text-violet-400 mb-3 flex items-center gap-1">📋 必要な書類</p>
                           <ul className="flex flex-col gap-2">
                             {documentsArray.map((doc: string, idx: number) => (
                               <li key={idx} className="flex items-start gap-2 text-[14px] font-bold text-gray-700">
                                 <span className="text-violet-500 mt-0.5">☑</span> {doc}
                               </li>
                             ))}
                           </ul>
                        </div>
                      )}

                      {/* Tips Dedicated Block */}
                      {tipsArray.length > 0 && (
                        <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl flex flex-col gap-1.5 mt-2">
                           <span className="text-[11px] font-black flex items-center gap-1 opacity-80"><MessageCircle className="w-3 h-3" /> 工夫・コツ</span>
                           <ul className="list-disc list-inside text-[13px] font-bold leading-relaxed">
                             {tipsArray.map((tip: string, idx: number) => <li key={idx}>{tip}</li>)}
                           </ul>
                        </div>
                      )}

                      {/* Generic Custom Metadata Tags (Fallbacks) */}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.keys(item).map(k => {
                          if (handledKeys.includes(k)) return null;
                          const fieldMeta = FIELD_LABELS[k];
                          const val = item[k];
                          if (!fieldMeta || fieldMeta.type === 'skip' || !val) return null;
                          
                          if (fieldMeta.type === 'tags' && Array.isArray(val)) {
                            return val.filter(isValidData).map((v: unknown, tagIdx: number) => (
                              <span key={`${k}-${tagIdx}`} className="px-3 py-1.5 bg-gray-50 rounded-xl text-[12px] font-bold text-gray-600 border border-gray-200 flex items-center gap-1">
                                {fieldMeta.label}: {String(v)}
                              </span>
                            ));
                          }
                          if (fieldMeta.type === 'text' && isValidData(val)) {
                            const displayVal = typeof val === 'boolean' ? (val ? 'あり' : 'なし') : String(val);
                            return (
                              <span key={k} className="px-3 py-1.5 bg-gray-50 rounded-xl text-[12px] font-bold text-gray-600 border border-gray-200 flex items-center gap-1">
                                {fieldMeta.label}: <span className="text-gray-900">{displayVal}</span>
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>

                      {/* Actions Footer */}
                      <div className="mt-2 pt-4 border-t border-gray-50 flex items-center justify-between">
                         <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                           {Array.isArray(item.source_topics) && item.source_topics.length > 0 && (
                             <button 
                               onClick={() => setShowSourcesFor(showSourcesFor === item.title ? null : item.title)}
                               className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full shadow-sm transition-all"
                             >
                               <MessageCircle className="w-3 h-3" /> 元の話題を見る
                             </button>
                           )}
                         </div>
                         <div className="flex items-center gap-1">
                           <button
                              onClick={() => handleItemLike(item.title)}
                              className={`text-[12px] font-bold flex items-center gap-1 px-3 py-2 rounded-full transition-colors ${likedItems.has(item.title) ? 'text-rose-500 bg-rose-50 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
                           >
                              {likedItems.has(item.title) ? "❤️ 共感した" : "🤍 共感"}
                           </button>
                           <button
                              onClick={(e) => handleToggleBookmark(item.title, item.content, e)}
                              className={`p-2 rounded-full transition-colors ${bookmarkedSnippets.has(item.title) ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
                           >
                              <Bookmark className={`w-4 h-4 ${bookmarkedSnippets.has(item.title) ? 'fill-current' : ''}`} />
                           </button>
                         </div>
                      </div>

                      {/* Sources Expanded State */}
                      {showSourcesFor === item.title && Array.isArray(item.source_topics) && (
                        <div className="p-4 bg-[var(--color-surface-warm)] rounded-2xl border border-[var(--color-border-light)] slide-up">
                           <p className="text-[11px] font-bold text-gray-400 mb-3 flex items-center gap-1">
                             <MessageCircle className="w-3 h-3" /> トークルームの実体験をみる
                           </p>
                           <div className="flex flex-col gap-2">
                             {item.source_topics.map((topic: any, idx: number) => (
                               <Link key={idx} href={`/talk/${slug.replace('mega-', '')}/${topic.id}`} className="block text-[13px] font-bold text-[var(--color-primary)] hover:underline truncate py-1.5 px-3 bg-white rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
                                 ↗ {topic.title}
                               </Link>
                             ))}
                           </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-[12px] font-bold text-gray-400 mb-4">この記事が役に立ちましたか？</p>
          <button
            disabled={hasVotedHelpful}
            onClick={() => { setHasVotedHelpful(true); voteWikiHelpful(entry.id); Haptics.success(); }}
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all duration-300 ${hasVotedHelpful ? 'bg-rose-500 text-white shadow-[0_8px_30px_rgba(244,63,94,0.3)] scale-105' : 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-105 active:scale-95'}`}
          >
            {hasVotedHelpful ? "🎉 投票しました！" : "👍 役に立った！"}
          </button>
          <p className="text-[11px] text-gray-400 mt-6 leading-relaxed max-w-sm mx-auto">
            ※このWikiは保護者の実体験をもとにAIが抽出した情報です。医療的な判断は必ず主治医にご相談ください。
          </p>
        </div>
      </main>
    </div>
  );
}
