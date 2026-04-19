import { useEffect, useMemo, useState, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { InspectorElement } from '../types';
import * as api from '../api/client';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type CategoryId,
  type Tweak,
  detectGlassRules,
  detectSelfTweaks,
  detectSharedTweaks,
  patchGlassRuleToken,
  patchSourceLineToken,
  shiftTweak,
} from '../lib/inspector-style-utils';

type Props = {
  projectId: string;
  element: InspectorElement | null;
  inspectMode: boolean;
  onApplied: () => void;
  onNotify?: (message: string) => void;
};

const INDEX_CSS_PATH = 'src/index.css';

export function InspectorHintsPanel({
  projectId,
  element,
  inspectMode,
  onApplied,
  onNotify,
}: Props) {
  const [tweaks, setTweaks] = useState<Tweak[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [busy, setBusy] = useState(false);

  // 要素変更時、編集候補を再計算（自分の class + 親の glass-* @apply）
  useEffect(() => {
    if (!inspectMode || !element) {
      setTweaks([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const list: Tweak[] = [];
      if (element.sourceFile && element.sourceLine != null) {
        list.push(...detectSelfTweaks(element.classes, element.sourceFile, element.sourceLine));
      }
      const rules = detectGlassRules(element.classes);
      if (rules.length > 0) {
        try {
          const { content } = await api.readFile(projectId, INDEX_CSS_PATH);
          for (const r of rules) {
            list.push(...detectSharedTweaks(content, r));
          }
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setTweaks(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [inspectMode, element, projectId]);

  const grouped = useMemo(() => {
    const map = new Map<CategoryId, Tweak[]>();
    for (const t of tweaks) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return map;
  }, [tweaks]);

  const visibleCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => grouped.has(c)),
    [grouped],
  );

  useEffect(() => {
    if (visibleCategories.length === 0) {
      setActiveCategory(null);
      return;
    }
    if (!activeCategory || !visibleCategories.includes(activeCategory)) {
      setActiveCategory(visibleCategories[0]);
    }
  }, [visibleCategories, activeCategory]);

  const apply = useCallback(
    async (idx: number, to: string) => {
      const tw = tweaks[idx];
      if (!tw) return;
      setBusy(true);
      try {
        if (tw.source.kind === 'self') {
          const { content } = await api.readFile(projectId, tw.source.file);
          const lines = content.split('\n');
          const li = tw.source.line - 1;
          if (li < 0 || li >= lines.length) {
            onNotify?.('該当行が見つかりません');
            return;
          }
          const patched = patchSourceLineToken(lines[li], tw.current, to);
          if (!patched) {
            onNotify?.('置換できませんでした');
            return;
          }
          lines[li] = patched;
          await api.writeFile(projectId, tw.source.file, lines.join('\n'));
        } else {
          const { content } = await api.readFile(projectId, INDEX_CSS_PATH);
          const r = patchGlassRuleToken(content, tw.source.rule, tw.current, to);
          if (!r) {
            onNotify?.('共通スタイルを更新できませんでした');
            return;
          }
          await api.writeFile(projectId, INDEX_CSS_PATH, r.content);
        }
        setTweaks((prev) => prev.map((t, i) => (i === idx ? shiftTweak(t, to) : t)));
        onApplied();
      } catch {
        onNotify?.('保存に失敗しました');
      } finally {
        setBusy(false);
      }
    },
    [tweaks, projectId, onApplied, onNotify],
  );

  if (!inspectMode || !element || visibleCategories.length === 0) return null;

  const srcLabel =
    element.sourceFile && element.sourceLine != null
      ? `${element.sourceFile} : L${element.sourceLine}`
      : null;

  const activeRows = activeCategory ? grouped.get(activeCategory) ?? [] : [];

  return (
    <div className="shrink-0 overflow-hidden border-b border-white/5 bg-white/[0.03]">
      <div className="flex items-center gap-1.5 overflow-x-auto px-3 pt-2.5">
        {visibleCategories.map((cat) => {
          const count = grouped.get(cat)?.length ?? 0;
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                active
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                  : 'bg-white/5 text-white/55 hover:bg-white/10'
              }`}
            >
              <span>{CATEGORY_LABELS[cat]}</span>
              <span className={active ? 'text-emerald-200/70' : 'text-white/35'}>{count}</span>
            </button>
          );
        })}
        {srcLabel && (
          <span className="ml-auto shrink-0 truncate font-mono text-[10px] text-emerald-400/80">
            {srcLabel}
          </span>
        )}
      </div>

      <div className="max-h-[min(40vh,260px)] overflow-y-auto px-3 py-2.5">
        <div className="flex flex-col gap-1.5">
          {activeRows.map((tw) => {
            const idx = tweaks.indexOf(tw);
            const sourceLabel =
              tw.source.kind === 'self' ? `自分 · L${tw.source.line}` : `.${tw.source.rule}`;
            return (
              <div key={`${idx}-${tw.current}`} className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!tw.prev || busy}
                  onClick={() => void apply(idx, tw.prev!)}
                  className="flex h-9 min-h-[40px] w-9 min-w-[40px] shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/55 transition-colors hover:bg-white/10 disabled:opacity-25 md:h-7 md:min-h-0 md:w-7 md:min-w-0"
                  aria-label="一段階小さく"
                >
                  <Minus size={12} />
                </button>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-medium text-white/85">
                  {tw.current}
                </span>
                <button
                  type="button"
                  disabled={!tw.next || busy}
                  onClick={() => void apply(idx, tw.next!)}
                  className="flex h-9 min-h-[40px] w-9 min-w-[40px] shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/55 transition-colors hover:bg-white/10 disabled:opacity-25 md:h-7 md:min-h-0 md:w-7 md:min-w-0"
                  aria-label="一段階大きく"
                >
                  <Plus size={12} />
                </button>
                <span className="ml-1 shrink-0 truncate font-mono text-[10px] text-white/35">
                  {sourceLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
