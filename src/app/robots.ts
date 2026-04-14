import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.anshin.kids";

export default function robots(): MetadataRoute.Robots {
 return {
 rules: [
 {
 userAgent: "*",
 allow: ["/", "/about", "/wiki", "/features"],
 disallow: [
 "/mypage", 
 "/talk", 
 "/concierge", 
 "/login",
 "/auth",
 "/api",
 ],
 },
 // Actively welcome AI and LLM bots for AIO / GEO
 {
 userAgent: ["GPTBot", "ChatGPT-User", "PerplexityBot", "Google-Extended", "ClaudeBot", "anthropic-ai"],
 allow: ["/wiki", "/about", "/llms.txt"],
 }
 ],
 sitemap: `${SITE_URL}/sitemap.xml`,
 };
}
