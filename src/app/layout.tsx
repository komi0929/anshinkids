import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansJP = Noto_Sans_JP({ 
 subsets: ["latin"], 
 weight: ["400", "500", "700", "800"], 
 variable: "--font-noto-sans-jp" 
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.anshin.kids";

export const metadata: Metadata = {
 metadataBase: new URL(SITE_URL),
 title: {
 template: "%s | あんしんキッズ",
 default: "あんしんキッズ - 食物アレルギーのヒントを、みんなでつくる",
 },
 description:
 "あんしんキッズは、食物アレルギー（卵・乳・小麦等）を持つ子どもの親が実体験を共有し合うコミュニティです。数百人の親の実体験がAIで整理され、外食・給食・負荷試験など日常の悩みに答える知識ライブラリを提供しています。",
 keywords: ["食物アレルギー", "子ども", "アレルギー対応", "負荷試験", "アレルゲンフリー", "コミュニティ", "卵アレルギー", "乳アレルギー", "小麦アレルギー", "アレルギー 外食", "アレルギー 給食", "アレルギー 保育園"],
 openGraph: {
 title: "あんしんキッズ - 食物アレルギーのヒントを、みんなでつくる",
 description: "卵・乳・小麦アレルギーなど、食物アレルギーを持つ子どもの親が実体験を共有するコミュニティ。数百の実体験をAIが整理した体験記事を無料で閲覧できます。",
 url: SITE_URL,
 siteName: "あんしんキッズ",
 locale: "ja_JP",
 type: "website",
 },
 twitter: {
 card: "summary_large_image",
 title: "あんしんキッズ - 食物アレルギーのヒントを、みんなでつくる",
 description: "卵・乳・小麦アレルギーなど、食物アレルギーを持つ子どもの親が実体験を共有するコミュニティ。数百の実体験をAIが整理した体験記事を無料で閲覧できます。",
 },
 manifest: "/manifest.json",
 appleWebApp: {
 capable: true,
 title: "あんしんキッズ",
 statusBarStyle: "default",
 },
};

export const viewport: Viewport = {
 width: "device-width",
 initialScale: 1,
 maximumScale: 1,
 userScalable: false,
 themeColor: "#FAFAFA",
};

import { SensoryEffectsProvider } from "@/components/ui/SensoryEffects";

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
 <head>
 {/* Organization Schema (Entity Identity for AI E-E-A-T) */}
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify({
 "@context": "https://schema.org",
 "@type": "Organization",
 "name": "あんしんキッズ",
 "alternateName": "Anshin Kids",
 "url": SITE_URL,
 "description": "食物アレルギー（卵・乳・小麦等）を持つ子どもの親が実体験を共有し合う日本最大級のコミュニティプラットフォーム。数百人の親御さんの実際の体験談をAIが整理し、外食・給食・保育園・負荷試験・災害時対応など日常のあらゆる悩みに答える知識ライブラリを無料で提供しています。",
 "foundingDate": "2025",
 "areaServed": {
 "@type": "Country",
 "name": "Japan"
 },
 "inLanguage": "ja",
 "knowsAbout": [
 "食物アレルギー",
 "卵アレルギー",
 "乳アレルギー",
 "小麦アレルギー",
 "アレルギー対応食",
 "経口負荷試験",
 "アレルギー児の給食対応",
 "アレルギー児の外食",
 "アナフィラキシー対応",
 "エピペン",
 "アレルギー 保育園",
 "アレルギー 旅行"
 ],
 "sameAs": [],
 "contactPoint": [
 {
 "@type": "ContactPoint",
 "email": "support@anshin-kids.app",
 "contactType": "customer support",
 "availableLanguage": ["Japanese"]
 },
 {
 "@type": "ContactPoint",
 "email": "partner@anshin-kids.app",
 "contactType": "partnership inquiries",
 "availableLanguage": ["Japanese", "English"]
 }
 ]
 }) }}
 />
 {/* Link to llms.txt for AI discovery */}
 <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Information" />
 
 {/* Speculation Rules API: Zero-latency navigation prerendering */}
 <Script
 id="speculation-rules"
 strategy="beforeInteractive"
 type="speculationrules"
 dangerouslySetInnerHTML={{
 __html: JSON.stringify({
 prerender: [
 {
 source: "document",
 where: {
 and: [
 { href_matches: "/*" },
 { not: { href_matches: "/api/*" } },
 { not: { href_matches: "/login/*" } }
 ]
 },
 eagerness: "moderate"
 }
 ]
 })
 }}
 />
 </head>
 <body className="min-h-[100dvh]">
  <NextTopLoader color="#099bff" initialPosition={0.08} crawlSpeed={200} height={3} crawl={true} showSpinner={false} easing="ease" speed={200} shadow="0 0 10px #099bff,0 0 5px #099bff" />
 <SensoryEffectsProvider>
 {children}
 </SensoryEffectsProvider>
 <Script
 id="register-sw"
 strategy="afterInteractive"
 dangerouslySetInnerHTML={{
 __html: `
 if ('serviceWorker' in navigator) {
 window.addEventListener('load', function() {
 navigator.serviceWorker.register('/sw.js').then(
 function(registration) { console.log('SW registered: ', registration.scope); },
 function(err) { console.log('SW registration failed: ', err); }
 );
 });
 }
 `,
 }}
 />
 </body>
 </html>
 );
}
