import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "あんしんキッズ - 食物アレルギーの知恵を、みんなでつくる",
  description:
    "食物アレルギーを持つ子どもの親のための知恵共有プラットフォーム。日々の会話がAIで整理され、未来の誰かの「希望の道しるべ」になります。",
  keywords: ["食物アレルギー", "子ども", "アレルギー対応", "負荷試験", "アレルゲンフリー", "コミュニティ"],
  openGraph: {
    title: "あんしんキッズ - 食物アレルギーの知恵を、みんなでつくる",
    description: "あなたの体験が、誰かの「希望の道しるべ」になります。",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAF7F2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
