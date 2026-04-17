/**
 * 開発用 API サーバー（Vite dev server とは別プロセスで動く）
 * Vite の proxy が /api/* をこのサーバーに転送する
 */
import express from 'express';
import cors from 'cors';
import { createApiRouter } from './api.js';

const PORT = parseInt(process.env.API_PORT || '3001', 10);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const router = await createApiRouter();
app.use('/api', router);

const server = app.listen(PORT, () => {
  console.log(`\n  API server → http://localhost:${PORT}/api/\n`);
});

server.timeout = 5 * 60 * 1000;
server.keepAliveTimeout = 5 * 60 * 1000;
