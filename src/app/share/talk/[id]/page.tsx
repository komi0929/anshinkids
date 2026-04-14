import { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { MessageCircle, ArrowRight } from "@/components/icons";

interface Props {
 params: Promise<{ id: string }>;
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Dynamically generate OGP for the specified message
export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const resolvedParams = await params;
 const adminClient = createAdminClient();
 const { data: message } = await adminClient
 .from("messages")
 .select("content, room_id, talk_rooms(name)")
 .eq("id", resolvedParams.id)
 .single();

 if (!message) {
 return { title: "トークルーム投稿 | あんしんキッズ" };
 }

 const text = message.content.substring(0, 80);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const roomName = (message.talk_rooms as any)?.name || "コミュニティ";
 // Point to the new dynamic API endpoint for OGP
 const ogImageUrl = `/api/og/sos?text=${encodeURIComponent(text)}`;

 return {
 title: `教えて！ - ${roomName} | あんしんキッズ`,
 description: message.content.substring(0, 120),
 openGraph: {
 title: `教えて！ - ${roomName} | あんしんキッズ`,
 description: text + "...",
 images: [ogImageUrl],
 },
 twitter: {
 card: "summary_large_image",
 title: `教えて！ - ${roomName} | あんしんキッズ`,
 description: text + "...",
 images: [ogImageUrl],
 },
 };
}

export default async function SharePostPage({ params }: Props) {
 const resolvedParams = await params;
 const adminClient = createAdminClient();
 // Fetch message details to display a nice landing page and figure out the redirect target
 const { data: message } = await adminClient
 .from("messages")
 .select("content, room_id, talk_rooms(slug, name)")
 .eq("id", resolvedParams.id)
 .single();

 if (!message) {
 return (
 <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[var(--color-bg)]">
 <MessageCircle className="w-12 h-12 text-[var(--color-muted)] mb-4" />
 <p className="font-bold text-[var(--color-text)]">この投稿はすでに削除されたか、見つかりません。</p>
 <Link href="/talk" className="mt-4 btn-primary !bg-white !text-[var(--color-text)] ">
 トークルーム一覧へ戻る
 </Link>
 </div>
 );
 }

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const roomSlug = (message.talk_rooms as any)?.slug || "";
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const roomName = (message.talk_rooms as any)?.name || "";

 return (
 <div className="min-h-[100dvh] flex flex-col items-center p-4 pt-10 sm:pt-20 bg-gradient-to-br from-[var(--color-bg)] to-[#F6FAF8]">
 <div className="w-full max-w-[400px] slide-up">
 {/* Branding header */}
 <div className="flex justify-center mb-6">
 <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] rounded-2xl flex items-center justify-center ">
 <MessageCircle className="w-6 h-6 text-white" />
 </div>
 </div>
 
 <div className="bg-white rounded-xl border-[1.5px] border-[var(--color-border)] p-6 mb-6 relative overflow-hidden">
 {/* Subtle noise/texture */}
 <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
 
 <div className="relative z-10">
 <span className="inline-block px-3 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[11px] font-extrabold rounded-full mb-3">
 📣 この投稿への助けを探しています
 </span>
 <p className="text-[17px] leading-[1.8] font-bold text-[var(--color-text)] whitespace-pre-wrap mb-4">
 {message.content}
 </p>
 <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-subtle)] font-medium bg-[var(--color-surface-soft)] px-3 py-2 rounded-xl border-[1.5px] border-[var(--color-border)]">
 テーマ：{roomName}
 </div>
 </div>
 </div>

 <Link
 href={`/talk/${roomSlug}`}
 className="w-full btn-primary !py-4 flex items-center justify-center gap-2 hover: transition-all text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-success-deep)]"
 >
 <span className="text-[14px] font-extrabold">アプリを開いてこの質問に答える</span>
 <ArrowRight className="w-4 h-4" />
 </Link>
 <p className="text-center text-[11px] text-[var(--color-muted)] mt-5 leading-relaxed">
 あんしんキッズは、アレルギーを持つ親の実体験コミュニティです。<br/>
 ログイン不要での閲覧も可能です。
 </p>
 </div>
 </div>
 );
}
