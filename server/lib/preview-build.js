/**
 * Vite 向けプレビュー: dist の生成とビルド状態
 */
import { spawn } from 'node:child_process';
import { readFile, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/** @typedef {{ status: 'building'|'ready'|'error', promise?: Promise<void>, error?: string }} BuildSlot */

/** @type {Map<string, BuildSlot>} */
const state = new Map();

export function previewBaseForProject(projectId) {
  let sub = String(process.env.SUBPATH || '').trim();
  if (sub && !sub.startsWith('/')) sub = `/${sub}`;
  sub = sub.replace(/\/$/, '');
  if (sub && sub !== '/') {
    return `${sub}/api/projects/${projectId}/preview/`;
  }
  return `/api/projects/${projectId}/preview/`;
}

export async function isViteProject(projectDir) {
  const fp = join(projectDir, 'package.json');
  if (!existsSync(fp)) return false;
  try {
    const pkg = JSON.parse(await readFile(fp, 'utf-8'));
    if (!pkg.scripts?.build) return false;
    const d = { ...pkg.dependencies, ...pkg.devDependencies };
    return Boolean(d.vite);
  } catch {
    return false;
  }
}

function runCmd(command, args, cwd, extraEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...extraEnv },
      shell: false,
    });
    let stderr = '';
    let stdout = '';
    child.stderr?.on('data', (c) => { stderr += c; });
    child.stdout?.on('data', (c) => { stdout += c; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else {
        const tail = (stderr || stdout).slice(-4000);
        reject(new Error(tail || `コマンドが終了コード ${code} で失敗しました`));
      }
    });
  });
}

async function npm(projectDir, args, extraEnv = {}) {
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return runCmd(cmd, args, projectDir, extraEnv);
}

export function getPreviewBuildState(projectId) {
  return state.get(projectId);
}

export function invalidatePreviewBuild(projectId, projectDir) {
  state.delete(projectId);
  const distPath = join(projectDir, 'dist');
  if (existsSync(distPath)) {
    rm(distPath, { recursive: true, force: true }).catch(() => {});
  }
}

export function schedulePreviewBuild(projectId, projectDir) {
  isViteProject(projectDir).then((ok) => {
    if (ok) kickBuild(projectId, projectDir);
  });
}

/**
 * プレビュー要求時にビルドを開始（既に building なら何もしない）
 */
export function kickBuild(projectId, projectDir) {
  const cur = state.get(projectId);
  if (cur?.status === 'building') return;
  const promise = doBuild(projectId, projectDir);
  state.set(projectId, { status: 'building', promise });
  promise.catch(() => {});
}

async function doBuild(projectId, projectDir) {
  const base = previewBaseForProject(projectId);
  try {
    await npm(projectDir, ['install', '--no-fund', '--no-audit'], {});
    await npm(projectDir, ['run', 'build'], { VITE_BASE_PATH: base });
    if (!existsSync(join(projectDir, 'dist', 'index.html'))) {
      throw new Error('ビルド後も dist/index.html が見つかりません');
    }
    state.set(projectId, { status: 'ready' });
  } catch (e) {
    console.error(`[preview-build] ${projectId}:`, e?.message || e);
    await rm(join(projectDir, 'dist'), { recursive: true, force: true }).catch(() => {});
    state.set(projectId, {
      status: 'error',
      error: e?.message || 'ビルドに失敗しました',
    });
  }
}

export function loadingPreviewHtml() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="4" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>プレビューを準備中</title>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
 background: #000; color: rgba(255,255,255,0.88); font-family: system-ui, -apple-system, sans-serif; }
    .panel { padding: 2rem 2.25rem; border-radius: 1rem; background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(12px); max-width: 22rem; text-align: center; }
    .spinner { width: 2rem; height: 2rem; margin: 0 auto 1rem; border: 2px solid rgba(255,255,255,0.2);
      border-top-color: rgba(255,255,255,0.75); border-radius: 50%; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { font-size: 0.875rem; line-height: 1.55; color: rgba(255,255,255,0.5); margin: 0.75rem 0 0; }
  </style>
</head>
<body>
  <div class="panel">
    <div class="spinner"></div>
    <strong>プレビューをビルドしています</strong>
    <p>本番と同じ手順（依存関係のインストールと Vite ビルド）を実行しています。初回は数分かかることがあります。数秒ごとに自動で再読み込みされます。</p>
  </div>
</body>
</html>`;
}

export function buildFailedPreviewHtml() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>プレビューを表示できません</title>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #000; color: rgba(255,255,255,0.88); font-family: system-ui, -apple-system, sans-serif; }
    .panel { padding: 2rem 2.25rem; border-radius: 1rem; background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(12px); max-width: 24rem; text-align: center; }
    p { font-size: 0.875rem; line-height: 1.55; color: rgba(255,255,255,0.5); margin: 0.75rem 0 0; }
  </style>
</head>
<body>
  <div class="panel">
    <strong>プレビューを表示できませんでした</strong>
    <p>依存関係のインストールまたはビルドに失敗した可能性があります。package.json や Node のバージョン、ZIP にソース一式が含まれているかを確認し、必要ならファイルを修正してからプレビューを再読み込みしてください。</p>
  </div>
</body>
</html>`;
}
