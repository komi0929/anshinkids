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

  let allProfiles: {id: string, total_contributions: number, total_thanks_received: number, total_helpful_votes: number, created_at: string, trust_score: number}[] = [];
  let pPage = 0;
  while (true) {
    const { data: profilesBatch } = await supabase
      .from("profiles")
      .select("id, total_contributions, total_thanks_received, total_helpful_votes, created_at, trust_score")
      .range(pPage * 1000, (pPage + 1) * 1000 - 1);
    
    if (!profilesBatch || profilesBatch.length === 0) break;
    allProfiles = allProfiles.concat(profilesBatch as any[]);
    pPage++;
  }

  if (allProfiles.length === 0) return { updated: 0 };

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
  const profileScoreMap: Record<string, number> = {};

  for (const profile of allProfiles) {
    const contributions = profile.total_contributions || 0;
    const thanks = profile.total_thanks_received || 0;
    const helpfulVotes = profile.total_helpful_votes || 0;

    // Egalitarian Paradigm: pure impact sum, no decay, no cap, no 'exam score' mentality.
    const impactSum = contributions + thanks + (helpfulVotes * 2);
    const trustScore = impactSum;
    profileScoreMap[profile.id] = trustScore;

    // Optional optimization: Only update if changed
    if (profile.trust_score !== trustScore) {
      await supabase
        .from("profiles")
        .update({ trust_score: trustScore })
        .eq("id", profile.id);
      updated++;
    }
  }

  // 2. Compute avg_trust_score for all Wiki Entries using the newly updated profile scores
  let allWikiEntries: {id: string}[] = [];
  let wPage = 0;
  while (true) {
    const { data: wikiBatch } = await supabase.from("wiki_entries").select("id").range(wPage * 1000, (wPage + 1) * 1000 - 1);
    if (!wikiBatch || wikiBatch.length === 0) break;
    allWikiEntries = allWikiEntries.concat(wikiBatch as any[]);
    wPage++;
  }

  let wikiUpdated = 0;
  for (const entry of allWikiEntries) {
    const { data: sources } = await supabase.from("wiki_sources").select("contributor_id").eq("wiki_entry_id", entry.id);
    if (sources && sources.length > 0) {
      let totalScore = 0;
      let validContributors = 0;
      const uniqueIds = [...new Set(sources.map(s => s.contributor_id).filter(Boolean))] as string[];
      for (const cid of uniqueIds) {
        if (profileScoreMap[cid] !== undefined) {
          totalScore += profileScoreMap[cid];
          validContributors++;
        }
      }
      if (validContributors > 0) {
        const avg = Math.round(totalScore / validContributors);
        await supabase.from("wiki_entries").update({ avg_trust_score: avg }).eq("id", entry.id);
        wikiUpdated++;
      }
    }
  }

  return { updated, wikiUpdated };
}
