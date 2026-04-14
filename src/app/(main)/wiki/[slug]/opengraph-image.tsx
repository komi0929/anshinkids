import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "あんしんキッズ 体験まとめ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
 const resolvedParams = await params;
 const supabase = await createClient();
 let entry = null;

 if (supabase) {
 const { data } = await supabase
 .from("wiki_entries")
 .select("title, category, source_count")
 .eq("slug", resolvedParams.slug)
 .maybeSingle();
 entry = data;
 }

 const title = entry?.title || "お悩み・体験まとめ";
 const category = entry?.category || "アレルギー・育児";
 const sourceCount = entry?.source_count || 0;

 return new ImageResponse(
 (
 <div
 style={{
 width: "100%",
 height: "100%",
 display: "flex",
 flexDirection: "column",
 alignItems: "flex-start",
 justifyContent: "space-between",
 padding: "80px",
 backgroundColor: "#fffdf9", // warmup surface
 backgroundImage: "linear-gradient(to bottom right, #fffdf9, #fcedeb)", // subtle coral tint
 fontFamily: "sans-serif",
 position: "relative",
 overflow: "hidden",
 }}
 >
 {/* Background Decorative Circles */}
 <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "#ff8c70", opacity: 0.1 }} />
 <div style={{ position: "absolute", bottom: "-50px", left: "-100px", width: "300px", height: "300px", borderRadius: "50%", background: "#ffd26b", opacity: 0.1 }} />

 {/* Top Header */}
 <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
 <div style={{ display: "flex", alignItems: "center", background: "#fef3f2", padding: "12px 24px", borderRadius: "999px", border: "2px solid #ffcec5" }}>
 <span style={{ fontSize: "32px", color: "#e76f51", fontWeight: "bold" }}>{category}</span>
 </div>
 {sourceCount > 0 && (
 <div style={{ display: "flex", marginLeft: "24px", alignItems: "center", background: "#fff", padding: "12px 24px", borderRadius: "999px", border: "2px solid #f0f0f0" }}>
 <span style={{ fontSize: "28px", color: "#666", fontWeight: "bold" }}>🌟 {sourceCount}人の親御さんの実体験が集まっています</span>
 </div>
 )}
 </div>

 {/* Main Title */}
 <div style={{ display: "flex", flexDirection: "column", marginTop: "40px", marginBottom: "auto" }}>
 <h1 style={{ fontSize: "74px", fontWeight: "900", color: "#333", lineHeight: 1.3, letterSpacing: "-0.02em", wordWrap: "break-word", textShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
 {title}
 </h1>
 </div>

 {/* Brand Bottom */}
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", borderTop: "4px solid #ffcec5", paddingTop: "40px" }}>
 <div style={{ display: "flex", alignItems: "center" }}>
 <div style={{ display: "flex", background: "#e76f51", borderRadius: "16px", padding: "12px" }}>
 <span style={{ fontSize: "40px", color: "#fff" }}>🧸</span>
 </div>
 <div style={{ display: "flex", flexDirection: "column", marginLeft: "20px" }}>
 <span style={{ fontSize: "42px", fontWeight: "900", color: "#e76f51", letterSpacing: "-0.02em" }}>あんしんキッズ</span>
 <span style={{ fontSize: "24px", fontWeight: "bold", color: "#e76f51", opacity: 0.7 }}>アレルギーと育児のまとめ記事</span>
 </div>
 </div>
 <div style={{ display: "flex" }}>
 <span style={{ fontSize: "28px", color: "#888", fontWeight: "bold" }}>anshin-kids.app</span>
 </div>
 </div>
 </div>
 ),
 {
 ...size,
 }
 );
}
