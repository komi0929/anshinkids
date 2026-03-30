"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
const _ip = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Leaf = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 .5 20 .5s-1.5 7-5.5 11c-2 2-5 3-5 3" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>;
const MessageCircle = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const BookOpen = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const Sparkles = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M12 3l1.5 4.5H18l-3.5 2.7 1.3 4.3L12 12l-3.8 2.5 1.3-4.3L6 7.5h4.5z" /></svg>;
const ArrowRight = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
const Shield = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const Clock = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const Heart = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;

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
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* Hero Section with Gradient */}
      <div className="hero-gradient flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Logo & Brand */}
          <div className="text-center mb-6 fade-in">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] shadow-lg gradient-animate" />
              <div className="relative w-full h-full rounded-[24px] flex items-center justify-center">
                <Leaf className="w-10 h-10 text-white drop-shadow-sm" />
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] opacity-15 blur-lg -z-10" />
            </div>
            <h1 className="text-[26px] font-extrabold text-[var(--color-text)] tracking-tight">
              あんしんキッズ
            </h1>
            <p className="text-[13px] text-[var(--color-text-secondary)] mt-2 leading-relaxed">
              食物アレルギーの知恵を、みんなでつくる
            </p>
          </div>

          {/* Mission Statement - Emotional Core */}
          <div className="mb-6 fade-in-delayed">
            <div className="card-elevated p-5">
              <p className="text-[13px] text-[var(--color-text-secondary)] leading-[1.9] text-center">
                今日あなたが話した体験が、<br />
                明日どこかで悩んでいる親子の<br />
                <span className="font-bold text-[var(--color-primary)] text-[14px]">
                  「希望の道しるべ」
                </span>
                <br />
                になります
              </p>
            </div>
          </div>

          {/* How it Works - Visual Flow */}
          <div className="mb-6 fade-in-delayed-2">
            <div className="flex items-center gap-1 justify-center">
              <div className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] flex-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 flex items-center justify-center">
                  <MessageCircle className="w-4.5 h-4.5 text-[var(--color-primary)]" />
                </div>
                <p className="text-[10px] font-bold text-[var(--color-text)]">話すだけ</p>
                <p className="text-[9px] text-[var(--color-subtle)] leading-snug">気軽にひとこと</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--color-muted)] flex-shrink-0" />
              <div className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] flex-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-accent)]/5 flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-[var(--color-accent)]" />
                </div>
                <p className="text-[10px] font-bold text-[var(--color-text)]">AIが整理</p>
                <p className="text-[9px] text-[var(--color-subtle)] leading-snug">自動で抽出</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--color-muted)] flex-shrink-0" />
              <div className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] flex-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-success)]/10 to-[var(--color-success)]/5 flex items-center justify-center">
                  <BookOpen className="w-4.5 h-4.5 text-[var(--color-success)]" />
                </div>
                <p className="text-[10px] font-bold text-[var(--color-text)]">知恵になる</p>
                <p className="text-[9px] text-[var(--color-subtle)] leading-snug">未来の誰かへ</p>
              </div>
            </div>
          </div>

          {/* LINE Login Button */}
          <div className="space-y-3 fade-in-delayed-2">
            <button
              onClick={handleLineLogin}
              disabled={isLoading}
              id="line-login-button"
              className="w-full py-4 px-6 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              style={{ backgroundColor: "#06C755" }}
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
              <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] p-3 rounded-xl text-center" role="alert">
                {error}
              </div>
            )}

            {/* Browse without login */}
            <Link
              href="/talk"
              id="browse-without-login"
              className="block w-full text-center py-3 text-[13px] font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
            >
              ログインせずに見てみる →
            </Link>
          </div>

          {/* Safety Box - Compact & Trustworthy */}
          <div className="mt-5 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] shadow-sm">
            <h3 className="text-xs font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              安心してご利用ください
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Shield, text: "匿名で参加できます" },
                { icon: Clock, text: "投稿は24時間で自動削除" },
                { icon: Heart, text: "LINEの友だちリスト非アクセス" },
                { icon: Sparkles, text: "いつでもアカウント削除可能" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2 p-2 rounded-xl bg-[var(--color-surface-warm)]">
                  <Icon className="w-3 h-3 text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                  <span className="text-[10px] text-[var(--color-text-secondary)] leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Links */}
          <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-[var(--color-subtle)]">
            <Link href="/about" className="underline hover:text-[var(--color-primary)] transition-colors">
              あんしんキッズとは
            </Link>
            <span className="text-[var(--color-border)]">|</span>
            <Link href="/terms" className="underline hover:text-[var(--color-primary)] transition-colors">
              利用規約
            </Link>
            <span className="text-[var(--color-border)]">|</span>
            <Link href="/privacy" className="underline hover:text-[var(--color-primary)] transition-colors">
              プライバシーポリシー
            </Link>
          </div>
          <p className="mt-2 text-center text-[10px] text-[var(--color-muted)]">
            ログインすることで、利用規約・プライバシーポリシーに同意したものとみなします
          </p>
        </div>
      </div>
    </div>
  );
}
