import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createAdminClient } from "../src/lib/supabase/admin";
import { THEMES } from "../src/lib/themes";
import { runBatchExtraction } from "../src/lib/ai/batch-processor";

const THEME_CONVERSATIONS: Record<string, { topicTitle: string; topicPreview: string; messages: string[] }[]> = {
  "family": [
    {
      topicTitle: "祖父母にアレルギーの深刻さを理解してもらうには？",
      topicPreview: "「少しくらい大丈夫でしょ」と言われてつらい",
      messages: [
        "義母に「少しくらい食べさせても平気でしょ？昔はそんな病気なかった」と言われて困っています。なかなか理解してもらえず帰省がストレスです…同じ悩みの方いますか？",
        "同じです！うちも最初は理解してもらえなくて、主治医の先生に紙の説明書を書いてもらいました。「医師の指示」という形にすると受け入れてもらいやすかったです💡",
        "アレルギーポータルの「おじいちゃん・おばあちゃんにも知ってほしい食物アレルギーのこと」というパンフレットが無料でダウンロードできますよ！イラスト入りで分かりやすいです。",
        "うちの場合は実際にアナフィラキシーで救急搬送された時のエピペンの写真を見せたら、義父母の態度が一変しました。深刻さを伝えるのは辛いけど大事だと思います。",
        "あとは、お義母さんにも「作れるメニュー」を一緒に考えると前向きになってくれることもありますよ。「おばあちゃんの◯◯は安心して食べられるね！」って子どもが喜ぶと嬉しそうにしてます😊"
      ]
    }
  ],
  "milestone": [
    {
      topicTitle: "卵が食べられるようになった！経過を記録します",
      topicPreview: "2年がかりで克服できました🎉",
      messages: [
        "報告です！4歳の娘が2年かけて卵アレルギーを克服できました🎉🎉🎉 経過を共有します。2歳で完全除去→3歳で加熱卵1/8個→3歳半で半個→4歳で全卵OK！皆さんの情報に何度も助けられました🙏",
        "おめでとうございます🎊 うちも今3歳で卵白が少しだけ食べられるようになってきたところです。希望をもらいました！ちなみに負荷試験はどのくらいの間隔で受けましたか？",
        "ありがとうございます！負荷試験は3〜4ヶ月おきに受けてました。その間は自宅で主治医の指示量を毎日食べ続ける（維持療法）を頑張りました。毎日の積み重ねが大きかったです。",
        "うちは乳アレルギー持ちの息子が、5歳でヨーグルト25gまで食べられるようになりました！全然食べられなかった頃が嘘みたい。牛乳はまだだけど、加工品は大丈夫になってきて料理の幅が広がりました🥛",
        "小麦アレルギー持ちの娘、3歳半で醤油と味噌がOKに！調味料が使えるだけで本当に世界が変わりました。お弁当のおかずの味付けバリエーションが増えて嬉しいです🌈"
      ]
    }
  ]
};

async function seed(themesToSeed: string[]) {
  const supabase = createAdminClient();

  for (const themeSlug of themesToSeed) {
    const theme = THEMES.find(t => t.slug === themeSlug);
    if (!theme) continue;

    console.log(`[SeedLocal] Processing theme: ${theme.name} (${theme.slug})`);

    const { data: room } = await supabase.from("talk_rooms").select("id").eq("slug", theme.slug).single();
    if (!room) continue;

    await supabase.from("messages").delete().eq("room_id", room.id);
    await supabase.from("talk_topics").delete().eq("room_id", room.id);

    await supabase.from("wiki_entries").upsert({
      slug: `mega-${theme.slug}`,
      category: theme.name,
      title: `【みんなの知恵袋】${theme.name}`,
      theme_slug: theme.slug,
      is_mega_wiki: true,
      is_public: true,
      sections: [],
      source_count: 0,
      summary: theme.description,
    }, { onConflict: "slug" });

    const conversations = THEME_CONVERSATIONS[theme.slug] || [];
    const oldDate = new Date(Date.now() - 3600000).toISOString();
    const expireDate = new Date(Date.now() + 86400000 * 3).toISOString();

    for (const conv of conversations) {
      const { data: topic } = await supabase.from("talk_topics").insert({
        room_id: room.id,
        title: conv.topicTitle,
        last_message_preview: conv.topicPreview,
        message_count: conv.messages.length,
        is_active: true
      }).select().single();

      if (!topic) continue;

      const msgRows = conv.messages.map((content) => ({
        room_id: room.id,
        topic_id: topic.id,
        content,
        ai_extracted: false,
        thanks_count: Math.floor(Math.random() * 12),
        created_at: oldDate,
        expires_at: expireDate,
      }));

      await supabase.from("messages").insert(msgRows);
    }
  }

  console.log("[SeedLocal] Data inserted. Running batch extraction...");

  await supabase.from("batch_logs").update({ status: "error", error_log: "force-cleared from local" }).eq("status", "running");

  const result = await runBatchExtraction();
  console.log("[SeedLocal] Extraction completed:", result);
}

seed(["family", "milestone"]).catch(console.error);
