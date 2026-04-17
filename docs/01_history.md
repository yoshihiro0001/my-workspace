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

---

【2026-04-07】

■種別
機能追加 / ドキュメント

■内容
Phase 1 実装: ワークスペースのトップ画面に「プロジェクト一覧カード」を表示。ダミーデータ4件（税金申告アプリ、ポートフォリオサイト、予約管理システム、レシピ共有アプリ）。スマホファースト、ダーク＆ガラスモーフィズム UI。サマリーパネルにプロジェクト数・作業中件数を表示。`docs/00_constitution.md` のプレースホルダを開発依頼書に基づき埋めた（最上位原則・本質・禁止事項）。

■理由
依頼書の3核心（①指示→実コード書き換え、②ファイル/フォルダ管理、③3つの顔）を前提とした設計で、まず動くトップ画面を確認するため。Phase 方針に従い AI API・永続化 DB はまだ使わない。

■対象
src/App.tsx, src/types.ts, src/data/mockProjects.ts, src/components/ProjectCard.tsx, docs/00_constitution.md, index.html

■結果
完了（Phase 1 — tsc / vite build 通過）

---

【2026-04-07】

■種別
機能追加

■内容
Phase 2 実装: プロジェクトカードタップ → プロジェクト詳細画面へスライド遷移。ファイル/フォルダ一覧をダミーデータで表示（依頼書のツリー例に準拠）。フォルダを開いて階層を辿れる。パンくずナビでルートや途中フォルダに戻れる。フォルダ→ファイルのソート、空フォルダ表示、AnimatePresence によるフォルダ切り替えアニメーション。ファイル種別（html/css/js/config）ごとにアイコン・色を分けた。

■理由
核心②「ファイルとフォルダで管理する」の土台。プロジェクト → フォルダ → ファイルの階層ナビゲーションを確認するため。

■対象
src/App.tsx, src/types.ts, src/data/mockFiles.ts, src/components/ProjectView.tsx, src/components/FileItem.tsx, src/components/ProjectCard.tsx

■結果
完了（Phase 2 — tsc / vite build 通過）

---

【2026-04-07】

■種別
機能追加

■内容
Phase 3 実装: ファイルタップでボトムシート型の詳細画面が開く（h-[90vh]、rounded-t-[2.5rem]、ドラッグハンドル）。核心③「3つの顔」をタブで切り替え可能。(1) プレビュー: HTML を iframe(srcdoc) で実レンダリング。デバイス切り替え（スマホ/タブレット/PC）付き。(2) 構成説明: 依頼書の8フィールド（名前・見た目・フォント・色・機能・アニメーション・状態・メモ）をガラスカードで表示。(3) AI編集: テキスト入力 → 送信 → モックのローディング＆完了フィードバック。税金申告アプリの主要4ファイルにダミーコンテンツ・構成説明を用意。

■理由
核心③「ファイルを開くと3つの顔が見える」の土台。AI API は Phase 方針に従いモック。

■対象
src/components/FileDetailSheet.tsx, src/components/ProjectView.tsx, src/data/mockContent.ts

■結果
完了（Phase 3 — tsc / vite build 通過）

---

【2026-04-07】

■種別
機能追加

■内容
Phase 4 実装: 保存・戻す・バージョン履歴。(1) 保存ボタン: 現在のコンテンツでバージョンを作成し確定。緑チェックのフラッシュ表示。(2) 戻すボタン: 未保存の変更を直前の保存状態に復元。(3) バージョン履歴パネル: 最新10件を一覧表示、任意のバージョンに復元可能（復元自体も新バージョンとして記録）。(4) AI編集がプレビューに即反映: モックAIがプロンプトに応じてコードを実際に書き換え（色変更・フォントサイズ・ダークモード等）、プレビュータブで変更を確認後に保存/戻すを選べる。(5) 未保存インジケーター: ファイル名横の黄色ドット＋AI編集タブ内のガイダンス。useFileEditor カスタムフックで状態管理を一元化。

