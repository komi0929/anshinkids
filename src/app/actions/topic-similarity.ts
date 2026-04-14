"use server";

import { createStaticClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export interface SimilarTopicResult {
 similarFound: boolean;
 topicId?: string;
 topicTitle?: string;
 reason?: string;
}

export async function checkSimilarTopicWithAI(roomId: string, newTitle: string): Promise<SimilarTopicResult> {
 try {
 if (!newTitle || newTitle.trim().length < 2) return { similarFound: false };
 const titleRegex = /^[a-zA-Z0-9\sぁ-んァ-ン一-龥ー]*$/;
 // basic sanity
 if (newTitle.length > 50) return { similarFound: false }; // Too long to be a normal title

 const supabase = createStaticClient();
 if (!supabase) return { similarFound: false };

 // Fetch existing active topics in this room
 const { data: activeTopics } = await supabase
 .from("talk_topics")
 .select("id, title")
 .eq("room_id", roomId)
 .eq("is_active", true)
 .order("updated_at", { ascending: false })
 .limit(50); // Only compare against top 50 mostly active ones to save prompt space and latency

 if (!activeTopics || activeTopics.length === 0) {
 return { similarFound: false };
 }

 // Exact string match check (fallback/fast-path)
 const exactMatch = activeTopics.find(t => t.title === newTitle.trim());
 if (exactMatch) {
 return {
 similarFound: true,
 topicId: exactMatch.id,
 topicTitle: exactMatch.title,
 reason: "内容が完全に一致するトピックが既に存在します。"
 };
 }

 // AI Semantic check
 const apiKey = process.env.GOOGLE_API_KEY;
 if (!apiKey) return { similarFound: false }; // Graceful degradation

 const genAI = new GoogleGenerativeAI(apiKey);
 const model = genAI.getGenerativeModel({
 model: "gemini-3-flash-preview",
 systemInstruction: `あなたはコミュニティのモデレーターAIです。
ユーザーが新しく「話題」を作成しようとしていますが、既存の話題と意味的に重複すると、会話が分散してしまいます。
既存の話題リストとユーザーの新しい話題を比較し、意味的・意図的に重複しているものがあれば1つだけ見つけてください。
重複していない場合は見つからなかったと返してください。`,
 });

 const prompt = `新しく作成される話題: "${newTitle.trim()}"

【現在アクティブな既存の話題リスト】
${activeTopics.map((t, i) => `ID: ${t.id} | TITLE: ${t.title}`).join("\n")}

指示:
もし「新しく作成される話題」とほぼ同じ意味・目的を持つ既存の話題があれば、その ID, タイトル, および同一とみなした簡潔な理由（ユーザー向け50文字以内）を返してください。
なければ similarFound を false にしてください。`;

 const result = await model.generateContent({
 contents: [{ role: "user", parts: [{ text: prompt }] }],
 generationConfig: {
 responseMimeType: "application/json",
 responseSchema: {
 type: SchemaType.OBJECT,
 properties: {
 similarFound: { type: SchemaType.BOOLEAN, description: "真の重複するトピックがあるか" },
 topicId: { type: SchemaType.STRING, description: "見つかった既存のトピックID" },
 topicTitle: { type: SchemaType.STRING, description: "見つかった既存のトピックタイトル" },
 reason: { type: SchemaType.STRING, description: "なぜ似ているのかのユーザー向け短い理由（日本語）" },
 },
 required: ["similarFound"],
 },
 temperature: 0.1, // very low for deterministic matching
 },
 });

 const responseText = result.response.text();
 const parsed = JSON.parse(responseText);

 // Validate the ID actually exists from our list (to prevent AI hallucination)
 if (parsed.similarFound && parsed.topicId) {
 const isValidId = activeTopics.some(t => t.id === parsed.topicId);
 if (isValidId) {
 return {
 similarFound: true,
 topicId: parsed.topicId,
 topicTitle: parsed.topicTitle || "",
 reason: parsed.reason || "似た意味の話題のため",
 };
 }
 }

 return { similarFound: false };
 } catch (error) {
 console.error("[checkSimilarTopicWithAI]", error);
 // Graceful degradation: If AI fails, just create the topic natively
 return { similarFound: false };
 }
}
