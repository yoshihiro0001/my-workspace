/**
 * Inject data-ws-file / data-ws-line for the preview inspector.
 * Skips lowercase intrinsics; targets PascalCase components and JSXMemberExpression (e.g. motion.div).
 */
import path from 'node:path';

function shouldInjectOpening(node) {
  const name = node.name;
  if (!name) return false;
  if (name.type === 'JSXIdentifier') {
    const n = name.name;
    if (n === 'Fragment') return false;
    if (/^[a-z]/.test(n)) return false;
    return true;
  }
  if (name.type === 'JSXMemberExpression') {
    if (name.property?.type !== 'JSXIdentifier') return false;
    if (name.property.name === 'Fragment') return false;
    return true;
  }
  return false;
}

export default function babelPluginWsSourceAttrs(api, opts = {}) {
  const { types: t } = api;
  const projectRoot = path.resolve(opts.projectRoot || process.cwd());

  return {
    name: 'ws-source-attrs',
    visitor: {
      JSXOpeningElement(elPath, state) {
        const node = elPath.node;
        if (!shouldInjectOpening(node)) return;

        const dup = node.attributes.some(
          (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === 'data-ws-file',
        );
        if (dup) return;

        const loc = node.loc;
        if (!loc?.start) return;

        let file = state.file.opts.filename;
        if (!file || file.includes(`${path.sep}node_modules${path.sep}`)) return;

        file = path.normalize(file);
        const normRoot = path.normalize(projectRoot);
        let rel = path.relative(normRoot, file);
        rel = rel.split(path.sep).join('/');
        if (!rel || rel.startsWith('..')) return;

        node.attributes.unshift(
          t.jsxAttribute(t.jsxIdentifier('data-ws-file'), t.stringLiteral(rel)),
          t.jsxAttribute(t.jsxIdentifier('data-ws-line'), t.stringLiteral(String(loc.start.line))),
          t.jsxAttribute(
            t.jsxIdentifier('data-ws-col'),
            t.stringLiteral(String((loc.start.column ?? 0) + 1)),
          ),
        );
      },
    },
  };
}
