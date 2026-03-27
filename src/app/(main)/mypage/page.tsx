import { Heart, BookOpen, TrendingUp, Award } from "lucide-react";

export default function MyPage() {
  // Demo data - in production this would come from server actions
  const profile = {
    display_name: "あんしんユーザー",
    trust_score: 45.5,
    total_contributions: 12,
    total_thanks_received: 28,
    allergen_tags: ["卵", "乳"],
    child_age_months: 36,
  };

  const gratitudeReports = [
    {
      id: "1",
      wiki_title: "卵不使用の市販おやつリスト 2026年版",
      contribution_snippet: "森永のアレルギー対応ビスケットが、うちの子のお気に入りです",
      merged_at: "2026-03-20T10:00:00Z",
      views_since: 142,
    },
    {
      id: "2",
      wiki_title: "卵アレルギーの負荷試験の進め方ガイド",
      contribution_snippet: "国立病院で負荷試験を受けた際、最初は卵ボーロ1/8個から開始しました",
      merged_at: "2026-03-15T10:00:00Z",
      views_since: 89,
    },
  ];

  function getTrustLabel(score: number) {
    if (score >= 70) return { label: "ゴールド", color: "text-amber-600", bg: "bg-amber-50" };
    if (score >= 40) return { label: "シルバー", color: "text-[var(--color-subtle)]", bg: "bg-[var(--color-surface-warm)]" };
    return { label: "ブロンズ", color: "text-[var(--color-accent)]", bg: "bg-[var(--color-warning-light)]" };
  }

  const trustInfo = getTrustLabel(profile.trust_score);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">マイページ</h1>
        <p className="page-subtitle">あなたの貢献はちゃんと届いています</p>
      </div>

      {/* Profile Card */}
      <div className="px-4 mb-6">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent-light)] to-[var(--color-primary)] flex items-center justify-center text-2xl text-white font-bold">
              {profile.display_name[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                {profile.display_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${trustInfo.color} ${trustInfo.bg}`}>
                  <Award className="w-3 h-3" />
                  {trustInfo.label}
                </span>
                <span className="text-xs text-[var(--color-subtle)]">
                  信頼度 {profile.trust_score}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--color-surface-warm)] rounded-xl p-3 text-center">
              <BookOpen className="w-4 h-4 text-[var(--color-primary)] mx-auto mb-1" />
              <div className="text-lg font-bold text-[var(--color-text)]">
                {profile.total_contributions}
              </div>
              <div className="text-[10px] text-[var(--color-subtle)]">
                投稿数
              </div>
            </div>
            <div className="bg-[var(--color-success-light)] rounded-xl p-3 text-center">
              <Heart className="w-4 h-4 text-[var(--color-success)] mx-auto mb-1" />
              <div className="text-lg font-bold text-[var(--color-text)]">
                {profile.total_thanks_received}
              </div>
              <div className="text-[10px] text-[var(--color-subtle)]">
                感謝された回数
              </div>
            </div>
            <div className="bg-[var(--color-warning-light)] rounded-xl p-3 text-center">
              <TrendingUp className="w-4 h-4 text-[var(--color-warning)] mx-auto mb-1" />
              <div className="text-lg font-bold text-[var(--color-text)]">
                {gratitudeReports.length}
              </div>
              <div className="text-[10px] text-[var(--color-subtle)]">
                Wiki反映数
              </div>
            </div>
          </div>

          {/* Allergen Tags */}
          <div className="mt-4 pt-4 border-t border-[var(--color-border-light)]">
            <p className="text-xs text-[var(--color-subtle)] mb-2">お子さまのアレルゲン</p>
            <div className="flex gap-2">
              {profile.allergen_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-[var(--color-surface-warm)] rounded-full text-xs font-medium text-[var(--color-text-secondary)]"
                >
                  {tag}
                </span>
              ))}
              <span className="px-3 py-1 bg-[var(--color-surface-warm)] rounded-full text-xs text-[var(--color-subtle)]">
                {Math.floor(profile.child_age_months / 12)}歳{profile.child_age_months % 12}ヶ月
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Silent Gratitude Reports */}
      <div className="px-4 pb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
          <span className="text-base">🌿</span>
          サイレント感謝レポート
        </h3>
        <p className="text-[12px] text-[var(--color-subtle)] mb-4">
          あなたの投稿がWikiに反映され、他の保護者の助けになっています
        </p>

        <div className="space-y-3">
          {gratitudeReports.map((report) => (
            <div key={report.id} className="card p-4 slide-up">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-success-light)] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🌱</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[14px] text-[var(--color-text)]">
                    {report.wiki_title}
                  </h4>
                  <p className="text-[12px] text-[var(--color-subtle)] mt-1 line-clamp-2">
                    あなたの投稿: 「{report.contribution_snippet}」
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-[var(--color-success)] font-medium">
                      {report.views_since}人の保護者が閲覧
                    </span>
                    <span className="text-[10px] text-[var(--color-muted)]">
                      {new Date(report.merged_at).toLocaleDateString("ja-JP")}に反映
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
