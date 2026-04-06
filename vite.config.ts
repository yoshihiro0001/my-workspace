import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * 本番を https://ドメイン/SUBPATH/ に載せるとき、ビルド時に VITE_BASE_PATH=/SUBPATH/ を付与する（deploy.sh が設定）。
 * ローカル `npm run dev` は既定 `/`。
 */
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
});
