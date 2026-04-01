<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# あんしんキッズ 開発ルール

## 本番環境
- **本番URL**: https://www.anshin.kids/
- **確認・検証は必ず本番URL (https://www.anshin.kids/) で行うこと**
- ローカル (localhost) での確認は開発時のビルドチェックのみ
- ブラウザ検証、UI確認、導線確認はすべて https://www.anshin.kids/ で実施

## シェル（必須）
- **OS: Windows / Shell: PowerShell**
- **コマンド連結は `;` を使う。`&&` は絶対に使わない**
- 例: `git add .; git commit -m "msg"; git push`

## インフラ
- GitHub: komi0929/anshinkids (main ブランチ)
- Vercel: 自動デプロイ（main push で反映）
- Supabase: awmfbqvpknqhsnxknybr.supabase.co
