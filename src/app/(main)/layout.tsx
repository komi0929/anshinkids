"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, BookOpen, Sparkles, User } from "lucide-react";

const navItems = [
  { href: "/talk", icon: MessageCircle, label: "トーク" },
  { href: "/wiki", icon: BookOpen, label: "Wiki辞書" },
  { href: "/concierge", icon: Sparkles, label: "AI相談" },
  { href: "/mypage", icon: User, label: "マイページ" },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
        </div>
      </nav>
    </div>
  );
}
