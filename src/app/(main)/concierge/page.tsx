"use client";

import { useState, useRef, useEffect } from "react";
const _ip = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Send = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
const Sparkles = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M12 3l1.5 4.5H18l-3.5 2.7 1.3 4.3L12 12l-3.8 2.5 1.3-4.3L6 7.5h4.5z" /></svg>;
const Leaf = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 .5 20 .5s-1.5 7-5.5 11c-2 2-5 3-5 3" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>;
const MessageCircle = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const Plus = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const Check = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><polyline points="20 6 9 17 4 12" /></svg>;
const Loader2 = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" /></svg>;
const AlertTriangle = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const Phone = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const X = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
import { askConcierge, contributeFromConcierge } from "@/app/actions/concierge";
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

export default function ConciergePage() {
  // Restore session from sessionStorage (survives page reload within same tab)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Restore session from sessionStorage on mount (avoids hydration mismatch)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("anshin_concierge_messages");
      if (stored) setMessages(JSON.parse(stored));
      const sid = sessionStorage.getItem("anshin_concierge_session");
      if (sid) setSessionId(sid);
    } catch { /* empty */ }
  }, []);

  // Gap 4: Contribution prompt
  const [showContribPrompt, setShowContribPrompt] = useState<number | null>(null);
  const [isContributing, setIsContributing] = useState(false);
  const [contributedIndices, setContributedIndices] = useState<Set<number>>(new Set());

  // === F2: Emergency banner ===
  const [showEmergency, setShowEmergency] = useState(false);

  // Persist session to sessionStorage
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

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const question = input.trim();

    // === F2: Emergency detection ===
    const safety = checkContentSafety(question);
    if (safety.isEmergency) {
      setShowEmergency(true);
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsLoading(true);

    const result = await askConcierge(sessionId, question);

    if (result.success && result.data) {
      setSessionId(result.data.sessionId);

      // === F4: Calculate answer confidence ===
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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="page-header border-b border-[var(--color-border-light)] bg-[var(--color-surface)]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[17px] font-extrabold text-[var(--color-text)]">AI相談 ✨</h1>
            <p className="text-[11px] text-[var(--color-subtle)]">みんなの体験をもとにAIがお答えします</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* === F2: Emergency Banner === */}
        {showEmergency && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 mb-3 slide-up">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-[14px] font-extrabold text-red-700">{EMERGENCY_GUIDANCE.title}</h3>
              </div>
              <button onClick={() => setShowEmergency(false)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1.5 mb-3">
              {EMERGENCY_GUIDANCE.steps.map((step, i) => (
                <p key={i} className="text-[12px] text-red-700 font-medium">{step}</p>
              ))}
            </div>
            <p className="text-[11px] text-red-600 font-bold">{EMERGENCY_GUIDANCE.important}</p>
            <a href="tel:119" className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-bold text-[14px]">
              <Phone className="w-5 h-5" /> 119番に電話する
            </a>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-success-light)] to-[var(--color-surface-warm)] flex items-center justify-center shadow-sm mb-4">
              <Leaf className="w-7 h-7 text-[var(--color-success)]" />
            </div>
            <h2 className="text-[17px] font-extrabold text-[var(--color-text)] mb-1">なんでも聞いてね 🌿</h2>

            {/* Single compact disclaimer */}
            <p className="text-[12px] font-medium leading-relaxed mb-6 max-w-xs" style={{ color: 'var(--color-subtle)' }}>
              ⚠️ 医療アドバイスではありません。回答はみんなの体験に基づきます。
            </p>

            <div className="space-y-2.5 w-full max-w-sm">
              <p className="text-[10px] font-semibold text-[var(--color-subtle)] mb-1">💬 こんなことを聞いてみよう</p>
              {(() => {
                // Personalize suggestions based on onboarding preferences
                const defaults = [
                  "3歳の誕生日にアレルギー対応ケーキを用意したいのですが、おすすめはありますか？",
                  "乳アレルギーでも安心して食べられるパンを教えてください",
                  "来月から保育園で給食が始まります。先生にどう伝えればいいですか？",
                ];
                try {
                  const stored = typeof window !== "undefined" ? localStorage.getItem("anshin_user_preferences") : null;
                  if (!stored) return defaults;
                  const prefs = JSON.parse(stored);
                  const allergens: string[] = prefs.allergens || [];

                  const personalized: string[] = [];
                  if (allergens.includes("egg")) personalized.push("卵アレルギーの3歳児ですが、食べられるケーキはありますか？");
                  else if (allergens.includes("milk")) personalized.push("乳アレルギーでも食べられるアイスクリームはありますか？");
                  else personalized.push(defaults[0]);

                  if (allergens.includes("wheat")) personalized.push("小麦アレルギーの子に米粉パンを作りたいのですが、おすすめのレシピは？");
                  else personalized.push(defaults[1]);

                  personalized.push(defaults[2]);
                  return personalized;
                } catch { return defaults; }
              })().map((suggestion, i) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                  className="w-full text-left p-3.5 card text-[13px] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-warm)] transition-all group stagger-item"
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`chat-bubble ${msg.role}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* === F4: AI Confidence Badge === */}
                {msg.role === "assistant" && msg.confidence && (
                  <div className="mt-3 pt-2.5 border-t border-[var(--color-border-light)]/50">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: msg.confidence.color }} />
                      <span className="text-[10px] font-medium" style={{ color: msg.confidence.color }}>
                        {msg.confidence.label}
                      </span>
                    </div>
                    {msg.confidence.level === "insufficient" && (
                      <p className="text-[10px] text-amber-600 mt-1 leading-snug">
                        ⚠️ まだ十分なデータがありません。トークルームで体験を共有すると、より正確な回答ができるようになります。
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Gap 4: Contribute prompt */}
            {msg.role === "user" && !contributedIndices.has(index) && showContribPrompt === index && (
              <div className="flex justify-end mt-2 fade-in">
                <div className="max-w-[280px] p-3 rounded-2xl bg-gradient-to-r from-[var(--color-success-light)] to-[var(--color-surface-warm)] border border-[var(--color-success)]/15">
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed mb-2">
                    💡 この相談内容を匿名で知恵袋に追加しますか？<br/>
                    <span className="text-[10px] text-[var(--color-muted)]">他の同じ悩みの方の助けになります</span>
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => handleContributeToWiki(index)} disabled={isContributing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-success)] text-white text-[11px] font-bold hover:opacity-90 transition-all disabled:opacity-50" id={`contrib-wiki-${index}`}>
                      {isContributing ? <><Loader2 className="w-3 h-3 animate-spin" /> 追加中</> : <><Plus className="w-3 h-3" /> 知恵袋に追加</>}
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
                  <span className="text-[10px] font-bold">知恵袋に追加しました 🌿</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="chat-bubble assistant">
              <div className="flex gap-1.5 py-1">
                <div className="w-2 h-2 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>



      {/* Input */}
      <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)]/95 backdrop-blur-sm p-4 safe-bottom">
        <div className="flex gap-3 items-end max-w-lg mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="お悩みを入力してください..."
            className="input-field flex-1 resize-none max-h-32"
            rows={1}
            id="concierge-input"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading} className="btn-primary !p-3 !rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0" id="concierge-send">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
