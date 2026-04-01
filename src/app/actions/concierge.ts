"use server";

import { createClient } from "@/lib/supabase/server";
import { askConcierge as askConciergeAI } from "@/lib/ai/concierge-rag";
import { getMyProfile } from "./mypage";

export async function askConcierge(sessionId: string | null, question: string, contextPayload?: string) {
  try {
    const supabase = await createClient();

    let userId: string | null = null;
    let finalPayload = contextPayload;

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;

      if (userId) {
        // Fetch real DB profile over client localstorage
        const { data: profile } = await getMyProfile();
        if (profile) {
          finalPayload = JSON.stringify({
             children: profile.children_profiles || [],
             allergies: profile.allergen_tags || []
          });
        }
      }
    }

    // Check if API key is configured
    if (!process.env.GOOGLE_API_KEY || !userId) {
      // Demo/guest response
      const loginNote = !userId
        ? "\n\n---\n💡 ログインすると、より詳しい個別相談ができます。"
        : "";
      return {
        success: true,
        data: {
          sessionId: sessionId || "demo",
          answer: `ご相談ありがとうございます 🌿\n\nお子さまのアレルギーについてのお悩み、よく伝わってきます。日々、お子さまの安全を最優先に考えながら食事を準備されているのは、本当に素晴らしいことです。\n\n一般的に以下のステップがお役に立つかもしれません：\n\n• **主治医との定期的な相談**: 負荷試験の進め方やタイミングは、お子さまの状態により大きく異なります\n• **トークルームへの投稿**: 同じ悩みを持つ保護者の方からのリアルな体験談が集まりつつあります\n• **食品メーカーへの直接確認**: アレルゲンのコンタミネーション情報は、メーカーに直接問い合わせることが最も確実です\n\n一人で抱え込まないでくださいね。あんしんキッズは、いつでもお話を伺います 💚${loginNote}`,
          messages: [],
          wikiSourceCount: 0,
          avgTrustScore: 0,
        },
      };
    }

    const result = await askConciergeAI(userId, sessionId, question, finalPayload);
    return { success: true, data: result };
  } catch (err) {
    console.error("[askConcierge]", err);
    return { success: false, error: "AIの応答に失敗しました。しばらくしてからお試しください。" };
  }
}

/**
 * Gap 4: Allow concierge consultations to feed back into Wiki.
 * Users can choose to anonymously contribute their question/experience
 * to the knowledge base, making the AI smarter for future consultations.
 */
export async function contributeFromConcierge(questionText: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { success: false, error: "DB未接続" };

    // User is optional — guests can contribute too
    const { data: { user } } = await supabase.auth.getUser();

    // Use AI to determine if this consultation contains new knowledge
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      // Fallback: store as raw contribution
      await supabase.from("wiki_sources").insert({
        wiki_entry_id: null,
        original_message_snippet: questionText.slice(0, 500),
        contributor_id: user?.id || null,
        contributor_trust_score: 0,
        source_type: "concierge",
      });
      return { success: true };
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Ask AI to extract structured knowledge from the consultation
    const prompt = `あなたは食物アレルギー情報の整理AIです。

以下はAIコンシェルジュへの相談内容です。この中に、他の保護者の役に立つ一次情報が含まれていますか？

相談内容:
「${questionText}」

タスク:
1. 一次情報（具体的な商品名、病院名、年齢、経験談など）が含まれているか判定
2. 含まれている場合、適切なWikiカテゴリーを決定
3. 構造化されたJSON形式で返す

含まれていない場合（一般的な質問のみの場合）は {"has_knowledge": false} を返してください。

含まれている場合:
{
  "has_knowledge": true,
  "title": "記事タイトル案",
  "category": "商品情報|体験記|対処法|レシピ|基礎知識",
  "summary": "抽出された一次情報の要約",
  "allergen_tags": ["卵", "乳"],
  "tips": ["具体的な工夫や情報"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.has_knowledge) {
        // Create or update wiki entry
        const slug = (parsed.title || "相談から")
          .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, "-")
          .replace(/-+/g, "-")
          .toLowerCase()
          .slice(0, 100);

        // Check if similar entry exists
        const { data: existing } = await supabase
          .from("wiki_entries")
          .select("id, content_json, source_count")
          .or(`slug.eq.${slug},title.ilike.%${parsed.title}%`)
          .limit(1)
          .single();

        if (existing) {
          // Merge into existing
          const currentContent = (existing.content_json || {}) as Record<string, unknown[]>;
          const tips = currentContent.tips || [];
          await supabase
            .from("wiki_entries")
            .update({
              content_json: {
                ...currentContent,
                tips: [...(tips as unknown[]), ...(parsed.tips || []).map((t: string) => ({ text: t, source: "AI相談から", added_at: new Date().toISOString() }))],
              },
              source_count: (existing.source_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          // Record source
          await supabase.from("wiki_sources").insert({
            wiki_entry_id: existing.id,
            original_message_snippet: questionText.slice(0, 500),
            contributor_id: user?.id || null,
            contributor_trust_score: 0,
            source_type: "concierge",
          });
        } else {
          // Create new entry
          const { data: newEntry } = await supabase
            .from("wiki_entries")
            .insert({
              title: parsed.title,
              slug,
              category: parsed.category || "その他",
              summary: parsed.summary,
              content_json: { tips: (parsed.tips || []).map((t: string) => ({ text: t, source: "AI相談から" })) },
              allergen_tags: parsed.allergen_tags || [],
              source_count: 1,
              is_public: true,
            })
            .select()
            .single();

          if (newEntry) {
            await supabase.from("wiki_sources").insert({
              wiki_entry_id: newEntry.id,
              original_message_snippet: questionText.slice(0, 500),
              contributor_id: user?.id || null,
              contributor_trust_score: 0,
              source_type: "concierge",
            });
          }
        }
      }
    }

    // Update contributor stats
    if (user) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_contributions")
          .eq("id", user.id)
          .single();
        await supabase
          .from("profiles")
          .update({ total_contributions: ((profile?.total_contributions as number) || 0) + 1 })
          .eq("id", user.id);
      } catch { /* best effort */ }
    }

    return { success: true };
  } catch (err) {
    console.error("[contributeFromConcierge]", err);
    return { success: false, error: "貢献の処理に失敗しました" };
  }
}
