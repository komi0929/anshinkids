"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Leaf, MessageCircle, Plus, Check, Loader2, AlertTriangle, Phone, X, RefreshCw, Send } from "@/components/icons";
import { askConcierge, contributeFromConcierge, warmUpConcierge } from "@/app/actions/concierge";
import { InstantCopyButton } from "@/components/ui/InstantCopyButton";
import { checkContentSafety, EMERGENCY_GUIDANCE, calculateAnswerConfidence } from "@/lib/ai/safety-guard";

interface ChatMessage {
 role: "user" | "assistant";
 content: string;
 confidence?: {
 level: string;
 label: string;
 color: string;
 sourceCount: number;
 };
}

export default function ConciergeClient({ 
 initialAllergens, 
 initialIsGuest 
}: { 
 initialAllergens: string[], 
 initialIsGuest: boolean 
}) {
 const [messages, setMessages] = useState<ChatMessage[]>([]);
 const [input, setInput] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const [sessionId, setSessionId] = useState<string | null>(null);
 const [isGuest] = useState(initialIsGuest);
 const [isMounted, setIsMounted] = useState(false);
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const textareaRef = useRef<HTMLTextAreaElement>(null);

 const [allergens, setAllergens] = useState<Set<string>>(new Set(initialAllergens));

 useEffect(() => {
 try {
 const stored = sessionStorage.getItem("anshin_concierge_messages");
 if (stored) {
 const msgs = JSON.parse(stored);
 setTimeout(() => setMessages(msgs), 0);
 }
 const sid = sessionStorage.getItem("anshin_concierge_session");
 if (sid) {
 setTimeout(() => setSessionId(sid), 0);
 }
 } catch { /* empty */ }

 // Fallback logic for guests if server gave empty allergens
 if (initialAllergens.length === 0) {
 try {
 const loadedAllergens = new Set<string>();
 const stored = localStorage.getItem("anshin_user_preferences");
 if (stored) {
 const prefs = JSON.parse(stored);
 if (prefs.children) {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 prefs.children.forEach((c: any) => {
 (c.allergens || []).forEach((a: string) => loadedAllergens.add(a));
 (c.customAllergens || []).forEach((a: string) => loadedAllergens.add(a));
 });
 } else if (prefs.allergens) {
 prefs.allergens.forEach((a: string) => loadedAllergens.add(a));
 }
 }
 if (loadedAllergens.size > 0) {
 setTimeout(() => setAllergens(loadedAllergens), 0);
 }
 } catch { /* ignore */ }
 }
 
 setTimeout(() => setIsMounted(true), 0);
 }, [initialAllergens]);

 const [showContribPrompt, setShowContribPrompt] = useState<number | null>(null);
 const [isContributing, setIsContributing] = useState(false);
 const [contributedIndices, setContributedIndices] = useState<Set<number>>(new Set());
 const [showEmergency, setShowEmergency] = useState(false);

 useEffect(() => {
 if (messages.length > 0) {
 sessionStorage.setItem("anshin_concierge_messages", JSON.stringify(messages));
 }
 if (sessionId) {
 sessionStorage.setItem("anshin_concierge_session", sessionId);
 }
 }, [messages, sessionId]);

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 }, [messages]);

 function handleReset() {
 if (!confirm("相談履歴をリセットして、新しい話題を始めますか？")) return;
 setMessages([]);
 setSessionId(null);
 setContributedIndices(new Set());
 setShowContribPrompt(null);
 sessionStorage.removeItem("anshin_concierge_messages");
 sessionStorage.removeItem("anshin_concierge_session");
 }

 // eslint-disable-next-line @typescript-eslint/no-unused-vars
 async function handleSend() {
 if (!input.trim() || isLoading) return;

 const question = input.trim();
 const safety = checkContentSafety(question);
 if (safety.isEmergency) {
 setShowEmergency(true);
 }

 setInput("");
 setMessages((prev) => [...prev, { role: "user", content: question }]);
 setIsLoading(true);

 const contextPayload = typeof window !== "undefined" ? localStorage.getItem("anshin_user_preferences") : null;
 const result = await askConcierge(sessionId, question, contextPayload || undefined);

 if (result.success && result.data) {
 setSessionId(result.data.sessionId);
 const wikiSourceCount = result.data.wikiSourceCount ?? 0;
 const avgTrustScore = result.data.avgTrustScore ?? 0;
 const confidence = calculateAnswerConfidence(wikiSourceCount, avgTrustScore);

 setMessages((prev) => [
 ...prev,
 {
 role: "assistant",
 content: result.data!.answer,
 confidence: {
 level: confidence.level,
 label: confidence.label,
 color: confidence.color,
 sourceCount: confidence.sourceCount,
 },
 },
 ]);
 const nextIndex = messages.length;
 setTimeout(() => setShowContribPrompt(nextIndex), 1500);
 } else {
 setMessages((prev) => [
 ...prev,
 { role: "assistant", content: "申し訳ございません。一時的にAIが応答できない状態です。しばらくしてからお試しください 🙇" },
 ]);
 }
 setIsLoading(false);
 }

 async function handleContributeToWiki(userMessageIndex: number) {
 const userMsg = messages[userMessageIndex];
 if (!userMsg || userMsg.role !== "user") return;
 setIsContributing(true);
 const result = await contributeFromConcierge(userMsg.content);
 if (result.success) setContributedIndices((prev) => new Set(prev).add(userMessageIndex));
 setIsContributing(false);
 setShowContribPrompt(null);
 }

 return (
 <div className="flex flex-col h-full bg-[var(--color-bg)]">
 {/* Header */}
 <div className="page-header border-b border-[var(--color-border-light)] bg-[var(--color-surface)]/80 backdrop-blur-md flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center ">
 <Sparkles className="w-5 h-5 text-white" />
 </div>
 <div>
 <h1 className="text-[17px] font-extrabold text-[var(--color-text)] break-keep text-balance">AI相談 ✨</h1>
 <p className="text-[11px] text-[var(--color-subtle)]">みんなの体験をもとにAIがお答えします</p>
 </div>
 </div>
 
 {messages.length > 0 && (
 <button onClick={handleReset} className="w-9 h-9 flex justify-center items-center rounded-xl bg-[var(--color-surface-soft)] text-[var(--color-subtle)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors" title="最初から相談する" aria-label="セッションをリセット">
 <RefreshCw className="w-4 h-4" />
 </button>
 )}
 </div>

 {/* Messages */}
 <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
 {showEmergency && (
 <div className="p-4 rounded-2xl bg-[var(--color-danger-light)]0 border-2 border-red-300 mb-3 slide-up">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <AlertTriangle className="w-5 h-5 text-[var(--color-danger)]" />
 <h3 className="text-[14px] font-extrabold text-red-700 break-keep text-balance">{EMERGENCY_GUIDANCE.title}</h3>
 </div>
 <button onClick={() => setShowEmergency(false)} className="text-[var(--color-danger)] hover:text-[var(--color-danger)]"><X className="w-4 h-4" /></button>
 </div>
 <div className="space-y-1.5 mb-3">
 {EMERGENCY_GUIDANCE.steps.map((step, i) => (
 <p key={i} className="text-[12px] text-red-700 font-medium">{step}</p>
 ))}
 </div>
 <p className="text-[11px] text-[var(--color-danger)] font-bold">{EMERGENCY_GUIDANCE.important}</p>
 <a href="tel:119" className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-bold text-[14px]">
 <Phone className="w-5 h-5" /> 119番に電話する
 </a>
 </div>
 )}

 {messages.length === 0 && (
 <div className="flex flex-col items-center justify-center h-full text-center px-6 fade-in">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-success-light)] to-[var(--color-surface-soft)] flex items-center justify-center mb-4">
 <Leaf className="w-7 h-7 text-[var(--color-success)]" />
 </div>
 <h2 className="text-[17px] font-extrabold text-[var(--color-text)] mb-1 break-keep text-balance">なんでも聞いてね 🌿</h2>

 <p className="text-[12px] font-medium leading-relaxed mb-6 max-w-xs" style={{ color: 'var(--color-subtle)' }}>
 ⚠️ 医療アドバイスではありません。回答はみんなの体験に基づきます。
 </p>

 <div className="space-y-2.5 w-full max-w-sm">
 <p className="text-[10px] font-semibold text-[var(--color-subtle)] mb-1">💬 こんなことを聞いてみよう</p>
 {(() => {
 const defaults = [
 "3歳の誕生日にアレルギー対応ケーキを用意したいのですが、おすすめはありますか？",
 "乳アレルギーでも安心して食べられるパンを教えてください",
 "来月から保育園で給食が始まります。先生にどう伝えればいいですか？",
 ];
 
 if (!isMounted) return defaults;

 const personalized: string[] = [];
 if (allergens.has("卵") || allergens.has("egg")) personalized.push("卵アレルギーの3歳児ですが、食べられるケーキはありますか？");
 else if (allergens.has("乳") || allergens.has("milk")) personalized.push("乳アレルギーでも食べられるアイスクリームはありますか？");
 else personalized.push(defaults[0]);

 if (allergens.has("小麦") || allergens.has("wheat")) personalized.push("小麦アレルギーの子に米粉パンを作りたいのですが、おすすめのレシピは？");
 else personalized.push(defaults[1]);

 personalized.push(defaults[2]);
 return personalized;
 })().map((suggestion, i) => (
 <button
 key={suggestion}
 onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
 className="w-full text-left p-3.5 card text-[13px] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] transition-all group stagger-item"
 id={`suggestion-${i}`}
 aria-label={`質問例: ${suggestion}`}
 >
 <div className="flex items-center gap-3">
 <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-primary)]/8 to-[var(--color-primary)]/3 flex items-center justify-center flex-shrink-0">
 <MessageCircle className="w-3.5 h-3.5 text-[var(--color-primary)]" aria-hidden="true" />
 </div>
 <span className="leading-snug">{suggestion}</span>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {messages.map((msg, index) => (
 <div key={index}>
 <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} fade-in`}>
 {msg.role === "assistant" && (
 <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center mr-2 mt-1 flex-shrink-0 ">
 <Sparkles className="w-4 h-4 text-white" />
 </div>
 )}
 <div className={`chat-bubble ${msg.role}`}>
 <p className="whitespace-pre-wrap">{msg.content}</p>

 {msg.role === "assistant" && msg.confidence && (
 <div className="mt-3 pt-2.5 border-t border-[var(--color-border-light)]/50">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: msg.confidence.color }} />
 <span className="text-[10px] font-medium" style={{ color: msg.confidence.color }}>
 {msg.confidence.label}
 </span>
 </div>
 {msg.confidence.level === "insufficient" && (
 <p className="text-[10px] text-[var(--color-warning)] mt-1 leading-snug">
 ⚠️ まだ十分なデータがありません。トークルームで体験を共有すると、より正確な回答ができるようになります。
 </p>
 )}
 </div>
 )}
 </div>
 </div>

 {msg.role === "user" && !contributedIndices.has(index) && showContribPrompt === index && (
 <div className="flex justify-end mt-2 fade-in">
 <div className="max-w-[280px] p-3 rounded-2xl bg-gradient-to-r from-[var(--color-success-light)] to-[var(--color-surface-soft)] border border-[var(--color-success)]/15">
 <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed mb-2">
 💡 この相談内容を匿名で体験まとめに追加しますか？<br/>
 <span className="text-[10px] text-[var(--color-muted)]">他の同じ悩みの方の助けになります</span>
 </p>
 <div className="flex gap-2">
 <button onClick={() => handleContributeToWiki(index)} disabled={isContributing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-success)] text-white text-[11px] font-bold hover:opacity-90 transition-all disabled:opacity-50" id={`contrib-wiki-${index}`}>
 {isContributing ? <><Loader2 className="w-3 h-3 animate-spin" /> 追加中</> : <><Plus className="w-3 h-3" /> まとめに追加</>}
 </button>
 <button onClick={() => setShowContribPrompt(null)} className="px-3 py-1.5 rounded-xl text-[11px] text-[var(--color-subtle)] hover:bg-[var(--color-surface)] transition-all">今回はスキップ</button>
 </div>
 </div>
 </div>
 )}

 {msg.role === "user" && contributedIndices.has(index) && (
 <div className="flex justify-end mt-2 fade-in">
 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-success-light)] text-[var(--color-success-deep)]">
 <Check className="w-3 h-3" />
 <span className="text-[10px] font-bold">体験まとめに追加しました 🌿</span>
 </div>
 </div>
 )}
 </div>
 ))}

          {isLoading && (
            <div className="flex items-start gap-2 fade-in">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 relative">
                {/* Nani-style playful spinning ring behind the icon */}
                <div className="absolute inset-0 rounded-xl border-2 border-transparent border-t-[var(--color-primary)] border-l-[var(--color-success)] animate-spin opacity-50"></div>
                <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] opacity-20 rounded-xl absolute inset-0 animate-pulse"></div>
                <Sparkles className="w-4 h-4 text-[var(--color-primary-dark)] relative z-10" />
              </div>
              <div className="flex flex-col gap-1 items-start">
                <div className="chat-bubble assistant !bg-transparent !border-none !p-0 !shadow-none">
                  <span className="text-[12px] font-extrabold text-[var(--color-primary-dark)] animate-pulse flex items-center gap-1.5 px-3 py-2 bg-[var(--color-surface-soft)] rounded-xl">
                    <span className="text-xl">🤔</span> みんなの体験を引っ張り出しています...
                  </span>
                </div>
                {/* Nani-style Skeleton shape resembling the expected 3-choice answer */}
                <div className="mt-1 ml-1 space-y-2">
                  <div className="h-6 w-48 rounded-lg shimmer-nani opacity-40"></div>
                  <div className="h-4 w-32 rounded-md shimmer-nani opacity-30"></div>
                  <div className="h-4 w-40 rounded-md shimmer-nani opacity-20"></div>
                </div>
              </div>
            </div>
          )}
 <div ref={messagesEndRef} />
 </div>

 {/* Input */}
 <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)]/80 backdrop-blur-md p-4 safe-bottom">
 {isGuest ? (
 <div className="flex flex-col items-center justify-center py-2 text-center">
 <span className="text-2xl mb-1">🔒</span>
 <p className="text-[13px] font-bold text-[var(--color-text)] mb-3">個別相談はメンバー専用機能です</p>
 <Link href="/login" className="btn-primary !text-[12px] !py-2.5 px-6 rounded-full">
 ログインして相談する
 </Link>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-2 text-center">
 <span className="text-2xl mb-1">🔒</span>
 <p className="text-[13px] font-extrabold text-[var(--color-text)] mb-2">AI相談はデータ蓄積中（準備中）です</p>
 <p className="text-[11px] font-medium text-[var(--color-subtle)] max-w-xs leading-relaxed">
 安全で正確な回答を提供するため、コミュニティの実体験が十分に集まるまでAIへの新規相談を一時ロックしています。
 </p>
 </div>
 )}
 </div>
 </div>
 );
}
