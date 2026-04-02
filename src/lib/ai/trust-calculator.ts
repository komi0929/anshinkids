import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Trust / Impact Score Calculation
 * 
 * Formula:
 *   score = contributions + thanks_received + (helpful_votes * 2)
 * 
 * - Egalitarian Paradigm: pure impact sum, no decay, no cap, no gamification
 * - Translates directly to "how much have you helped other parents"
 */
export async function recalculateTrustScores() {
  const supabase = createAdminClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, total_contributions, total_thanks_received, total_helpful_votes, created_at");

  if (!profiles) return { updated: 0 };

  // Fetch active days for streak bonus (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { data: streakData } = await supabase
    .from("contribution_days")
    .select("user_id, active_date")
    .gte("active_date", thirtyDaysAgo);

  const userActiveDays: Record<string, number> = {};
  if (streakData) {
    const userDays: Record<string, Set<string>> = {};
    for (const row of streakData) {
      if (!userDays[row.user_id]) userDays[row.user_id] = new Set();
      userDays[row.user_id].add(row.active_date);
    }
    for (const [userId, days] of Object.entries(userDays)) {
      userActiveDays[userId] = days.size;
    }
  }

  let updated = 0;

  for (const profile of profiles as unknown as {id: string, total_contributions: number, total_thanks_received: number, total_helpful_votes: number, created_at: string}[]) {
    const contributions = profile.total_contributions || 0;
    const thanks = profile.total_thanks_received || 0;
    const helpfulVotes = profile.total_helpful_votes || 0;
    // Intentionally removed activeDays to prevent gamification loop

    // Egalitarian Paradigm: pure impact sum, no decay, no cap, no 'exam score' mentality.
    // 1 contribution = 1 impact. 1 thanks = 1 impact. 1 helpful vote = 2 impact.
    const impactSum = contributions + thanks + (helpfulVotes * 2);
    const trustScore = impactSum;

    await supabase
      .from("profiles")
      .update({ trust_score: trustScore })
      .eq("id", profile.id);

    updated++;
  }

  return { updated };
}
