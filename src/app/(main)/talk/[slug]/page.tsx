import { redirect } from "next/navigation";
import { getTalkRoomBySlug, getTalkTopics } from "@/app/actions/messages";
import { getTopicSummariesForRoom, TopicSummary } from "@/app/actions/topic-summary";
import { THEME_PROMPTS } from "@/lib/theme-prompts";
import { createClient } from "@/lib/supabase/client";
import ThemeHubClient from "./theme-hub-client";

import { THEMES } from "@/lib/themes";
interface Topic {
  id: string;
  title: string;
  message_count: number;
  last_message_preview: string | null;
  updated_at: string;
  creator_name?: string;
  creator_avatar?: string | null;
}

export async function generateStaticParams() {
  return THEMES.map((theme) => ({
    slug: theme.slug,
  }));
}

export default async function ThemeHubPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  // Server-side fetching: NO network waterfall in the browser
  const roomRes = await getTalkRoomBySlug(slug);
  if (!roomRes.success || !roomRes.data || roomRes.data.id === "temp-id") {
    redirect("/talk");
  }
  const roomInfo = roomRes.data;

  // Fetch topics, summaries, and user profile in parallel
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userAllergens: string[] = [];
  let userAgeGroups: string[] = [];

  const [topicsRes, summariesRes, profileRes] = await Promise.all([
    getTalkTopics(roomInfo.id),
    getTopicSummariesForRoom(roomInfo.id),
    user ? supabase.from("profiles").select("allergen_tags, children_profiles, interests").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null })
  ]);

  let userInterests: string[] = [];

  if (profileRes.data) {
    userAllergens = profileRes.data.allergen_tags || [];
    const childrenProfile = profileRes.data.children_profiles as any[];
    if (childrenProfile && Array.isArray(childrenProfile)) {
      userAgeGroups = Array.from(new Set(childrenProfile.map(c => c.ageGroup).filter(Boolean))) as string[];
    }
    if (profileRes.data.interests && Array.isArray(profileRes.data.interests)) {
      userInterests = profileRes.data.interests;
    }
  }

  const topics = (topicsRes.success && topicsRes.data ? topicsRes.data : []) as Topic[];
  const summaries = (summariesRes.success && summariesRes.data ? summariesRes.data : {}) as Record<string, TopicSummary>;

  // Generate suggested prompts on the server
  const themePrompts = THEME_PROMPTS[slug] || [];
  const nonOverlapping = themePrompts.filter(p => !topics.some(t => t.title === p));
  const suggestedPrompts = nonOverlapping.slice(0, 3); // Removed impure Math.random() sorting from server component

  return (
    <ThemeHubClient
      slug={slug}
      roomInfo={roomInfo as { id: string; name: string; description: string; icon_emoji: string; slug: string; }}
      initialTopics={topics}
      initialSummaries={summaries}
      suggestedPrompts={suggestedPrompts}
      userAllergens={userAllergens}
      userAgeGroups={userAgeGroups}
      userInterests={userInterests}
    />
  );
}
