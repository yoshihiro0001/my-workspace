# プロジェクト履歴（時系列・単一の正）

このファイルは **このリポジトリの進行記録の唯一の正** とする。

- 古い記録は**削除しない**
- 新しい記録は**時系列で末尾に追記**
- AI・人間とも、**記録がない変更は未完了**とみなす

---

## 記録形式（コピーして使う）

```
【YYYY-MM-DD】

■種別
（機能追加 / 修正 / UI変更 / デプロイ / ドキュメント / インフラ / その他）

■内容
何をしたか（短文でよい）

■理由
なぜしたか（任意）

■対象
ファイル・画面名など

■結果
完了 / 保留 / 巻き戻し など
```

---

## 履歴

---

【テンプレート初期状態】

■種別
ドキュメント

■内容
Template-repository 由来の初期ファイル。憲法・履歴・運用の枠のみ。

■理由
複製後の判断ブレ防止のため。

■対象
docs/00_constitution.md, docs/01_history.md, docs/02_operations.md

■結果
完了（複製後、初回ブートストラップで置換・追記すること）

---

【2026-04-06】

■種別
ドキュメント

■内容
`docs/開発依頼書.md` を追加（テンプレ整合済み仕様）。`docs/DEVELOPMENT_KICKOFF.md`（初版）、`docs/CURSOR_AGENT_CLONE.md`。`00_START_HERE.md` / `AGENTS.md` を my-workspace 向けに更新。

■理由
GitHub / ローカルで仕様の正本を共有する。

■対象
docs/開発依頼書.md, docs/DEVELOPMENT_KICKOFF.md, docs/CURSOR_AGENT_CLONE.md, 00_START_HERE.md, AGENTS.md, docs/01_history.md

■結果
完了

---

【2026-04-06】

■種別
ドキュメント

■内容
`docs/DEVELOPMENT_KICKOFF.md` を「オーナー記入」中心から、AI にそのまま渡す最初の指示文（コピペ用）に変更。`00_START_HERE.md` / `README.md` / `AGENTS.md` の表現を整合。

■理由
開発開始時に求めていたのは指示文であり、事前の長文記入ではなかったため。

■対象
docs/DEVELOPMENT_KICKOFF.md, 00_START_HERE.md, README.md, AGENTS.md, docs/01_history.md

■結果
完了
