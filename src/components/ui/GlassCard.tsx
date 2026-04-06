import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

/** リスト行・カードの基本形（デザイン②: glass + rounded-2xl） */
export function GlassCard({ children, className = '' }: Props) {
  return (
    <div
      className={`glass-card glass-hover flex flex-col gap-3 text-white/90 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
