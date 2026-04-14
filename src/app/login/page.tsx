"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Check,
} from "@/components/icons";
import Image from "next/image";

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
    <div
      className="min-h-[100dvh] flex flex-col bg-[var(--color-bg)]"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="text-center mb-10 fade-in">
            <div className="w-20 h-20 mx-auto mb-5 bg-[var(--color-primary)] rounded-[32px] flex items-center justify-center shadow-[0_8px_24px_rgba(141,224,60,0.3)] overflow-hidden p-3">
              <Image src="/logo.png" alt="あんしんキッズ ロゴ" width={80} height={80} className="w-full h-full object-contain filter drop-shadow-sm brightness-0 invert" />
            </div>
            <h1
              className="text-[24px] font-extrabold tracking-tight text-[var(--color-text)]"
            >
              あんしんキッズ
            </h1>
            <p
              className="text-[13px] text-[var(--color-text-secondary)] mt-1 leading-relaxed"
            >
              食物アレルギーのヒントを、みんなでつくる
            </p>
          </div>

          {/* How it Works — Compact */}
          <div className="mb-8 fade-in" style={{ animationDelay: "100ms" }}>
            <div className="p-5 rounded-[32px] bg-white shadow-soft">
              <div className="flex items-center gap-2">
                {[
                  { icon: "💬", label: "体験を話す" },
                  { icon: "🤖", label: "AIが整理" },
                  { icon: "📖", label: "まとめに" },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-1 flex-1">
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-[18px] shadow-sm border border-[var(--color-border-light)]">
                        {step.icon}
                      </div>
                      <span className="text-[10px] font-extrabold text-[var(--color-subtle)] whitespace-nowrap">
                        {step.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <span className="text-[var(--color-muted)] text-[12px] opacity-50 flex-shrink-0 -mt-4">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LINE Login Button */}
          <div className="space-y-4 fade-in" style={{ animationDelay: "200ms" }}>
            <button
              onClick={handleLineLogin}
              disabled={isLoading}
              id="line-login-button"
              className="w-full py-4 px-6 rounded-full font-bold text-[16px] text-white flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-primary)",
                boxShadow: "0 8px 24px rgba(6, 199, 85, 0.25)",
              }}
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.348 0 .63.285.63.63v3.51h1.753c.348 0 .628.283.628.63 0 .344-.28.629-.628.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
                  fill="white"
                />
              </svg>
              {isLoading ? "接続中..." : "LINEでログイン"}
            </button>

            {error && (
              <div
                className="text-[13px] font-semibold p-3.5 rounded-xl text-center"
                style={{
                  color: "var(--color-danger)",
                  background: "var(--color-danger-light)",
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Browse without login */}
            <Link
              href="/talk"
              id="browse-without-login"
              className="block w-full text-center py-2.5 text-[14px] font-bold text-[var(--color-primary)] transition-colors"
            >
              ログインせずに見てみる →
            </Link>
          </div>

          {/* Safety Points */}
          <div
            className="mt-8 p-5 rounded-[32px] fade-in bg-white shadow-soft"
            style={{ animationDelay: "300ms" }}
          >
            <h3
              className="text-[13px] font-extrabold mb-3 flex items-center gap-2 text-[var(--color-text)]"
            >
              <Shield
                className="w-4 h-4 text-[var(--color-primary)]"
              />
              安心してご利用ください
            </h3>
            <div className="space-y-2">
              {[
                "匿名で参加できます",
                "投稿は自動消去されるので安心",
                "LINEの友だちには通知されません",
                "いつでも１タップで退会可能",
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-2"
                >
                  <Check
                    size={13}
                    className="flex-shrink-0 text-[var(--color-primary)]"
                  />
                  <span
                    className="text-[12px] font-medium text-[var(--color-text-secondary)]"
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal & About */}
          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] font-bold text-[var(--color-subtle)]"
          >
            <Link
              href="/about"
              className="underline hover:no-underline transition-colors whitespace-nowrap"
            >
              あんしんキッズとは
            </Link>
            <Link
              href="/terms"
              className="underline hover:no-underline transition-colors whitespace-nowrap"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="underline hover:no-underline transition-colors whitespace-nowrap"
            >
              プライバシーポリシー
            </Link>
          </div>
          <p
            className="mt-2 text-center text-[11px] font-medium pb-4 text-[var(--color-muted)]"
          >
            ログインすることで利用規約・プライバシーポリシーに同意したものとみなします
          </p>
        </div>
      </div>
    </div>
  );
}
