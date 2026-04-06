# AI エージェント向けルール（Cursor / Codex 等）

## 必読順（実装・変更のたび）

1. `00_START_HERE.md`
2. 本ファイル
3. **`docs/00_constitution.md`**（このプロダクトの正）
4. **`docs/01_history.md`**（直近の変更・判断）
5. **`docs/02_operations.md`**（デプロイ・検証）
6. **`docs/DESIGN_HANDOVER.md`**（UI の詳細）

初回セットアップは **`docs/FIRST_AGENT_PROMPT.md`** の手順どおり。**リポジトリ名以外の値は `npm run bootstrap:derive -- <repo名>` の出力に従う**（ポート衝突時のみ `APP_PORT` をオーナー確認のうえ変更し履歴に残す）。

## 毎回の依頼にユーザーが付ける一言

ユーザーが付けない場合でも、**実装作業の完了前に**次を実行すること。

> 憲法・履歴・デザイン憲法に従って実装し、終わったら `docs/01_history.md` に追記して。

（短い版は `docs/ONE_LINER.md` を参照）

## 技術スタック（変更しない）

- **Vite 6 + React 19 + TypeScript + Tailwind 3**
- **アイコン**: `lucide-react`
- **アニメーション**: `framer-motion`（`motion` コンポーネント）
- **本番配信**: `server.js`（Express が `dist/` を `SUBPATH` 配下で配信）

## UI の絶対ルール

- 新規画面・コンポーネントは **`docs/DESIGN_HANDOVER.md`** に従う。
- プロダクト方針は **`docs/00_constitution.md`** を優先する。
- ガラス系は **`src/index.css` の `.glass` / `.glass-card` / `.glass-panel`** を使うか、同じトーンで追加する。
- ダーク基調（`bg-black`）、文字は `text-white/…` の透明度で階層を付ける。

## サブパス（本番）

- `vite.config.ts` の `base` は **`VITE_BASE_PATH` 環境変数**（`deploy.sh` が `SUBPATH` から設定）。
- ルーティングを追加する場合は **Vite の base と整合**させる（`BrowserRouter` 使うなら `basename` を `import.meta.env.BASE_URL` に合わせる）。

## 履歴（必須）

- **機能変更・バグ修正・デプロイ・憲法の変更**があったら、必ず **`docs/01_history.md` に追記**する。
- **他プロジェクト**（例: tax / Keihi）の `ai_context` やサーバー固有パスを混ぜない。

## 変更してよい／注意

- **してよい**: `src/` 以下の機能追加、`App.tsx` の置き換え、新コンポーネント、`docs/` の追記。
- **注意**: `deploy.sh` の除外・PM2 名・`SUBPATH` の扱いを変えるとデプロイ手順とドキュメントがズレる。変えるなら `README.md`・`00_START_HERE.md`・`docs/02_operations.md` も更新すること。
- **秘密**: `deploy.config.sh` は `.gitignore` 対象。**コミットしない。**

## 完了前チェック

```bash
npm run check
npm run build
```
