"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Leaf,
  MessageCircle,
  BookOpen,
  Sparkles,
  Shield,
  ArrowRight,
  Check,
} from "@/components/icons";

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
      className="min-h-[100dvh] flex flex-col"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo & Brand */}
          <div className="text-center mb-10 fade-in">
            <div
              className="w-20 h-20 mx-auto mb-5 rounded-[22px] flex items-center justify-center"
              style={{ background: "var(--color-primary)" }}
            >
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <h1
              className="text-[28px] font-black tracking-tight break-keep text-balance"
              style={{
                color: "var(--color-text)",
                fontFamily: "var(--font-display)",
              }}
            >
              あんしんキッズ
            </h1>
            <p
              className="text-[15px] font-medium mt-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              食物アレルギーの知恵を、みんなでつくる
            </p>
          </div>

          {/* Mission Statement */}
          <div className="mb-8 fade-in-delayed">
            <div className="card-elevated p-6">
              <p
                className="text-[15px] font-medium leading-[2] text-center"
                style={{ color: "var(--color-text-secondary)" }}
              >
                今日あなたが話した体験が、
                <br />
                明日どこかで悩んでいる親子の
                <br />
                <span
                  className="font-extrabold text-[16px]"
                  style={{ color: "var(--color-primary)" }}
                >
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
                {
                  icon: <MessageCircle className="w-5 h-5" />,
                  title: "話すだけ",
                  sub: "気軽に",
                },
                {
                  icon: <Sparkles className="w-5 h-5" />,
                  title: "AIが編集",
                  sub: "自働で抽出",
                },
                {
                  icon: <BookOpen className="w-5 h-5" />,
                  title: "知恵に",
                  sub: "未来へ残す",
                },
              ].map((step, i) => (
                <div key={step.title} className="relative">
                  <div
                    className="flex flex-col items-center justify-center gap-1.5 px-1 py-4 rounded-2xl h-full"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-1"
                      style={{
                        background: "var(--color-primary-bg)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {step.icon}
                    </div>
                    <p
                      className="text-[12px] font-bold whitespace-nowrap text-center"
                      style={{ color: "var(--color-text)" }}
                    >
                      {step.title}
                    </p>
                    <p
                      className="text-[10px] font-medium whitespace-nowrap text-center"
                      style={{ color: "var(--color-subtle)" }}
                    >
                      {step.sub}
                    </p>
                  </div>
                  {i < 2 && (
                    <div
                      className="absolute top-1/2 -right-2.5 transform -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center rounded-full"
                      style={{ background: "var(--color-bg)" }}
                    >
                      <ArrowRight
                        size={12}
                        style={{ color: "var(--color-muted)" }}
                      />
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
              style={{
                backgroundColor: "#06C755",
                boxShadow: "0 3px 12px rgba(6, 199, 85, 0.25)",
              }}
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                width="24"
                height="24"
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
                className="text-[14px] font-semibold p-4 rounded-xl text-center"
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
              className="block w-full text-center py-3 text-[14px] font-bold transition-colors"
              style={{ color: "var(--color-primary)" }}
            >
              ログインせずに見てみる →
            </Link>
          </div>

          {/* Safety Points */}
          <div
            className="mt-6 p-5 rounded-2xl"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3
              className="text-[14px] font-extrabold mb-4 flex items-center gap-2 break-keep text-balance"
              style={{ color: "var(--color-text)" }}
            >
              <Shield
                className="w-4 h-4"
                style={{ color: "var(--color-primary)" }}
              />
              安心してご利用ください
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                "匿名で参加できます",
                "投稿は自動消去されるので安心",
                "LINEの友だちには通知されません",
                "いつでも１タップで登録解除可能",
              ].map((text) => (
                <div
                  key={text}
                  className="flex items-center gap-2.5 p-3 rounded-xl whitespace-nowrap overflow-hidden"
                  style={{ background: "var(--color-surface-soft)" }}
                >
                  <Check
                    size={14}
                    className="flex-shrink-0"
                    style={{ color: "var(--color-primary)" }}
                  />
                  <span
                    className="text-[12px] font-bold truncate"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] font-bold"
            style={{ color: "var(--color-subtle)" }}
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
            className="mt-2 text-center text-[11px] font-medium"
            style={{ color: "var(--color-muted)" }}
          >
            ログインすることで、利用規約・プライバシーポリシーに同意したものとみなします
          </p>
        </div>
      </div>
    </div>
  );
}
