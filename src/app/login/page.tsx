"use client";

import { useState } from "react";
import { Leaf, MessageCircle, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLineLogin() {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "custom:line" as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error("LINE Login error:", err);
      setError("LINEログインに失敗しました。しばらくしてからお試しください。");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-[var(--color-success)] to-[var(--color-primary)] flex items-center justify-center shadow-lg">
            <Leaf className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            あんしんキッズ
          </h1>
          <p className="text-[13px] text-[var(--color-subtle)] mt-2 leading-relaxed">
            食物アレルギーの一次情報を
            <br />
            安心して共有・検索できる場所
          </p>
        </div>

        {/* North Star Story */}
        <div className="mb-8 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] shadow-sm">
          <p className="text-[12px] text-[var(--color-text-secondary)] leading-[1.8] text-center mb-4">
            あなたの体験が、誰かの
            <span className="font-bold text-[var(--color-primary)]">「希望の道しるべ」</span>
            になります
          </p>
          <div className="flex gap-2">
            <div className="flex-1 p-2.5 rounded-xl bg-[var(--color-surface-warm)] text-center">
              <MessageCircle className="w-5 h-5 mx-auto mb-1 text-[var(--color-primary)]" />
              <p className="text-[10px] font-medium text-[var(--color-text)]">話すだけ</p>
              <p className="text-[9px] text-[var(--color-subtle)] mt-0.5">気軽にひとこと</p>
            </div>
            <div className="flex items-center text-[var(--color-muted)] text-[10px]">→</div>
            <div className="flex-1 p-2.5 rounded-xl bg-[var(--color-surface-warm)] text-center">
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-[var(--color-primary)]" />
              <p className="text-[10px] font-medium text-[var(--color-text)]">AIが整理</p>
              <p className="text-[9px] text-[var(--color-subtle)] mt-0.5">自動で抽出</p>
            </div>
            <div className="flex items-center text-[var(--color-muted)] text-[10px]">→</div>
            <div className="flex-1 p-2.5 rounded-xl bg-[var(--color-surface-warm)] text-center">
              <BookOpen className="w-5 h-5 mx-auto mb-1 text-[var(--color-success)]" />
              <p className="text-[10px] font-medium text-[var(--color-text)]">知恵になる</p>
              <p className="text-[9px] text-[var(--color-subtle)] mt-0.5">未来の誰かへ</p>
            </div>
          </div>
        </div>

        {/* LINE Login Button */}
        <button
          onClick={handleLineLogin}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          style={{ backgroundColor: "#06C755" }}
        >
          <svg width="28" height="28" viewBox="0 0 120 120" fill="none">
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
          <div className="mt-4 text-sm text-[var(--color-danger)] bg-red-50 p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Safety Box */}
        <div className="mt-6 p-4 rounded-xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)]">
          <h3 className="text-xs font-semibold text-[var(--color-text)] mb-2">🔒 安心してご利用ください</h3>
          <ul className="text-[11px] text-[var(--color-subtle)] space-y-1.5 leading-relaxed">
            <li>• LINEの友だちリストへのアクセスは行いません</li>
            <li>• 投稿は24時間で自動的にリセットされます</li>
            <li>• 匿名のニックネームで参加できます</li>
            <li>• アカウント削除はいつでも可能です</li>
          </ul>
        </div>

        {/* Legal Links */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-[var(--color-subtle)]">
          <Link href="/terms" className="underline hover:text-[var(--color-primary)]">
            利用規約
          </Link>
          <span>|</span>
          <Link href="/privacy" className="underline hover:text-[var(--color-primary)]">
            プライバシーポリシー
          </Link>
        </div>
        <p className="mt-3 text-center text-[10px] text-[var(--color-muted)]">
          ログインすることで、利用規約・プライバシーポリシーに同意したものとみなします
        </p>
      </div>
    </div>
  );
}
