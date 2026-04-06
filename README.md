# Template Repository

GitHub **Template repository** 用のボイラープレートです。  
**React + TypeScript + Vite + Tailwind**、**ダーク＆ガラス UI**（`docs/DESIGN_HANDOVER.md`）、**同一ドメインのサブパス本番**（Express + PM2 + Nginx）、**憲法＋履歴＋運用ドキュメント**（`docs/00`〜`02`）まで含みます。

## テンプレート複製後の最初の一歩

1. リポジトリをローカルに clone し、このフォルダを Cursor で開く  
2. **`docs/FIRST_AGENT_PROMPT.md`** の「コピー用」ブロックを開き、**GitHub リポジトリ名 1 行だけ**変えて AI に送る（`npm run bootstrap:derive` でスラッグ・ポート等を自動導出）  
3. 以降の機能開発では、依頼の末尾に **`docs/ONE_LINER.md` の一言**を付ける  

詳細は **`00_START_HERE.md`** を参照。

## すぐ始める（すでに名前を揃えた後）

```bash
npm install
npm run dev
```

## このテンプレートに含まれるもの

| 項目 | 内容 |
|------|------|
| フロント | Vite 6, React 19, Tailwind 3, lucide-react, framer-motion |
| スタイル | `src/index.css` の `.glass` / `.glass-card` / `.glass-panel` |
| 本番サーバ | `server.js` が `dist/` を `SUBPATH` 下で配信、`/api/health` |
| デプロイ | `deploy.sh`、`deploy.config.example.sh` |
| ドキュメント | `AGENTS.md`, `docs/DESIGN_HANDOVER.md`, **`docs/00_constitution.md`**, **`docs/01_history.md`**, **`docs/02_operations.md`** |
| 初回AI用 | **`docs/FIRST_AGENT_PROMPT.md`**, **`docs/ONE_LINER.md`** |
| 名前の自動導出 | `npm run bootstrap:derive -- <repo名>`（`scripts/derive-from-repo-name.mjs`） |
| チェックリスト | `RENAME_CHECKLIST.md` |

## GitHub にテンプレートとして置く手順（メンテナ）

1. このリポジトリを push する。
2. GitHub → **Settings** → **Template repository** を有効化。
3. 新規案件は **Use this template** で複製し、**`docs/FIRST_AGENT_PROMPT.md`** で初期化。

## ローカルだけでビルド確認

```bash
export VITE_BASE_PATH=/demo/
npm run build
export SUBPATH=/demo
export PORT=3999
node server.js
# → http://localhost:3999/demo/
```

## ライセンス

テンプレート利用者が各自のプロジェクトで好きなライセンスを選んでください（本リポジトリにライセンスファイルが無い場合は、利用前にリポジトリオーナーに確認してください）。
