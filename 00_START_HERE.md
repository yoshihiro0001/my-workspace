# ここから読む（オーナー・AI 共通）

## このリポジトリ（my-workspace）

- **プロダクト仕様の正本**: **`docs/開発依頼書.md`**（AI搭載開発ワークスペース）
- **実装を始めるとき**: **`docs/DEVELOPMENT_KICKOFF.md`**（AI に渡す最初の指示文・コピペ用）
- **見た目の憲法**: `docs/DESIGN_HANDOVER.md`
- **判断・履歴・運用**: `docs/00_constitution.md` / `docs/01_history.md` / `docs/02_operations.md`

## このテンプレートの目的（技術面）

- **同じドメインのサブパス**（例: `https://fashionhoteljoy.com/my-workspace/`）に載る **React + Tailwind** アプリの土台。

## テンプレートを複製した直後にやること

1. **`docs/FIRST_AGENT_PROMPT.md`** を開き、枠内をコピーして **GitHub リポジトリ名 1 行だけ**書き換え、AI に送る（`npm run bootstrap:derive` で残りは自動導出）。
2. **仕様どおり開発を始めるとき**は **`docs/DEVELOPMENT_KICKOFF.md`** の「コピー用」枠をそのまま AI に送る。
3. 日常の開発依頼の末尾には **`docs/ONE_LINER.md` の一言**を付ける。

## まだローカルに clone していない場合

**`docs/CURSOR_AGENT_CLONE.md`** のコピペ用ブロックを使う（`OWNER` / `REPO` を必ず書く）。

## 読む順番（AI エージェント向け）

1. このファイル（`00_START_HERE.md`）
2. `AGENTS.md`
3. **`docs/開発依頼書.md`**（プロダクト仕様）
4. `docs/00_constitution.md`
5. `docs/01_history.md`
6. `docs/02_operations.md`
7. `docs/DESIGN_HANDOVER.md`
8. `RENAME_CHECKLIST.md`（複製直後の確認用）

## コードが読めない方向け：日常の動かし方

| やりたいこと | 手順 |
|--------------|------|
| 初回の名前・デプロイ設定まとめて | `docs/FIRST_AGENT_PROMPT.md` を AI に送る |
| **仕様どおり開発を始める** | **`docs/DEVELOPMENT_KICKOFF.md`** の指示文をコピーして AI に送る |
| パソコンで画面を見る | `npm install` → `npm run dev` |
| 本番に載せる | `deploy.config.sh` を用意して `bash deploy.sh`（手順は `docs/02_operations.md`） |
| 機能を頼む | 依頼文の最後に **`docs/ONE_LINER.md` の一言**を付ける |

## 本番に載せる前に（人間が一度だけ）

- サーバーに **Nginx** で `location` を追加（初回プロンプト実行後の `nginx-location.generated.conf` 等を貼る）
- 必要なら `ssh` で `REMOTE_DIR` を `mkdir`

## GitHub でリポジトリを作ったあと

1. ローカルに clone して Cursor でフォルダを開く
2. **`docs/FIRST_AGENT_PROMPT.md`** で AI に初期セットアップを依頼（未実施なら）
3. **`docs/DEVELOPMENT_KICKOFF.md`** の指示文をコピーして開発を開始
4. 以降は **`docs/ONE_LINER.md` を毎回**つけて開発依頼
