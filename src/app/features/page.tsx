"use client";

import Link from "next/link";
import { Sparkles, MessageCircle, Shield, User, Heart, Leaf, BookOpen, Check, TrendingUp, ShieldCheck, RefreshCw, Clock, Search, Plus, Trash2, Bell } from "@/components/icons";

const Cloud = ({ className }: { className?: string }) => <Sparkles className={className} />;

interface Feature {
  title: string;
  desc: string;
  icon: React.ReactNode;
  tags?: string[];
}

interface Category {
  title: string;
  desc: string;
  colorClass: string;
  features: Feature[];
}

const CATEGORIES: Category[] = [
  {
    title: "SNS・コミュニティ設計",
    desc: "ユーザー同士が助け合い、ポジティブなループを生み出すための機能群",
    colorClass: "from-pink-100/50 to-rose-50 border-rose-100 text-rose-600 bg-rose-500/10",
    features: [
      { title: "完全匿名トークルーム", desc: "LINEのアカウント名や実名を出さず、安全に投稿できるルーム設計。各ユーザーには匿名ID（Slug）が発行されます。", icon: <User className="w-5 h-5" />, tags: ["Privacy", "Auth"] },
      { title: "「ありがとう」フィードバック", desc: "誰かの知恵が役に立った時、ワンタップで感謝を伝えられる共感機能。「投稿してよかった」という体験を作ります。", icon: <Heart className="w-5 h-5" />, tags: ["Engagement"] },
      { title: "連続貢献ストリーク（🔥）", desc: "連続で投稿した日数をカウントし、マイページで炎のアイコンと共に可視化するゲーミフィケーション要素。", icon: <TrendingUp className="w-5 h-5" />, tags: ["Gamification"] },
      { title: "影響力の可視化", desc: "「あなたの声が〇人の親に読まれました」「AIが〇回参照しました」といった貢献を通じた社会的影響をスコア化して表示。", icon: <Sparkles className="w-5 h-5" />, tags: ["MyPage"] },
      { title: "トラストバッジ（金/銀/銅）", desc: "情報の質の担保として、貢献数に応じたバッジを授与。AIが参照する際の信頼度スコア（trust_score）にも直結します。", icon: <ShieldCheck className="w-5 h-5" />, tags: ["Trust", "Auth"] },
      { title: "トピックへの「召喚」CTA", desc: "回答が少ない時に「みんなの経験を教えてください」と協力を促す、SNS的なダイナミックコールトゥアクション。", icon: <MessageCircle className="w-5 h-5" /> },
      { title: "コミュニティステータスランク", desc: "ログイン回数や投稿数に応じて称号が進化するロイヤルティプログラム。", icon: <TrendingUp className="w-5 h-5" /> },
      { title: "トークルームの共感ボタン", desc: "コメントを返さなくても、「わかる！」という共感だけを手軽に残せる機能。", icon: <Heart className="w-5 h-5" /> },
      { title: "アカウント削除と資産の匿名化", desc: "退会時には個人情報を完全消去しつつ、知恵袋に抽出されたノウハウのみをコミュニティの資産として匿名で保持するセキュアシステム。", icon: <Shield className="w-5 h-5" />, tags: ["Privacy"] },
      { title: "カテゴリ別おすすめルーム", desc: "ユーザーのアレルゲン情報から、現在最も盛り上がっている最適なトークルームを自動推薦。", icon: <Sparkles className="w-5 h-5" /> },
    ]
  },
  {
    title: "AI自律ループとDB機構",
    desc: "データ抽出・整理から安全性担保まで、プラットフォームを自動で育てるAI基盤",
    colorClass: "from-[var(--color-primary)]/10 to-[var(--color-success)]/10 border-[var(--color-success)]/20 text-[var(--color-success-deep)] bg-[var(--color-success)]/10",
    features: [
      { title: "3日間の非アクティブ時パージ", desc: "トークルームで72時間（3日間）新しい投稿がなかった場合、自動で会話をアーカイブしタイムラインを常に最新に保ちます。", icon: <Clock className="w-5 h-5" />, tags: ["Cron", "DB"] },
      { title: "みんなの声 → 知恵袋抽出ループ", desc: "上記のパージ時、Gemini AIが会話の文脈を読み取り、一次情報（Snippet）として自動抽出・要約を行う自律システム。", icon: <RefreshCw className="w-5 h-5" />, tags: ["Gemini 2.0"] },
      { title: "8テーマのHub & Spoke分配", desc: "抽出された知識を「外食」「代替レシピ」「保育園」などの8つの巨大なメガWikiへ自動的に分類・紐付けする情報ハブ構造。", icon: <BookOpen className="w-5 h-5" /> },
      { title: "文脈考慮のAIコンシェルジュ", desc: "個々のプロフィール（年齢枠・アレルゲン）を常に暗黙のコンテキストとして保持し、それに寄り添って回答する相談AI。", icon: <MessageCircle className="w-5 h-5" /> },
      { title: "AI回答の信頼度バッジ", desc: "回答に必要な「保護者の一次情報」のデータ量に基づき、回答の確かさを判定してバッジ（緑/橙/赤）で視覚的警告を出す機能。", icon: <ShieldCheck className="w-5 h-5" /> },
      { title: "情報ソース（参照元）の透明性追跡", desc: "AIがどの投稿（wiki_sources）を参考にしたかカウントを追跡することで、AI特有のハルシネーションを極小化。", icon: <Search className="w-5 h-5" /> },
      { title: "緊急度判定ガード（119番誘導）", desc: "「息苦しい」「蕁麻疹が広がった」等のアナフィラキシー疑いをAIが検知し、即座に回答を停止して119番を促すセーフティガード。", icon: <Shield className="w-5 h-5" />, tags: ["Safety", "Urgent"] },
      { title: "AI画面から「ワンクリック知恵保存」", desc: "AIへの質問とその回答が有用だった場合、ワンタップで匿名化して知恵袋のナレッジベースに直接追加する機能。", icon: <Check className="w-5 h-5" /> },
      { title: "バウンスアニメーションUI", desc: "AIが思考中であることを伝える、心地よくリズミカルなWaiting UIパターン。", icon: <Sparkles className="w-5 h-5" /> },
      { title: "動的JSONBスキーマ拡張対応", desc: "構造化データやJSONスキーマを用いてAPIのレスポンスを厳格に管理するフルスタックAIアーキテクチャ。", icon: <TrendingUp className="w-5 h-5" /> },
      { title: "複数こども×アレルゲン完全考慮RAG", desc: "ユーザーが設定した複数のお子さまの年齢や複雑なアレルゲン情報（28品目＋自由記述）をすべてAIにコンテキストとして渡し、一人ひとりに寄り添った高精度の回答を動的生成します。", icon: <User className="w-5 h-5" />, tags: ["RAG", "Context Injection"] },
      { title: "DBスキーマレス・ポリフィル機構", desc: "リモートDBのマイグレーション状況に依存せず、複雑な複数こどもJSON配列を既存のテキスト配列カラムへ安全にフォールバックして同期させる耐障害システム。", icon: <Shield className="w-5 h-5" />, tags: ["Polyfill", "Resilience"] },
    ]
  },
  {
    title: "高精細 MyPage ＆ オンボーディング",
    desc: "複雑なアレルギー管理を、直感的に楽しく入力させるためのユーザー体験",
    colorClass: "from-amber-100/50 to-orange-50 border-orange-200 text-orange-700 bg-orange-500/10",
    features: [
      {
        title: "自己修復型セッション初期化",
        desc: "AIによるコンテキスト維持の限界に達した場合、直感的に記憶をクリア（RefreshCw）して新しい話題の精度を確保",
        icon: <RefreshCw className="w-5 h-5" />,
        tags: ["RAG", "相談"]
      },
      {
        title: "投稿の引用返信 (Quoted Reply)",
        desc: "気になる体験談をワンタップで引用し、コンテキスト付きでスムーズにトークを継続できるシステム",
        icon: <MessageCircle className="w-5 h-5" />,
        tags: ["みんなの声"]
      },
      {
        title: "自身の発言の取り消し・削除",
        desc: "リアルタイムな削除権限の検証を行い、誤った投稿や後悔した投稿を即座に削除できる安心安全機能",
        icon: <Trash2 className="w-5 h-5" />,
        tags: ["みんなの声"]
      },
      {
        title: "統合通知フィード",
        desc: "記事の閲覧数アップ、感謝リアクションの獲得、知恵袋への採用などのポジティブなアクションをひとまとめに確認",
        icon: <Bell className="w-5 h-5" />,
        tags: ["インセンティブ"]
      },
      {
        title: "プロフィールカスタマイズ",
        desc: "表示名とアイコンの変更に対応。実名を隠しつつ10種類のアバター（またはLINEアイコン）で個性を表現可能",
        icon: <User className="w-5 h-5" />,
        tags: ["プロフィール"]
      },
      { title: "特定原材料8品目の視覚化", desc: "厚労省が定める最新の義務8品目を、直感的な絵文字と大きく押しやすいボタンで表示。", icon: <Leaf className="w-5 h-5" />, tags: ["UI/UX"] },
      { title: "準ずるもの20品目のチップ選択", desc: "通知対象となる20品目の中から、タグ（チップ）形式でサクサクと選択できる軽量UI。", icon: <Check className="w-5 h-5" /> },
      { title: "「その他のアレルゲン」エンター追加入力", desc: "一覧にない珍しい食材アレルギーでも、エンターキー（またはスマホの確定）で自由に無制限に追加できるTag Inputシステム。", icon: <Plus className="w-5 h-5" /> },
      { title: "非同期での複数こども管理タブ", desc: "「1人目」「2人目」のタブを切り替えることで、兄弟姉妹の異なるアレルゲン・年齢を同一画面で並行して入力可能。", icon: <User className="w-5 h-5" />, tags: ["JSONB"] },
      { title: "ステップ型オンボーディング機構", desc: "情報入力を「アレルゲン」「年齢」「悩み」の3ステップに分割し、離脱率を下げるウィザードUI。", icon: <Sparkles className="w-5 h-5" /> },
      { title: "入力状況のローカルストレージ保存", desc: "アプリを閉じてもオンボーディングの途中状態が消えず、すぐに再開できる同期機構。", icon: <Cloud className="w-5 h-5" /> },
      { title: "年齢別のコンテンツ自動出し分け", desc: "「離乳食期」「幼児食期」「園児」といった年齢グループに基づき、優先表示するコンテンツを切り替え。", icon: <TrendingUp className="w-5 h-5" /> },
      { title: "「一番の悩み」に基づくAI例文生成", desc: "「市販品探し」「外食」などの選択に応じ、コンシェルジュ画面に「この質問をしてみよう」というサジェストを兄弟それぞれのプロファイルから動的に提示。", icon: <MessageCircle className="w-5 h-5" /> },
      { title: "Bento UIベースのマイページ", desc: "複雑な各種設定や貢献ステータスを、視覚的境界が美しい角丸（Bento）カードとして整列。", icon: <BookOpen className="w-5 h-5" />, tags: ["Nani Style"] },
      { title: "モーダル式一発再編集機能", desc: "マイページの「鉛筆アイコン」を押すと、全情報が保持された状態のウィザードがモーダルとして再展開されるシームレスな編集体験。", icon: <Check className="w-5 h-5" /> },
      { title: "知恵袋の28品目＋フル対応フィルター", desc: "特定原材料8品目に加え、準ずる20品目で知恵（Wiki）を正確に横断検索・絞り込みできる動的タグフィルター機構。", icon: <Search className="w-5 h-5" />, tags: ["Search", "UX"] },
    ]
  },
  {
    title: "パフォーマンス・アーキテクチャ (Nani Design)",
    desc: "最速のレンダリングと美しい「Tech-Natural Fusion」デザインシステム",
    colorClass: "from-blue-100/50 to-indigo-50 border-indigo-200 text-indigo-700 bg-indigo-500/10",
    features: [
      { title: "手書き軽量SVGフルスクラッチ（Lucide排除）", desc: "汎用アイコンライブラリを全て撤廃し、温かみのある太線の「手書き風カスタムSVGアイコン」群を自給。", icon: <Leaf className="w-5 h-5" />, tags: ["Performance"] },
      { title: "超・角丸（32px）とパステルGlassmorphism", desc: "Nani UI / Bento UIにインスパイアされた、親しみやすく触りたくなる「ぷにぷに」のUIマテリアル。", icon: <Sparkles className="w-5 h-5" /> },
      { title: "インクブルー × コーラルピンク基調", desc: "医療的な冷たさを排除し、ノートに描いたような安心感のあるTech-Natural Fusionカラーパレット。", icon: <Heart className="w-5 h-5" /> },
      { title: "Hydration Mismatch自動回避", desc: "Server/Clientのレンダリング差によるReactのクラッシュを先読みして防ぐ `isMounted` SSRバリデーション。", icon: <ShieldCheck className="w-5 h-5" />, tags: ["React"] },
      { title: "PWA・モバイル最適化 (100dvh & safe-bottom)", desc: "スマホブラウザのURLバーやiOSのセーフエリア（ノッチ・ホームバー）を考慮した、完全なネイティブアプリ風レイアウト。", icon: <User className="w-5 h-5" /> },
      { title: "Shimmer（スケルトン）ローディング", desc: "データ取得中に画面が真っ白になるのを防ぎ、キラキラと光る波紋のようなローディングで待ち時間を軽減。", icon: <RefreshCw className="w-5 h-5" /> },
      { title: "Smart Sticky ナビゲーション", desc: "スクロールしても入力欄や送信ボタンが常に指を届きやすい下部に固定される追従UI。", icon: <MessageCircle className="w-5 h-5" /> },
      { title: "APIエンドポイントレス構想 (Server Actions)", desc: "Next.js 16のServer Actionsをフル活用し、フロントとバックエンドの中間API層を排除した高速データ通信。", icon: <TrendingUp className="w-5 h-5" /> },
      { title: "Supabase RLS & Role Separation", desc: "Row Level Securityとサービスロールキーを組み合わせ、バッチ処理とユーザー操作を完全に分離した強固な認証DB。", icon: <Shield className="w-5 h-5" />, tags: ["Security"] },
      { title: "TypeScriptによる厳密型安全運用", desc: "NullやUndefinedを許容しない厳格な型推論による、ビルド時にバグを撲滅するセーフティ開発体制。", icon: <Check className="w-5 h-5" /> },
    ]
  }
];