■理由
依頼書 UX 最重要「怖くない: 削除・上書きは必ず戻せる状態にする」の実現。核心①の「保存を押すとファイルに確定保存」「戻すを押すと直前の状態に戻る」を動作させた。

■対象
src/types.ts, src/hooks/useFileEditor.ts, src/components/FileDetailSheet.tsx, src/components/VersionHistory.tsx

■結果
完了（Phase 4 — tsc / vite build 通過）

---

【2026-04-08】

■種別
機能追加

■内容
Phase 5 実装: CRUD 操作。(1) プロジェクトの新規作成（名前＋説明、共通設定フォルダ自動生成）・名前変更・削除。(2) ファイル/フォルダの新規作成（＋ドロップダウンで種別選択）・名前変更・削除。(3) ゴミ箱画面（一覧＋復元）。(4) 削除確認モーダル（赤警告アイコン、DESIGN_HANDOVER 準拠）。(5) カード上のアクションメニュー（「…」→ 名前変更/削除）。(6) useWorkspace フックで全状態を一元管理（projects/files/trash の CRUD）。フォルダ削除は中身を再帰的にゴミ箱へ。プロジェクト削除は配下ファイルも一括ゴミ箱行き。

■理由
核心②「ファイルとフォルダで管理する」の完成。ユーザーが自分で構造を作成・整理・削除でき、削除しても復元可能（「怖くない」）。

■対象
src/types.ts, src/hooks/useWorkspace.ts, src/components/InputModal.tsx, src/components/DeleteConfirm.tsx, src/components/TrashView.tsx, src/components/ProjectCard.tsx, src/components/ProjectView.tsx, src/components/FileItem.tsx, src/App.tsx

■結果
完了（Phase 5 — tsc / vite build 通過）

---

【2026-04-08】

■種別
機能追加 / インフラ

■内容
Phase 6 実装: IndexedDB による全データ永続化。(1) `idb` ライブラリ導入。(2) `src/lib/db.ts` に DB スキーマ（projects / files / trash / content / versions / meta の6ストア）と全 CRUD 関数を定義。(3) `useWorkspace` を IndexedDB 連携に書き換え。初回起動時はモックデータを DB にシード、以後は DB から読み込み。全操作（作成・名前変更・削除・ゴミ箱・復元）が即座に DB に反映。(4) `useFileEditor` もコンテンツとバージョン履歴を DB に永続化。保存・復元で DB に書き込み。(5) App にローディング画面を追加（DB 初期化完了まで表示）。技術選定: `idb`（typed wrapper for IndexedDB）。Phase 方針に従いバックエンド API は不要、ブラウザ完結。

■理由
リロードしてもデータが消えない「本物の作業環境」を実現。依頼書「データの考え方」に従い、プロジェクト・ファイル・バージョン履歴・ゴミ箱を永続化。

■対象
package.json, src/lib/db.ts, src/hooks/useWorkspace.ts, src/hooks/useFileEditor.ts, src/App.tsx

■結果
完了（Phase 6 — tsc / vite build 通過）

---

【2026-04-09】

■種別
機能追加

■内容
Phase 7 実装: AI編集体験の完成。(1) チャット UI: ユーザー指示と AI 応答が吹き出し形式で時系列に並ぶ。ユーザー=右(青)、AI=左(ガラス)。自動スクロール。(2) 候補チップ: 初回表示時に「ボタンの色を赤にして」「ダークモードにして」など6種のワンタップ候補を表示。(3) AI応答に変更サマリー: 成功時は緑チェック+「プレビューに反映済み」、変更なし時はグレーで理由表示。(4) 自動プレビュー切り替え: AI 編集成功後 0.6s でプレビュータブに自動遷移し、結果を即確認。(5) モック AI を大幅強化: 色変更(赤/緑/紫/オレンジ/ピンク)、フォントサイズ(大/小)、角丸、ダーク/ライト、余白、影、枠線、中央揃え、セクション追加、ボタン装飾、グラデーション、タイトル装飾の全15パターン+フォールバック。変更不可時はメッセージで通知。(6) 保存ラベルに直近の AI 指示内容を自動反映。

