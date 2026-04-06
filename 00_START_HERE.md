# ここから読む（オーナー・AI 共通）

## このテンプレートの目的

- **同じドメインのサブパス**（例: `https://example.com/myapp/`）に載る **React + Tailwind** アプリの出発点。
- **見た目の憲法**は `docs/DESIGN_HANDOVER.md`（ダーク＆ガラス・フォント・Motion 等）。
- **判断の憲法・履歴・運用**は `docs/00_constitution.md` / `docs/01_history.md` / `docs/02_operations.md`（tax の `ai_context` と同型の考え方）。

## テンプレートを複製した直後にやること

1. **`docs/FIRST_AGENT_PROMPT.md`** を開き、枠内のプロンプトをコピーして **GitHub リポジトリ名 1 行だけ**書き換え、AI に送る（`npm run bootstrap:derive` で残りは自動導出）。
2. 日常の開発依頼の末尾には **`docs/ONE_LINER.md` の一言**を付ける。

## 読む順番（AI エージェント向け）

1. このファイル（`00_START_HERE.md`）
2. `AGENTS.md`
3. `docs/00_constitution.md`
4. `docs/01_history.md`
5. `docs/02_operations.md`
6. `docs/DESIGN_HANDOVER.md`
7. `RENAME_CHECKLIST.md`（複製直後の確認用）

## コードが読めない方向け：日常の動かし方

| やりたいこと | 手順 |
|--------------|------|
| 初回の名前・デプロイ設定まとめて | `docs/FIRST_AGENT_PROMPT.md` を AI に送る |
| パソコンで画面を見る | `npm install` → `npm run dev` |
| 本番に載せる | `deploy.config.sh` を用意して `bash deploy.sh`（手順は `docs/02_operations.md`） |
| 機能を頼む | 依頼文の最後に **`docs/ONE_LINER.md` の一言**を付ける |

## 本番に載せる前に（人間が一度だけ）

- サーバーに **Nginx** で `location` を追加（初回プロンプト実行後の `nginx-location.generated.conf` 等を貼る）
- 必要なら `ssh` で `REMOTE_DIR` を `mkdir`

## GitHub で「テンプレートから新規リポジトリ」を作ったあと

1. ローカルに clone して Cursor でフォルダを開く
2. **`docs/FIRST_AGENT_PROMPT.md`** で AI に初期セットアップを依頼
3. 以降は **`docs/ONE_LINER.md` を毎回**つけて開発依頼
