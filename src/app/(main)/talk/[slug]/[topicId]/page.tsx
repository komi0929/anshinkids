import { getTalkRoomBySlug, getTalkTopicById, getTopicMessages } from "@/app/actions/messages";
import { getTopicSummary } from "@/app/actions/topic-summary";
import ChatClient from "./chat-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TopicPage({ params }: { params: Promise<{ slug: string; topicId: string }> }) {
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
 initialRoomInfo={roomRes.data as { id: string; name: string; description: string; icon_emoji: string; }}
 initialTopicInfo={topicRes.data as { id: string; title: string; message_count: number; }}
 initialMessages={(messagesRes.data as import("./chat-client").Message[]) || []}
 initialSummary={(summaryRes.data as import("@/app/actions/topic-summary").TopicSummary) || null}
 />
 );
}
