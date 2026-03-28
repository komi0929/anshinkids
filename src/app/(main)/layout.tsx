"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, BookOpen, Sparkles, User, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/talk", icon: MessageCircle, label: "トーク" },
  { href: "/wiki", icon: BookOpen, label: "知恵袋" },
  { href: "/concierge", icon: Sparkles, label: "AI相談" },
  { href: "/mypage", icon: User, label: "マイページ" },
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
        if (!cancelled) setIsLoggedIn(!!user);
      } catch {
        if (!cancelled) setIsLoggedIn(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [pathname]);

  return (
    <div className="min-h-screen pb-20">
      {children}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {/* Show login button if not authenticated */}
          {isLoggedIn === false && (
            <Link
              href="/login"
              className="nav-item"
              style={{ color: "var(--color-primary)" }}
            >
              <LogIn />
              <span>ログイン</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
