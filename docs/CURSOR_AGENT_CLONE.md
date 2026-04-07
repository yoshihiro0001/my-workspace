# エージェントに「ローカルへ clone」を頼むとき

**「my-workspace を作ったから clone」だけ**だと、GitHub の **ユーザー名／組織名** が分からずエージェントは URL を組み立てられません。  
次のブロックを **そのままコピー**し、`OWNER` / `REPO` だけ自分の値に変えて送ってください。

---

## コピペ用（HTTPS）

```
次を実行してください（ネットワーク権限が必要です）。

mkdir -p ~/projects
cd ~/projects
git clone https://github.com/OWNER/REPO.git
cd REPO
```

例（本テンプレ利用時）:

- `OWNER` = `yoshihiro0001`
- `REPO` = `my-workspace`

---

## コピペ用（SSH・鍵設定済みの場合）

```
mkdir -p ~/projects
cd ~/projects
git clone git@github.com:OWNER/REPO.git
cd REPO
```

---

## オーナー向けメモ

- クローン後は **Cursor でそのフォルダを開く**（Open Folder → `~/projects/REPO`）。
- 初回セットアップは **`docs/FIRST_AGENT_PROMPT.md`** を続けて送る。
