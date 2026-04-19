import { useEffect, useState, useCallback } from 'react';
import { Palette, Sparkles, Minus, Plus } from 'lucide-react';
import type { InspectorElement } from '../types';
import * as api from '../api/client';
import {
  detectGlassRule,
  listRoundedTokens,
  patchIndexCssGlassRadius,
  patchTsxLineRoundedToken,
  nextRounderToken,
  prevRounderToken,
  type GlassRule,
  type RadiusPresetId,
} from '../lib/inspector-style-utils';

type Props = {
  projectId: string;
  element: InspectorElement | null;
  inspectMode: boolean;
  onApplied: () => void;
  onNotify?: (message: string) => void;
};

function friendlyTitle(el: InspectorElement): string {
  const t = el.text;
  if (/プロジェクト数/.test(t)) return 'プロジェクト数のサマリーカード';
  if (el.classes.some((c) => c.includes('glass-panel'))) return 'ガラス調のパネル';
  if (el.classes.some((c) => c.includes('glass-card'))) return 'ガラス調のカード';
  if (el.tag === 'button') return 'ボタン';
  if (el.tag === 'header') return 'ヘッダー領域';
  if (el.tag === 'section') return 'セクション（まとまったブロック）';
  if (el.tag === 'nav') return 'ナビゲーション';
  return `${el.tag} 要素`;
}

