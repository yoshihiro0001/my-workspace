#!/usr/bin/env node
/**
 * GitHub リポジトリ名 1 つから、SUBPATH / ポート / ディレクトリ名などを決定的に導出する。
 * 使い方: npm run bootstrap:derive -- my-workspace
 */

const raw = process.argv[2];

if (!raw || raw === '-h' || raw === '--help') {
  console.error(
    'Usage: npm run bootstrap:derive -- <github-repo-name>\n' +
      'Example: npm run bootstrap:derive -- my-workspace'
  );
  process.exit(raw ? 0 : 1);
}

function normalizeSlug(name) {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
  return s;
}

function portFromSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return 3100 + (h % 100);
}

function displayNameFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const slug = normalizeSlug(raw);
if (!slug) {
  console.error('Error: repo name normalizes to empty slug. Use a-z, 0-9, hyphen, underscore.');
  process.exit(1);
}

const displayEn = displayNameFromSlug(slug);
const appPort = String(portFromSlug(slug));
const server = 'fashionhoteljoy.com';
const user = 'root';

const lines = [
  '# 以下は `npm run bootstrap:derive -- ' + raw.trim() + '` の出力です（コピーして deploy.config.sh 等に使う）',
  '',
  `GITHUB_REPO_NAME=${slug}`,
  `SLUG=${slug}`,
  `DISPLAY_NAME_EN=${displayEn}`,
  `DEPLOY_SERVER=${server}`,
  `DEPLOY_USER=${user}`,
  `REMOTE_DIR=/var/www/${slug}`,
  `PM2_NAME=${slug}`,
  `SUBPATH=/${slug}`,
  `APP_PORT=${appPort}`,
  '',
  '# 本番 URL 例',
  `PUBLIC_URL=https://${server}/${slug}/`,
  '',
  '# 衝突時: サーバーで ss -tlnp / pm2 list を確認し、APP_PORT だけ deploy.config.sh で手動変更',
];

console.log(lines.join('\n'));
