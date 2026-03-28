"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LineCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("LINE認証を処理中...");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");

      if (error) {
        setStatus(`認証エラー: ${error}`);
        setHasError(true);
        setTimeout(() => router.push("/login?error=" + encodeURIComponent(error)), 2000);
        return;
      }

      if (!code) {
        setStatus("認証コードがありません");
        setHasError(true);
        setTimeout(() => router.push("/login?error=no_code"), 2000);
        return;
      }

      // Verify state (CSRF protection)
      const storedState = localStorage.getItem("line_oauth_state");
      if (state !== storedState) {
        setStatus("セキュリティ検証に失敗しました");
        setHasError(true);
        setTimeout(() => router.push("/login?error=invalid_state"), 2000);
        return;
      }
      localStorage.removeItem("line_oauth_state");

      try {
        setStatus("LINEプロフィールを取得中...");

        // Call our API route to exchange code for token and create session
        const redirectUri = `${window.location.origin}/auth/callback/line`;
        const response = await fetch("/api/auth/line", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirectUri }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "認証に失敗しました");
        }

        setStatus("ログイン中...");

        // Set session directly using the tokens from the API
        const supabase = createClient();
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionError) {
          console.error("Session set error:", sessionError);
          throw new Error("セッションの確立に失敗しました");
        }

        setStatus("ログイン完了！リダイレクト中...");

        // Full page reload to ensure proxy processes session cookies
        // (router.push uses soft navigation which skips the proxy)
        await new Promise((resolve) => setTimeout(resolve, 500));

        window.location.href = "/talk";
      } catch (err) {
        console.error("LINE callback error:", err);
        const message = err instanceof Error ? err.message : "認証に失敗しました";
        setStatus(`エラー: ${message}`);
        setHasError(true);
        setTimeout(() => router.push("/login?error=" + encodeURIComponent(message)), 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)]">
      <div
        className={`w-20 h-20 mb-6 rounded-2xl flex items-center justify-center ${
          hasError ? "bg-red-500" : "bg-[#06C755] animate-pulse"
        }`}
      >
        {hasError ? (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="40" height="40" viewBox="0 0 120 120" fill="none">
            <path
              d="M60 8C30.2 8 6 28.1 6 52.7c0 22.1 19.6 40.6 46.1 44.1 1.8.4 4.2 1.2 4.8 2.7.6 1.4.4 3.5.2 4.9l-.8 4.7c-.2 1.4-1.1 5.3 4.6 2.9 5.8-2.5 31-18.3 42.3-31.3C112.3 70.7 114 62 114 52.7 114 28.1 89.8 8 60 8Z"
              fill="white"
            />
          </svg>
        )}
      </div>
      <p className={`font-medium ${hasError ? "text-red-500" : "text-[var(--color-text)]"}`}>
        {status}
      </p>
      {hasError && (
        <p className="text-[var(--color-subtle)] text-sm mt-2">
          ログイン画面に戻ります...
        </p>
      )}
    </div>
  );
}
