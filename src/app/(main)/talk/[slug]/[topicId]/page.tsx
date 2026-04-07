import { getTalkRoomBySlug, getTalkTopicById, getTopicMessages } from "@/app/actions/messages";
import { getTopicSummary } from "@/app/actions/topic-summary";
import ChatClient from "./chat-client";
import { notFound } from "next/navigation";

export default async function TopicPage({ params }: { params: { slug: string; topicId: string } }) {
  const { slug, topicId } = await params;
  
  // Parallel fetch to eliminate waterfall
  const [roomRes, topicRes, messagesRes, summaryRes] = await Promise.all([
    getTalkRoomBySlug(slug),
    getTalkTopicById(topicId),
    getTopicMessages(topicId),
    getTopicSummary(topicId)
  ]);

  if (!roomRes.success || !roomRes.data) notFound();
  if (!topicRes.success || !topicRes.data) notFound();

  return (
    <ChatClient
      slug={slug}
      topicId={topicId}
      initialRoomInfo={roomRes.data as any}
      initialTopicInfo={topicRes.data as any}
      initialMessages={(messagesRes.data as any) || []}
      initialSummary={(summaryRes.data as any) || null}
    />
  );
}
