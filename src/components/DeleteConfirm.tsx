import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

type Props = {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirm({ name, onConfirm, onCancel }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-sm flex flex-col items-center gap-4 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
          <AlertTriangle size={28} strokeWidth={1.5} className="text-red-400" />
        </span>

        <div>
          <p className="text-base font-semibold text-white">削除しますか？</p>
          <p className="mt-1 text-sm text-white/50">
            「{name}」をゴミ箱に移動します。あとから復元できます。
          </p>
        </div>

        <div className="flex w-full gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full bg-white/10 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/15"
          >
            キャンセル
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            className="flex-1 rounded-full bg-red-500/20 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
          >
            削除
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
