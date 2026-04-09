import { redirect } from "next/navigation";
import { getTalkRoomBySlug, getTalkTopics } from "@/app/actions/messages";
import { getTopicSummariesForRoom, TopicSummary } from "@/app/actions/topic-summary";
import { THEME_PROMPTS } from "@/lib/theme-prompts";
import ThemeHubClient from "./theme-hub-client";

interface Topic {
  id: string;
  title: string;
  message_count: number;
  last_message_preview: string | null;
  updated_at: string;
  creator_name?: string;
  creator_avatar?: string | null;
}

export default async function ThemeHubPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ topic?: string }>;
}) {
  const { slug } = await props.params;
  const resolvedSearchParams = await props.searchParams;
  const initialTopic = resolvedSearchParams.topic || null;

  // Server-side fetching: NO network waterfall in the browser
  const roomRes = await getTalkRoomBySlug(slug);
  if (!roomRes.success || !roomRes.data || roomRes.data.id === "temp-id") {
    redirect("/talk");
  }
  const roomInfo = roomRes.data;

  // Fetch topics and summaries in parallel
  const [topicsRes, summariesRes] = await Promise.all([
    getTalkTopics(roomInfo.id),
    getTopicSummariesForRoom(roomInfo.id),
  ]);

  const topics = (topicsRes.success && topicsRes.data ? topicsRes.data : []) as Topic[];
  const summaries = (summariesRes.success && summariesRes.data ? summariesRes.data : {}) as Record<string, TopicSummary>;

  // Generate suggested prompts on the server
  const themePrompts = THEME_PROMPTS[slug] || [];
  const nonOverlapping = themePrompts.filter(p => !topics.some(t => t.title === p));
  const suggestedPrompts = nonOverlapping.slice(0, 3); // Removed impure Math.random() sorting from server component

  return (
    <ThemeHubClient
      slug={slug}
      initialTopicFormVal={initialTopic}
      roomInfo={roomInfo as { id: string; name: string; description: string; icon_emoji: string; slug: string; }}
      initialTopics={topics}
      initialSummaries={summaries}
      suggestedPrompts={suggestedPrompts}
    />
  );
}
