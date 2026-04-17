#!/usr/bin/env node
/**
 * 管理対象プロジェクトのプレビュー用 production build。
 * ユーザーの vite.config を読み、ソース位置注入プラグインを先頭に付けて build する。
 * mergeConfig は後勝ちのため、inject → user のあと base/root を最終マージする。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, loadConfigFromFile, mergeConfig } from 'vite';
import { injectWorkspaceSource } from './vite-inject-source.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const projectDir = path.resolve(process.argv[2] || '.');
const base = process.argv[3] || '/';

const candidates = [
  'vite.config.ts',
  'vite.config.mts',
  'vite.config.cts',
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.cjs',
];

let configPath;
for (const c of candidates) {
  const p = path.join(projectDir, c);
  if (fs.existsSync(p)) {
    configPath = p;
    break;
  }
}

if (!configPath) {
  console.error('[run-preview-vite-build] vite.config が見つかりません');
  process.exit(1);
}

const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, configPath);
if (!loaded?.config) {
  console.error('[run-preview-vite-build] Vite 設定の読み込みに失敗しました');
  process.exit(1);
}

const injectFirst = { plugins: [injectWorkspaceSource(projectDir)] };
const withUser = mergeConfig(injectFirst, loaded.config);
const merged = mergeConfig(withUser, {
  base,
  root: loaded.config.root ? path.resolve(projectDir, loaded.config.root) : projectDir,
});

await build(merged);
