/**
 * JSX/TSX の各要素に data-ws-file / data-ws-line を付与（プレビューインスペクタ用）
 */
import path from 'node:path';

export default function babelPluginWsSourceAttrs(api, opts = {}) {
  const { types: t } = api;
  const projectRoot = path.resolve(opts.projectRoot || process.cwd());

  return {
    name: 'ws-source-attrs',
    visitor: {
      JSXOpeningElement(elPath, state) {
        const node = elPath.node;
        if (node.name?.type === 'JSXIdentifier' && node.name.name === 'Fragment') return;

        const dup = node.attributes.some(
          (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === 'data-ws-file',
        );
        if (dup) return;

        const loc = node.loc;
        if (!loc) return;

        const file = state.file.opts.filename;
        if (!file || file.includes(`${path.sep}node_modules${path.sep}`)) return;

        let rel = path.relative(projectRoot, file);
        rel = rel.split(path.sep).join('/');
        if (!rel || rel.startsWith('..')) return;

        node.attributes.unshift(
          t.jsxAttribute(t.jsxIdentifier('data-ws-file'), t.stringLiteral(rel)),
          t.jsxAttribute(t.jsxIdentifier('data-ws-line'), t.stringLiteral(String(loc.start.line))),
        );
      },
    },
  };
}
