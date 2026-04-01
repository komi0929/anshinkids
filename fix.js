const fs = require('fs');
let content = fs.readFileSync('src/app/(main)/wiki/[slug]/page.tsx', 'utf8');
const lines = content.split('\n');

// Find the line that starts with '            <d        {/* Topic '
let targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('この知恵のもとになった声')) {
    targetIdx = i + 2; // the line after </h3>
    break;
  }
}

if (targetIdx !== -1) {
  let newLines = lines.slice(0, targetIdx);
  newLines.push('            <div className="space-y-3">');
  newLines.push('              {entry.wiki_sources.map((src, i) => (');
  newLines.push('                <div key={i} className="p-4 rounded-2xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)]">');
  newLines.push('                   <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{src.original_message_snippet}</p>');
  newLines.push('                </div>');
  newLines.push('              ))}');
  newLines.push('            </div>');
  newLines.push('          </div>');
  newLines.push('        )}');
  newLines.push('');
  newLines.push('        {/* Topic Summoning: Redirect explicitly to talk room */}');
  newLines.push('        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[var(--color-surface-warm)] to-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">');
  newLines.push('          <div className="flex items-center gap-3">');
  newLines.push('            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">');
  newLines.push('              <MessageCircle className="w-5 h-5 text-[var(--color-primary)]" />');
  newLines.push('            </div>');
  newLines.push('            <div className="flex-1">');
  newLines.push('              <p className="text-[12px] text-[var(--color-text)] font-bold leading-snug">');
  newLines.push('                この知恵をもっと充実させませんか？');
  newLines.push('              </p>');
  newLines.push('              <p className="text-[10px] text-[var(--color-subtle)] mt-0.5">');
  newLines.push('                トークルームで体験をシェアすると、あなたの声がここに抽出されてみんなの役に立ちます。');
  newLines.push('              </p>');
  newLines.push('            </div>');
  newLines.push('          </div>');
  newLines.push('          <Link');
  newLines.push('            href={`/talk/${talkSlug}`}');
  newLines.push('            className="block mt-4 w-full text-center btn-primary !text-[13px] font-black !py-3 flex items-center justify-center gap-2"');
  newLines.push('            id="summon-topic"');
  newLines.push('          >');
  newLines.push('            <MessageCircle className="w-4 h-4" />');
  newLines.push('            このテーマについて話す');
  newLines.push('          </Link>');
  newLines.push('        </div>');
  newLines.push('      </div>');
  newLines.push('    </div>');
  newLines.push('  );');
  newLines.push('}');
  newLines.push('');

  fs.writeFileSync('src/app/(main)/wiki/[slug]/page.tsx', newLines.join('\n'));
  console.log("Fixed page.tsx");
} else {
  console.log("Could not find target line");
}
