import { getMyProfile, getMyContributions, getMyImpact } from "@/app/actions/mypage";
import { getImpactFeedback, getContributionStreak } from "@/app/actions/discover";
import NotificationsClient from "./notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [profileRes, contribRes, impactRes, impactFeedbackRes, streakRes] = await Promise.all([
    getMyProfile().catch(() => ({ success: false as const, data: null })),
    getMyContributions().catch(() => ({ success: true, data: [] })),
    getMyImpact().catch(() => ({ success: true, data: null })),
    getImpactFeedback().catch(() => ({ success: false, data: null })),
    getContributionStreak().catch(() => ({ success: false, data: null })),
  ]);

  // Build profile stats
  const profile = profileRes.success ? profileRes.data as unknown as {
    total_contributions: number;
    total_thanks_received: number;
    trust_score: number;
  } : null;

  // Build impact data
  const impact = impactFeedbackRes.success ? impactFeedbackRes.data as unknown as {
    articlesHelped: number;
    thanks: number;
    trustScore: number;
    recentImpacts?: {
      title: string;
      slug: string;
      category: string;
      snippet: string;
      trustScore: number;
      extractedAt: string;
    }[];
  } : null;

  // Build streak
  const streak = streakRes.success ? streakRes.data as unknown as {
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
  } : null;

  // Build contributions
  const contributions = contribRes.success ? contribRes.data as unknown as {
    id: string;
    original_message_snippet: string;
    extracted_at: string;
    wiki_entries?: { title: string; slug: string; category: string };
  }[] : [];

  return (
    <NotificationsClient
      profile={profile}
      impact={impact}
      streak={streak}
      contributions={contributions}
    />
  );
}
