"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, User, LogIn, Settings } from "@/components/icons";

const navItems = [
  { href: "/talk", label: "テーマ一覧", Icon: MessageCircle },
  { href: "/support", label: "サポート", Icon: Settings },
  { href: "/mypage", label: "マイページ", Icon: User },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        setIsLoggedIn(!!user);
      } catch {
        if (!cancelled) setIsLoggedIn(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  // Hide footer on topic detail pages (chat view)
  const isTalkDetail = /^\/talk\/[^/]+\/[^/]+/.test(pathname);

  return (
    <div className={`min-h-[100dvh] ${isTalkDetail ? "" : "pb-[72px]"} max-w-md mx-auto relative bg-[var(--color-bg)] shadow-md`}>
      {children}

      {/* Bottom Navigation */}
      {!isTalkDetail && (
        <nav className="bottom-nav" id="main-navigation" role="navigation" aria-label="メインナビゲーション">
          <div className="flex justify-around items-center max-w-lg mx-auto">
            {navItems.map((item) => {
              if (item.href === "/mypage" && isLoggedIn === false) {
                return null;
              }

              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  id={`nav-${item.href.slice(1)}`}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.Icon size={22} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {isLoggedIn === false && (
              <Link
                href="/login"
                className="nav-item"
                style={{ color: "var(--color-primary)" }}
                id="nav-login"
                aria-label="ログイン"
              >
                <LogIn size={22} />
                <span>ログイン</span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