■理由
核心①「指示したら、本物のコードが変わる」の体験サイクル完成。依頼書 UX「指示する → すぐ見える → 保存できる」の3ステップを気持ちよく動かすため。

■対象
src/hooks/useFileEditor.ts, src/components/FileDetailSheet.tsx

■結果
完了（Phase 7 — tsc / vite build 通過）

---

【2026-04-07】

■種別
機能追加

■内容
Phase 8 実装: 設定ページ。(1) AI接続設定: プロバイダ選択（Anthropic/OpenAI/モック）、APIキー入力（表示/非表示トグル）、モデル選択ドロップダウン（プロバイダに応じて自動切替）、システムプロンプト編集、接続ステータスバッジ。(2) プレビュー設定: デフォルトデバイス選択（スマホ/タブレット/PC）。(3) 保存・履歴設定: 最大バージョン数スライダー（3〜30）、ゴミ箱自動削除日数スライダー（7〜90日）。(4) データ管理: エクスポート（JSON一括ダウンロード）、インポート（ファイル選択＋読み込み）、全データクリア（確認付き）。(5) アプリ情報: バージョン、プロバイダ、ストレージ使用量、データ保存場所。(6) 設定リセット（確認付き）。(7) 実API接続: useFileEditor にプロバイダ設定を渡し、Anthropic API / OpenAI API への直接リクエスト対応。モック↔実API をプロバイダ切替で自動分岐。マークダウンコードフェンスの自動除去。(8) maxVersions 設定が useFileEditor に反映。(9) ホーム画面ヘッダーに歯車アイコンで設定画面へ遷移。

■理由
実用的な開発ツールとして使用するために、AIプロバイダのAPIキー設定やデータ管理が必要。モックのみでは実際の開発に使えないため。

■対象
src/types.ts, src/lib/db.ts, src/hooks/useSettings.ts, src/hooks/useFileEditor.ts, src/components/SettingsView.tsx, src/components/FileDetailSheet.tsx, src/components/ProjectView.tsx, src/App.tsx

■結果
完了（Phase 8 — tsc / vite build 通過）

---

【2026-04-14】

■種別
ドキュメント / 方向転換

■内容
プロダクトの方向性を大幅に変更。「仮想ファイル＋モックプレビュー＋構成説明」型のファイルマネージャーから、「実ファイル＋本物のサイト表示＋ソースマップ連携＋スライダー編集＋憲法連動型AI」の直感型ビジュアル開発エンジンへ転換。

変更内容:
- `docs/開発依頼書.md` を全面書き換え（ZenLedger Workspace Pro：直感型・高精度ビジュアル開発エンジン）
- `docs/00_constitution.md` を新方向に合わせて更新（最上位原則・3核心・禁止事項を改訂）
- 新しい3つの核心: ①本物のサイトをフルサイズで見ながら開発 ②タップ→光る→スライダー調整（非AIロジック） ③AI は根拠付きで動く
- コア・フィロソフィー3原則を新設: ①非AIロジックによる爆速反応 ②透明性の確保 ③スマホファースト
- 3層レイヤー構造を定義: プレビュー・ライブコード・エージェントの重ね合わせUI
- 実装フェーズを再定義: Phase 0（移行設計）→ Phase 1（基盤と光るロジック）→ Phase 2（直接編集とGitHub連携）→ Phase 3（憲法連動型AIエージェント）
- Phase 1〜8の資産の再利用/置き換え方針を明文化

■理由
現行の構成説明・モックプレビューでは「本当にできてるか不安」「実感がない」という根本的な問題があった。実際のサイトそのものを見ながら開発できる体験こそが、コードが読めないユーザーにとって最も直感的で信頼できるインターフェースであるため。

■対象
docs/開発依頼書.md, docs/00_constitution.md, docs/01_history.md

■結果
完了（ドキュメント更新。実装は Phase 0 から着手予定）

---

【2026-04-14】

■種別
機能追加 / インフラ / 方向転換実装

