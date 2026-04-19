import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

type Props = {
  message: string;
  confirmLabel?: string;
  onDiscard: () => void;
  onCancel: () => void;
};

export function UnsavedDiscardModal({
  message,
  confirmLabel = '破棄して戻る',
  onDiscard,
  onCancel,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel flex w-full max-w-sm flex-col items-center gap-4 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
          <AlertTriangle size={28} strokeWidth={1.5} className="text-amber-400" />
        </span>
        <p className="text-sm leading-relaxed text-white/80">{message}</p>
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full bg-white/10 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/15"
          >
            キャンセル
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={onDiscard}
            className="flex-1 rounded-full bg-amber-500/20 py-2.5 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/30"
          >
            {confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
