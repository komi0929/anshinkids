export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runBatchExtraction } from "@/lib/ai/batch-processor";
import { THEMES } from "@/lib/themes";

/**
 * Seed all 8 themes with realistic dummy conversations then trigger AI extraction.
 * Call: GET /api/seed-all-themes
 */

// Realistic dummy conversations for each theme
const THEME_CONVERSATIONS: Record<string, { topicTitle: string; topicPreview: string; messages: string[] }[]> = {
  "daily-food": [
    {
      topicTitle: "卵不使用の市販おやつ・おかず情報交換！",
      topicPreview: "最近見つけた卵不使用のものありますか？",
      messages: [
        "幼稚園のお弁当が始まるのですが、卵アレルギーがあるのでウインナーとかかまぼこも気を使います。卵不使用でリピートしている市販のおかずや、おすすめのおやつがあれば教えてください！",
        "ニッポンハムの『みんなの食卓』シリーズは卵・乳など不使用で専用工場で作られているので一番安心です！ウインナーもミートボールもお弁当に大活躍していますよ。",
        "おやつなら、シャトレーゼの乳と卵と小麦粉を使用していないケーキやアイスがあります！ストックしておくと、他の子がケーキを食べている時にも同じように出せるので助かってます🙌",
        "市販のミートボールは『イシイのおべんとクン ミートボール』も卵・乳不使用です！どこでも買えるのでめちゃくちゃ助かります。",
        "アンパンマンのカレーとかアンパンマンポテトも卵不使用なので、お弁当の隙間埋めに重宝してます。ただ、ポテトは製造ラインで卵使用製品を作ってたりするので裏面のコンタミ表示は毎回チェックするようにしています。"
      ]
    },
    {
      topicTitle: "米粉パン、どこのがモチモチでおすすめ？",
      topicPreview: "スーパーで買えるものでおすすめ知りたいです！",
      messages: [
        "朝食用のパンで、小麦不使用でモチモチしているものってありますか？いくつか試したんですがパサパサしていて子供が食べてくれません😭",
        "スーパーで買えるなら『マイセン』の玄米パンや米粉パンがおいしいです！少しトーストするとカリッとして中はモチモチになりますよー✨",
        "うちはイオンのトップバリュ『やさしごはん』シリーズのお米パンを買ってます🍞特定原材料7品目不使用で、レンジで少し温めるとフワフワになって美味しいです！"
      ]
    }
  ],
  "products": [
    {
      topicTitle: "乳不使用のチョコレート・クッキーありますか？",
      topicPreview: "バレンタインで困っています",
      messages: [
        "もうすぐバレンタインなのですが、乳アレルギーの息子が友達と同じようにチョコレートを楽しめるものを探しています。乳不使用のチョコレート商品ありますか？",
        "辻安全食品の『元祖板チョコ』シリーズは乳成分完全不使用です！かなり本格的な味で大人でも美味しいですよ。通販で買えます。",
        "ブルボンのプチシリーズの中に乳不使用のものがいくつかあります。公式サイトのアレルゲン検索が便利です。プチポテトの塩味やうす焼きが該当しますね。",
        "最近見つけたのが『DARI K（ダリケー）』というメーカーの生チョコ。原料がカカオと砂糖だけで乳不使用です！バレンタインにもぴったりでした😊"
      ]
    },
    {
      topicTitle: "給食の代替弁当に使える冷凍食品リスト",
      topicPreview: "7品目不使用の冷凍食品まとめたい！",
      messages: [
        "毎日の代替弁当を作るのが辛くて…7品目不使用の冷凍食品で使えるものリスト化したいです。皆さんのおすすめ教えてください！",
        "ニチレイの『アレルゲンフリー弁当用おかず』は工場単位で7品目不使用なので安心です！ハンバーグと肉だんごをローテーションさせてます。",
        "テーブルマークの冷凍うどんは小麦不使用の米粉うどんがありますよ！レンジで3分で完成するので忙しい朝に助かります。",
        "あと意外と知られてないのがピカール（フランスの冷凍専門店）。グルテンフリーのピザ生地とか、乳不使用のアイスとか、選択肢が豊富です。"
      ]
    }
  ],
  "eating-out": [
    {
      topicTitle: "アレルギー対応が良かったチェーン店まとめ",
      topicPreview: "安心して外食できるお店情報ほしい",
      messages: [
        "家族で外食する時、いつも不安で結局行けないことが多いです。アレルギー対応が良かったチェーン店があれば教えてください🙏",
        "CoCo壱番屋は低アレルゲンカレーがあって、特定原材料7品目不使用です！別鍋で調理してくれて、席まで成分表も持ってきてくれました。",
        "モスバーガーのアレルギー対応もしっかりしてます。低アレルゲンメニュー（モスの菜摘バーガー）があって、バンズをレタスで包んでくれます。アレルギー一覧表もかなり詳細です。",
        "サイゼリヤは意外とアレルゲン情報が詳細で、公式サイトのメニュー別アレルゲン表がダウンロードできます。ドリアとかグラタン以外なら乳不使用のメニューもけっこうありますよ。",
        "くら寿司はアレルゲン情報がタッチパネルで確認できて便利です！醤油も小麦不使用のたまり醤油に変えてもらえました。"
      ]
    }
  ],
  "school-life": [
    {
      topicTitle: "保育園の給食どうしてますか？面談のコツ教えて",
      topicPreview: "入園前面談に向けてアドバイスほしいです",
      messages: [
        "来月から保育園入園です。食物アレルギーの息子（卵・乳）がいるのですが、入園前の面談で園側に何を伝えたらスムーズに進みますか？先輩ママの経験聞きたいです！",
        "面談では必ず医師の「食物アレルギー生活管理指導表」を持参して、除去する食材と程度（完全除去/加熱可など）を明確にしてください。先生の理解度が全然変わりますよ✨",
        "うちの園は代替食を出してくれるタイプでしたが、最初に「誤食した場合のエピペンの使い方」の研修をお願いしたら快く対応してくれました。遠慮せず聞いてみるのがいいと思います！",
        "給食表は月末にもらえるので、毎月チェックして「この日は代替弁当の方が安心」と伝えるとスムーズです。全部を園任せにしないことでお互いの信頼関係が築けました。",
        "遠足の時は特に要注意です。おやつ交換の文化があるので、先生に「他の子のおやつを食べないよう見ていてほしい」と事前にお伝えしましょう。交換用にアレルギー対応のおやつを持たせるのも手です。"
      ]
    }
  ],
  "challenge": [
    {
      topicTitle: "卵の食物負荷試験やった方いますか？",
      topicPreview: "怖いけど挑戦したい。体験談聞きたい",
      messages: [
        "3歳の娘が卵アレルギーで、主治医から「そろそろ負荷試験を」と言われています。経験者の方、当日の流れや準備しておいてよかったものを教えてください😢",
        "うちは4歳の時に卵白の負荷試験をしました。朝9時に病院入りして、15分おきに卵白を少量ずつ摂取。6時間の滞在でした。持ち物は着替え（嘔吐に備え）、DVDプレイヤー（暇つぶし）、お気に入りのおもちゃがあると◎",
        "うちの子は3歳半で挑戦して、1/4個で腹痛が出ました。結果は「加熱卵1/8個まで可」。少しだけど大きな一歩でした！焦らず少しずつがいいです。負荷の量は主治医としっかり相談してくださいね。",
        "私は子どものために負荷試験ノートを作りました。食べた量、時間、症状の有無を記録するものです。先生にも好評でしたし、次回の負荷試験の参考になりました📝",
        "当日は空腹で来て、と指示されました。試験用の卵製品は病院が用意してくれるパターンと持参パターンがあるので事前に確認しておくといいですよ！"
      ]
    }
  ],
  "skin-body": [
    {
      topicTitle: "アトピー用の保湿剤、何使ってますか？",
      topicPreview: "冬になって肌荒れがひどくなってきた",
      messages: [
        "2歳の息子がアトピーで、冬になると乾燥がひどくなります。皮膚科のヒルドイドだけじゃ足りないのでプラスで使える保湿剤を探しています。おすすめありますか？",
        "うちは『ケアセラ APフェイス＆ボディクリーム』を全身に塗ってます。セラミド配合で無香料・無着色。べたつかないのに夕方までしっとりしてるのが気に入ってます！",
        "キュレルのクリームを塗った上からワセリンでフタをする二層塗りがうちの定番です。皮膚科でも「その方法でOK」とお墨付きもらいました。特にお風呂上がり5分以内が勝負です！",
        "ヴェレダのカレンドラベビークリームは天然ハーブ成分で敏感肌にも使えます。少し高いですが伸びが良いのでコスパは悪くないですよ。あと入浴剤はアトピタの入浴液がおすすめです🛁"
      ]
    }
  ],
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

export async function GET() {
  try {
    const supabase = createAdminClient();
    const results: Record<string, { topics: number; messages: number }> = {};

    for (const theme of THEMES) {
      console.log(`[SeedAll] Processing theme: ${theme.name} (${theme.slug})`);

      // Find the room
      const { data: room } = await supabase.from("talk_rooms").select("id").eq("slug", theme.slug).single();
      if (!room) {
        console.warn(`[SeedAll] Room not found for ${theme.slug}, skipping.`);
        continue;
      }

      // Clean up old dummy data
      await supabase.from("messages").delete().eq("room_id", room.id);
      await supabase.from("talk_topics").delete().eq("room_id", room.id);

      // Ensure mega-wiki entry exists
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

      // Insert conversations
      const conversations = THEME_CONVERSATIONS[theme.slug] || [];
      let totalMsgs = 0;

      const oldDate = new Date(Date.now() - 3600000).toISOString();
      const expireDate = new Date(Date.now() + 86400000 * 3).toISOString();

      for (const conv of conversations) {
        const { data: topic, error: topicErr } = await supabase.from("talk_topics").insert({
          room_id: room.id,
          title: conv.topicTitle,
          last_message_preview: conv.topicPreview,
          message_count: conv.messages.length,
          is_active: true
        }).select().single();

        if (topicErr || !topic) {
          console.error(`[SeedAll] Topic insert failed for ${theme.slug}:`, topicErr);
          continue;
        }

        const msgRows = conv.messages.map((content) => ({
          room_id: room.id,
          topic_id: topic.id,
          content,
          ai_extracted: false,
          thanks_count: Math.floor(Math.random() * 12),
          created_at: oldDate,
          expires_at: expireDate,
        }));

        const { error: msgErr } = await supabase.from("messages").insert(msgRows);
        if (msgErr) console.error(`[SeedAll] Message insert failed for ${theme.slug}:`, msgErr);
        totalMsgs += msgRows.length;
      }

      results[theme.slug] = { topics: conversations.length, messages: totalMsgs };
    }

    console.log("[SeedAll] All dummy data inserted. Clearing locks and running batch extraction...");

    // Force clear any stuck locks
    await supabase.from("batch_logs").update({ status: "error", error_log: "force-cleared from seed-all" }).eq("status", "running");

    // Run batch extraction (processes all rooms that have unextracted messages)
    const extractionResult = await runBatchExtraction();

    return NextResponse.json({
      success: true,
      seeded: results,
      extraction: extractionResult,
    });
  } catch (err: unknown) {
    console.error("[SeedAll] Error:", err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : JSON.stringify(err),
    });
  }
}