■内容
新アーキテクチャ Phase 0〜1 実装: 「仮想ファイル＋モックプレビュー」から「実ファイル＋本物のサイト表示＋インスペクタ」への全面移行を実施。

バックエンド:
- Express API サーバー構築（`server/api.js`, `server/dev.js`, `server/lib/project-store.js`）
- プロジェクト CRUD（作成時に HTML/CSS/JS テンプレート自動生成 + Git 初期化）
- ファイル CRUD（サーバー上の実ファイルの読み書き・作成・削除）
- Git 操作 API（commit / log / status / revert）
- プレビュー配信（プロジェクトの実ファイルを HTTP 配信、HTML にインスペクタスクリプトを自動注入）
- 開発時: Vite proxy で `/api/*` を API サーバー（port 3001）に転送
- 本番: `server.js` が dist 配信 + API を一体提供

フロントエンド:
- 全面書き換え。旧コンポーネント 11 ファイルを削除、新コンポーネント 7 ファイルを作成
- `ProjectList`: サーバー API 接続のプロジェクト一覧（作成・名前変更・削除）
- `WorkspaceView`: 3層レイヤー構造の基盤（プレビュー + コード + 履歴）
- `PreviewLayer`: プロジェクトの実サイトを iframe でフルスクリーン表示、インスペクタモード ON/OFF、デバイス切り替え
- `CodeLayer`: ファイルツリー + シンタックスハイライト付きコードビューア + 要素選択時のネオンハイライト + 直接編集・保存
- `FileTree`: サーバーから取得した実ファイルのツリー表示
- `SettingsView`: 旧 IndexedDB 依存を除去、サーバー連携に合わせて簡略化
- `api/client.ts`: 全 API エンドポイントの型安全クライアント
- `types.ts`: サーバー連携用の型定義に全面刷新
- `lib/db.ts`: 設定保存のみに簡略化（IndexedDB は設定専用）

インスペクタ:
- `server/inspector-client.js`: プレビュー iframe 内に注入されるインスペクタスクリプト
- 要素ホバー時にネオン枠でハイライト、タグ名・クラス名のラベル表示
- タップで要素選択 → postMessage で親フレームに通知（tag, classes, styles, rect, html）
- 親フレームが通知を受けてコードレイヤーの該当行をネオンハイライト

技術選定:
- `simple-git`: Git 操作（init, add, commit, log, checkout）
- `cors`: 開発モードの CORS 対応
- `concurrently`: API サーバー + Vite の並行起動
- `prism-react-renderer`: シンタックスハイライト（nightOwl テーマ）

■理由
開発依頼書の方向転換（同日）に基づき、Phase 0（移行設計）と Phase 1（基盤と「光る」ロジック）を一括実装。実際のサイトをフルサイズで見ながら要素をタップ → コードが光る体験を実現するため。

■対象
server/api.js, server/dev.js, server/lib/project-store.js, server/inspector-client.js, server.js, vite.config.ts, package.json, .gitignore, src/App.tsx, src/types.ts, src/lib/db.ts, src/api/client.ts, src/components/ProjectList.tsx, src/components/WorkspaceView.tsx, src/components/PreviewLayer.tsx, src/components/CodeLayer.tsx, src/components/FileTree.tsx, src/components/SettingsView.tsx, src/components/InputModal.tsx（維持）, src/components/DeleteConfirm.tsx（維持）, src/hooks/useSettings.ts（維持）

削除: src/components/FileDetailSheet.tsx, FileItem.tsx, ProjectCard.tsx, ProjectView.tsx, TrashView.tsx, VersionHistory.tsx, src/data/mockContent.ts, mockFiles.ts, mockProjects.ts, src/hooks/useFileEditor.ts, useWorkspace.ts

■結果
完了（tsc / vite build 通過。API サーバー動作確認済み: プロジェクト作成・ファイルツリー・Git ログ・プレビュー配信+インスペクタ注入）

---

【2026-04-15】

■種別
機能追加

