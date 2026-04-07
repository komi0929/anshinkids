"use server";

import { createClient } from "@/lib/supabase/server";

export interface TopicSummary {
  id: string;
  topic_id: string;
  summary_snippet: string | null;
  full_summary: Record<string, unknown> | null;
  allergen_tags: string[];
  source_count: number;
  last_generated_at: string;
}

export async function getTopicSummary(topicId: string): Promise<{ success: boolean; data: TopicSummary | null }> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: null };

    // Use .from() with type assertion since topic_summaries is a new table not yet in generated types
    const { data, error } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: TopicSummary | null; error: unknown }> } } } }).from("topic_summaries")
      .select("*")
      .eq("topic_id", topicId)
      .maybeSingle();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("[getTopicSummary]", err);
    return { success: true, data: null };
  }
}

export async function getTopicSummariesForRoom(roomId: string): Promise<{ success: boolean; data: Record<string, TopicSummary> }> {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: true, data: {} };

    // Get all topic IDs for this room
    const { data: topics } = await supabase
      .from("talk_topics")
      .select("id")
      .eq("room_id", roomId)
      .eq("is_active", true);

    if (!topics || topics.length === 0) return { success: true, data: {} };

    const topicIds = topics.map(t => t.id);

    // Use type assertion for new table
    const { data: summaries, error } = await (supabase as unknown as { from: (t: string) => { select: (c: string) => { in: (c: string, v: string[]) => Promise<{ data: TopicSummary[] | null; error: unknown }> } } }).from("topic_summaries")
      .select("*")
      .in("topic_id", topicIds);

    if (error) throw error;

    // Index by topic_id for fast lookup
    const map: Record<string, TopicSummary> = {};
    if (summaries) {
      for (const s of summaries) {
        map[s.topic_id] = s;
      }
    }

    return { success: true, data: map };
  } catch (err) {
    console.error("[getTopicSummariesForRoom]", err);
    return { success: true, data: {} };
  }
}
