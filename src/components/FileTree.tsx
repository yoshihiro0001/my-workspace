import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react';
import type { FileEntry } from '../types';

type Props = {
  tree: FileEntry[];
  selectedPath: string | null;
  onSelect: (entry: FileEntry) => void;
};

export function FileTree({ tree, selectedPath, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-0.5 py-1">
      {tree.map((entry) => (
        <TreeNode
          key={entry.path}
          entry={entry}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function TreeNode({
  entry,
  depth,
  selectedPath,
  onSelect,
}: {
  entry: FileEntry;
  depth: number;
  selectedPath: string | null;
  onSelect: (entry: FileEntry) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const isFolder = entry.kind === 'folder';
  const isSelected = entry.path === selectedPath;

  const ext = entry.name.split('.').pop()?.toLowerCase() ?? '';
  const colorClass =
    ext === 'html' || ext === 'htm'
      ? 'text-orange-400'
      : ext === 'css'
        ? 'text-blue-400'
        : ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx'
          ? 'text-yellow-400'
          : 'text-white/40';

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (isFolder) setOpen((v) => !v);
          else onSelect(entry);
        }}
        className={`flex min-h-[44px] w-full items-center gap-1.5 rounded-lg px-2 py-2.5 text-left text-xs transition-colors md:min-h-0 md:py-1.5 ${
          isSelected
            ? 'bg-white/10 text-white'
            : 'text-white/60 hover:bg-white/5 hover:text-white/80'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          <>
            <ChevronRight
              size={12}
              className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
            />
            {open ? (
              <FolderOpen size={14} className="shrink-0 text-white/40" />
            ) : (
              <Folder size={14} className="shrink-0 text-white/40" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <File size={14} className={`shrink-0 ${colorClass}`} />
          </>
        )}
        <span className="truncate font-mono">{entry.name}</span>
      </button>

      <AnimatePresence>
        {isFolder && open && entry.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {entry.children.map((child) => (
              <TreeNode
                key={child.path}
                entry={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
