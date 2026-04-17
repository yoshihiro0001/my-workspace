/**
 * Preview build: inject data-ws-* into TSX/JSX.
 * Resolves @babel/preset-typescript from the host app so child projects need no @babel/* for preview.
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import babel from '@babel/core';
import wsPlugin from './babel-plugin-ws-source-attrs.mjs';

const require = createRequire(import.meta.url);
const presetTypeScriptPath = require.resolve('@babel/preset-typescript');

function cleanModuleId(id) {
  const q = id.indexOf('?');
  const h = id.indexOf('#');
  let end = id.length;
  if (q >= 0) end = Math.min(end, q);
  if (h >= 0) end = Math.min(end, h);
  return id.slice(0, end);
}

export function injectWorkspaceSource(projectRoot) {
  const root = path.resolve(projectRoot);
  return {
    name: 'workspace-inject-source',
    enforce: 'pre',
    apply: 'build',
    async transform(code, id) {
      if (id.includes('\0')) return null;
      const fid = cleanModuleId(id);
      if (!/\.(tsx|jsx)$/i.test(fid)) return null;
      if (fid.includes(`${path.sep}node_modules${path.sep}`)) return null;

      const absFile = path.isAbsolute(fid) ? path.normalize(fid) : path.normalize(path.join(root, fid));

      try {
        const result = await babel.transformAsync(code, {
          filename: absFile,
          cwd: root,
          babelrc: false,
          configFile: false,
          presets: [
            [
              presetTypeScriptPath,
              { isTSX: true, allExtensions: true, onlyRemoveTypeImports: true },
            ],
          ],
          plugins: [[wsPlugin, { projectRoot: root }]],
          sourceMaps: true,
          retainLines: true,
        });

        if (!result?.code) return null;
        return { code: result.code, map: result.map };
      } catch (e) {
        console.error('[workspace-inject-source] skip (babel):', absFile, e?.message || e);
        return null;
      }
    },
  };
}
