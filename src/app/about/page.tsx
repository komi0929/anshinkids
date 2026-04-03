"use client";

import Link from "next/link";
import { ArrowLeft, Leaf, Check, Shield, ChevronRight, Sparkles } from "@/components/icons";

const STEPS = [
  {
    num: "1",
    title: "みんなの声で話す・見る",
    desc: "テーマごとに分かれた部屋で、体験談やおすすめ情報を読んだり、気軽に書き込んだりできます。",
    points: [
      "見るだけでもOK — ログインしなくても読めます",
      "書き込みは自動消去 — 知恵はAIが永久保存",
      "匿名のニックネームで参加できます",
    ],
  },
  {
    num: "2",
    title: "知恵袋で調べる",
    desc: "みんなの投稿をAIが自動で整理して、8つの大きなテーマ記事にまとめています。",
    points: [
      "「毎日のごはん」「外食情報」など8テーマ別に探せます",
      "あなたの情報もかんたんに追加できます",
      "情報の信頼度が表示されるので安心",
    ],
  },
  {
    num: "3",
    title: "AIに相談する",
    desc: "みんなの体験をもとに、AIがやさしくお答えします。",
    points: [
      "ログインなしでも使えます",
      "よくある質問のサンプルが用意されています",
      "自分の言葉で自由に質問できます",
    ],
  },
];

const SAFETY_POINTS = [
  { title: "匿名で参加できます", desc: "ニックネームで投稿。本名は出ません。" },
  { title: "投稿は自動消去", desc: "発言が流れる心配なく、知恵はAIが永久保存します。" },
  { title: "信頼できる情報づくり", desc: "多くの体験に基づく情報ほど信頼度が高く表示されます。" },
  { title: "当事者だけの安心空間", desc: "同じ悩みを持つ保護者同士で情報を共有します。" },
];

const USE_CASES = [
  "「うちの子が食べられるおやつはどれ？」と市販品の情報を知りたいとき",
  "「外食でアレルギー対応してくれるお店は？」と外食情報を探すとき",
  "「保育園の給食、どう相談した？」と園への伝え方を知りたいとき",
  "「血液検査のクラスってどう読むの？」と基礎知識を学びたいとき",
  "「同じ悩みの人と話したい」と思ったとき",
];

