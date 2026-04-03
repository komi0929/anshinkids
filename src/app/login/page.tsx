"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Leaf, MessageCircle, BookOpen, Sparkles, Shield, ArrowRight, Check } from "@/components/icons";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) setError(`認証エラー: ${urlError}`);
  }, []);

  function handleLineLogin() {
    setIsLoading(true);
    setError(null);

    try {
      const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
      if (!channelId) {
        throw new Error("LINE Channel ID not configured");
      }

      const state = crypto.randomUUID();
      localStorage.setItem("line_oauth_state", state);

      const redirectUri = `${window.location.origin}/auth/callback/line`;
      const params = new URLSearchParams({
        response_type: "code",
        client_id: channelId,
        redirect_uri: redirectUri,
        state,
        scope: "profile openid",
      });

      window.location.href = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
    } catch (err) {
      console.error("LINE Login error:", err);
      setError("LINEログインに失敗しました。しばらくしてからお試しください。");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "var(--color-bg)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo & Brand */}
          <div className="text-center mb-10 fade-in">
            <div className="w-20 h-20 mx-auto mb-5 rounded-[22px] flex items-center justify-center"
              style={{ background: "var(--color-primary)" }}>
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-[28px] font-black tracking-tight" style={{ color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
              あんしんキッズ
            </h1>
            <p className="text-[15px] font-medium mt-2" style={{ color: "var(--color-text-secondary)" }}>
              食物アレルギーの知恵を、みんなでつくる
            </p>
          </div>

          {/* Mission Statement */}
          <div className="mb-8 fade-in-delayed">
            <div className="card-elevated p-6">
              <p className="text-[15px] font-medium leading-[2] text-center" style={{ color: "var(--color-text-secondary)" }}>
                今日あなたが話した体験が、<br />
                明日どこかで悩んでいる親子の<br />
                <span className="font-extrabold text-[16px]" style={{ color: "var(--color-primary)" }}>
                  「希望の道しるべ」
                </span>
                <br />
                になります
              </p>
            </div>
          </div>

          {/* How it Works - 3 Steps */}
          <div className="mb-8 fade-in-delayed-2">
            <div className="grid grid-cols-3 gap-2 relative">
              {[
                { icon: <MessageCircle className="w-5 h-5" />, title: "話すだけ", sub: "気軽に" },
                { icon: <Sparkles className="w-5 h-5" />, title: "AIが編集", sub: "自働で抽出" },
                { icon: <BookOpen className="w-5 h-5" />, title: "知恵に", sub: "未来へ残す" },
              ].map((step, i) => (
                <div key={step.title} className="relative">
                  <div className="flex flex-col items-center justify-center gap-1.5 px-1 py-4 rounded-2xl h-full"
                    style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1"
                      style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
                      {step.icon}
                    </div>
                    <p className="text-[12px] font-bold whitespace-nowrap text-center" style={{ color: "var(--color-text)" }}>{step.title}</p>
                    <p className="text-[10px] font-medium whitespace-nowrap text-center" style={{ color: "var(--color-subtle)" }}>{step.sub}</p>
                  </div>
                  {i < 2 && (
                    <div className="absolute top-1/2 -right-2.5 transform -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center rounded-full" style={{ background: "var(--color-bg)" }}>
                      <ArrowRight size={12} style={{ color: "var(--color-muted)" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* LINE Login Button */}
          <div className="space-y-4 fade-in-delayed-2">
            <button
              onClick={handleLineLogin}
              disabled={isLoading}
              id="line-login-button"
              className="w-full py-4 px-6 rounded-2xl font-bold text-[16px] text-white flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#06C755", boxShadow: "0 3px 12px rgba(6, 199, 85, 0.25)" }}
            >
              <svg width="26" height="26" viewBox="0 0 120 120" fill="none">
                <path d="M60 8C30.2 8 6 28.1 6 52.7c0 22.1 19.6 40.6 46.1 44.1 1.8.4 4.2 1.2 4.8 2.7.6 1.4.4 3.5.2 4.9l-.8 4.7c-.2 1.4-1.1 5.3 4.6 2.9 5.8-2.5 31-18.3 42.3-31.3C112.3 70.7 114 62 114 52.7 114 28.1 89.8 8 60 8Z" fill="white"/>
                <g fill="#06C755">
                  <path d="M50.3 43.2h-3.5c-1 0-1.8.8-1.8 1.8v22.1c0 1 .8 1.8 1.8 1.8h3.5c1 0 1.8-.8 1.8-1.8V45c0-1-.8-1.8-1.8-1.8Z"/>
                  <path d="M71.2 43.2h-3.5c-1 0-1.8.8-1.8 1.8v13.1L55.4 43.8c-.1-.2-.3-.4-.5-.5h-4.1c-1 0-1.8.8-1.8 1.8v22.1c0 1 .8 1.8 1.8 1.8h3.5c1 0 1.8-.8 1.8-1.8V54l10.6 14.4c.3.4.7.6 1.2.6h3.5c1 0 1.8-.8 1.8-1.8V45c0-1-.9-1.8-1.8-1.8Z"/>
                  <path d="M40.6 62h-9.3V45c0-1-.8-1.8-1.8-1.8h-3.5c-1 0-1.8.8-1.8 1.8v22.1c0 .5.2.9.5 1.3.3.3.7.5 1.2.5H40.6c1 0 1.8-.8 1.8-1.8v-3.5c.1-.8-.7-1.6-1.8-1.6Z"/>
                  <path d="M95.7 50.1c1 0 1.8-.8 1.8-1.8V45c0-1-.8-1.8-1.8-1.8H82.2c-.5 0-.9.2-1.3.5-.3.3-.5.7-.5 1.2v22.1c0 .5.2.9.5 1.3.3.3.7.5 1.2.5h13.5c1 0 1.8-.8 1.8-1.8v-3.5c0-1-.8-1.8-1.8-1.8h-9.3v-3.4h9.3c1 0 1.8-.8 1.8-1.8v-3.5c0-1-.8-1.8-1.8-1.8h-9.3v-3.4h9.4Z"/>
                </g>
              </svg>
              {isLoading ? "接続中..." : "LINEでログイン"}
            </button>

            {error && (
              <div className="text-[14px] font-semibold p-4 rounded-xl text-center"
                style={{ color: "var(--color-danger)", background: "var(--color-danger-light)" }}
                role="alert">
                {error}
              </div>
            )}

            {/* Browse without login */}
            <Link
              href="/talk"
              id="browse-without-login"
              className="block w-full text-center py-3 text-[14px] font-bold transition-colors"
              style={{ color: "var(--color-primary)" }}
            >
              ログインせずに見てみる →
            </Link>
          </div>

          {/* Safety Points */}
          <div className="mt-6 p-5 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <h3 className="text-[14px] font-extrabold mb-4 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
              <Shield className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              安心してご利用ください
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                "匿名で参加できます",
                "投稿は自動消去されるので安心",
                "LINEの友だちには通知されません",
                "いつでも１タップで登録解除可能",
              ].map((text) => (
                <div key={text} className="flex items-center gap-2.5 p-3 rounded-xl whitespace-nowrap overflow-hidden"
                  style={{ background: "var(--color-surface-soft)" }}>
                  <Check size={14} className="flex-shrink-0" style={{ color: "var(--color-primary)" }} />
                  <span className="text-[12px] font-bold truncate" style={{ color: "var(--color-text-secondary)" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] font-bold" style={{ color: "var(--color-subtle)" }}>
            <Link href="/about" className="underline hover:no-underline transition-colors whitespace-nowrap">
              あんしんキッズとは
            </Link>
            <Link href="/terms" className="underline hover:no-underline transition-colors whitespace-nowrap">
              利用規約
            </Link>
            <Link href="/privacy" className="underline hover:no-underline transition-colors whitespace-nowrap">
              プライバシーポリシー
            </Link>
          </div>
          <p className="mt-2 text-center text-[11px] font-medium" style={{ color: "var(--color-muted)" }}>
            ログインすることで、利用規約・プライバシーポリシーに同意したものとみなします
          </p>
        </div>
      </div>
    </div>
  );
}
