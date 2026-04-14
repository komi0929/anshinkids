const fs = require('fs');
const fn = 'src/app/(main)/notifications/notifications-client.tsx';
let c = fs.readFileSync(fn, 'utf8');

const emptyStateTarget = `{/* Empty state */}
        <div className="text-center py-12 bg-white rounded-2xl border-[1.5px] border-[var(--color-border)]">`;

const emptyStateReplacement = `{(!impact || (impact.articlesHelped === 0 && impact.thanks === 0 && (!impact.recentImpacts || impact.recentImpacts.length === 0))) && (
        <div className="text-center py-12 bg-white rounded-2xl border-[1.5px] border-[var(--color-border)]">
        <div className="w-16 h-16 rounded-full bg-[var(--color-bg)] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🌱</span>
        </div>
        <p className="text-[15px] font-black text-[var(--color-text)] mb-2">まだ活動はありません</p>
        <p className="text-[13px] font-medium text-[var(--color-subtle)] leading-relaxed mb-6">
          トークルームで体験を共有すると、<br/>ここにあなたの活動が表示されます。
        </p>
        <Link href="/talk" className="btn-primary inline-flex items-center gap-2 px-6 py-4">
          💬 トークルームへ行く
        </Link>
        </div>
        )}`;

c = c.replace(emptyStateTarget, emptyStateReplacement);
fs.writeFileSync(fn, c);
