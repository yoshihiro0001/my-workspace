/**
 * Multi-perspective inspector helpers.
 *
 * 「要素 → 1ファイルの1点」だけを指す旧仕様をやめ、
 * 1つの要素から「カテゴリ別（角丸 / 余白 / 文字 / 影 / 枠 …）」に
 * 複数の編集源（要素自身のクラス / 親の共通スタイル）を横断的に集約する。
 *
 * 外部に公開するのは:
 *   - detectTweaks(element classes, sourceFile, sourceLine) で要素自身の編集候補
 *   - detectGlassRules / detectSharedTweaks で `src/index.css` 内の共通ルール候補
 *   - patchSourceLineToken / patchGlassRuleToken でファイル書き換え
 *   - CATEGORY_LABELS / CATEGORY_ORDER で UI ラベル
 */

export type CategoryId =
  | 'radius'
  | 'padding'
  | 'margin'
  | 'gap'
  | 'fontSize'
  | 'fontWeight'
  | 'shadow'
  | 'borderWidth';

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  radius: '角丸',
  padding: '余白(内)',
  margin: '余白(外)',
  gap: '隙間',
  fontSize: '文字サイズ',
  fontWeight: '文字の太さ',
  shadow: '影',
  borderWidth: '枠線',
};

export const CATEGORY_ORDER: CategoryId[] = [
  'radius',
  'padding',
  'margin',
  'gap',
  'fontSize',
  'fontWeight',
  'shadow',
  'borderWidth',
];

export type GlassRule = 'glass' | 'glass-card' | 'glass-panel';
const GLASS_RULES: GlassRule[] = ['glass-panel', 'glass-card', 'glass'];

// ── Tailwind 標準スケール（カスタム値 [..] は意図的に対象外にする） ──
const SPACING_SCALE = [
  '0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4',
  '5', '6', '7', '8', '9', '10', '11', '12',
  '14', '16', '20', '24', '28', '32', '40',
];

const RADIUS_SCALE = ['none', 'sm', '', 'md', 'lg', 'xl', '2xl', '3xl', 'full'];
const FONT_SIZE_SCALE = [
  'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl',
];
const FONT_WEIGHT_SCALE = [
  'thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black',
];
const SHADOW_SCALE = ['none', 'sm', '', 'md', 'lg', 'xl', '2xl'];
const BORDER_WIDTH_SCALE = ['0', '', '2', '4', '8'];

type Matcher = {
  category: CategoryId;
  parse: (token: string) => { prefix: string; value: string } | null;
  scale: string[];
};

function tokenize(prefix: string, value: string): string {
  return value === '' ? prefix : `${prefix}-${value}`;
}

function spacingMatcher(prefixes: string[], category: CategoryId): Matcher {
  // longest-first を担保するため呼び出し側で順序を保証する
  const re = new RegExp(`^(${prefixes.join('|')})-(.+)$`);
  return {
    category,
    parse: (t) => {
      const m = re.exec(t);
      if (!m) return null;
      if (!SPACING_SCALE.includes(m[2])) return null;
      return { prefix: m[1], value: m[2] };
    },
    scale: SPACING_SCALE,
  };
}

const MATCHERS: Matcher[] = [
  // radius (rounded / rounded-{none,sm,md,lg,xl,2xl,3xl,full})
  {
    category: 'radius',
    parse: (t) => {
      const m = /^(rounded)(?:-(.+))?$/.exec(t);
      if (!m) return null;
      const value = m[2] ?? '';
      if (!RADIUS_SCALE.includes(value)) return null;
      return { prefix: 'rounded', value };
    },
    scale: RADIUS_SCALE,
  },
  // padding (longer prefix first: ps/pe を p より前に)
  spacingMatcher(['px', 'py', 'pt', 'pb', 'pl', 'pr', 'ps', 'pe', 'p'], 'padding'),
  // margin
  spacingMatcher(['mx', 'my', 'mt', 'mb', 'ml', 'mr', 'ms', 'me', 'm'], 'margin'),
  // gap (gap-x / gap-y を gap より前に)
  spacingMatcher(['gap-x', 'gap-y', 'gap'], 'gap'),
  // text size
  {
    category: 'fontSize',
    parse: (t) => {
      const m = /^text-(.+)$/.exec(t);
      if (!m) return null;
      if (!FONT_SIZE_SCALE.includes(m[1])) return null;
      return { prefix: 'text', value: m[1] };
    },
    scale: FONT_SIZE_SCALE,
  },
  // font weight
  {
    category: 'fontWeight',
    parse: (t) => {
      const m = /^font-(.+)$/.exec(t);
      if (!m) return null;
      if (!FONT_WEIGHT_SCALE.includes(m[1])) return null;
      return { prefix: 'font', value: m[1] };
    },
    scale: FONT_WEIGHT_SCALE,
  },
  // shadow
  {
    category: 'shadow',
    parse: (t) => {
      const m = /^(shadow)(?:-(.+))?$/.exec(t);
      if (!m) return null;
      const value = m[2] ?? '';
      if (!SHADOW_SCALE.includes(value)) return null;
      return { prefix: 'shadow', value };
    },
    scale: SHADOW_SCALE,
  },
  // border width
  {
    category: 'borderWidth',
    parse: (t) => {
      const m = /^(border)(?:-(0|2|4|8))?$/.exec(t);
      if (!m) return null;
      const value = m[2] ?? '';
      if (!BORDER_WIDTH_SCALE.includes(value)) return null;
      return { prefix: 'border', value };
    },
    scale: BORDER_WIDTH_SCALE,
  },
];

