/**
 * ============================================================
 * 🧪 記事生成シミュレーター
 * ============================================================
 * 
 * 実際のバッチ処理パイプラインと同一のプロンプトを使い、
 * ダミーのトーク会話から、どのようなWiki記事（JSON）が
 * 生成されるかをローカルで確認できるスクリプト。
 * 
 * 使い方: node scripts/simulate-extraction.mjs
 * ============================================================
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── 設定 ───────────────────────────────────────────────────

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "AIzaSyB7ufS_Oj97WMVfO0h4rTyYtcL9cdUFec0";

// ─── テーマ定義（themes.ts と同一の構造） ─────────────────────

const THEMES = {
  "daily-food": {
    name: "毎日のごはん",
    extractionHint: "レシピ・代替食材・お弁当の工夫を構造化。材料、手順、どのアレルゲン除去かを記録。",
    indexingAxis: "場面別（朝食・昼食・弁当・夕食・おやつ）→ レシピ/食材名",
    sectionSchema: `{
  "heading": "場面名（朝食・弁当など）",
  "items": [{
    "title": "レシピ/食材名",
    "content": "具体的な情報",
    "allergen_free": ["卵", "乳"],
    "mention_count": 1,
    "heat_score": 0,
    "tips": ["工夫やコツ"],
    "is_recommended": false
  }]
}`,
  },
  "products": {
    name: "使ってよかった市販品",
    extractionHint: "商品名、メーカー、対応アレルゲン、味・使い勝手の評価、購入先を構造化。",
    indexingAxis: "カテゴリ（パン・おやつ・調味料・冷凍食品等）→ 商品名",
    sectionSchema: `{
  "heading": "カテゴリ名（パン・おやつなど）",
  "items": [{
    "title": "商品名",
    "brand": "メーカー名",
    "content": "レビュー要約",
    "allergen_free": ["卵"],
    "where_to_buy": ["購入先"],
    "mention_count": 1,
    "heat_score": 0,
    "reviews": [{"rating": 4, "comment": "コメント"}],
    "is_recommended": false
  }]
}`,
  },
  "eating-out": {
    name: "外食・おでかけ",
    extractionHint: "店名、チェーン名、アレルギー対応メニュー有無、スタッフ対応、安全に食べられたメニューを構造化。",
    indexingAxis: "ジャンル（ファストフード・ファミレス・和食・旅行先等）→ 店名/場所",
    sectionSchema: `{
  "heading": "ジャンル名（ファストフードなど）",
  "items": [{
    "title": "店名/チェーン名",
    "content": "対応の詳細",
    "allergy_menu": true,
    "safe_items": ["安全メニュー"],
    "mention_count": 1,
    "heat_score": 0,
    "reviews": [{"rating": 4, "comment": "体験"}],
    "is_recommended": false
  }]
}`,
  },
};

// ─── ダミー会話データ（3テーマ分） ────────────────────────────

const DUMMY_CONVERSATIONS = {
  "daily-food": [
    "[ID:001] [トピック:卵なしでも美味しいおやつ] うちの子は卵アレルギーなんですが、おやつに困っています。最近、米粉とバナナだけで作るパンケーキがすごく良くて、子供も喜んで食べてます！",
    "[ID:002] [トピック:卵なしでも美味しいおやつ] わかります！うちも卵ダメで。バナナパンケーキいいですよね。うちはそこに豆乳ヨーグルト混ぜてます。しっとりして美味しくなりますよ",
    "[ID:003] [トピック:卵なしでも美味しいおやつ] 米粉パンケーキ、焼くときにココナッツオイル使うとさらにサクサクになりますよ〜。冷凍もできるのでお弁当にも入れてます",
    "[ID:004] [トピック:お弁当どうしてる？] お弁当作りが毎日大変で…。卵焼きの代わりに何入れてますか？",
    "[ID:005] [トピック:お弁当どうしてる？] うちはかぼちゃの茶巾！見た目も黄色で卵焼きっぽく見えるし、子供も好き。ラップで包んで絞るだけだから簡単ですよ",
    "[ID:006] [トピック:お弁当どうしてる？] さつまいもスティックもオススメです。オーブンで焼くだけ。甘くて子供喜びます",
    "[ID:007] [トピック:お弁当どうしてる？] ツナとコーンのおにぎり、定番化してます。マヨネーズはキューピーのエッグケアを使ってます",
    "[ID:008] [トピック:朝ごはん何食べてる？] 朝って時間ないから、前日に作り置きしたいんですよね。オートミールに豆乳かけて一晩冷蔵庫に入れておくオーバーナイトオーツ、めちゃ楽です",
    "[ID:009] [トピック:朝ごはん何食べてる？] おすすめ！納豆ごはんに海苔巻くだけでも栄養OK。あとは味噌汁さえあれば完璧かな",
    "[ID:010] [トピック:卵なしでも美味しいおやつ] タピオカ粉で作るポンデケージョもすごくオススメです！チーズアレルギーなければ、もちもちで最高。小麦粉も使わないのでグルテンフリーにもなります",
    "[ID:011] [トピック:朝ごはん何食べてる？] うちは蒸しパンの冷凍ストックしてます。米粉と豆乳で蒸すだけ。レンチンですぐ食べられるので朝助かる",
    "[ID:012] [トピック:夕飯のメイン] ハンバーグのつなぎに卵使えないから、れんこんのすりおろしを入れてます。もちもちして逆に美味しいって言われます笑",
  ],
  "products": [
    "[ID:101] [トピック:おすすめの米粉パン] 日本ハムの「みんなの食卓」シリーズの米粉パン、すごくおいしい！トーストするとサクサクで普通のパンみたい。イオンで買えます",
    "[ID:102] [トピック:おすすめの米粉パン] みんなの食卓いいですよね！うちも常備してます。冷凍できるのもポイント高い",
    "[ID:103] [トピック:おすすめの米粉パン] タイナイの「お米のパン」も美味しいですよ。Amazonで買えます。少しもっちりした食感です",
    "[ID:104] [トピック:おやつ何あげてる？] 28品目不使用で探すとなかなかないけど、「辻安全食品」のクッキー類は信頼できます。味もちゃんと美味しい",
    "[ID:105] [トピック:おやつ何あげてる？] 亀田の「ハイハイン」は赤ちゃんの頃からずっとお世話になってます。国産米100%で安心。コスパも良い",
    "[ID:106] [トピック:おやつ何あげてる？] アンパンマンのおせんべいも28品目不使用でうちの子大好き。スーパーどこでも売ってるし助かる",
    "[ID:107] [トピック:おやつ何あげてる？] 最近見つけた「太田油脂」のノンアレクッキー、素朴で美味しい。楽天で箱買いしてます",
    "[ID:108] [トピック:調味料の選び方] マヨネーズはキューピーの「エッグケア」一択。味も普通のマヨとほぼ変わらない。サラダにもお弁当にも使えて万能",
    "[ID:109] [トピック:調味料の選び方] 創健社の「有機みそ」使ってます。大豆アレルギーの子は使えないけど、添加物なしで安心",
    "[ID:110] [トピック:おすすめの米粉パン] シャールの食パンも卵乳フリーで美味しい。ドイツの会社で品質が高いです。カルディで見かけます",
  ],
  "eating-out": [
    "[ID:201] [トピック:ファミレスで食べられるとこ] ココスがアレルギー対応メニューしっかりしてて助かります。低アレルゲンメニューがあって、卵・乳・小麦・えび・かに・そば・落花生なし。キッズプレートが安心",
    "[ID:202] [トピック:ファミレスで食べられるとこ] ガストも最近よくなりましたよ。アレルギー情報をタブレットで確認できるし、店員さんに伝えると厨房で別調理してくれます",
    "[ID:203] [トピック:ファミレスで食べられるとこ] サイゼリヤはアレルゲン表がしっかりしてて、ドリアとかグラタン避ければ食べられるもの結構あります。コスパもいいし家族で行きやすい",
    "[ID:204] [トピック:回転寿司行ける？] くら寿司は皿ごとのアレルゲン情報がアプリで見られるので安心。ネタによっては卵不使用の握りも選べます",
    "[ID:205] [トピック:回転寿司行ける？] スシローも聞けばアレルゲン表もらえます。うちの子は刺身だけ食べてることも多いですが笑、みんなと同じ場所で食べられるのが嬉しいみたい",
    "[ID:206] [トピック:テーマパーク] ディズニーランドは神対応ですね！アレルギー対応レストランが複数あって、事前にキャストに伝えれば個別対応してくれます。低アレルゲンメニューもあります",
    "[ID:207] [トピック:テーマパーク] USJも対応よくなりました。アレルギー対応セットがいくつかあって、Webで事前確認もできます",
    "[ID:208] [トピック:ファストフード] モスバーガーの低アレルゲンメニューは本当に助かる。専用の調理エリアで作ってくれるので安心感が違います",
    "[ID:209] [トピック:ファストフード] マクドナルドはアレルゲン表はあるけど、フライヤーは共有なので厳密に除去してる家庭は注意が必要です。ポテトだけなら大丈夫かなって感じ",
    "[ID:210] [トピック:旅行先] 沖縄旅行、アレルギー対応のホテルが増えてきてます。ルネッサンスリゾートオキナワは事前に相談すると個別対応してくれました。素晴らしかった",
  ],
};

// ─── プロンプト生成（article-templates.ts と同一ロジック） ───────

function getExtractionPrompt(themeSlug, messagesText, existingSectionsTitleList) {
  const theme = THEMES[themeSlug];
  if (!theme) return "";

  return `あなたは体験まとめ記事の専門編集AIです。
以下のトークルーム「${theme.name}」の直近の会話内容から、保護者にとって価値のある実体験（ナレッジ）を抽出し、Mega-Wiki（総合まとめ記事）の該当セクションへ格納するためのJSONを生成してください。

## テーマ: ${theme.name}
${theme.extractionHint}
分類軸: ${theme.indexingAxis}

## 会話（時系列順）:
${messagesText}

## 既存のセクションとアイテム一覧（重複アイテムを作らないための参考）:
${existingSectionsTitleList || "（まだアイテムがありません）"}

## 出力ルール
1. 以下の出力スキーマに厳格に沿ったJSON配列（[]）を返してください。
2. JSON以外のテキストやMarkdownの装飾（\`\`\`jsonなど）は絶対に含めないでください。
3. すでに既存の「見出し(heading)」や「アイテム(title)」と同じ意味のものがあれば、表記揺れを整えて同じタイトルを出力してください。
4. 情報がない場合、またはノイズのみの場合は空の配列 [] を返してください。
5. 【プライバシー保護】個人名・病院名・地名・SNSアカウント等の個人特定情報は絶対に含めないでください。「ある病院で」「知人が」のように匿名化して記録してください。
6. 【医療的断定の禁止】「〜すべき」「〜が正しい」等の断定表現は使わず、「〜という体験がある」「〜という声が多い」のように体験談として記録してください。

## 出力スキーマ:
[
${theme.sectionSchema}
]`;
}

// ─── メイン実行 ─────────────────────────────────────────────

const SYSTEM_PROMPT = `あなたは食物アレルギーに関する一次情報を抽出・構造化する専門のAI編集者です。
ユーザーのトーク投稿から以下の情報を構造化して抽出してください：

- 商品名・ブランド名
- アレルゲン（卵、乳、小麦、etc.）
- 症状・反応の詳細
- 病院名・医師の対応
- 代替レシピ・工夫
- 飲食店・チェーン店の対応
- 負荷試験の経過・結果

## 編集者としての構造化ルール:
1. **すべての投稿から情報を抽出すること** — 1文字も見逃さない
2. 個人を特定できる情報は除去すること
3. 「断定」は避け、「〜というケースが報告されています」のように記述すること

## 短い発言の取り扱い（超重要）:
- 「○○は最高」「○○おすすめ」→ その商品/食品/店への **支持票**。mentionsカウント+1として記録。
- 「○○使ってる」「うちも○○」→ **利用実績の追加証拠**。mentionsカウント+1。
- 「○○教えて」「おすすめある？」→ **質問（ナレッジギャップ）**。抽出対象ではないが、その質問に対する他の回答と組み合わせて構造化する。
- 「わかります」「そうですよね」→ **共感表明** — 直前の発言への支持票として、直前の内容のmentionsを+1する。
- 純粋な挨拶のみ（「こんにちは」）→ 抽出しない。

## 傾斜のルール:
- 同じ商品/食品に複数の言及がある場合、mentions数を記録し、raw_summaryで「特に○○が好評（N件の言及）」と明記
- 1件のみの言及は「〜という報告もあります」と控えめに記述
- 新しい情報には「🆕」マークを付与

JSON形式で出力してください。`;

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  🧪 あんしんキッズ — 記事生成シミュレーター                ║");
  console.log("║  バッチ処理と同一のプロンプトでダミー会話→Wiki記事を生成   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");

  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const results = {};
  const outputDir = path.join(__dirname, "..", "simulation-output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  for (const [themeSlug, messages] of Object.entries(DUMMY_CONVERSATIONS)) {
    const theme = THEMES[themeSlug];
    console.log(`\n${"─".repeat(60)}`);
    console.log(`📂 テーマ: ${theme.name} (${themeSlug})`);
    console.log(`   会話数: ${messages.length}件`);
    console.log(`${"─".repeat(60)}`);
    
    const messagesText = messages.join("\n");
    const prompt = getExtractionPrompt(themeSlug, messagesText, "");

    console.log("   🤖 Gemini に抽出リクエスト中...");
    
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const responseText = result.response.text();
      let sections;
      try {
        sections = JSON.parse(responseText.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim());
      } catch {
        console.log("   ⚠️  JSON パースエラー。生テキストを保存します。");
        sections = responseText;
      }

      results[themeSlug] = {
        theme: theme.name,
        input_messages: messages.length,
        generated_sections: sections,
      };

      // 結果をコンソールに表示
      if (Array.isArray(sections)) {
        console.log(`   ✅ ${sections.length} セクション生成完了！`);
        console.log("");
        
        for (const sec of sections) {
          console.log(`   ┌─ 📖 ${sec.heading}`);
          if (sec.items && Array.isArray(sec.items)) {
            for (const item of sec.items) {
              const rec = item.is_recommended ? " 👑" : "";
              const mentions = item.mention_count || 1;
              console.log(`   │  ├─ ${item.title}${rec} (${mentions}人の声)`);
              
              // content の最初の80文字を表示
              const contentPreview = (item.content || "").slice(0, 80);
              console.log(`   │  │  ${contentPreview}${item.content?.length > 80 ? "..." : ""}`);
              
              // tips があれば表示
              if (item.tips && item.tips.length > 0) {
                console.log(`   │  │  💡 ${item.tips.join(" / ")}`);
              }
              // allergen_free があれば表示
              if (item.allergen_free && item.allergen_free.length > 0) {
                console.log(`   │  │  🏷️  除去: ${item.allergen_free.join(", ")}`);
              }
              // reviews があれば表示
              if (item.reviews && item.reviews.length > 0) {
                for (const r of item.reviews.slice(0, 2)) {
                  const stars = "⭐".repeat(r.rating || 0);
                  console.log(`   │  │  ${stars} ${r.comment || ""}`);
                }
              }
              // safe_items があれば表示
              if (item.safe_items && item.safe_items.length > 0) {
                console.log(`   │  │  ✅ 安全: ${item.safe_items.join(", ")}`);
              }
              // where_to_buy
              if (item.where_to_buy && item.where_to_buy.length > 0) {
                console.log(`   │  │  🛒 購入先: ${item.where_to_buy.join(", ")}`);
              }
            }
          }
          console.log(`   └─────────────────────────`);
        }
      } else {
        console.log("   ⚠️  配列ではない応答:");
        console.log(JSON.stringify(sections, null, 2).slice(0, 500));
      }
    } catch (err) {
      console.error(`   ❌ エラー: ${err.message}`);
      results[themeSlug] = { theme: theme.name, error: err.message };
    }
  }

  // ─── 結果をファイルに保存 ──────────────────────────────────

  const outputPath = path.join(outputDir, `simulation_${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n${"═".repeat(60)}`);
  console.log(`📄 結果を保存しました: ${outputPath}`);
  console.log(`${"═".repeat(60)}`);

  // ─── サマリー表示 ──────────────────────────────────────────

  console.log("\n📊 シミュレーション結果サマリー:");
  console.log("─────────────────────────────────────────");
  for (const [slug, data] of Object.entries(results)) {
    if (data.error) {
      console.log(`  ❌ ${data.theme}: エラー`);
    } else if (Array.isArray(data.generated_sections)) {
      const totalItems = data.generated_sections.reduce(
        (sum, sec) => sum + (sec.items?.length || 0), 0
      );
      console.log(`  ✅ ${data.theme}: ${data.generated_sections.length}セクション, ${totalItems}アイテム ← ${data.input_messages}件の会話から`);
    }
  }
  console.log("─────────────────────────────────────────");
  console.log("🎉 完了！出力JSONをWiki記事UIのプレビューとして確認できます。");
}

main().catch(console.error);
