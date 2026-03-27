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

      // LINE Login via Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        const redirectUrl = `${supabaseUrl}/auth/v1/authorize?provider=line&redirect_to=${encodeURIComponent(window.location.origin + "/auth/callback")}`;
        window.location.href = redirectUrl;
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 5.64 2 10.11c0 4 3.22 7.35 7.56 8.14.29.06.69.19.79.43.09.22.06.56.03.78l-.13.77c-.04.22-.18.88.77.48s5.12-3.01 6.98-5.15C19.94 13.41 22 11.88 22 10.11 22 5.64 17.52 2 12 2zm-2.86 10.87H7.58a.41.41 0 0 1-.41-.41V8.92a.41.41 0 0 1 .82 0v3.13h1.15a.41.41 0 0 1 0 .82zm1.57-.41a.41.41 0 0 1-.82 0V8.92a.41.41 0 0 1 .82 0v3.54zm3.57 0a.41.41 0 0 1-.3.39.41.41 0 0 1-.44-.16l-1.59-2.16v1.93a.41.41 0 0 1-.82 0V8.92a.41.41 0 0 1 .3-.39.41.41 0 0 1 .44.16l1.59 2.16V8.92a.41.41 0 0 1 .82 0v3.54zm2.86-2.73a.41.41 0 0 1 0 .82h-1.15v.74h1.15a.41.41 0 0 1 0 .82H15.6a.41.41 0 0 1-.41-.41V8.92a.41.41 0 0 1 .41-.41h1.56a.41.41 0 0 1 0 .82h-1.15v.74h1.15a.41.41 0 0 1 0 .66z" />
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