function motionHintFromChunk(chunk: string): string | null {
  if (!/motion\.|<motion\./.test(chunk)) return null;
  if (!/initial=\{\{/.test(chunk) && !/animate=\{\{/.test(chunk)) return null;
  return 'この付近に「表示されるときのなめらかな動き」（入場アニメ）の指定があります。数字や opacity / y をいじると動きが変わります。';
}

export function InspectorHintsPanel({
  projectId,
  element,
  inspectMode,
  onApplied,
  onNotify,
}: Props) {
  const [motionHint, setMotionHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!element?.sourceFile || !element.sourceLine || !inspectMode) {
      setMotionHint(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { content } = await api.readFile(projectId, element.sourceFile!);
        const lines = content.split('\n');
        const i = Math.max(0, element.sourceLine! - 1);
        const chunk = lines.slice(Math.max(0, i - 4), Math.min(lines.length, i + 8)).join('\n');
        if (!cancelled) setMotionHint(motionHintFromChunk(chunk));
      } catch {
        if (!cancelled) setMotionHint(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, element?.sourceFile, element?.sourceLine, inspectMode]);

  const applyGlassPreset = useCallback(
    async (rule: GlassRule, preset: RadiusPresetId) => {
      setBusy(true);
      try {
        const { content } = await api.readFile(projectId, 'src/index.css');
        const nx = patchIndexCssGlassRadius(content, rule, preset);
        if (!nx) {
          onNotify?.('index.css 内の該当スタイルが見つかりませんでした');
          return;
        }
        await api.writeFile(projectId, 'src/index.css', nx.content);
        onNotify?.('角丸を更新しました');
        onApplied();
      } catch {
        onNotify?.('保存に失敗しました');
      } finally {
        setBusy(false);
      }
    },
    [projectId, onApplied, onNotify],
  );

  const applyTsxRoundedStep = useCallback(
    async (dir: 'rounder' | 'sharper') => {
      if (!element?.sourceFile || !element.sourceLine) return;
      const tokens = listRoundedTokens(element.classes);
      const tok = tokens[0];
      if (!tok) return;
      const next = dir === 'rounder' ? nextRounderToken(tok) : prevRounderToken(tok);
      if (!next) {
        onNotify?.('これ以上はこのボタンでは変更できません');
        return;
      }
      setBusy(true);
      try {
        const { content } = await api.readFile(projectId, element.sourceFile);
        const lines = content.split('\n');
        const idx = element.sourceLine - 1;
        if (idx < 0 || idx >= lines.length) return;
        const patched = patchTsxLineRoundedToken(lines[idx], tok, next);
        if (!patched) {
          onNotify?.('この行では自動置換できませんでした');
          return;
        }
        lines[idx] = patched;
        await api.writeFile(projectId, element.sourceFile, lines.join('\n'));
        onNotify?.('クラスを更新しました');
        onApplied();
      } catch {
        onNotify?.('保存に失敗しました');
      } finally {
        setBusy(false);
      }
    },
    [projectId, element, onApplied, onNotify],
  );

  if (!inspectMode || !element) return null;

  const glassRule = detectGlassRule(element.classes);
  const roundedOnEl = listRoundedTokens(element.classes);
  const br = element.styles?.borderRadius ?? '';
  const src =
    element.sourceFile && element.sourceLine != null
      ? `${element.sourceFile} : L${element.sourceLine}`
      : null;

  return (
    <div className="shrink-0 overflow-hidden border-b border-white/5 bg-white/[0.03]">
        <div className="max-h-[min(40vh,280px)] overflow-y-auto px-3 py-2.5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-sky-400/90" />
            <span className="text-[11px] font-semibold tracking-wide text-white/80">かんたんガイド</span>
          </div>

          <p className="text-xs font-medium text-white/90">{friendlyTitle(element)}</p>
          {src && <p className="mt-0.5 font-mono text-[10px] text-emerald-400/90">{src}</p>}

          <p className="mt-2 text-[11px] leading-relaxed text-white/50">
            コードが読めなくても、下のボタンでよく触る「角丸」などを試せます。反映後はプレビューが更新されます。
          </p>

          {motionHint && (
            <div className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/5 px-2.5 py-2">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-sky-300/90">
                <Palette size={12} />
                動きについて
              </div>
              <p className="text-[11px] leading-relaxed text-white/55">{motionHint}</p>
            </div>
          )}

          {(glassRule || roundedOnEl.length > 0) && (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 px-2.5 py-2">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium text-white/60">
                <Palette size={12} />
                角丸
              </div>
              {br ? (
                <p className="mb-2 text-[10px] text-white/35">現在の表示（ブラウザ計算値）: {br}</p>
              ) : null}

              {glassRule && (
                <>
                  <p className="mb-1.5 text-[11px] leading-relaxed text-white/45">
                    <span className="font-medium text-white/60">「{glassRule}」</span>
                    は <span className="font-mono text-white/50">src/index.css</span> の共通スタイルです。ここを変えると、同じクラスを使う場所すべてに反映されます。
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        ['compact', 'やや角'],
                        ['standard', 'いつもの'],
                        ['round', 'もっと丸'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        disabled={busy}
                        onClick={() => void applyGlassPreset(glassRule, id)}
                        className="min-h-[36px] rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-medium text-white/70 transition-colors hover:bg-white/15 disabled:opacity-40 md:min-h-0"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {roundedOnEl.length > 0 && element.sourceFile && element.sourceLine != null && (
                <div className="mt-2 border-t border-white/5 pt-2">
                  <p className="mb-1.5 text-[11px] text-white/45">
                    この要素に <span className="font-mono text-emerald-400/80">{roundedOnEl[0]}</span>{' '}
                    が付いています。1 段階だけ変えられます。
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void applyTsxRoundedStep('sharper')}
                      className="flex min-h-[40px] flex-1 items-center justify-center gap-1 rounded-xl bg-white/10 py-2 text-[10px] text-white/65 hover:bg-white/15 disabled:opacity-40 md:min-h-0"
                    >
                      <Minus size={12} /> 角を立てる
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void applyTsxRoundedStep('rounder')}
                      className="flex min-h-[40px] flex-1 items-center justify-center gap-1 rounded-xl bg-white/10 py-2 text-[10px] text-white/65 hover:bg-white/15 disabled:opacity-40 md:min-h-0"
                    >
                      <Plus size={12} /> もっと丸く
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!glassRule && roundedOnEl.length === 0 && (
            <p className="mt-2 text-[11px] text-white/35">
              この要素には <span className="font-mono">glass-panel</span> /{' '}
              <span className="font-mono">glass-card</span> や <span className="font-mono">rounded-*</span>{' '}
              が見つかりませんでした。角丸は親のスタイルや別ファイルの可能性があります。
            </p>
          )}
        </div>
    </div>
  );
}
