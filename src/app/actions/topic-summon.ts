
"use server";

import { THEME_BY_SLUG } from "@/lib/themes";
import { getGeminiFlash } from "@/lib/ai/gemini";
import { SchemaType } from "@google/generative-ai";

/**
 * Phase 3: Topic Summoning — まとめ記事から引用質問を生成
 * 
 * Mega-Wiki内のセクション/項目から、対応するトークルームへの
 * 自動テキストを生成する。
 */
export async function generateSummonText(themeSlug: string, sectionHeading: string, itemTitle: string): Promise<{
  success: boolean;
  text: string;
  roomSlug: string;
}> {
  const theme = THEME_BY_SLUG[themeSlug];
  if (!theme) {
    return { success: false, text: "", roomSlug: "" };
  }

  try {
    const model = getGeminiFlash(`あなたは「${theme.name}」というテーマの保護者コミュニティのファシリテーターです。
まとめ記事の「${sectionHeading}」について、「${itemTitle}」に関する新しい体験談やエピソードを募集したいです。

以下のルールで、保護者が思わずコメントを返したくなるような、短く温かい「問いかけ（話題の投下）」を1〜2文で生成してください。
- 100文字以内
- 親しみやすく、少し絵文字を交える
- 「最近はどうですか？」「工夫はありますか？」などの問いかけで終わること`);

    const prompt = `トピック: ${itemTitle}
上記に関する問いかけを生成してください。`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            questionText: {
              type: SchemaType.STRING,
              description: "生成した問いかけ"
            }
          },
          required: ["questionText"]
        },
        temperature: 0.5,
      }
    });

    let text = "";
    try {
      const parsed = JSON.parse(result.response.text());
      text = parsed.questionText;
    } catch {
      text = `【まとめ記事から】${itemTitle}について、最新の体験談や工夫があれば教えてください！🌱`;
    }

    return {
      success: true,
      text: text || `【みんなのまとめ】${itemTitle}について、最近の体験を教えてください！`,
      roomSlug: themeSlug,
    };
  } catch (error) {
    console.error("[generateSummonText] AI Error:", error);
    // Fallback in case AI is unreachable
    const text = `【まとめ記事から】${itemTitle}について、最新の体験談や工夫があれば教えてください！🌱`;
    return {
      success: true,
      text,
      roomSlug: themeSlug,
    };
  }
}

