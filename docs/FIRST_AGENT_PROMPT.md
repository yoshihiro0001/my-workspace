# ① テンプレート複製後・最初にエージェントへ送るプロンプト

GitHub でテンプレートから新規リポジトリを作り、**ローカルに clone 済み**のフォルダを Cursor で開いた状態で、下記を**そのままコピー**し、**リポジトリ名 1 行だけ**自分の値に変えて送ってください。

---

## オーナーが決めること（これだけ）

- **GitHub リポジトリ名**（例: `my-workspace`）  
  → スラッグ・URL パス・内部ポート・英語の仮表示名は **`npm run bootstrap:derive -- <名前>`** で**自動導出**します。

---

## コピー用（この枠の中をすべてコピー）

```
あなたはこのリポジトリの初期セットアップ担当です。次を実行してください。

【オーナー入力（1 つだけ書き換え）】
- GitHub リポジトリ名: my-workspace

【自動】
1. リポジトリルートで `npm run bootstrap:derive -- my-workspace` を実行する（上の名前に合わせる）。
2. コマンド出力の SLUG / REMOTE_DIR / PM2_NAME / SUBPATH / APP_PORT / DISPLAY_NAME_EN / DEPLOY_SERVER / DEPLOY_USER を**唯一の正**として、以降すべてに使う。

【やること（すべて）】
1. 導出した SLUG を正としてコード・ドキュメントを統一する:
   - package.json の name（= SLUG、npm 向け小文字・ハイフン）
   - index.html の <title>（まずは DISPLAY_NAME_EN でよい。日本語にしたければオーナー向けに一言残す）
   - README.md のタイトル・一言説明（リポジトリ名 / SLUG に合わせる）
   - src/App.tsx の見出し「Template」等を DISPLAY_NAME_EN に合わせて置換
   - docs/00_constitution.md の「最上位原則」「本質」を、このアプリ用に具体的に書き換え（プレースホルダを残さない）。日本語のプロダクト名があればここに書く。
2. deploy.config.example.sh を元に deploy.config.sh を新規作成し、導出値を埋める:
   REMOTE_DIR, PM2_NAME, SUBPATH, APP_PORT, DEPLOY_SERVER, DEPLOY_USER
   ※ deploy.config.sh は .gitignore 対象なのでコミットに含めないこと。
3. nginx-location.example.conf と同じ形で、リポジトリ内に nginx-location.generated.conf を生成（SUBPATH と APP_PORT は導出値）。ユーザーがサーバーに貼る用。コミットしてよい。
4. RENAME_CHECKLIST.md を「自動導出を使った」旨とともに完了チェック済みに更新。
5. docs/01_history.md の末尾に、今日の日付で「初回ブートストラップ（リポジトリ名・derive 出力・SUBPATH・PORT）」のエントリを追記。
6. npm install を実行し、npm run dev が起動できること、npm run build が通ることを確認。
7. 変更を git add / commit（deploy.config.sh が含まれていないことを確認）し、push するかどうかはユーザーに確認してから。

【禁止】
- 別リポジトリ（tax / Keihi 等）の ai_context やサーバーパスをこのプロジェクトに混ぜない。
- deploy.config.sh をコミットしない。
- リポジトリ名以外を勝手に別値にしない（ポートや SUBPATH は必ず bootstrap:derive の出力に従う。衝突時のみ APP_PORT をオーナー確認のうえ変更し、履歴に理由を書く）。

終わったら、ユーザー向けに「次に人間がやること（Nginx 貼り付け・サーバー mkdir・初回 deploy.sh・ポート衝突時の確認）」を箇条書きで短くまとめて。
```

---

# ③ 開発のたびに指示の末尾へ付ける「一言」

**コピー用（毎回これを貼る）:**

```
憲法・履歴・デザイン憲法に従って実装し、終わったら docs/01_history.md に追記して。
```

（短くしたい場合）

```
docs/00_constitution.md と docs/DESIGN_HANDOVER.md に従い、変更後は docs/01_history.md に追記。
```

意味の通じる言い換えでもよいが、**履歴追記**と**憲法・デザイン参照**の2点が入っていることが重要です。

---

## 補足（オーナー向け）

- ①は **1 リポジトリにつき 1 回**で足ります。**リポジトリ名だけ**変えれば足ります。
- **日本語のアプリ名**は `docs/00_constitution.md` と `index.html` をあとから直すのが最短です。
- **ポートが他アプリと被った**ときだけ、`deploy.config.sh` の `APP_PORT` を変え、`docs/01_history.md` に理由を残します。
- ③は **機能追加・バグ修正の依頼のたび**に付けると、エージェントの抜けが減ります。
