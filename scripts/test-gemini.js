const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());
const { getGeminiFlash, SYSTEM_PROMPTS } = require("./src/lib/ai/gemini");
const { getExtractionPrompt } = require("./src/lib/wiki/article-templates");

async function testGemini() {
  const model = getGeminiFlash(SYSTEM_PROMPTS.batchExtractor);
  
  const messagesText = `
[発言ID:1] 3歳の娘が卵アレルギーで、主治医から「そろそろ負荷試験を」と言われています。経験者の方、当日の流れや準備しておいてよかったものを教えてください😢
[発言ID:2] うちは4歳の時に卵白の負荷試験をしました。朝9時に病院入りして、15分おきに卵白を少量ずつ摂取。6時間の滞在でした。持ち物は着替え（嘔吐に備え）、DVDプレイヤー（暇つぶし）、お気に入りのおもちゃがあると◎
[発言ID:3] うちの子は3歳半で挑戦して、1/4個で腹痛が出ました。結果は「加熱卵1/8個まで可」。少しだけど大きな一歩でした！焦らず少しずつがいいです。負荷の量は主治医としっかり相談してくださいね。
`;

  const prompt = getExtractionPrompt("challenge", messagesText, "");
  console.log("Sending to Gemini...");
  
  try {
    const start = Date.now();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.2 
      }
    });
    console.log(`Success! Took ${Date.now() - start}ms`);
    console.log(result.response.text());
  } catch (err) {
    console.error("Gemini Error:", err);
  }
}

testGemini();
