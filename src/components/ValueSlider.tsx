import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';

export type EditableValue = {
  line: number;
  col: number;
  raw: string;
  numValue: number;
  unit: string;
  kind: 'size' | 'color' | 'opacity' | 'angle' | 'time' | 'number';
  min: number;
  max: number;
  step: number;
};

type Props = {
  value: EditableValue;
  onChange: (newRaw: string) => void;
  onClose: () => void;
};

export function ValueSlider({ value, onChange, onClose }: Props) {
  const [current, setCurrent] = useState(value.numValue);
  const [colorHex, setColorHex] = useState(value.kind === 'color' ? value.raw : '#000000');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const emit = useCallback(
    (val: number | string) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (value.kind === 'color') {
          onChange(String(val));
        } else {
          const num = typeof val === 'number' ? val : parseFloat(String(val));
          onChange(`${num}${value.unit}`);
        }
      }, 60);
    },
    [onChange, value.kind, value.unit],
  );

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setCurrent(v);
      emit(v);
    },
    [emit],
  );

  const nudge = useCallback(
    (dir: 1 | -1) => {
      setCurrent((prev) => {
        const next = Math.round((prev + dir * value.step) * 1000) / 1000;
        const clamped = Math.max(value.min, Math.min(value.max, next));
        emit(clamped);
        return clamped;
      });
    },
    [value.step, value.min, value.max, emit],
  );

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setColorHex(e.target.value);
      emit(e.target.value);
    },
    [emit],
  );

  if (value.kind === 'color') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/95 px-3 py-2.5 shadow-xl backdrop-blur-xl"
      >
        <input
          type="color"
          value={colorHex}
          onChange={handleColorChange}
          className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs font-bold text-white/80">{colorHex}</span>
        <button onClick={onClose} className="ml-auto text-white/30 hover:text-white/60">
          <X size={14} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-900/95 px-3 py-2 shadow-xl backdrop-blur-xl"
    >
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => nudge(-1)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10"
      >
        <Minus size={12} />
      </motion.button>

      <input
        type="range"
        min={value.min}
        max={value.max}
        step={value.step}
        value={current}
        onChange={handleSliderChange}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-lg"
      />

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => nudge(1)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10"
      >
        <Plus size={12} />
      </motion.button>

      <span className="min-w-[4.5rem] text-right font-mono text-xs font-bold tabular-nums text-emerald-400">
        {value.step < 1 ? current.toFixed(2) : current}
        <span className="text-white/30">{value.unit}</span>
      </span>

      <button onClick={onClose} className="text-white/30 hover:text-white/60">
        <X size={12} />
      </button>
    </motion.div>
  );
}

const PATTERNS: {
  regex: RegExp;
  kind: EditableValue['kind'];
  extract: (m: RegExpExecArray) => { numValue: number; unit: string; raw: string };
  min: number;
  max: number;
  step: number;
}[] = [
  {
    regex: /(\d+(?:\.\d+)?)(px)/g,
    kind: 'size', min: 0, max: 500, step: 1,
    extract: (m) => ({ numValue: parseFloat(m[1]), unit: m[2], raw: m[0] }),
  },
  {
    regex: /(\d+(?:\.\d+)?)(rem)/g,
    kind: 'size', min: 0, max: 20, step: 0.125,
    extract: (m) => ({ numValue: parseFloat(m[1]), unit: m[2], raw: m[0] }),
  },
  {
    regex: /(\d+(?:\.\d+)?)(em)/g,
    kind: 'size', min: 0, max: 20, step: 0.125,
    extract: (m) => ({ numValue: parseFloat(m[1]), unit: m[2], raw: m[0] }),
  },
  {
    regex: /(\d+(?:\.\d+)?)(vh|vw)/g,
    kind: 'size', min: 0, max: 100, step: 1,
    extract: (m) => ({ numValue: parseFloat(m[1]), unit: m[2], raw: m[0] }),
  },
  {
    regex: /(\d+(?:\.\d+)?)(%)/g,
    kind: 'size', min: 0, max: 100, step: 1,
    extract: (m) => ({ numValue: parseFloat(m[1]), unit: m[2], raw: m[0] }),
  },
  {
    regex: /(\d+(?:\.\d+)?)(deg)/g,
    kind: 'angle', min: 0, max: 360, step: 1,
    extract: (m) => ({ numValue: parseFloat(m[1]), unit: m[2], raw: m[0] }),
  },
  {
    regex: /(\d+(?:\.\d+)?)(s)\b/g,
    kind: 'time', min: 0, max: 10, step: 0.1,
    extract: (m) => ({ numValue: parseFloat(m[1]), unit: m[2], raw: m[0] }),
  },
  {
    regex: /#([0-9a-fA-F]{6})\b/g,
    kind: 'color', min: 0, max: 0, step: 0,
    extract: (m) => ({ numValue: 0, unit: '', raw: m[0] }),
  },
  {
    regex: /#([0-9a-fA-F]{3})\b/g,
    kind: 'color', min: 0, max: 0, step: 0,
    extract: (m) => ({ numValue: 0, unit: '', raw: m[0] }),
  },
];

export function detectEditableValues(code: string): EditableValue[] {
  const lines = code.split('\n');
  const results: EditableValue[] = [];
  const seen = new Set<string>();

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];
    for (const pattern of PATTERNS) {
      pattern.regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.regex.exec(lineText)) !== null) {
        const key = `${lineIdx}:${m.index}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const extracted = pattern.extract(m);
        results.push({
          line: lineIdx,
          col: m.index,
          raw: extracted.raw,
          numValue: extracted.numValue,
          unit: extracted.unit,
          kind: pattern.kind,
          min: pattern.min,
          max: pattern.max,
          step: pattern.step,
        });
      }
    }
  }
  return results;
}
