import { Router } from 'express';
import { readFile, writeFile, mkdir, rm, stat, cp } from 'fs/promises';
import { join, extname, resolve } from 'path';
import { existsSync } from 'fs';
import simpleGit from 'simple-git';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { ProjectStore } from './lib/project-store.js';
import { INSPECTOR_SCRIPT } from './inspector-client.js';
import {
  isViteProject,
  schedulePreviewBuild,
  kickBuild,
  getPreviewBuildState,
  invalidatePreviewBuild,
  loadingPreviewHtml,
  buildFailedPreviewHtml,
} from './lib/preview-build.js';

const WORKSPACE_DIR = process.env.WORKSPACE_DIR || join(process.cwd(), 'workspace-data');
const TMP_DIR = join(WORKSPACE_DIR, '.tmp');
const store = new ProjectStore(WORKSPACE_DIR);

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build',
  '__pycache__', '.cache', '.parcel-cache', '.turbo',
  'vendor', 'bower_components', '.svn',
]);

function safePath(base, rel) {
  const resolved = resolve(base, rel);
  if (!resolved.startsWith(base)) {
    throw new Error('Path traversal blocked');
  }
  return resolved;
}

async function getTree(dir, base = '') {
  let entries;
  try { entries = await import('fs/promises').then(m => m.readdir(dir, { withFileTypes: true })); }
  catch { return []; }
  const result = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      const children = await getTree(join(dir, entry.name), relPath);
      result.push({ name: entry.name, path: relPath, kind: 'folder', children });
    } else {
      result.push({ name: entry.name, path: relPath, kind: 'file' });
    }
  }
  result.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return result;
}

const MIME_MAP = {
  '.html': 'text/html', '.htm': 'text/html', '.css': 'text/css',
  '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      await mkdir(TMP_DIR, { recursive: true });
      cb(null, TMP_DIR);
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
});

async function ensureIndexAtRoot(projectDir) {
  if (existsSync(join(projectDir, 'index.html'))) {
    await cleanEmptyDirs(projectDir);
    return;
  }
  const { readdir: listDir } = await import('fs/promises');
  const items = await listDir(projectDir, { withFileTypes: true });
  const subdirs = items.filter(d => d.isDirectory() && !d.name.startsWith('.'));
  if (subdirs.length === 1) {
    const soleDir = join(projectDir, subdirs[0].name);
    if (existsSync(join(soleDir, 'index.html'))) {
      const children = await listDir(soleDir);
      for (const child of children) {
        await cp(join(soleDir, child), join(projectDir, child), { recursive: true });
      }
      await rm(soleDir, { recursive: true, force: true });
      await cleanEmptyDirs(projectDir);
      return;
    }
  }
  await cleanEmptyDirs(projectDir);
}

async function cleanEmptyDirs(dir) {
  const { readdir: listDir } = await import('fs/promises');
  try {
    const items = await listDir(dir, { withFileTypes: true });
    for (const item of items) {
      if (!item.isDirectory() || item.name.startsWith('.')) continue;
      const sub = join(dir, item.name);
      await cleanEmptyDirs(sub);
      const remaining = await listDir(sub);
      if (remaining.length === 0) {
        await rm(sub, { recursive: true, force: true });
      }
    }
  } catch { /* ignore */ }
}

function getPreviewRequestPath(req) {
  const id = req.params.id;
  const suffix = `/projects/${id}/preview`;
  const url = (req.originalUrl || req.url || '').split('?')[0];
  const idx = url.indexOf(suffix);
  if (idx === -1) return 'index.html';
  let rest = url.slice(idx + suffix.length).replace(/^\/+/, '');
  if (!rest) return 'index.html';
  try {
    return decodeURIComponent(rest);
  } catch {
    return 'index.html';
  }
}

async function findIndexHtml(projectDir) {
  if (existsSync(join(projectDir, 'index.html'))) return 'index.html';
  const { readdir: listDir } = await import('fs/promises');
  const items = await listDir(projectDir, { withFileTypes: true });
  for (const d of items.filter(i => i.isDirectory() && !i.name.startsWith('.'))) {
    if (existsSync(join(projectDir, d.name, 'index.html'))) {
      return `${d.name}/index.html`;
    }
    const pub = join(projectDir, d.name, 'public', 'index.html');
    if (existsSync(pub)) return `${d.name}/public/index.html`;
  }
  if (existsSync(join(projectDir, 'public', 'index.html'))) return 'public/index.html';
  return null;
}

