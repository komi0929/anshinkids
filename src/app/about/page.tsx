"use client";

import Link from "next/link";
const _ip = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ArrowLeft = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
const MessageCircle = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const BookOpen = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const Sparkles = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M12 3l1.5 4.5H18l-3.5 2.7 1.3 4.3L12 12l-3.8 2.5 1.3-4.3L6 7.5h4.5z" /></svg>;
const ArrowRight = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
const Leaf = ({ className = "" }: { className?: string }) => <svg {..._ip} className={className}><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 .5 20 .5s-1.5 7-5.5 11c-2 2-5 3-5 3" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>;

export default function AboutPage() {
  return (
    <div className="fade-in pb-24">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface)]/95 backdrop-blur-sm sticky top-0 z-40">
        <Link
          href="/talk"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-warm)] transition-colors"
          id="back-from-about"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
        </Link>
        <h1 className="text-[15px] font-bold text-[var(--color-text)]">
          あんしんキッズとは
        </h1>
      </div>

      {/* Hero */}
      <div className="hero-gradient px-5 pt-10 pb-8 text-center">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] shadow-lg gradient-animate" />
          <div className="relative w-full h-full rounded-3xl flex items-center justify-center">
            <Leaf className="w-10 h-10 text-white drop-shadow-sm" />
          </div>
          <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] opacity-15 blur-xl -z-10" />
        </div>
        <h2 className="text-[22px] font-extrabold text-[var(--color-text)] leading-tight tracking-tight">
          食物アレルギーの知恵を<br />みんなで、安心して
        </h2>
        <p className="text-[13px] text-[var(--color-text-secondary)] mt-3 leading-[1.8] max-w-sm mx-auto">
          お子さまの食物アレルギーに悩むママ・パパが
          <strong>体験や情報を気軽に共有・検索</strong>できるサービスです。
        </p>
      </div>

      {/* Mission Statement */}
      <div className="px-4 -mt-3 mb-6">
        <div className="card-elevated p-5 contrib-highlight">
          <p className="text-[14px] text-[var(--color-text)] leading-[2] text-center font-medium">
            今日、あなたが自分の悩みを解消するために
            した会話が、そのまま消えることなく蓄積され、
            <br />
            明日、同じ壁にぶつかったどこかの親子を
            <br />
            必ず救う
            <span className="text-[var(--color-primary)] font-extrabold">「希望の道しるべ」</span>
            になります。
          </p>
        </div>
      </div>

      {/* こんな方に */}
      <div className="px-4 mb-6">
        <div className="card p-5">
          <h3 className="text-[16px] font-extrabold text-[var(--color-text)] mb-4">
            📌 こんなとき、使ってください
          </h3>
          <ul className="space-y-3.5 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
            {[
              { emoji: "🍪", text: "「うちの子が食べられるおやつはどれ？」と**市販品の情報**を知りたいとき" },
              { emoji: "🍽️", text: "「外食でアレルギー対応してくれるお店は？」と**外食情報**を探すとき" },
              { emoji: "🏫", text: "「保育園の給食、どう相談した？」と**園への伝え方**を知りたいとき" },
              { emoji: "🏥", text: "「血液検査のクラスってどう読むの？」と**基礎知識**を学びたいとき" },
              { emoji: "💚", text: "「同じ悩みの人と話したい」と思ったとき" },
            ].map(({ emoji, text }) => (
              <li key={emoji} className="flex gap-3">
                <span className="text-lg flex-shrink-0">{emoji}</span>
                <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3つの機能 */}
      <div className="px-5 mb-3">
        <h3 className="text-[16px] font-extrabold text-[var(--color-text)]">
          🔰 使い方はかんたん3ステップ
        </h3>
      </div>

      {/* Step 1 */}
      <div className="px-4 mb-4">
        <div className="card overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-[var(--color-surface-warm)] to-[var(--color-surface)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center shadow-sm">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">STEP 1</span>
                <h4 className="text-[15px] font-extrabold text-[var(--color-text)] mt-0.5">
                  みんなの声で話す・見る
                </h4>
              </div>
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-[1.8] mb-3">
              テーマごとに分かれた部屋で、体験談やおすすめ情報を読んだり、気軽に書き込んだりできます。
            </p>
            <ul className="text-[12px] text-[var(--color-subtle)] space-y-1.5">
              <li className="flex items-start gap-2"><span className="text-[var(--color-success)]">✅</span> <strong>見るだけでもOK</strong> — ログインしなくても読めます</li>
              <li className="flex items-start gap-2"><span className="text-[var(--color-success)]">✅</span> 書き込みは<strong>24時間で自動消去</strong> — 発言が残る心配なし</li>
              <li className="flex items-start gap-2"><span className="text-[var(--color-success)]">✅</span> <strong>匿名のニックネーム</strong>で参加できます</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Flow Arrow */}
      <div className="flex justify-center mb-4">
        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-warm)] border border-[var(--color-border-light)] flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-[var(--color-muted)] rotate-90" />
        </div>
      </div>

      {/* Step 2 */}
      <div className="px-4 mb-4">
        <div className="card overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-[var(--color-success-light)]/50 to-[var(--color-surface)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-success)] to-[var(--color-success-deep)] flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--color-success)] bg-[var(--color-success)]/10 px-2 py-0.5 rounded-full">STEP 2</span>
                <h4 className="text-[15px] font-extrabold text-[var(--color-text)] mt-0.5">
                  知恵袋で調べる
                </h4>
              </div>
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-[1.8] mb-3">
              みんなの投稿をAIが自動で整理して、読みやすい記事にまとめています。
            </p>
            <ul className="text-[12px] text-[var(--color-subtle)] space-y-1.5">
              <li className="flex items-start gap-2"><span className="text-[var(--color-success)]">✅</span> 「商品情報」「体験記」「対処法」などカテゴリ別に探せます</li>
              <li className="flex items-start gap-2"><span className="text-[var(--color-success)]">✅</span> あなたの情報も<strong>かんたんに追加</strong>できます</li>
              <li className="flex items-start gap-2"><span className="text-[var(--color-success)]">✅</span> 情報の<strong>信頼度</strong>が表示されるので安心</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Flow Arrow */}
      <div className="flex justify-center mb-4">
        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-warm)] border border-[var(--color-border-light)] flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-[var(--color-muted)] rotate-90" />
        </div>
      </div>

      {/* Step 3 */}
      <div className="px-4 mb-6">
        <div className="card overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-[var(--color-warning-light)]/50 to-[var(--color-surface)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-warm)] flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-full">STEP 3</span>
                <h4 className="text-[15px] font-extrabold text-[var(--color-text)] mt-0.5">
                  AIに相談する
                </h4>
              </div>
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-[1.8] mb-3">
              みんなの体験をもとに、AIがやさしくお答えします。
            </p>
            <ul className="text-[12px] text-[var(--color-subtle)] space-y-1.5">
              <li className="flex items-start gap-2"><span className="text-[var(--color-success)]">✅</span> <strong>ログインなしでも使えます</strong></li>
              <li className="flex items-start gap-2"><span className="text-[var(--color-success)]">✅</span> よくある質問のサンプルが用意されています</li>
              <li className="flex items-start gap-2"><span className="text-[var(--color-success)]">✅</span> 自分の言葉で自由に質問できます</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 安心ポイント */}
      <div className="px-4 mb-6">
        <div className="card p-5">
          <h3 className="text-[16px] font-extrabold text-[var(--color-text)] mb-4">
            🔒 安心して使えるポイント
          </h3>
          <div className="space-y-4">
            {[
              { emoji: "🛡️", title: "匿名で参加できます", desc: "ニックネームで投稿。本名は出ません。", bg: "var(--color-success-light)" },
              { emoji: "⏰", title: "投稿は24時間で自動削除", desc: "発言が永遠に残る心配がありません。", bg: "var(--color-warning-light)" },
              { emoji: "💖", title: "信頼できる情報づくり", desc: "多くの体験に基づく情報ほど信頼度が高く表示されます。", bg: "var(--color-heart-light)" },
              { emoji: "👥", title: "当事者だけの安心空間", desc: "同じ悩みを持つ保護者同士で情報を共有します。", bg: "var(--color-surface-warm)" },
            ].map(({ emoji, bg, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: bg }}>
                  {emoji}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[var(--color-text)]">{title}</h4>
                  <p className="text-[12px] text-[var(--color-subtle)] mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 注意書き */}
      <div className="px-4 mb-6">
        <div className="p-3.5 rounded-2xl bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20">
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            ⚠️ このサービスの情報は保護者の体験に基づく参考情報です。
            <strong>医療的な判断は必ず主治医にご相談ください。</strong>
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-8">
        <h3 className="text-[16px] font-extrabold text-[var(--color-text)] text-center mb-4">
          さっそく使ってみましょう！
        </h3>
        <div className="space-y-3 max-w-sm mx-auto">
          <Link
            href="/talk"
            className="btn-primary w-full text-center block"
            id="go-to-talk-cta"
          >
            💬 みんなの声を見てみる
          </Link>
          <Link
            href="/login"
            className="btn-secondary w-full text-center block"
            id="login-cta"
          >
            LINEでログインして参加する
          </Link>
          <Link
            href="/guide"
            className="w-full text-center block text-[13px] font-bold text-[var(--color-primary)] py-3 rounded-xl border border-[var(--color-primary)]/20 hover:bg-[var(--color-success-light)] transition-colors"
            id="guide-cta"
          >
            📖 使い方ガイドを見る
          </Link>
        </div>
        <p className="text-[11px] text-[var(--color-subtle)] text-center mt-3">
          ログインしなくても閲覧・AI相談はご利用いただけます
        </p>
      </div>

      {/* Footer links */}
      <div className="px-4 pb-8 flex items-center justify-center gap-4 text-[11px] text-[var(--color-subtle)]">
        <Link href="/guide" className="underline hover:text-[var(--color-primary)] transition-colors">
          使い方ガイド
        </Link>
        <span className="text-[var(--color-border)]">|</span>
        <Link href="/terms" className="underline hover:text-[var(--color-primary)] transition-colors">
          利用規約
        </Link>
        <span className="text-[var(--color-border)]">|</span>
        <Link href="/privacy" className="underline hover:text-[var(--color-primary)] transition-colors">
          プライバシーポリシー
        </Link>
      </div>
    </div>
  );
}