■内容
Phase 2〜3 実装: スライダー直接編集 + 憲法連動型 AI エージェント。

**スライダー編集（Phase 2 コア）:**
- `ValueSlider` コンポーネント新設: CSS 数値（px, rem, em, vh, vw, %, deg, s）と HEX カラーのリアルタイム編集
- スマートボールド検出: コード内の編集可能な値（数値＋単位、カラーコード）を自動検出し、太字＋ハイライト表示
- タップ → スライダー表示 → ドラッグで値変更 → デバウンス 250ms でファイル保存 → プレビュー iframe 自動リロード
- ±ボタンによる微調整（step 単位のインクリメント/デクリメント）
- カラー値はネイティブ color picker で編集可能
- `detectEditableValues()` ユーティリティ: 9 種の正規表現パターンで行/列レベルの位置情報付きで値を抽出

**プレビューリアルタイム連携:**
- `PreviewLayer` を `forwardRef` + `useImperativeHandle` で拡張
- `PreviewHandle.refresh()` を外部から呼び出し可能に
- スライダー変更 → ファイル保存後 → iframe 自動リロードで即時反映

**AI エージェントレイヤー（Phase 3）:**
- `AgentLayer` コンポーネント新設: チャット UI（ユーザー=右青/AI=左紫のバブル形式）
- サジェスチョンチップ 6 種（「この色をもっと明るくして」「ダークモードにして」等）
- AI 修正案の「適用する」ボタン → ファイル保存 + プレビュー自動リロード
- 設定画面の AI プロバイダ/APIキー/モデル/システムプロンプトを `X-AI-Settings` ヘッダーで API に送信

**AI プロキシサーバー:**
- `/api/ai/chat` エンドポイント追加（server/api.js）
- Anthropic (Claude) / OpenAI (GPT) の 2 プロバイダ対応プロキシ
- CORS 問題を回避しつつ、フロントから API キーを安全に送信
- モックモード: 色変更・サイズ変更・角丸・余白・ダークテーマ等の 6 パターン自動適用
- AI レスポンスの JSON パース（`{"code":"...","explanation":"..."}` 形式）

**ワイヤリング:**
- `WorkspaceView` に AI アシスタントボタン（✨アイコン）追加
- `App.tsx` → `WorkspaceView` → `AgentLayer` へ設定を伝播
- `CodeLayer` に `onFileChanged` / `onFileSelect` コールバック追加、スライダー変更時の自動保存+プレビュー連携

■理由
開発依頼書の Phase 2「スライダーによるコード数値の直接上書き」と Phase 3「憲法連動型 AI エージェント」を実装。コードを読めないユーザーが「スワイプ」と「日本語の指示」だけでサイトを直感的に修正できる体験を完成させるため。

■対象
src/components/ValueSlider.tsx（新規）, src/components/AgentLayer.tsx（新規）, src/components/CodeLayer.tsx, src/components/PreviewLayer.tsx, src/components/WorkspaceView.tsx, src/App.tsx, server/api.js

■結果
完了（tsc / vite build 通過。AI モックエンドポイント動作確認済み: 色変更・サイズ変更の自動適用）

---

【2026-04-15】

■種別
バグ修正 / 機能追加

■内容
1. **プロジェクト作成ボタン不具合修正**:
   - `InputModal` の `handleSubmit` が async の `onSubmit` を await していなかったため、API 呼び出しの成否に関わらずフィードバックが一切なかった
   - 修正: `handleSubmit` を async 化し、try/catch でエラーメッセージを画面に表示。ローディングスピナーとボタンの disabled 制御を追加。`motion.button` に whileTap フィードバックも追加

2. **ZIP インポート機能**:
   - `POST /api/projects/import/zip`: multer で ZIP ファイルを受信 → adm-zip で展開 → 共通プレフィックス自動除去 → Git 初期化
   - フロントエンド: ファイル選択 UI、ファイルサイズ表示、FormData による送信

