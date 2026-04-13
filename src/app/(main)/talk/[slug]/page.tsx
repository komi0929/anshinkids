import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTalkRoomBySlug, getTalkTopics } from "@/app/actions/messages";
import { getTopicSummariesForRoom, TopicSummary } from "@/app/actions/topic-summary";
import { THEME_PROMPTS } from "@/lib/theme-prompts";
import { createStaticClient } from "@/lib/supabase/server";
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

export default function ThemeHubPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full fade-in z-50">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-[var(--color-border-light)] flex items-center justify-center mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent" />
          <svg className="w-7 h-7 text-[var(--color-primary)] animate-spin relative z-10" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        </div>
        <p className="text-[13px] font-bold text-[var(--color-text-secondary)] tracking-widest animate-pulse">Now Loading...</p>
      </div>
    }>
      <ThemeHubFetcher params={props.params} />
    </Suspense>
  );
}

async function ThemeHubFetcher(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  // Server-side fetching: NO network waterfall in the browser
  const roomRes = await getTalkRoomBySlug(slug);
  if (!roomRes.success || !roomRes.data || roomRes.data.id === "temp-id") {
    redirect("/talk");
  }
  const roomInfo = roomRes.data;

  // Fetch topics, summaries, and static image gallery in parallel. No user cookies read here to ensure 100% SSG static rendering for 0ms transitions.
  const supabase = createStaticClient();
  
  const [topicsRes, summariesRes, wikiEntryRes] = await Promise.all([
    getTalkTopics(roomInfo.id),
    getTopicSummariesForRoom(roomInfo.id),
    supabase ? supabase.from("wiki_entries").select("image_gallery").eq("slug", `mega-${slug}`).maybeSingle() : Promise.resolve({ data: null })
  ]);

  const topics = (topicsRes.success && topicsRes.data ? topicsRes.data : []) as Topic[];
  const summaries = (summariesRes.success && summariesRes.data ? summariesRes.data : {}) as Record<string, TopicSummary>;
  const imageGallery = (wikiEntryRes.data?.image_gallery || []) as string[];

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
      userAllergens={[]} // Client-hydrated via context/fetch
      userAgeGroups={[]} // Client-hydrated
      userInterests={[]} // Client-hydrated
      imageGallery={imageGallery}
    />
  );
}
