#!/usr/bin/env bash
# ローカルで Vite ビルド → rsync → 本番 npm install --production → PM2
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ ! -f "$ROOT/deploy.config.sh" ]]; then
  echo "❌ deploy.config.sh がありません。"
  echo "   deploy.config.example.sh をコピーして deploy.config.sh を作成してください。"
  exit 1
fi
# shellcheck source=/dev/null
source "$ROOT/deploy.config.sh"

: "${DEPLOY_SERVER:?}"
: "${DEPLOY_USER:?}"
: "${REMOTE_DIR:?}"
: "${PM2_NAME:?}"
: "${SUBPATH:?}"
: "${APP_PORT:?}"

SSH_TARGET="${DEPLOY_USER}@${DEPLOY_SERVER}"

# Vite の base（末尾スラッシュ必須）
export VITE_BASE_PATH="${SUBPATH%/}/"

echo ""
echo "🚀 デプロイ → ${SSH_TARGET}:${REMOTE_DIR}"
echo "   公開: https://${DEPLOY_SERVER}${VITE_BASE_PATH}"
echo ""

echo "📦 ローカルビルド（VITE_BASE_PATH=${VITE_BASE_PATH}）..."
npm ci
npm run build

echo ""
echo "📦 rsync..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude 'deploy.config.sh' \
  "$ROOT/" "${SSH_TARGET}:${REMOTE_DIR}/"

echo ""
echo "⚙️  リモート..."
ssh "${SSH_TARGET}" bash -s <<EOF
set -euo pipefail
cd "${REMOTE_DIR}"
mkdir -p data uploads
npm install --production
export PORT="${APP_PORT}"
export SUBPATH="${SUBPATH}"
if pm2 list | grep -q " ${PM2_NAME} "; then
  pm2 restart "${PM2_NAME}" --update-env
else
  pm2 start server.js --name "${PM2_NAME}"
  pm2 save
fi
pm2 list
EOF

echo ""
echo "✅ 完了"
echo "   画面: https://${DEPLOY_SERVER}${VITE_BASE_PATH}"
echo "   API:  curl -s https://${DEPLOY_SERVER}${SUBPATH}/api/health"
echo ""
