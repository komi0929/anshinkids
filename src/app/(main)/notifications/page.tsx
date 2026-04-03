"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Heart, BookOpen, ArrowLeft, ArrowUpRight, TrendingUp, Sparkles } from "@/components/icons";
import { getMyProfile, getMyContributions, getMyImpact } from "@/app/actions/mypage";

interface Notification {
  id: string;
  type: "thanks" | "wiki_extracted" | "impact_milestone" | "trust_up";
  message: React.ReactNode;
  dateStr: string;
  isRead: boolean;
  link?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true);
      try {
        const [profileRes, contribRes, impactRes] = await Promise.all([
          getMyProfile(),
          getMyContributions(),
          getMyImpact()
        ]);

        const notifs: Notification[] = [];
        let idCounter = 1;

        if (profileRes.success && profileRes.data) {
          const p = profileRes.data as unknown as { total_thanks_received: number; trust_score: number };
          if (p.total_thanks_received > 0) {
            notifs.push({
              id: `notif-${idCounter++}`,
              type: "thanks",
              message: <span>あなたの投稿に合計 <strong className="text-[var(--color-heart)]">{p.total_thanks_received}回</strong> の「ありがとう」が届いています！</span>,
              dateStr: "最近の活動",
              isRead: false,
              link: "/talk"
            });
          }
          if (p.trust_score > 30) {
            notifs.push({
              id: `notif-${idCounter++}`,
              type: "trust_up",
              message: <span>あなたの体験が多くの親御さんの参考になっています。<strong className="text-[var(--color-warning)]">ありがとうございます！</strong></span>,
              dateStr: "継続的な活動",
              isRead: true,
              link: "/mypage"
            });
          }
        }

        if (impactRes.success && impactRes.data) {
          const impact = impactRes.data as unknown as { totalHelpfulVotes: number };
          if (impact.totalHelpfulVotes > 0) {
            notifs.push({
              id: `notif-${idCounter++}`,
              type: "impact_milestone",
              message: <span>あなたの声が、これまでに <strong className="text-[var(--color-primary)]">{impact.totalHelpfulVotes}人</strong> の親に読まれて役に立ちました。</span>,
              dateStr: "累積インパクト",
              isRead: true,
              link: "/mypage"
            });
          }
        }

        if (contribRes.success && contribRes.data) {
          const contribs = contribRes.data as unknown as { extracted_at: string; wiki_entries?: { title: string, slug: string } }[];
          // Take the latest 3 extracted to wiki
          contribs.slice(0, 3).forEach((c) => {
            notifs.push({
              id: `notif-${idCounter++}`,
              type: "wiki_extracted",
              message: <span>あなたのお声がAIによって整理され、まとめ記事 <strong className="text-[var(--color-success)]">「{c.wiki_entries?.title || "新しい記事"}」</strong> に採用されました 🌱</span>,
              dateStr: new Date(c.extracted_at).toLocaleDateString("ja-JP"),
              isRead: false,
              link: c.wiki_entries ? `/wiki/${c.wiki_entries.slug}` : "/wiki"
            });
          });
        }

        if (notifs.length === 0) {
          notifs.push({
            id: "welcome",
            type: "impact_milestone",
            message: "あんしんキッズへようこそ！「みんなの声」で体験を共有して、最初の知恵をつくりましょう。",
            dateStr: "システム通知",
            isRead: true,
            link: "/talk"
          });
        }

        setNotifications(notifs.sort(() => -1)); // just inverse basically to show mostly recent first conceptually
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  function getIcon(type: Notification["type"]) {
    switch (type) {
      case "thanks": return <div className="w-10 h-10 rounded-full bg-[var(--color-heart-light)] flex items-center justify-center text-[var(--color-heart)]"><Heart className="w-5 h-5" /></div>;
      case "wiki_extracted": return <div className="w-10 h-10 rounded-full bg-[var(--color-success-light)] flex items-center justify-center text-[var(--color-success)]"><BookOpen className="w-5 h-5" /></div>;
      case "impact_milestone": return <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]"><Sparkles className="w-5 h-5" /></div>;
      case "trust_up": return <div className="w-10 h-10 rounded-full bg-[var(--color-warning-light)]00 flex items-center justify-center text-[var(--color-warning)]"><TrendingUp className="w-5 h-5" /></div>;
    }
  }

  return (
    <div className="fade-in pb-4">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-40">
        <Link href="/mypage" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors active:scale-95">
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-warm)] flex items-center justify-center shadow-sm">
            <Bell className="w-4 h-4 text-[var(--color-text)]" />
          </div>
          <h1 className="text-[15px] font-bold text-[var(--color-text)] break-keep text-balance">お知らせ・通知</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="shimmer h-20 rounded-2xl" />)
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className={`card p-4 transition-all ${notif.isRead ? 'opacity-80' : 'border-[var(--color-primary)]/20 shadow-sm bg-[var(--color-surface)]'}`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 relative">
                  {getIcon(notif.type)}
                  {!notif.isRead && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FF5B5B] border-2 border-[var(--color-surface)] rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--color-text)] leading-[1.6]">{notif.message}</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-1.5">{notif.dateStr}</p>
                </div>
              </div>
              {notif.link && (
                <div className="mt-3 text-right">
                  <Link href={notif.link} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-warm)] text-[11px] font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)] hover:text-[var(--color-primary)] transition-colors">
                    詳細を見る <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
