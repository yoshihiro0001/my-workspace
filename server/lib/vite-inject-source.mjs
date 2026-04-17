/**
 * プレビュー用ビルド: TSX/JSX に data-ws-* を注入する Vite プラグイン
 */
import path from 'node:path';
import babel from '@babel/core';
import wsPlugin from './babel-plugin-ws-source-attrs.mjs';

export function injectWorkspaceSource(projectRoot) {
  const root = path.resolve(projectRoot);
  return {
    name: 'workspace-inject-source',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\.(tsx|jsx)$/.test(id)) return null;
      if (id.includes(`${path.sep}node_modules${path.sep}`)) return null;

      const result = await babel.transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        presets: [
          [
            '@babel/preset-typescript',
            { isTSX: true, allExtensions: true, onlyRemoveTypeImports: true },
          ],
        ],
        plugins: [[wsPlugin, { projectRoot: root }]],
        sourceMaps: true,
      });

      if (!result?.code) return null;
      return { code: result.code, map: result.map };
    },
  };
}
