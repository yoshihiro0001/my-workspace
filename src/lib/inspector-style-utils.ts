/** Helpers for inspector "friendly" style tweaks (non-coder UX). */

export type GlassRule = 'glass-panel' | 'glass-card';

export type RadiusPresetId = 'compact' | 'standard' | 'round';

const GLASS_RADIUS: Record<GlassRule, Record<RadiusPresetId, string>> = {
  'glass-panel': {
    compact: 'rounded-2xl',
    standard: 'rounded-3xl',
    round: 'rounded-[2.5rem]',
  },
  'glass-card': {
    compact: 'rounded-xl',
    standard: 'rounded-2xl',
    round: 'rounded-3xl',
  },
};

export function patchIndexCssGlassRadius(
  css: string,
  rule: GlassRule,
  preset: RadiusPresetId,
): { content: string } | null {
  const token = GLASS_RADIUS[rule][preset];
  const re = new RegExp(
    `(\\.${rule}\\s*\\{[\\s\\S]*?@apply\\s+glass\\s+)rounded-[\\w\\[\\].-]+`,
    'm',
  );
  if (!re.test(css)) return null;
  return { content: css.replace(re, `$1${token}`) };
}

export function detectGlassRule(classNames: string[]): GlassRule | null {
  const s = classNames.join(' ');
  if (/\bglass-panel\b/.test(s)) return 'glass-panel';
  if (/\bglass-card\b/.test(s)) return 'glass-card';
  return null;
}

/** Tailwind rounded-* tokens on this element (DOM class list). */
export function listRoundedTokens(classNames: string[]): string[] {
  return classNames.filter((c) => /^rounded(-|$)/.test(c));
}

export function patchTsxLineRoundedToken(line: string, fromToken: string, toToken: string): string | null {
  if (!line.includes(fromToken)) return null;
  const next = line.replace(fromToken, toToken);
  return next === line ? null : next;
}

const ROUND_STEPS = ['rounded-none', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl'] as const;

export function nextRounderToken(current: string): string | null {
  const i = ROUND_STEPS.indexOf(current as (typeof ROUND_STEPS)[number]);
  if (i < 0) return null;
  if (i >= ROUND_STEPS.length - 1) return null;
  return ROUND_STEPS[i + 1];
}

export function prevRounderToken(current: string): string | null {
  const i = ROUND_STEPS.indexOf(current as (typeof ROUND_STEPS)[number]);
  if (i < 0) return null;
  if (i <= 0) return null;
  return ROUND_STEPS[i - 1];
}
