# 運用・デプロイ（このリポジトリの手順書）

デプロイ・検証・名前の揃えを行うときは **本ファイルと `RENAME_CHECKLIST.md`** をセットで使う。

---

## 名前・ポートの自動導出（推奨）

GitHub リポジトリ名だけ決まっているとき、ルートで次を実行すると SUBPATH・APP_PORT 等が一括で出る。

```bash
npm run bootstrap:derive -- my-workspace
```

出力を `deploy.config.sh` の正として使う。ポートが本番で衝突する場合のみ `APP_PORT` を手で変え、`docs/01_history.md` に理由を書く。

---

## 本番の考え方（共通）

- **1 アプリ = 1 サブパス（SUBPATH）= 1 PM2 名 = 1 内部ポート（APP_PORT）= サーバー上 1 ディレクトリ（REMOTE_DIR）**
- Nginx の `location` と `proxy_pass` のポートは **`deploy.config.sh` の `APP_PORT` と一致**させる
- **`deploy.config.sh` は Git にコミットしない**（`.gitignore` 済み）

---

## デプロイ手順（ローカルから）

1. `deploy.config.example.sh` をコピーして `deploy.config.sh` を作り、値を埋める
2. プロジェクトルートで `bash deploy.sh`
3. リモートで `pm2 list` が **online**、ブラウザで `https://ドメイン${SUBPATH}/` と `${SUBPATH}/api/health` を確認

詳細コマンドはリポジトリ直下の `deploy.sh` を参照。

---

## ローカル開発

```bash
npm install
npm run dev
```

変更後:

```bash
npm run check
npm run build
```

---

## 作業完了のチェックリスト

- [ ] `npm run build` が通る
- [ ] 本番反映した場合は URL・ヘルス確認済み
- [ ] **`docs/01_history.md` に追記済み**

---

## 関連ファイル

| ファイル | 役割 |
|----------|------|
| `deploy.sh` | ローカルビルド → rsync → PM2 |
| `deploy.config.example.sh` | 変数テンプレート |
| `nginx-location.example.conf` | Nginx 追記例 |
| `RENAME_CHECKLIST.md` | 複製直後の名前揃え |
