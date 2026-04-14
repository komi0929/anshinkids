"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, User, LogIn, Bell, Settings } from "@/components/icons";

const navItems = [
  { href: "/talk", label: "テーマ一覧", Icon: MessageCircle },
  { href: "/notifications", label: "通知", Icon: Bell },
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
    <div className={`min-h-[100dvh] ${isTalkDetail ? "" : "pb-[100px]"} max-w-md mx-auto relative bg-[var(--color-bg)] shadow-[0_0_40px_rgba(0,0,0,0.03)]`}>
      {children}

      {/* Bottom Navigation */}
      {!isTalkDetail && (
        <nav className="bottom-nav flex justify-between items-center px-4" id="main-navigation" role="navigation" aria-label="メインナビゲーション">
          {navItems.map((item) => {
            // Hide notifications & mypage for logged-out users
            if ((item.href === "/mypage" || item.href === "/notifications") && isLoggedIn === false) {
              return null;
            }

            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item flex flex-col items-center gap-1 p-2 flex-1 ${isActive ? "active" : ""}`}
                id={`nav-${item.href.slice(1)}`}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <item.Icon size={22} className={isActive ? "scale-110 transition-transform" : "transition-transform"} />
                <span className="text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
          {isLoggedIn === false && (
            <Link
              href="/login"
              className="nav-item flex flex-col items-center gap-1 p-2 flex-1 text-[var(--color-primary)]"
              id="nav-login"
              aria-label="ログイン"
            >
              <LogIn size={22} />
              <span className="text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap">ログイン</span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
