/**
 * 統一アイコンシステム — あんしんキッズ
 * 全ページでこのファイルからインポートして使用すること。
 * ルール:
 * - すべて strokeWidth: 1.8, viewBox: "0 0 24 24"
 * - デフォルトサイズ: 20x20
 * - className で色・サイズを変更
 */

import React from "react";

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

// ── Navigation & Arrows ──
export const ArrowLeft = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
);
export const Home = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
export const ArrowRight = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
);
export const ArrowUpRight = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
);
export const ChevronRight = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><polyline points="9 18 15 12 9 6" /></svg>
);

// ── Communication ──
export const MessageCircle = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
export const Send = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);
export const Reply = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
);

// ── Content ──
export const BookOpen = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
);
export const Book = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
);
export const Bookmark = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
);

// ── AI & Special ──
export const Sparkles = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M12 3l1.5 4.5H18l-3.5 2.7 1.3 4.3L12 12l-3.8 2.5 1.3-4.3L6 7.5h4.5z" /></svg>
);
export const Leaf = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 .5 20 .5s-1.5 7-5.5 11c-2 2-5 3-5 3" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>
);

// ── Actions ──
export const Search = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
export const Filter = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
);
export const Plus = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
export const Check = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><polyline points="20 6 9 17 4 12" /></svg>
);
export const X = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
export const RefreshCw = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
);
export const Pencil = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
);

// ── Info & Status ──
export const Clock = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
export const Shield = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
export const ShieldCheck = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
);
export const AlertTriangle = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
export const Loader2 = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" /></svg>
);
export const Eye = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);

// ── User & Social ──
export const User = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
export const Heart = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
);
export const Award = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
);
export const TrendingUp = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
);

// ── Auth ──
export const LogIn = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
);
export const LogOut = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);

// ── Settings & UI Controls ──
export const Settings = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const Bell = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
);
export const Trash2 = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);
// ── Emergency ──
export const Phone = ({ className, style, size = 20 }: IconProps) => (
  <svg {...base(size)} className={className} style={style}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);