3. **Git クローンインポート機能**:
   - `POST /api/projects/import/git`: simple-git で shallow clone → .git 除去 → プロジェクトディレクトリにコピー → 新規 Git リポジトリとして初期化
   - フロントエンド: HTTPS URL 入力、バリデーション
   - エラー時はプロジェクトメタデータもロールバック

4. **ImportModal コンポーネント新設**:
   - タブ切り替え（ZIP ファイル / Git リポジトリ）
   - プロジェクト名入力（ZIP の場合はファイル名から自動補完）
   - ローディング・エラー・成功のフィードバック
   - ProjectList のヘッダーにインポートボタン（↓アイコン）追加

5. **ProjectStore.createEmpty()** 追加: テンプレートファイルなしでプロジェクトディレクトリのみ作成（インポート用）

■理由
ユーザーがプロジェクト作成ボタンを押しても反応がなく、操作を完了できなかった。原因は InputModal の非同期処理とエラーハンドリングの欠如。同時に、既存プロジェクトの取り込み手段（ZIP/Git）がなく、新規作成しかできない状態だった。

■対象
src/components/InputModal.tsx, src/components/ImportModal.tsx（新規）, src/components/ProjectList.tsx, server/api.js, server/lib/project-store.js, package.json（multer, adm-zip 追加）

■結果
完了（tsc / vite build 通過。API テスト済み: プロジェクト作成・ZIP インポート・Git クローン）

---

【2026-04-15】

■種別
バグ修正

■内容
大容量 ZIP インポート時の「Unexpected end of JSON input」エラーを修正。

1. **multer を diskStorage に変更**: `memoryStorage()` → `diskStorage()`。59MB の ZIP を全量メモリに読み込んでいたのを一時ファイル経由に変更。上限も 100MB → 500MB に引き上げ。一時ファイルは処理後に自動削除。

2. **node_modules 等の大量ファイルをスキップ**: ZIP 展開時に `node_modules`, `.git`, `.next`, `dist`, `build`, `__pycache__` 等 12 種のディレクトリを自動除外。インポート後に `.gitignore` を自動生成して Git コミットから除外。これにより数千ファイルの `git add .` がタイムアウトする問題を解消。

3. **タイムアウト延長**: dev.js / server.js のサーバータイムアウトを 5 分に延長。Vite プロキシのタイムアウトも 5 分に設定。

4. **フロントエンドの安全化**: `res.json()` を `safeJson()` に置き換え — レスポンスボディが空や不正な JSON の場合にクラッシュしないフォールバック処理。インポート中のステータスメッセージ表示（「サーバーで展開中… (大きいファイルは時間がかかります)」）。処理中はモーダルの閉じるボタン・バックドロップクリックを無効化。

5. **body サイズ制限**: `express.json()` の limit を 5MB → 10MB に引き上げ（dev.js / server.js 共通）。

■理由
59.2MB の ZIP（tax プロジェクト）をインポートしようとすると、メモリ不足 + node_modules の大量ファイルの git commit でサーバーがタイムアウトし、空レスポンスをフロントがパースできなかった。

■対象
server/api.js, server/dev.js, server.js, vite.config.ts, src/components/ImportModal.tsx

■結果
完了（tsc / vite build 通過。node_modules + dist 自動スキップ・.gitignore 自動生成を確認）

---

【2026-04-15】

■種別
インフラ

■内容
メインの開発サーバー（`npm run dev` = API 3001 + Vite）の状態確認と再起動。

1. **状態**: 別セッションで起動していた `concurrently` 配下で `node server/dev.js` が SIGKILL 済みのまま Vite だけ残っており、`/api/*` が ECONNREFUSED になっていた。古い Vite（同一リポジトリ由来）のプロセスも併存していた。

2. **対応**: 上記関連プロセスを終了したうえで `npm run dev` を再実行。

3. **`concurrently` の欠落**: 再実行時に `concurrently: command not found` となり、`dev` スクリプトが参照するバイナリが `node_modules` に存在しなかった。`devDependencies` に `concurrently` を追加し `npm install` で解消。

■理由
開発用 API とフロントを同時に起動する前提が崩れており、ブラウザからプロジェクト一覧等が取得できない状態だったため。

