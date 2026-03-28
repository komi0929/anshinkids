"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageCircle, BookOpen, Sparkles, Shield, Clock, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="fade-in pb-24">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface)] sticky top-0 z-40">
        <Link
          href="/talk"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <h1 className="text-[15px] font-bold text-[var(--color-text)]">
          あんしんキッズとは
        </h1>
      </div>

      {/* Hero */}
      <div className="px-5 pt-8 pb-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-[var(--color-success)] to-[var(--color-primary)] flex items-center justify-center shadow-lg">
          <span className="text-3xl">🌿</span>
        </div>
        <h2 className="text-[20px] font-bold text-[var(--color-text)] leading-tight">
          食物アレルギーの情報を<br />安心して探せる場所
        </h2>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-3 leading-relaxed max-w-sm mx-auto">
          「あんしんキッズ」は、お子さまの食物アレルギーに
          悩むママ・パパが<strong>体験や情報を気軽に共有・検索</strong>できるサービスです。
        </p>
      </div>

      {/* こんな方に */}
      <div className="px-4 mb-6">
        <div className="card p-5">
          <h3 className="text-[15px] font-bold text-[var(--color-text)] mb-3">
            📌 こんなとき、使ってください
          </h3>
          <ul className="space-y-3 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
            <li className="flex gap-3">
              <span className="text-lg flex-shrink-0">🍪</span>
              <span>「うちの子が食べられるおやつはどれ？」と<strong>市販品の情報</strong>を知りたいとき</span>
            </li>
            <li className="flex gap-3">
              <span className="text-lg flex-shrink-0">🍽️</span>
              <span>「外食でアレルギー対応してくれるお店は？」と<strong>外食情報</strong>を探すとき</span>
            </li>
            <li className="flex gap-3">
              <span className="text-lg flex-shrink-0">🧪</span>
              <span>「負荷試験ってどうだった？」と<strong>他のご家庭の体験談</strong>を聞きたいとき</span>
            </li>
            <li className="flex gap-3">
              <span className="text-lg flex-shrink-0">🏫</span>
              <span>「保育園の給食、どう相談した？」と<strong>園への伝え方</strong>を知りたいとき</span>
            </li>
            <li className="flex gap-3">
              <span className="text-lg flex-shrink-0">💚</span>
              <span>「同じ悩みの人と話したい」と思ったとき</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 3つの機能 */}
      <div className="px-5 mb-2">
        <h3 className="text-[15px] font-bold text-[var(--color-text)]">
          🔰 使い方はかんたん3ステップ
        </h3>
      </div>

      {/* Step 1: トークルーム */}
      <div className="px-4 mb-5">
        <div className="card overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-[var(--color-surface-warm)] to-[var(--color-surface)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[var(--color-text)]">
                  ① トークルームで話す・見る
                </h4>
              </div>
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-3">
              テーマごとに分かれた部屋で、体験談やおすすめ情報を読んだり、気軽に書き込んだりできます。
            </p>
            <ul className="text-[12px] text-[var(--color-subtle)] space-y-1">
              <li>✅ <strong>見るだけでもOK</strong> — ログインしなくても読めます</li>
              <li>✅ 書き込みは<strong>24時間で自動消去</strong> — 発言が残る心配なし</li>
              <li>✅ <strong>匿名のニックネーム</strong>で参加できます</li>
            </ul>
          </div>
          <div className="relative">
            <Image
              src="/about-talk.png"
              alt="トークルームの画面イメージ"
              width={800}
              height={600}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Step 2: 知恵袋 */}
      <div className="px-4 mb-5">
        <div className="card overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-[var(--color-success-light)] to-[var(--color-surface)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-success)]/15 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[var(--color-success)]" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[var(--color-text)]">
                  ② 知恵袋で調べる
                </h4>
              </div>
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-3">
              みんなの投稿をAIが自動で整理して、読みやすい記事にまとめています。
              キーワードやカテゴリで検索できます。
            </p>
            <ul className="text-[12px] text-[var(--color-subtle)] space-y-1">
              <li>✅ 「市販品」「外食」「負荷試験」などカテゴリ別に探せます</li>
              <li>✅ あなたの知っている情報も<strong>かんたんに追加</strong>できます</li>
              <li>✅ 情報の<strong>信頼度</strong>が表示されるので安心</li>
            </ul>
          </div>
          <div className="relative">
            <Image
              src="/about-wiki.png"
              alt="知恵袋の画面イメージ"
              width={800}
              height={600}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Step 3: AI相談 */}
      <div className="px-4 mb-6">
        <div className="card overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-[var(--color-warning-light)] to-[var(--color-surface)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-warning)]/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[var(--color-warning)]" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[var(--color-text)]">
                  ③ AIに相談する
                </h4>
              </div>
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-3">
              みんなの体験をもとに、AIがやさしくお答えします。
              「こんな声がありましたよ」という形でお伝えするので、気軽に聞いてみてください。
            </p>
            <ul className="text-[12px] text-[var(--color-subtle)] space-y-1">
              <li>✅ <strong>ログインなしでも使えます</strong></li>
              <li>✅ よくある質問のサンプルが用意されています</li>
              <li>✅ 自分の言葉で自由に質問できます</li>
            </ul>
          </div>
          <div className="relative">
            <Image
              src="/about-ai.png"
              alt="AI相談の画面イメージ"
              width={800}
              height={600}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 安心ポイント */}
      <div className="px-4 mb-6">
        <div className="card p-5">
          <h3 className="text-[15px] font-bold text-[var(--color-text)] mb-4">
            🔒 安心して使えるポイント
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-success-light)] flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-[var(--color-success)]" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[var(--color-text)]">匿名で参加できます</h4>
                <p className="text-[12px] text-[var(--color-subtle)] mt-0.5">ニックネームで投稿。本名は出ません。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[var(--color-warning)]" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[var(--color-text)]">投稿は24時間で自動削除</h4>
                <p className="text-[12px] text-[var(--color-subtle)] mt-0.5">発言が永遠に残る心配がありません。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-warm)] flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[var(--color-text)]">信頼できる情報づくり</h4>
                <p className="text-[12px] text-[var(--color-subtle)] mt-0.5">たくさんの体験に基づく情報ほど信頼度が高く表示されます。</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 注意書き */}
      <div className="px-4 mb-6">
        <div className="p-3 rounded-xl bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20">
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            ⚠️ このサービスの情報は保護者の体験に基づく参考情報です。
            <strong>医療的な判断は必ず主治医にご相談ください。</strong>
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-8">
        <h3 className="text-[15px] font-bold text-[var(--color-text)] text-center mb-4">
          さっそく使ってみましょう！
        </h3>
        <div className="space-y-3 max-w-sm mx-auto">
          <Link
            href="/talk"
            className="btn-primary w-full text-center block"
          >
            💬 トークルームを見てみる
          </Link>
          <Link
            href="/login"
            className="btn-secondary w-full text-center block"
          >
            LINEでログインして参加する
          </Link>
        </div>
        <p className="text-[11px] text-[var(--color-subtle)] text-center mt-3">
          ログインしなくても閲覧・AI相談はご利用いただけます
        </p>
      </div>

      {/* Footer links */}
      <div className="px-4 pb-8 flex items-center justify-center gap-4 text-[11px] text-[var(--color-subtle)]">
        <Link href="/terms" className="underline hover:text-[var(--color-primary)]">
          利用規約
        </Link>
        <span>|</span>
        <Link href="/privacy" className="underline hover:text-[var(--color-primary)]">
          プライバシーポリシー
        </Link>
      </div>
    </div>
  );
}
