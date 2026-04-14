import type { Metadata } from "next";
import { getTalkRoomBySlug } from "@/app/actions/messages";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
 const resolvedParams = await params;
 const result = await getTalkRoomBySlug(resolvedParams.slug);

 if (result.success && result.data) {
 const data = result.data as { name: string; description: string; icon_emoji: string; };
 const title = `${data.icon_emoji} ${data.name}のトークルーム`;
 const description = data.description || "食物アレルギーに関するリアルな体験談や工夫を語り合うルームです。";
 
 return {
 title,
 description,
 openGraph: {
 title,
 description,
 },
 twitter: {
 title,
 description,
 }
 };
 }
 
 return { title: 'トークルーム' };
}

export default function TalkDynamicLayout({ children }: { children: React.ReactNode }) {
 return <>{children}</>;
}
