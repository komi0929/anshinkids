import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Trust Score Calculation
 * 
 * Formula:
 *   base = (contributions * 1.5) + (thanks_received * 3.0)
 *   score = min(100, base / decay_factor)
 * 
 * - 貢献回数: 投稿するたびに +1.5pt
 * - 感謝いいね受信数: 他者からの感謝 +3.0pt (高評価)
 * - 最大100点
 * - 新規アカウントは自動的に低スコア (ステマ対策)
 */
export async function recalculateTrustScores() {
  const supabase = createAdminClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, total_contributions, total_thanks_received, created_at");

  if (!profiles) return { updated: 0 };

  let updated = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const profile of profiles as any[]) {
    const contributions = profile.total_contributions || 0;
    const thanks = profile.total_thanks_received || 0;

    // Account age factor (older = more trusted)
    const accountAgeDays = Math.max(
      1,
      (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const ageFactor = Math.min(1, accountAgeDays / 30); // Max trust after 30 days

    const rawScore = (contributions * 1.5 + thanks * 3.0) * ageFactor;
    const trustScore = Math.min(100, Math.round(rawScore * 100) / 100);

    await supabase
      .from("profiles")
      .update({ trust_score: trustScore })
      .eq("id", profile.id);

    updated++;
  }

  return { updated };
}
