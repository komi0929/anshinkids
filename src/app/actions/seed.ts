"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * F1: Cold Start Countermeasure — Seed Content System
 * 
 * 新Wiki分類:「商品情報 / 体験記 / 対処法 / レシピ / 基礎知識」
 * 各カテゴリ1〜2記事。テーマの重複なし。
 */

const SEED_WIKI_ENTRIES = [
  {
    title: "卵不使用のおすすめ市販おやつ（2026年版）",
    slug: "egg-free-snacks-2026",
    category: "商品情報",
    summary: "卵不使用で安心して食べられる市販おやつのまとめ。コンタミ情報も記載。",
    allergen_tags: ["卵"],
    content_json: {
      tips: [
        { text: "アンパンマンのスティックパンは卵不使用ですが、同一ラインで卵製品を製造しているので要確認です", source: "初期データ" },
        { text: "セブンイレブンのもちもちリングドーナツは卵・乳不使用として人気ですが、定期的に原材料確認をおすすめします", source: "初期データ" },
        { text: "「太陽食品」の卵不使用マヨネーズは、サラダやお弁当のサンドイッチに使えて便利です", source: "初期データ" },
      ],
    },
  },
  {
    title: "乳アレルギーでも行ける外食チェーン情報",
    slug: "dairy-free-restaurants",
    category: "商品情報",
    summary: "乳成分に配慮のある外食チェーンの対応状況まとめ。",
    allergen_tags: ["乳"],
    content_json: {
      tips: [
        { text: "CoCo壱番屋はアレルゲン一覧表をウェブサイトで公開しています。乳抜きで注文できるメニューも多いです", source: "初期データ" },
        { text: "くら寿司は全メニューのアレルギー情報をタッチパネルで確認可能です", source: "初期データ" },
        { text: "モスバーガーは低アレルゲンメニューを常設しています。店舗で「アレルギー対応表」を依頼できます", source: "初期データ" },
      ],
    },
  },
  {
    title: "保育園への生活管理指導表の書き方と面談のコツ",
    slug: "daycare-allergy-communication",
    category: "対処法",
    summary: "入園時のアレルギー対応依頼の伝え方と準備書類のポイント。",
    allergen_tags: [],
    content_json: {
      tips: [
        { text: "入園前面談で「生活管理指導表」を持参し、主治医の記入済みのものを提出すると話がスムーズです", source: "初期データ" },
        { text: "「除去食の範囲」を具体的に書面で伝えると、調理担当者にも正確に伝わります", source: "初期データ" },
        { text: "緊急時の対応フロー（エピペン有無、かかりつけ医の連絡先）は必ず書面で共有を", source: "初期データ" },
        { text: "年度替わりで担任が変わる際は、改めて面談を依頼すると安心です", source: "初期データ" },
      ],
    },
  },
  {
    title: "エピペンの正しい使い方・保管・有効期限の管理",
    slug: "epipen-usage-guide",
    category: "基礎知識",
    summary: "エピペンの正しい使い方、保管温度、有効期限の管理方法。",
    allergen_tags: [],
    content_json: {
      tips: [
        { text: "エピペンは太ももの外側に垂直に強く押し込みます。服の上からでも注射可能です", source: "初期データ" },
        { text: "保管温度は15〜30℃。車内や直射日光は避けてください", source: "初期データ" },
        { text: "有効期限は約1年。スマホのリマインダーで更新日を管理すると忘れません", source: "初期データ" },
        { text: "練習用トレーナーで家族全員が使い方を練習しておくと緊急時に慌てません", source: "初期データ" },
      ],
    },
  },
  {
    title: "米粉でつくる簡単パンケーキ・おやつレシピ集",
    slug: "rice-flour-recipes",
    category: "レシピ",
    summary: "小麦の代わりに米粉を使った、お子さま向けの簡単レシピ集。",
    allergen_tags: ["小麦"],
    content_json: {
      tips: [
        { text: "米粉パンケーキ：米粉100g、豆乳120ml、砂糖15g、ベーキングパウダー小さじ1を混ぜて焼くだけ", source: "初期データ" },
        { text: "米粉の天ぷら粉として使うと、小麦粉よりカリッと仕上がります", source: "初期データ" },
        { text: "「みたけ食品」のお米の粉シリーズは製菓用・料理用で分かれていて使いやすいです", source: "初期データ" },
      ],
    },
  },
  {
    title: "アレルギーっ子との旅行・外出で困らないための準備術",
    slug: "travel-with-allergy-kids",
    category: "対処法",
    summary: "旅行先・外出先でのアレルギー対応の工夫まとめ。",
    allergen_tags: [],
    content_json: {
      tips: [
        { text: "旅行前にホテルにアレルギー対応の相談メールを送ると、朝食対応してくれる宿が多いです", source: "初期データ" },
        { text: "100均のタッパーに「安全なおやつセット」を入れて外出すると、急な空腹にも対応できます", source: "初期データ" },
        { text: "「アレルギー対応カード」を英語・日本語で作って財布に入れておくと外食時に便利", source: "初期データ" },
        { text: "飛行機の機内食はアレルギー対応が事前予約できる航空会社が多いので、搭乗前に確認を", source: "初期データ" },
      ],
    },
  },
  {
    title: "食物アレルギーの血液検査の読み方（クラスとは？）",
    slug: "allergy-blood-test-guide",
    category: "基礎知識",
    summary: "IgE抗体検査のクラス分類の意味と、数値だけで判断できない理由。",
    allergen_tags: ["卵", "乳", "小麦"],
    content_json: {
      tips: [
        { text: "クラス2以上＝食べられない、ではありません。血液検査は「感作」を示すだけで、実際に症状が出るかは別問題です", source: "初期データ" },
        { text: "「特異的IgE抗体価」の数値が高くても、日常的に食べてまったく症状が出ないお子さんもいます", source: "初期データ" },
        { text: "血液検査の結果だけで除去食を始めないでください。必ず主治医と相談の上、必要に応じて負荷試験を", source: "初期データ" },
      ],
    },
  },
  {
    title: "「うちの子、初めてケーキを食べられた！」家族の体験記",
    slug: "first-cake-stories",
    category: "体験記",
    summary: "アレルギー対応ケーキを食べられた嬉しい瞬間の記録。",
    allergen_tags: ["卵", "乳", "小麦"],
    content_json: {
      tips: [
        { text: "シャトレーゼのアレルギー対応ケーキは卵・乳・小麦不使用。誕生日に初めて「みんなと同じケーキ」を食べられた瞬間は家族みんなで泣きました", source: "初期データ" },
        { text: "タカキヘルスケアフーズの米粉パンは、通販で定期購入可能。「やっと普通にサンドイッチを作ってあげられた」という声が多いです", source: "初期データ" },
        { text: "コージーコーナーも季節限定でアレルギー対応ケーキを販売。事前予約が必要ですが、クリスマスにはぜひ", source: "初期データ" },
      ],
    },
  },
];