export type TweakSource =
  | { kind: 'self'; file: string; line: number }
  | { kind: 'shared'; rule: GlassRule };

export type Tweak = {
  category: CategoryId;
  current: string;
  prev: string | null;
  next: string | null;
  source: TweakSource;
};

function tweakFromMatcher(m: Matcher, token: string): { prev: string | null; next: string | null } | null {
  const parsed = m.parse(token);
  if (!parsed) return null;
  const i = m.scale.indexOf(parsed.value);
  if (i < 0) return null;
  return {
    prev: i > 0 ? tokenize(parsed.prefix, m.scale[i - 1]) : null,
    next: i < m.scale.length - 1 ? tokenize(parsed.prefix, m.scale[i + 1]) : null,
  };
}

/** Tailwind トークン1つを「どのカテゴリ／前後どの値」かに分類。なければ null。 */
export function detectTweakForToken(
  token: string,
): { category: CategoryId; prev: string | null; next: string | null } | null {
  for (const m of MATCHERS) {
    const r = tweakFromMatcher(m, token);
    if (r) return { category: m.category, ...r };
  }
  return null;
}

/** 要素自身のクラス列から、編集候補を抽出。 */
export function detectSelfTweaks(classes: string[], file: string, line: number): Tweak[] {
  const out: Tweak[] = [];
  for (const c of classes) {
    const t = detectTweakForToken(c);
    if (!t) continue;
    out.push({
      category: t.category,
      current: c,
      prev: t.prev,
      next: t.next,
      source: { kind: 'self', file, line },
    });
  }
  return out;
}

/** 要素のクラスに含まれる glass 系の共通ルール（要素に明示的に書かれているもののみ）。 */
export function detectGlassRules(classes: string[]): GlassRule[] {
  const set = new Set<GlassRule>();
  for (const c of classes) {
    if (GLASS_RULES.includes(c as GlassRule)) set.add(c as GlassRule);
  }
  return Array.from(set);
}

/** index.css の中の `.<rule> { @apply ...; }` から空白区切りのトークンを取り出す。 */
export function readGlassRuleApplyTokens(css: string, rule: GlassRule): string[] {
  const re = new RegExp(`\\.${rule}\\s*\\{[\\s\\S]*?@apply\\s+([^;]+);`, 'm');
  const m = re.exec(css);
  if (!m) return [];
  return m[1].split(/\s+/).filter(Boolean);
}

/** 共通ルール側の編集候補を抽出。 */
export function detectSharedTweaks(css: string, rule: GlassRule): Tweak[] {
  const tokens = readGlassRuleApplyTokens(css, rule);
  const out: Tweak[] = [];
  for (const tok of tokens) {
    const t = detectTweakForToken(tok);
    if (!t) continue;
    out.push({
      category: t.category,
      current: tok,
      prev: t.prev,
      next: t.next,
      source: { kind: 'shared', rule },
    });
  }
  return out;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** ソースの 1 行からトークン1つだけを安全に置換。境界（空白／クォート）必須。 */
export function patchSourceLineToken(line: string, from: string, to: string): string | null {
  const re = new RegExp(`(?<![\\w-])${escapeRegExp(from)}(?![\\w-])`);
  if (!re.test(line)) return null;
  return line.replace(re, to);
}

/** index.css の `.<rule> { @apply ... <from> ...; }` の `from` だけを `to` に置換。 */
export function patchGlassRuleToken(
  css: string,
  rule: GlassRule,
  from: string,
  to: string,
): { content: string } | null {
  const re = new RegExp(
    `(\\.${rule}\\s*\\{[\\s\\S]*?@apply\\s+[^;]*?(?<![\\w-]))${escapeRegExp(from)}(?![\\w-])`,
    'm',
  );
  if (!re.test(css)) return null;
  return { content: css.replace(re, `$1${to}`) };
}

/** 適用後に Tweak の current/prev/next を更新。 */
export function shiftTweak(tw: Tweak, to: string): Tweak {
  const t = detectTweakForToken(to);
  if (!t) return { ...tw, current: to, prev: null, next: null };
  return { ...tw, current: to, prev: t.prev, next: t.next };
}
