import { MetadataRoute } from "next";
import { getTalkRooms } from "@/app/actions/messages";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.anshin.kids";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const routes = [
 "",
 "/about",
 "/features",
 "/wiki",
 "/guide",
 "/terms",
 "/privacy",
 ].map((route) => ({
 url: `${SITE_URL}${route}`,
 lastModified: new Date().toISOString(),
 changeFrequency: "daily" as const,
 priority: route === "" ? 1 : route === "/wiki" ? 0.95 : 0.8,
 }));

 // Add all public Mega-Wikis dynamically
 const { data: themes } = await getTalkRooms();
 const wikiRoutes = (themes || []).map((theme) => ({
 url: `${SITE_URL}/wiki/mega-${theme.slug}`,
 lastModified: new Date().toISOString(),
 changeFrequency: "hourly" as const, // High frequency for active communities
 priority: 0.9,
 }));

 return [...routes, ...wikiRoutes];
}
