import { getMyProfile, getMyContributions, getMyImpact } from "@/app/actions/mypage";
import NotificationsClient from "./notifications-client";

export const dynamic = "force-dynamic";

interface Notification {
  id: string;
  type: "thanks" | "wiki_extracted" | "impact_milestone" | "trust_up";
  message: React.ReactNode;
  dateStr: string;
  isRead: boolean;
  link?: string;
}

export default async function NotificationsPage() {
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
      message: "あんしんキッズへようこそ！「トークルーム」で体験を共有して、最初のヒントをつくりましょう。",
      dateStr: "システム通知",
      isRead: true,
      link: "/talk"
    });
  }

  return <NotificationsClient initialNotifications={notifs.reverse()} />;
}