export async function seedWikiContent() {
  try {
    const supabase = createAdminClient();
    if (!supabase) return { success: false, error: "Admin client not available" };

    const { data: existing } = await supabase
      .from("wiki_entries")
      .select("slug")
      .in("slug", SEED_WIKI_ENTRIES.map(e => e.slug));

    const existingSlugs = new Set((existing || []).map(e => e.slug));
    const toInsert = SEED_WIKI_ENTRIES.filter(e => !existingSlugs.has(e.slug));

    if (toInsert.length === 0) {
      return { success: true, message: "シードデータは既に投入済みです", inserted: 0 };
    }

    const entries = toInsert.map(entry => ({
      ...entry,
      source_count: entry.content_json.tips.length,
      avg_trust_score: 50,
      is_public: true,
    }));

    const { error } = await supabase.from("wiki_entries").insert(entries);

    if (error) {
      console.error("[seedWikiContent]", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: `${toInsert.length}件のシードコンテンツを投入しました`,
      inserted: toInsert.length,
    };
  } catch (err) {
    console.error("[seedWikiContent]", err);
    return { success: false, error: "シード投入に失敗しました" };
  }
}

/**
 * Talk Room テーマを「実体験を聞きたい」軸で更新
 * 負荷試験は1テーマに統一。通院・治療の曖昧カテゴリは廃止。
 */
const NEW_TALK_ROOMS = [
  { slug: "daily-food", name: "毎日のごはん", description: "献立・代替食材・お弁当のリアルな工夫", icon_emoji: "🍚", sort_order: 1 },
  { slug: "products", name: "使ってよかった市販品", description: "おやつ・パン・調味料のクチコミ", icon_emoji: "🛒", sort_order: 2 },
  { slug: "eating-out", name: "外食・おでかけ", description: "チェーン店・旅行・イベントの対応", icon_emoji: "🍽️", sort_order: 3 },
  { slug: "school-life", name: "園・学校との連携", description: "給食・面談・行事の乗り切り方", icon_emoji: "🏫", sort_order: 4 },
  { slug: "challenge", name: "負荷試験の体験談", description: "準備・当日の流れ・結果後の変化", icon_emoji: "🧪", sort_order: 5 },
  { slug: "skin-body", name: "肌とからだのケア", description: "アトピー・保湿・スキンケアの工夫", icon_emoji: "🧴", sort_order: 6 },
  { slug: "family", name: "気持ち・家族・まわり", description: "不安・理解・パートナーや祖父母との関わり", icon_emoji: "👨‍👩‍👧", sort_order: 7 },
  { slug: "milestone", name: "食べられた！の記録", description: "克服・成長のうれしい報告", icon_emoji: "🌱", sort_order: 8 },
];

export async function updateTalkRoomThemes() {
  try {
    const supabase = createAdminClient();
    if (!supabase) return { success: false, error: "Admin client not available" };

    // Deactivate old rooms
    await supabase
      .from("talk_rooms")
      .update({ is_active: false })
      .eq("is_active", true);

    // Upsert new rooms
    for (const room of NEW_TALK_ROOMS) {
      const { data: existing } = await supabase
        .from("talk_rooms")
        .select("id")
        .eq("slug", room.slug)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("talk_rooms")
          .update({ ...room, is_active: true })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("talk_rooms")
          .insert({ ...room, is_active: true });
      }
    }

    return {
      success: true,
      message: `${NEW_TALK_ROOMS.length}件のテーマを更新しました`,
    };
  } catch (err) {
    console.error("[updateTalkRoomThemes]", err);
    return { success: false, error: "テーマ更新に失敗しました" };
  }
}