export default function AboutPage() {
  return (
    <div className="fade-in pb-24" style={{ background: "var(--color-bg)" }}>
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center gap-3 sticky top-0 z-40"
        style={{ background: "rgba(248, 246, 242, 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--color-border)" }}>
        <Link
          href="/talk"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          id="back-from-about"
          style={{ color: "var(--color-text)" }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-[16px] font-extrabold break-keep text-balance" style={{ color: "var(--color-text)" }}>
          あんしんキッズとは
        </h1>
      </div>

      {/* Hero */}
      <div className="px-6 pt-10 pb-8 text-center">
        <div className="w-20 h-20 mx-auto mb-5 rounded-[22px] flex items-center justify-center"
          style={{ background: "var(--color-primary)" }}>
          <Leaf className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-[22px] font-black leading-tight tracking-tight break-keep text-balance" style={{ color: "var(--color-text)" }}>
          食物アレルギーの知恵を<br />みんなで、安心して
        </h2>
        <p className="text-[15px] font-medium mt-3 leading-[1.9] max-w-sm mx-auto" style={{ color: "var(--color-text-secondary)" }}>
          お子さまの食物アレルギーに悩むママ・パパが
          <strong>体験や情報を気軽に共有・検索</strong>できるサービスです。
        </p>
      </div>

      {/* Mission Statement */}
      <div className="px-5 -mt-2 mb-8">
        <div className="card-elevated p-6 contrib-highlight">
          <p className="text-[15px] font-medium leading-[2.1] text-center" style={{ color: "var(--color-text)" }}>
            今日、あなたが自分の悩みを解消するために
            した何気ない会話が、
            <br />
            明日、同じことで悩むどこかの親子にとっての
            <br />
            やさしい
            <span className="font-extrabold" style={{ color: "var(--color-primary)" }}>「役立つ知恵」</span>
            に変わります。
          </p>
        </div>
      </div>

      {/* こんな方に */}
      <div className="px-5 mb-8">
        <div className="card p-6">
          <h3 className="text-[17px] font-extrabold mb-5 break-keep text-balance" style={{ color: "var(--color-text)" }}>
            こんなとき、使ってください
          </h3>
          <ul className="space-y-4">
            {USE_CASES.map((text, i) => (
              <li key={i} className="flex gap-3 text-[14px] font-medium leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                <Check size={18} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3 Steps */}
      <div className="px-5 mb-3">
        <h3 className="text-[17px] font-extrabold break-keep text-balance" style={{ color: "var(--color-text)" }}>
          使い方はかんたん3ステップ
        </h3>
      </div>

      <div className="px-5 space-y-3 mb-8">
        {STEPS.map((step, i) => (
          <div key={step.num}>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[15px]"
                  style={{ background: "var(--color-primary)", color: "white" }}>
                  {step.num}
                </div>
                <h4 className="text-[16px] font-extrabold break-keep text-balance" style={{ color: "var(--color-text)" }}>
                  {step.title}
                </h4>
              </div>
              <p className="text-[14px] font-medium mb-3 leading-[1.9]" style={{ color: "var(--color-text-secondary)" }}>
                {step.desc}
              </p>
              <ul className="space-y-2">
                {step.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-2 text-[13px] font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                    <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-primary)" }} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex justify-center py-2">
                <ChevronRight size={16} className="rotate-90" style={{ color: "var(--color-muted)" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Safety Points */}
      <div className="px-5 mb-8">
        <div className="card p-6">
          <h3 className="text-[17px] font-extrabold mb-5 break-keep text-balance" style={{ color: "var(--color-text)" }}>
            安心して使えるポイント
          </h3>
          <div className="space-y-4">
            {SAFETY_POINTS.map(({ title, desc }) => (
              <div key={title} className="flex gap-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-primary-bg)" }}>
                  <Shield size={18} style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold break-keep text-balance" style={{ color: "var(--color-text)" }}>{title}</h4>
                  <p className="text-[13px] font-medium mt-0.5 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="px-5 mb-8">
        <div className="p-4 rounded-2xl" style={{ background: "var(--color-warning-light)", border: "1px solid rgba(217, 119, 6, 0.15)" }}>
          <p className="text-[13px] font-semibold leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            ⚠️ このサービスの情報は保護者の体験に基づく参考情報です。
            <strong>医療的な判断は必ず主治医にご相談ください。</strong>
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-8">
        <h3 className="text-[18px] font-extrabold text-center mb-5 break-keep text-balance" style={{ color: "var(--color-text)" }}>
          さっそく使ってみましょう！
        </h3>
        <div className="space-y-3 max-w-sm mx-auto">
          <Link href="/wiki" className="btn-primary w-full text-center block" id="go-to-wiki-cta" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}>
            📖 今すぐ知恵袋を見てみる
          </Link>
          <Link href="/talk" className="btn-secondary w-full text-center block" id="go-to-talk-cta">
            💬 みんなの声を見てみる
          </Link>
          <Link href="/login" className="btn-secondary w-full text-center block" id="login-cta">
            LINEでログインして参加する
          </Link>
        </div>
        <p className="text-[12px] font-medium text-center mt-4" style={{ color: "var(--color-subtle)" }}>
          ログインしなくても知恵袋の閲覧・AI相談はご利用いただけます
        </p>
      </div>

      {/* Collaboration CTA */}
      <div className="px-5 mb-8">
        <div className="card p-6 text-center border-2 border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-all bg-[var(--color-surface)]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-[16px] bg-[var(--color-primary)]/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-[17px] font-extrabold text-[var(--color-text)] mb-2 break-keep text-balance">
            開発者・協力者の方へ
          </h3>
          <p className="text-[13px] font-medium text-[var(--color-text-secondary)] leading-relaxed mb-5">
            あんしんキッズをより強力な「保護者の味方」へと進化させるため、私たちの実装したSNS的アプローチや自律AIループなど、<strong>約50の機能仕様をすべてオープン</strong>にしています。
          </p>
          <Link href="/features" className="w-full text-center flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[var(--color-surface-warm)] text-[var(--color-text)] font-extrabold text-[14px] border border-[var(--color-border)] hover:bg-[var(--color-border-light)] transition-colors">
            <Sparkles className="w-4 h-4" /> オープンな開発・機能仕様を見る
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-8 flex flex-col items-center justify-center gap-3 text-[12px] font-medium" style={{ color: "var(--color-subtle)" }}>
        <div className="flex items-center gap-5">
          <Link href="/guide" className="underline hover:no-underline transition-colors">
            使い方ガイド
          </Link>
          <span style={{ color: "var(--color-border)" }}>|</span>
          <Link href="/terms" className="underline hover:no-underline transition-colors">
            利用規約
          </Link>
          <span style={{ color: "var(--color-border)" }}>|</span>
          <Link href="/privacy" className="underline hover:no-underline transition-colors">
            プライバシー
          </Link>
        </div>
        <div className="flex items-center gap-5 mt-2">
          <a href="mailto:support@anshin-kids.app?subject=お問い合わせ" className="underline hover:no-underline transition-colors">
            運営へのお問い合わせ
          </a>
          <span style={{ color: "var(--color-border)" }}>|</span>
          <a href="mailto:partner@anshin-kids.app?subject=活動へのご協賛・サポートについて" className="underline hover:no-underline transition-colors">
            企業・医療提携について
          </a>
        </div>
      </div>
    </div>
  );
}
