import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

type Props = {
  title: string;
  placeholder: string;
  initialValue?: string;
  secondaryPlaceholder?: string;
  submitLabel?: string;
  onSubmit: (value: string, secondary?: string) => void | Promise<void>;
  onClose: () => void;
};

export function InputModal({
  title,
  placeholder,
  initialValue = '',
  secondaryPlaceholder,
  submitLabel = '作成',
  onSubmit,
  onClose,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [secondary, setSecondary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || loading) return;
    setError(null);
    setLoading(true);
    try {
      await onSubmit(value.trim(), secondary.trim() || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [value, secondary, loading, onSubmit]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel flex w-full max-w-sm flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-white">{title}</p>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/50 transition-colors hover:bg-white/15"
          >
            <X size={14} />
          </button>
        </div>

        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !secondaryPlaceholder && handleSubmit()}
          placeholder={placeholder}
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:ring-1 focus:ring-white/20"
        />

        {secondaryPlaceholder && (
          <input
            type="text"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={secondaryPlaceholder}
            className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:ring-1 focus:ring-white/20"
          />
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-full bg-white/10 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/15 disabled:opacity-40"
          >
            キャンセル
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!value.trim() || loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/15 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? '処理中…' : submitLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
