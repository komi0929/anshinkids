import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiPro, SYSTEM_PROMPTS } from "@/lib/ai/gemini";

interface ConciergeChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askConcierge(
  userId: string,
  sessionId: string | null,
  question: string,
  contextPayload?: string
) {
  const supabase = createAdminClient();
  const model = getGeminiPro(SYSTEM_PROMPTS.concierge);

  // Get or create session
  let session;
  if (sessionId) {
    const { data } = await supabase
      .from("concierge_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    session = data;
  }

  if (!session) {
    const { data } = await supabase
      .from("concierge_sessions")
      .insert({ user_id: userId, messages_json: [] })
      .select()
      .maybeSingle();
    session = data;
  }

  if (!session) throw new Error("Failed to create concierge session");

  const history: ConciergeChatMessage[] = (session.messages_json as ConciergeChatMessage[]) || [];

  // Mix context keywords gracefully for the semantic search (only allergens and age to avoid diluting the search)
  let combinedQuery = question;
  if (contextPayload) {
     if (contextPayload.includes("卵")) combinedQuery += " 卵";
     if (contextPayload.includes("乳")) combinedQuery += " 乳";
     if (contextPayload.includes("小麦")) combinedQuery += " 小麦";
     if (contextPayload.includes("ピーナッツ") || contextPayload.includes("落花生")) combinedQuery += " 落花生";
     if (contextPayload.includes("離乳食")) combinedQuery += " 離乳食";
     if (contextPayload.includes("幼児期")) combinedQuery += " 幼児";
     if (contextPayload.includes("小学生")) combinedQuery += " 学校 給食";
  }

  // Extract meaningful Japanese keywords (Kanji, Katakana, Alphanumerics, and specific 1-char allergens)
  // This completely eliminates the "0 hit" bug caused by space-splitting Japanese text.
  const keywordMatches = combinedQuery.match(/([一-龯]+|[ァ-ヴー]+|[A-Za-z0-9]+|卵|乳|麦)/g) || [];
  const questionKeywords = Array.from(new Set(keywordMatches))
    .filter(w => w.length >= 2 || ["卵", "乳", "麦", "米", "魚", "肉"].includes(w))
    .slice(0, 5);

  let wikiResults: Record<string, unknown>[] = [];

  // 1. Keyword-matched results (most relevant)
  if (questionKeywords.length > 0) {
    const orFilter = questionKeywords
      .map(k => `title.ilike.%${k}%,summary.ilike.%${k}%`)
      .join(",");
    const { data: matched } = await supabase
      .from("wiki_entries")
      .select("title, summary, sections, allergen_tags, avg_trust_score, source_count")
      .or(orFilter)
      .order("avg_trust_score", { ascending: false })
      .limit(5);
    if (matched) wikiResults = matched;
  }

  // 2. Fill remaining slots with top entries by trust score
  const existingIds = new Set(wikiResults.map(w => w.title));
  const { data: topEntries } = await supabase
    .from("wiki_entries")
    .select("title, summary, sections, allergen_tags, avg_trust_score, source_count")
    .order("avg_trust_score", { ascending: false })
    .limit(5);
  if (topEntries) {
    for (const entry of topEntries) {
      if (!existingIds.has(entry.title) && wikiResults.length < 10) {
        wikiResults.push(entry);
      }
    }
  }

  // Build context from wiki
  const wikiContext = wikiResults
    .map(
      (w) =>
        `【${w.title}】(信頼度: ${w.avg_trust_score})\n${w.summary || JSON.stringify(w.sections).slice(0, 1000)}`
    )
    .join("\n\n---\n\n");

  // Build prompt with RAG context + social proof
  const totalSources = wikiResults.reduce((sum, w) => sum + ((w.source_count as number) || 0), 0);
  const sourceProof = totalSources > 0
    ? `\n\n## 重要な回答スタイル:\n回答の冒頭で「この情報は${totalSources}件の保護者の実体験にもとづいています」と伝えてください。\n具体的な体験の引用がある場合は「ある保護者の方は〜」のように紹介してください。\n回答の最後に「このテーマについてあなたの体験もぜひトークルームで共有してください。みんなのヒントがさらに育ちます」と添えてください。`
    : "";

  // Limit history sent to the LLM to the last 10 messages to prevent context overflow.
  const recentHistory = history.slice(-10);

  const ragPrompt = `## コンシェルジュとしてのパーソナライズ絶対指示:
以下の「相談者のコンテキスト」を最優先で考慮して回答を生成してください。
${contextPayload || "未設定"}
- 最初の挨拶の直後に、登録情報（年齢やアレルゲン）に優しく触れ、「〇〇アレルギーの〇〇歳のお子様ですね。日々のおかず作り、本当にお疲れ様です」などと寄り添ってください。
- 提案する解決策や体験談は、お子様の年齢（成長段階）やアレルゲン情報に完全に適応させてください。
- アカウント状態が「貢献者」の場合、「いつもコミュニティへ体験を共有していただき、とても助かっています」と深い感謝を添えてください。

## 参照可能な一次情報データベース（AI動的Wiki）:
${wikiContext || "（まだ一次情報が蓄積されていません。一般的なアドバイスで回答してください）"}
${sourceProof}

## 会話履歴:
${recentHistory.map((m) => `${m.role === "user" ? "保護者" : "コンシェルジュ"}: ${m.content}`).join("\n")}

## 保護者からの新しい相談:
${question}

上記のWikiデータのみを参照し、温かく可能性を提示しながら回答してください。`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: ragPrompt }] }],
    generationConfig: { temperature: 0.2 }
  });
  const answer = result.response.text();

  // Update session with new messages (capped at 20 total in DB to prevent JSON bloat)
  const updatedMessages = [
    ...history,
    { role: "user" as const, content: question },
    { role: "assistant" as const, content: answer },
  ].slice(-20);

  await supabase
    .from("concierge_sessions")
    .update({ messages_json: updatedMessages })
    .eq("id", session.id);

  // Calculate source metrics for confidence scoring
  const wikiSourceCount = wikiResults.length;
  const avgTrustScore = wikiResults.length > 0
    ? wikiResults.reduce((sum, w) => sum + ((w.avg_trust_score as number) || 0), 0) / wikiResults.length
    : 0;

  return {
    sessionId: session.id,
    answer,
    messages: updatedMessages,
    wikiSourceCount,
    avgTrustScore,
  };
}
