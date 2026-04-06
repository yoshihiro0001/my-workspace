import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { GlassCard } from './components/ui/GlassCard';

export default function App() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 p-4 pb-10 md:max-w-2xl md:p-6">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pt-2"
        >
          <p className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Template
          </p>
          <p className="mt-1 max-w-md text-sm text-white/50">
            GitHub テンプレートのサンプル画面です。コンポーネントとスタイルをこのまま拡張してください。
          </p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/40">
                主役の数値（例）
              </p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-semibold tabular-nums text-white md:text-5xl">
                  128,400
                </span>
                <span className="text-sm text-white/50">円</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 text-right">
              <span className="text-xs text-white/40">前年比</span>
              <span className="text-sm font-medium text-emerald-400">+12.4%</span>
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3"
        >
          <GlassCard>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <Sparkles size={18} strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">カード型リストの例</p>
                  <p className="text-xs text-white/40">glass · rounded-2xl · lucide</p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-sm text-white/90">¥ 3,200</span>
            </div>
            <div className="border-t border-white/5 pt-3">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 transition-colors hover:bg-white/15">
                タグ例
              </span>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
