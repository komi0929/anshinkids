const fs = require('fs');

const data = JSON.parse(fs.readFileSync('simulation-output/simulation_1775272797178.json', 'utf8'));
const page = fs.readFileSync('src/app/(main)/simulation/page.tsx', 'utf8');

// Find the interface Item section  
const ifaceIdx = page.indexOf('interface Item {');
const restOfFile = page.substring(ifaceIdx);

// Update THEME_EMOJIS in restOfFile
const updatedRest = restOfFile.replace(
  /const THEME_EMOJIS[^}]+\};/s,
  `const THEME_EMOJIS: Record<string, string> = {
  "daily-food": "🍚",
  products: "🛒",
  "eating-out": "🍽️",
  school: "🏫",
  "load-test": "🧪",
  "skin-care": "🧴",
  emotions: "👨\\u200d👩\\u200d👧",
  "food-wins": "🌱",
};`
);

const header = `"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, BookOpen, MessageCircle, Bookmark } from "@/components/icons";

/**
 * 🧪 シミュレーション結果プレビューページ
 * 
 * ダミー会話から生成されたWiki記事JSONを、
 * 実際のWiki記事UIでプレビューできるページ。
 */

// シミュレーション結果データ（simulation-output の結果を埋め込み）
const SIMULATION_DATA: Record<string, { theme: string; input_messages: number; generated_sections: Section[] }> = ${JSON.stringify(data, null, 2)};

`;

fs.writeFileSync('src/app/(main)/simulation/page.tsx', header + updatedRest, 'utf8');
console.log('Done - regenerated simulation page');