■対象
package.json, package-lock.json, docs/01_history.md

■結果
完了（ターミナルログで API `http://localhost:3001/api/` と Vite `http://localhost:5173/` の起動を確認。`npm run check` / `npm run build` 通過）

---

【2026-04-17】

■種別
バグ修正

■内容
ZIP インポート後のプレビューで「File not found」となる問題を修正。

1. **commonPrefix 検出の全面書き換え**:
   - 以前: 最初のファイルエントリの1段目だけを見て全員一致を確認 → macOS の `__MACOSX/` エントリが混ざると判定が外れ、ファイルがサブフォルダに残る
   - 修正: まず `__MACOSX/`、`._*`、`.DS_Store` のジャンクエントリを除外。実質的なファイルだけで多段のプレフィックスを検出（`a/b/c/file` のように深いネストでも正しくフラット化）

2. **`ensureIndexAtRoot()` 追加（ZIP 展開後のセーフティネット）**:
   - commonPrefix 検出がうまくいっても、サブフォルダが1つだけで `index.html` がその中にある場合、自動的に内容をルートに持ち上げる
   - 持ち上げ後に空フォルダが残る問題も `cleanEmptyDirs()` で再帰的に除去

3. **`findIndexHtml()` 追加（プレビュー配信のフォールバック）**:
   - プレビューが `index.html` を見つけられない場合、サブフォルダや `public/` ディレクトリ内を探索
   - 既存のインポート済みプロジェクトでも File not found を回避

■理由
macOS で作成した ZIP には `__MACOSX/` フォルダが含まれ、これが commonPrefix 判定を狂わせていた。結果、`index.html` がプロジェクトルートではなくサブフォルダに展開され、プレビューサーバーが「File not found」を返していた。

■対象
server/api.js

■結果
完了（tsc / vite build 通過。macOS 形式 ZIP（`__MACOSX` + 二重ネスト）で index.html がルート直下に正しく展開されること、空フォルダが残らないこと、プレビューが正常にHTMLを返すことを確認）

---

【2026-04-18】

■種別
機能追加

■内容
Vite プロジェクトのプレビューを本番（`npm run build` の `dist` 配信）に近い形で表示できるようにした。

1. **`server/lib/preview-build.js`（新規）**: `package.json` に `vite` と `build` があるプロジェクトを検出。`npm install` 後に `VITE_BASE_PATH` を `/api/projects/<id>/preview/`（本番は `SUBPATH` 付きで `${SUBPATH}/api/projects/<id>/preview/`）に設定して `npm run build`。ビルド中・失敗時はダークトーンのプレースホルダ HTML（ガラス系に近いトーン）を返す。

2. **`server/api.js`**: プレビュー GET で Vite プロジェクトは `dist/` から配信（HTML は従来どおりインスペクタ注入）。クライアントルータ向けに拡張子なしパスは `index.html` にフォールバック。ZIP / Git インポート直後にバックグラウンドでビルド開始。ファイルの追加・更新・削除および Git 復元後は `dist` を破棄して再ビルドするよう無効化。

3. **URL 解決**: `getPreviewRequestPath` を `/projects/:id/preview` サフィックス基準に変更し、本番の `SUBPATH` 付き URL でもアセットパスが一致するようにした。

ZIP で取り込んだ Vite+React は開発時の `/src/main.tsx` 直配信ではホスト側 Vite に吸い寄せられ真っ暗・不一致になる。本番と同じくビルド済み静的成果物をサブパス `base` 付きで配ればインポートしたサイトをそのままプレビューできる。
ZIP で取り込んだ Vite+React は開発時の `/src/main.tsx` 直配信ではホスト側 Vite に吸い寄せられ真っ暗・不一致になる。本番と同じくビルド済み静的成果物をサブパス `base` 付きで配ればイン��ートしたサイトをそのままプレビューできる。

■対象
server/lib/preview-build.js, server/api.js, docs/01_history.md

■結果
完了（`npm run check` / `npm run build` 通過）
