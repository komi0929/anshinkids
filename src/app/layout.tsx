import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "あんしんキッズ - 食物アレルギーの一次情報プラットフォーム",
  description:
    "食物アレルギーを持つ子どもの親のための一次情報アセット化プラットフォーム。当事者のリアルな体験をAIが辞書化し、心理的安全性の高い空間で情報を共有できます。",
  keywords: ["食物アレルギー", "子ども", "アレルギー対応", "負荷試験", "アレルゲンフリー"],
  openGraph: {
    title: "あんしんキッズ",
    description: "食物アレルギーの一次情報を、安心して共有・検索できるプラットフォーム",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