export async function createApiRouter() {
  await store.load();
  const router = Router();

  // ── Projects ──

  router.get('/projects', (_req, res) => {
    res.json(store.list());
  });

  router.get('/projects/:id', (req, res) => {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    res.json(p);
  });

  router.post('/projects', async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: '名前は必須です' });
      const project = await store.create(name, description || '');
      res.status(201).json(project);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch('/projects/:id', async (req, res) => {
    const updated = await store.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    res.json(updated);
  });

  router.delete('/projects/:id', async (req, res) => {
    const ok = await store.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    res.json({ ok: true });
  });

  // ── Import: ZIP ──

  router.post('/projects/import/zip', upload.single('file'), async (req, res) => {
    let project = null;
    const tmpFile = req.file?.path;
    try {
      if (!req.file) return res.status(400).json({ error: 'ZIP ファイルが必要です' });
      const name = req.body.name;
      if (!name) return res.status(400).json({ error: 'プロジェクト名が必要です' });

      req.setTimeout(5 * 60 * 1000);
      res.setTimeout(5 * 60 * 1000);

      project = await store.createEmpty(name, 'ZIP からインポート');
      const projectDir = store.projectDir(project.id);

      const zip = new AdmZip(tmpFile);
      const entries = zip.getEntries();

      const JUNK_PREFIXES = ['__MACOSX/', '._', '.DS_Store'];
      function isJunk(name) {
        return JUNK_PREFIXES.some(p => name.startsWith(p) || name.includes('/' + p));
      }

      const realFiles = entries
        .filter(e => !e.isDirectory && !isJunk(e.entryName))
        .map(e => e.entryName);

      let commonPrefix = '';
      if (realFiles.length > 0) {
        const segments = realFiles[0].split('/');
        if (segments.length > 1) {
          let depth = 0;
          for (let d = 0; d < segments.length - 1; d++) {
            const candidate = segments.slice(0, d + 1).join('/') + '/';
            if (realFiles.every(f => f.startsWith(candidate))) {
              depth = d + 1;
            } else {
              break;
            }
          }
          if (depth > 0) {
            commonPrefix = segments.slice(0, depth).join('/') + '/';
          }
        }
      }

      let extracted = 0;
      let skipped = 0;
      for (const entry of entries) {
        if (isJunk(entry.entryName)) { skipped++; continue; }

        let entryPath = entry.entryName;
        if (commonPrefix && entryPath.startsWith(commonPrefix)) {
          entryPath = entryPath.substring(commonPrefix.length);
        }
        if (!entryPath || entryPath === '/') continue;

        const parts = entryPath.split('/');
        if (parts.some(p => SKIP_DIRS.has(p))) { skipped++; continue; }
        if (parts.some(p => p.startsWith('._'))) continue;

        const fullPath = safePath(projectDir, entryPath);
        if (entry.isDirectory) {
          await mkdir(fullPath, { recursive: true });
        } else {
          await mkdir(join(fullPath, '..'), { recursive: true });
          await writeFile(fullPath, entry.getData());
          extracted++;
        }
      }

      await ensureIndexAtRoot(projectDir);

      const gitignoreContent = [...SKIP_DIRS].join('\n') + '\n.DS_Store\n*.log\n';
      const gitignorePath = join(projectDir, '.gitignore');
      if (!existsSync(gitignorePath)) {
        await writeFile(gitignorePath, gitignoreContent);
      }

      const git = simpleGit(projectDir);
      await git.init();
      await git.add('.');
      await git.commit('ZIP からインポート');

      res.status(201).json({ ...project, stats: { extracted, skipped } });
      schedulePreviewBuild(project.id, projectDir);
    } catch (e) {
      if (project) {
        await store.remove(project.id).catch(() => {});
      }
      res.status(500).json({ error: e.message || 'ZIP インポートに失敗しました' });
    } finally {
      if (tmpFile) await rm(tmpFile, { force: true }).catch(() => {});
    }
  });

  // ── Import: Git clone ──

  router.post('/projects/import/git', async (req, res) => {
    let project = null;
    try {
      const { url, name } = req.body;
      if (!url) return res.status(400).json({ error: 'Git URL が必要です' });
      if (!name) return res.status(400).json({ error: 'プロジェクト名が必要です' });

      project = await store.createEmpty(name, `${url} からクローン`);
      const projectDir = store.projectDir(project.id);

      const tmpDir = projectDir + '_clone_tmp';
      try {
        const git = simpleGit();
        await git.clone(url, tmpDir, ['--depth', '1']);

        await rm(join(tmpDir, '.git'), { recursive: true, force: true });

        const { readdir } = await import('fs/promises');
        const items = await readdir(tmpDir);
        for (const item of items) {
          await cp(join(tmpDir, item), join(projectDir, item), { recursive: true });
        }
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }

      const git = simpleGit(projectDir);
      await git.init();
      await git.add('.');
      await git.commit(`${url} からクローン`);

      res.status(201).json(project);
      schedulePreviewBuild(project.id, projectDir);
    } catch (e) {
      if (project) {
        await store.remove(project.id).catch(() => {});
      }
      res.status(500).json({ error: e.message });
    }
  });

  // ── File tree ──

  router.get('/projects/:id/tree', async (req, res) => {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    const tree = await getTree(store.projectDir(p.id));
    res.json(tree);
  });

  // ── File CRUD ──

  router.get('/projects/:id/file', async (req, res) => {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'path パラメータが必要です' });
    try {
      const fullPath = safePath(store.projectDir(p.id), filePath);
      const content = await readFile(fullPath, 'utf-8');
      res.json({ path: filePath, content });
    } catch (e) {
      res.status(404).json({ error: 'ファイルが見つかりません' });
    }
  });

  router.put('/projects/:id/file', async (req, res) => {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: 'path が必要です' });
    try {
      const fullPath = safePath(store.projectDir(p.id), filePath);
      await mkdir(join(fullPath, '..'), { recursive: true });
      await writeFile(fullPath, content ?? '');
      invalidatePreviewBuild(p.id, store.projectDir(p.id));
      res.json({ ok: true, path: filePath });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/projects/:id/file', async (req, res) => {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    const { path: filePath, kind, content } = req.body;
    if (!filePath || !kind) return res.status(400).json({ error: 'path と kind が必要です' });
    try {
      const fullPath = safePath(store.projectDir(p.id), filePath);
      if (kind === 'folder') {
        await mkdir(fullPath, { recursive: true });
      } else {
        await mkdir(join(fullPath, '..'), { recursive: true });
        await writeFile(fullPath, content ?? '');
      }
      invalidatePreviewBuild(p.id, store.projectDir(p.id));
      res.status(201).json({ ok: true, path: filePath });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/projects/:id/file', async (req, res) => {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'path パラメータが必要です' });
    try {
      const fullPath = safePath(store.projectDir(p.id), filePath);
      await rm(fullPath, { recursive: true, force: true });
      invalidatePreviewBuild(p.id, store.projectDir(p.id));
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Git ──

  router.get('/projects/:id/git/log', async (req, res) => {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    try {
      const git = simpleGit(store.projectDir(p.id));
      const log = await git.log({ maxCount: 50 });
      res.json(log.all.map((c) => ({
        hash: c.hash,
        message: c.message,
        date: c.date,
        author: c.author_name,
      })));
    } catch {
      res.json([]);
    }
  });

  router.get('/projects/:id/git/status', async (req, res) => {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    try {
      const git = simpleGit(store.projectDir(p.id));
      const st = await git.status();
      res.json({
        modified: st.modified,
        created: st.created,
        deleted: st.deleted,
        staged: st.staged,
        isClean: st.isClean(),
      });
    } catch {
      res.json({ modified: [], created: [], deleted: [], staged: [], isClean: true });
    }
  });

  router.post('/projects/:id/git/commit', async (req, res) => {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    try {
      const git = simpleGit(store.projectDir(p.id));
      const message = req.body.message || `保存: ${new Date().toLocaleString('ja-JP')}`;
      await git.add('.');
      const result = await git.commit(message);
      res.json({ ok: true, hash: result.commit, message });
    } catch (e) {
      if (e.message?.includes('nothing to commit')) {
        return res.json({ ok: true, message: '変更なし' });
      }
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/projects/:id/git/revert', async (req, res) => {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    const { hash } = req.body;
    if (!hash) return res.status(400).json({ error: 'hash が必要です' });
    try {
      const git = simpleGit(store.projectDir(p.id));
      await git.checkout([hash, '--', '.']);
      await git.add('.');
      await git.commit(`復元: ${hash.slice(0, 7)} の状態に戻しました`);
      invalidatePreviewBuild(p.id, store.projectDir(p.id));
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Preview (serve project files with inspector injection) ──

  async function sendHtmlWithInspector(res, fullPath) {
    let html = await readFile(fullPath, 'utf-8');
    if (html.includes('</body>')) {
      html = html.replace('</body>', INSPECTOR_SCRIPT + '\n</body>');
    } else if (html.includes('</html>')) {
      html = html.replace('</html>', INSPECTOR_SCRIPT + '\n</html>');
    } else {
      html += '\n' + INSPECTOR_SCRIPT;
    }
    res.type('html').send(html);
  }

  /** Vite プロジェクト: 本番と同様 npm run build の dist を配信 */
  async function serveViteDistPreview(req, res, p, projectDir) {
    const distDir = join(projectDir, 'dist');
    const distIndex = join(distDir, 'index.html');
    const st = getPreviewBuildState(p.id);

    if (st?.status === 'building') {
      return res.status(200).type('html').send(loadingPreviewHtml());
    }

    if (st?.status === 'error' && !existsSync(distIndex)) {
      return res.status(200).type('html').send(buildFailedPreviewHtml());
    }

    if (!existsSync(distIndex)) {
      kickBuild(p.id, projectDir);
      return res.status(200).type('html').send(loadingPreviewHtml());
    }

    const reqPath = getPreviewRequestPath(req);

    let fullPath;
    try {
      fullPath = safePath(distDir, reqPath);
    } catch {
      return res.status(403).send('Forbidden');
    }

    if (!existsSync(fullPath)) {
      if (extname(reqPath)) {
        return res.status(404).send('Not found');
      }
      if (existsSync(fullPath + '.html')) {
        fullPath = fullPath + '.html';
      } else {
        try {
          fullPath = safePath(distDir, 'index.html');
        } catch {
          return res.status(403).send('Forbidden');
        }
      }
    }

    const s = await stat(fullPath);
    if (s.isDirectory()) {
      const indexPath = join(fullPath, 'index.html');
      if (existsSync(indexPath)) fullPath = indexPath;
      else {
        try {
          fullPath = safePath(distDir, 'index.html');
        } catch {
          return res.status(404).send('No index.html');
        }
      }
    }

    const ext = extname(fullPath).toLowerCase();
    if (ext === '.html' || ext === '.htm') {
      await sendHtmlWithInspector(res, fullPath);
      return;
    }
    const mime = MIME_MAP[ext] || 'application/octet-stream';
    res.type(mime).sendFile(fullPath);
  }

  /** 静的 HTML など（テンプレート生成プロジェクト） */
  async function serveStaticPreview(req, res, p, projectDir) {
    let reqPath = getPreviewRequestPath(req);

    if (reqPath === 'index.html' && !existsSync(join(projectDir, 'index.html'))) {
      const found = await findIndexHtml(projectDir);
      if (found) reqPath = found;
    }

    let fullPath;
    try {
      fullPath = safePath(projectDir, reqPath);
    } catch {
      return res.status(403).send('Forbidden');
    }

    if (!existsSync(fullPath)) {
      if (!extname(reqPath) && existsSync(fullPath + '.html')) {
        fullPath = fullPath + '.html';
      } else if (existsSync(join(fullPath, 'index.html'))) {
        fullPath = join(fullPath, 'index.html');
      } else {
        return res.status(404).send('File not found');
      }
    }

    const s = await stat(fullPath);
    if (s.isDirectory()) {
      const indexPath = join(fullPath, 'index.html');
      if (existsSync(indexPath)) fullPath = indexPath;
      else return res.status(404).send('No index.html');
    }

    const ext = extname(fullPath).toLowerCase();
    if (ext === '.html' || ext === '.htm') {
      await sendHtmlWithInspector(res, fullPath);
      return;
    }
    const mime = MIME_MAP[ext] || 'application/octet-stream';
    res.type(mime).sendFile(fullPath);
  }

  async function servePreview(req, res) {
    const p = store.get(req.params.id);
    if (!p) return res.status(404).send('Not found');
    const projectDir = store.projectDir(p.id);
    if (await isViteProject(projectDir)) {
      return serveViteDistPreview(req, res, p, projectDir);
    }
    return serveStaticPreview(req, res, p, projectDir);
  }

  router.get('/projects/:id/preview', servePreview);
  router.get('/projects/:id/preview/*', servePreview);

  // ── AI proxy ──

  router.post('/ai/chat', async (req, res) => {
    const { message, file, code } = req.body;
    if (!message) return res.status(400).json({ error: 'メッセージが必要です' });

    const settingsRaw = req.headers['x-ai-settings'];
    let settings = {};
    try { settings = settingsRaw ? JSON.parse(settingsRaw) : {}; } catch {}
    const { provider, apiKey, model, systemPrompt } = settings;

    if (!provider || provider === 'mock') {
      const mockResult = applyMockAI(message, code || '');
      return res.json(mockResult);
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'API キーが設定されていません。設定画面で入力してください。' });
    }

    const sysPrompt = (systemPrompt || '') +
      '\n\n## 出力形式\n以下の JSON のみを返してください（マークダウン不要）:\n{"code":"修正後のコード全文","explanation":"修正の説明（日本語で簡潔に）"}';

    const userContent = `ファイル: ${file || '(不明)'}\n\n## 現在のコード:\n\`\`\`\n${code || ''}\n\`\`\`\n\n## 指示:\n${message}`;

    try {
      let result;
      if (provider === 'anthropic') {
        result = await callAnthropic(apiKey, model || 'claude-sonnet-4-6', sysPrompt, userContent);
      } else if (provider === 'openai') {
        result = await callOpenAI(apiKey, model || 'gpt-4o', sysPrompt, userContent);
      } else {
        return res.status(400).json({ error: `不明なプロバイダ: ${provider}` });
      }
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message || 'AI API 呼び出しに失敗しました' });
    }
  });

  return router;
}

function applyMockAI(message, code) {
  const lower = message.toLowerCase();
  let newCode = code;
  let explanation = '';

  if (lower.includes('赤') || lower.includes('red')) {
    newCode = code.replace(/#[0-9a-fA-F]{3,6}/g, '#ff4444');
    explanation = '色を赤系に変更しました。';
  } else if (lower.includes('青') || lower.includes('blue')) {
    newCode = code.replace(/#[0-9a-fA-F]{3,6}/g, '#4488ff');
    explanation = '色を青系に変更しました。';
  } else if (lower.includes('大き') || lower.includes('サイズ')) {
    newCode = code.replace(/font-size:\s*[\d.]+rem/g, 'font-size: 3rem');
    newCode = newCode.replace(/font-size:\s*[\d.]+px/g, 'font-size: 32px');
    explanation = 'フォントサイズを大きくしました。';
  } else if (lower.includes('角丸') || lower.includes('round')) {
    newCode = code.replace(/border-radius:\s*[\d.]+px/g, 'border-radius: 20px');
    newCode = newCode.replace(/border-radius:\s*999px/g, 'border-radius: 20px');
    explanation = '角丸を調整しました。';
  } else if (lower.includes('余白') || lower.includes('padding')) {
    newCode = code.replace(/padding:\s*[\d.]+(?:px|rem)/g, 'padding: 3rem');
    explanation = '余白を広くしました。';
  } else if (lower.includes('ダーク') || lower.includes('dark')) {
    newCode = code.replace(/background:\s*[^;]+;/g, 'background: #111111;');
    newCode = newCode.replace(/color:\s*[^;]+;/g, 'color: #ffffff;');
    explanation = 'ダークテーマに変更しました。';
  } else {
    explanation = `「${message}」の指示を受け取りましたが、モックモードでは対応パターンが限られています。設定画面で AI プロバイダを Claude/GPT に切り替えてください。`;
    return { explanation };
  }

  return { code: newCode, explanation };
}

async function callAnthropic(apiKey, model, systemPrompt, userContent) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  return parseAIResponse(text);
}

async function callOpenAI(apiKey, model, systemPrompt, userContent) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseAIResponse(text);
}

function parseAIResponse(text) {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      code: parsed.code || undefined,
      explanation: parsed.explanation || '修正を適用しました。',
    };
  } catch {
    if (text.includes('<') || text.includes('{')) {
      return { code: text.trim(), explanation: 'コードを生成しました。' };
    }
    return { explanation: text.trim() };
  }
}
