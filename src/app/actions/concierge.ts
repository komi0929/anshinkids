"use server";

import { createClient } from "@/lib/supabase/server";
import { askConcierge as askConciergeAI } from "@/lib/ai/concierge-rag";

export async function askConcierge(sessionId: string | null, question: string) {
  try {
    const supabase = await createClient();

    let userId: string | null = null;
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
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
          answer: `ご相談ありがとうございます 🌿

お子さまのアレルギーについてのお悩み、よく伝わってきます。日々、お子さまの安全を最優先に考えながら食事を準備されているのは、本当に素晴らしいことです。

一般的に以下のステップがお役に立つかもしれません：

• **主治医との定期的な相談**: 負荷試験の進め方やタイミングは、お子さまの状態により大きく異なります
• **トークルームへの投稿**: 同じ悩みを持つ保護者の方からのリアルな体験談が集まりつつあります
• **食品メーカーへの直接確認**: アレルゲンのコンタミネーション情報は、メーカーに直接問い合わせることが最も確実です

一人で抱え込まないでくださいね。あんしんキッズは、いつでもお話を伺います 💚${loginNote}`,
          messages: [],
        },
      };
    }

    const result = await askConciergeAI(userId, sessionId, question);
    return { success: true, data: result };
  } catch (err) {
    console.error("[askConcierge]", err);
    return { success: false, error: "AIの応答に失敗しました。しばらくしてからお試しください。" };
  }
}