export default function FeaturesPage() {
  return (
    <div className="fade-in pb-12 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="page-header border-b border-[var(--color-border-light)] bg-[var(--color-surface)]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] flex items-center justify-center shadow-md">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[17px] font-extrabold text-[var(--color-text)]">オープンな開発仕様</h1>
            <p className="text-[11px] text-[var(--color-subtle)]">これまでに実装された50の全機能・仕様</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="mb-8 p-5 rounded-2xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)] slide-up shadow-sm">
          <h2 className="text-[15px] font-extrabold text-[var(--color-text)] mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
            なぜ全ての仕様を公開するのか？
          </h2>
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-4">
            「あんしんキッズ」は、アレルギーをもつ子どもたちとその家族を守り、助け合うためのプラットフォームです。<br/>
            極めて細かいSNSの心理的アプローチから、裏側で稼働する自律型のAIモデルやデータベース抽出ループまで、約50の機能を独自に実装しています。<br/>
            これらをすべて透明にオープンにすることで、更なる改善へのアイデアや、開発に協力いただけるパートナー（コラボレーター）を広く募りたいと考えています。
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-white border border-[var(--color-border-light)] rounded-full text-[11px] font-bold text-[var(--color-subtle)]">Next.js 16</span>
            <span className="px-3 py-1 bg-white border border-[var(--color-border-light)] rounded-full text-[11px] font-bold text-[var(--color-subtle)]">Supabase</span>
            <span className="px-3 py-1 bg-white border border-[var(--color-border-light)] rounded-full text-[11px] font-bold text-[var(--color-subtle)]">Gemini AI</span>
            <span className="px-3 py-1 bg-white border border-[var(--color-border-light)] rounded-full text-[11px] font-bold text-[var(--color-subtle)]">Tailwind CSS v4</span>
          </div>
        </div>

        <div className="space-y-10">
          {CATEGORIES.map((category, index) => (
            <section key={category.title} className="slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[14px] bg-gradient-to-br ${category.colorClass} shadow-sm border`}>
                    {index + 1}
                  </span>
                  <h3 className="text-[16px] font-extrabold text-[var(--color-text)]">{category.title}</h3>
                </div>
                <p className="text-[12px] font-medium text-[var(--color-subtle)] ml-10 leading-snug">
                  {category.desc}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 sm:pl-10">
                {category.features.map((feature, fIndex) => (
                  <div key={fIndex} className="p-4 rounded-2xl bg-white border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:shadow-sm transition-all group">
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5 text-[var(--color-subtle)] group-hover:text-[var(--color-primary)] transition-colors">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-[14px] font-bold text-[var(--color-text)] leading-tight">{feature.title}</h4>
                        </div>
                        <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
                          {feature.desc}
                        </p>
                        {feature.tags && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {feature.tags.map(tag => (
                              <span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)] bg-[var(--color-surface-warm)] px-2 py-0.5 rounded-md">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Global CTA */}
        <div className="mt-12 p-6 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-success)] text-white text-center shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-5 -mb-5" />
          
          <div className="relative z-10">
            <div className="w-14 h-14 mx-auto bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md mb-3 shadow-inner border border-white/30">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-[18px] font-extrabold mb-2 text-shadow-sm">力を貸してください 🤝</h2>
            <p className="text-[13px] font-medium text-white/90 mb-5 leading-relaxed max-w-[280px] mx-auto">
              これらの仕様を一緒に洗練させ、より多くのアレルギーっ子家族を救う開発メンバー・デザイナー・コミュニティリードを探しています。
            </p>
            <a href="mailto:contact@example.com" className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-primary)] px-6 py-3 rounded-xl text-[14px] font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all">
              <User className="w-4 h-4" /> 開発に協力する
            </a>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/about" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--color-subtle)] hover:text-[var(--color-text)] transition-colors">
            <ArrowLeftIcon className="w-4 h-4" /> お知らせ・概要に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
);
