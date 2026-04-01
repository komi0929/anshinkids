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

  // Mix context keywords gracefully
  let combinedQuery = question;
  if (contextPayload) {
    try {
      const p = JSON.parse(contextPayload);
      if (p.children && p.children.length > 0) {
        const algs = p.children.flatMap((c: Record<string, unknown>) => [...((c.allergens as string[]) || []), ...((c.customAllergens as string[]) || [])]);
        if (algs.length > 0) combinedQuery += " " + algs.join(" ");
      }
    } catch { /* skip */ }
  }

  const questionKeywords = combinedQuery
    .replace(/[？?！!。、\s]+/g, " ")
    .split(" ")
    .filter(w => w.length >= 2)
    .slice(0, 5);

  let wikiResults: Record<string, unknown>[] = [];

  // 1. Keyword-matched results (most relevant)
  if (questionKeywords.length > 0) {
    const orFilter = questionKeywords
      .map(k => `title.ilike.%${k}%,summary.ilike.%${k}%`)
      .join(",");
    const { data: matched } = await supabase
      .from("wiki_entries")
      .select("title, summary, content_json, allergen_tags, avg_trust_score, source_count")
      .or(orFilter)
      .order("avg_trust_score", { ascending: false })
      .limit(5);
    if (matched) wikiResults = matched;
  }

  // 2. Fill remaining slots with top entries by trust score
  const existingIds = new Set(wikiResults.map(w => w.title));
  const { data: topEntries } = await supabase
    .from("wiki_entries")
    .select("title, summary, content_json, allergen_tags, avg_trust_score, source_count")
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
        `【${w.title}】(信頼度: ${w.avg_trust_score})\n${w.summary || JSON.stringify(w.content_json).slice(0, 500)}`
    )
    .join("\n\n---\n\n");

  // Build prompt with RAG context + social proof
  const totalSources = wikiResults.reduce((sum, w) => sum + ((w.source_count as number) || 0), 0);
  const sourceProof = totalSources > 0
    ? `\n\n## 重要な回答スタイル:\n回答の冒頭で「この情報は${totalSources}件の保護者の実体験にもとづいています」と伝えてください。\n具体的な体験の引用がある場合は「ある保護者の方は〜」のように紹介してください。\n回答の最後に「このテーマについてあなたの体験もぜひトークルームで共有してください。みんなの知恵がさらに育ちます」と添えてください。`
    : "";

  const ragPrompt = `${SYSTEM_PROMPTS.concierge}

## 相談者のプロフィール情報（回答のパーソナライズに活用してください）:
${contextPayload || "未設定"}

## 参照可能な一次情報データベース（AI動的Wiki）:
${wikiContext || "（まだ一次情報が蓄積されていません。一般的なアドバイスで回答してください）"}
${sourceProof}

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
