# deploy.config.example.sh → コピーして deploy.config.sh にリネームし、値を編集する。

export DEPLOY_SERVER="fashionhoteljoy.com"
export DEPLOY_USER="root"
export REMOTE_DIR="/var/www/PROJECT_SLUG"
export PM2_NAME="PROJECT_SLUG"
# 公開パス（先頭スラッシュ、末尾スラッシュなし）例: /myapp
export SUBPATH="/PROJECT_SLUG"
# Node の listen ポート（Nginx proxy_pass と一致させる。他アプリと被らない番号）
export APP_PORT="3100"
