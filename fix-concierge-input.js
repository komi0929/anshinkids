const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/(main)/concierge/concierge-client.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `  {/* Input */}
  <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)]/80 backdrop-blur-md p-4 safe-bottom">
    {isGuest ? (
      <div className="flex flex-col items-center justify-center py-2 text-center">
        <span className="text-2xl mb-1">🔒</span>
        <p className="text-[13px] font-bold text-[var(--color-text)] mb-3">個別相談はメンバー専用機能です</p>
        <Link href="/login" className="btn-primary !text-[12px] !py-2.5 px-6 rounded-full">
          ログインして相談する
        </Link>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-2 text-center">
        <span className="text-2xl mb-1">🔒</span>
        <p className="text-[13px] font-extrabold text-[var(--color-text)] mb-2">AI相談はデータ蓄積中（準備中）です</p>
        <p className="text-[11px] font-medium text-[var(--color-subtle)] max-w-xs leading-relaxed">
          安全で正確な回答を提供するため、コミュニティの実体験が十分に集まるまでAIへの新規相談を一時ロックしています。
        </p>
      </div>
    )}
  </div>`;

const replacement = `  {/* Input */}
  <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)]/80 backdrop-blur-md p-3 safe-bottom relative z-20">
    {isGuest ? (
      <div className="flex items-center justify-between py-1 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔒</span>
          <div>
            <p className="text-[12px] font-extrabold text-[var(--color-text)] leading-tight">個別相談はメンバー専用です</p>
            <p className="text-[10px] text-[var(--color-subtle)] leading-tight mt-0.5">登録して悩みを相談</p>
          </div>
        </div>
        <Link href="/login" className="btn-primary !text-[11px] !py-2 !px-4 rounded-full">
          ログイン
        </Link>
      </div>
    ) : (
      <div className="max-w-3xl mx-auto flex gap-2 items-end">
        <div className="flex-1 bg-white rounded-2xl border-[1.5px] border-[var(--color-border)] overflow-hidden flex items-end min-h-[44px] px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow focus-within:shadow-[0_4px_20px_rgba(100,200,255,0.15)] focus-within:border-[var(--color-primary)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              // Pre-warm: cold-start the lambda while the user types
              warmUpConcierge().catch(() => {});
            }}
            placeholder="AIコンシェルジュに相談..."
            className="w-full bg-transparent border-none outline-none resize-none text-[14px] p-0 text-[var(--color-text)] placeholder-[var(--color-subtle)] placeholder:font-medium leading-[1.5] max-h-[120px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if ((e.key === "Enter" && !e.shiftKey) || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={\`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl transition-all outline-none \${
            input.trim() && !isLoading
              ? "bg-[var(--color-primary)] text-white shadow-[0_4px_15px_rgba(36,175,255,0.3)] active:scale-90"
              : "bg-[var(--color-surface-soft)] text-[var(--color-muted)] opacity-70"
          }\`}
          aria-label="送信"
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </div>
    )}
  </div>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Input area unlocked and onFocus pre-warm injected!");
