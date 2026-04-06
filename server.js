/**
 * 本番: Vite の dist を SUBPATH 配下で配信（SPA フォールバック）
 * SUBPATH=/myapp のとき → https://ドメイン/myapp/
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizeSubpath(p) {
  let s = String(p).trim();
  if (!s.startsWith('/')) s = `/${s}`;
  return s.replace(/\/$/, '') || '/';
}

const SUBPATH = normalizeSubpath(process.env.SUBPATH || '/app');
const PORT = parseInt(process.env.PORT || '3000', 10);
const dist = path.join(__dirname, 'dist');

const app = express();

app.get(`${SUBPATH}/api/health`, (_req, res) => {
  res.json({ ok: true, subpath: SUBPATH, time: new Date().toISOString() });
});

app.use(SUBPATH, express.static(dist));

app.use(SUBPATH, (_req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  SPA → http://localhost:${PORT}${SUBPATH}/\n`);
});
