import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiPro, SYSTEM_PROMPTS } from "@/lib/ai/gemini";

interface ConciergeChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askConcierge(
  userId: string,
  sessionId: string | null,
  question: string
) {
  const supabase = createAdminClient();
  const model = getGeminiPro();

  // Get or create session
  let session;
  if (sessionId) {
    const { data } = await supabase
      .from("concierge_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();
    session = data;
  }

  if (!session) {
    const { data } = await supabase
      .from("concierge_sessions")
      .insert({ user_id: userId, messages_json: [] })
      .select()
      .single();
    session = data;
  }

  if (!session) throw new Error("Failed to create concierge session");

  const history: ConciergeChatMessage[] = (session.messages_json as ConciergeChatMessage[]) || [];

  // RAG: Search wiki for relevant context
  const { data: wikiResults } = await supabase
    .from("wiki_entries")
    .select("title, summary, content_json, allergen_tags, avg_trust_score")
    .order("avg_trust_score", { ascending: false })
    .limit(10);

  // Build context from wiki
  const wikiContext = (wikiResults || [])
    .map(
      (w: Record<string, unknown>) =>
        `【${w.title}】(信頼度: ${w.avg_trust_score})\n${w.summary || JSON.stringify(w.content_json).slice(0, 500)}`
    )
    .join("\n\n---\n\n");

  // Build prompt with RAG context
  const ragPrompt = `${SYSTEM_PROMPTS.concierge}

## 参照可能な一次情報データベース（AI動的Wiki）:
${wikiContext || "（まだ一次情報が蓄積されていません。一般的なアドバイスで回答してください）"}

## 会話履歴:
${history.map((m) => `${m.role === "user" ? "保護者" : "コンシェルジュ"}: ${m.content}`).join("\n")}

## 保護者からの新しい相談:
${question}

上記のWikiデータのみを参照し、温かく可能性を提示しながら回答してください。`;

  const result = await model.generateContent(ragPrompt);
  const answer = result.response.text();

  // Update session with new messages
  const updatedMessages = [
    ...history,
    { role: "user" as const, content: question },
    { role: "assistant" as const, content: answer },
  ];

  await supabase
    .from("concierge_sessions")
    .update({ messages_json: updatedMessages })
    .eq("id", session.id);

  // Calculate source metrics for confidence scoring
  const wikiSourceCount = wikiResults?.length || 0;
  const avgTrustScore = wikiResults && wikiResults.length > 0
    ? wikiResults.reduce((sum, w: Record<string, unknown>) => sum + ((w.avg_trust_score as number) || 0), 0) / wikiResults.length
    : 0;

  return {
    sessionId: session.id,
    answer,
    messages: updatedMessages,
    wikiSourceCount,
    avgTrustScore,
  };
}
