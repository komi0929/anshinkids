"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Leaf } from "lucide-react";
import { askConcierge } from "@/app/actions/concierge";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ConciergePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsLoading(true);

    const result = await askConcierge(sessionId, question);

    if (result.success && result.data) {
      setSessionId(result.data.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.data!.answer },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "申し訳ございません。一時的にAIが応答できない状態です。しばらくしてからお試しください 🙇",
        },
      ]);
    }
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="page-header border-b border-[var(--color-border-light)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-success)] to-[var(--color-primary)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text)]">
              AIコンシェルジュ
            </h1>
            <p className="text-[11px] text-[var(--color-subtle)]">
              アプリ内の一次情報のみをもとに回答します
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-success-light)] to-[var(--color-surface-warm)] flex items-center justify-center mb-6">
              <Leaf className="w-10 h-10 text-[var(--color-success)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">
              お悩みをお聞かせください
            </h2>
            <p className="text-[13px] text-[var(--color-subtle)] leading-relaxed mb-8 max-w-sm">
              あんしんキッズのAI辞書に蓄積された当事者の一次情報をもとに、
              可能性のある選択肢を優しくお伝えします。
            </p>

            {/* Suggestion chips */}
            <div className="space-y-2 w-full max-w-sm">
              {[
                "卵クラス4の3歳児ですが、負荷試験はいつ頃始められますか？",
                "乳アレルギーでも食べられる市販のパンはありますか？",
                "保育園の給食対応をお願いするコツを教えてください",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left p-3 card text-[13px] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] transition-colors"
                >
                  💬 {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} fade-in`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-success)] to-[var(--color-primary)] flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`chat-bubble ${msg.role}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-success)] to-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="chat-bubble assistant">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-1">
        <p className="text-[10px] text-center text-[var(--color-muted)]">
          AIの回答は医療アドバイスではありません。必ず主治医にご相談ください。
        </p>
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex gap-3 items-end max-w-lg mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="お悩みを入力してください..."
            className="input-field flex-1 resize-none max-h-32"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn-primary !p-3 !rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
