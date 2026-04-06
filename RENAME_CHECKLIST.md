# テンプレートから新規プロジェクト化するときのチェックリスト

**推奨**: 手作業で消す代わりに、**`docs/FIRST_AGENT_PROMPT.md`** を AI に渡すと一括で済みます。  
以下は **人間が確認する用**の一覧です。

## 名前・識別子（例: `myapp`）

- [ ] **GitHub リポジトリ名**
- [ ] **`package.json` の `name`**
- [ ] **`index.html` の `<title>`**
- [ ] **`docs/00_constitution.md`**（プレースホルダをプロダクト用に書き換え）
- [ ] **`docs/01_history.md`**（初回ブートストラップの追記）
- [ ] **`deploy.config.sh`**（`deploy.config.example.sh` をコピーして作成・**コミットしない**）
  - [ ] `REMOTE_DIR` → `/var/www/myapp`
  - [ ] `PM2_NAME` → `myapp`
  - [ ] `SUBPATH` → `/myapp`（先頭スラッシュ、末尾なし）
  - [ ] `APP_PORT` → 他と被らない番号（例: `3100`）
- [ ] **Nginx**（`nginx-location.example.conf` または生成された `nginx-location.generated.conf` をサーバーに反映）
- [ ] **`README.md` 冒頭のタイトル・説明文**

## 忘れがち

- [ ] 本番ビルドは **`deploy.sh` が `VITE_BASE_PATH` を設定**するので、`SUBPATH` を変えたら **再デプロイ**が必要。
- [ ] `pm2 list` と `ss -tlnp` で **ポートの重複**がないか確認。

## 検証コマンド（値は自分の環境に置換）

```bash
npm run dev
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
```

デプロイ後:

```bash
curl -s https://YOUR_DOMAIN/SUBPATH/api/health
```
