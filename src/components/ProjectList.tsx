import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, LayoutGrid, Settings, Loader2, MoreHorizontal,
  Pencil, Trash2, FolderOpen, Download,
} from 'lucide-react';
import type { Project } from '../types';
import * as api from '../api/client';
import { InputModal } from './InputModal';
import { DeleteConfirm } from './DeleteConfirm';
import { ImportModal } from './ImportModal';

type Props = {
  onOpenProject: (project: Project) => void;
  onOpenSettings: () => void;
};

export function ProjectList({ onOpenProject, onOpenSettings }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await api.listProjects();
      setProjects(list);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = useCallback(
    async (name: string, description?: string) => {
      await api.createProject(name, description || '');
      setShowCreate(false);
      refresh();
    },
    [refresh],
  );

  const handleRename = useCallback(
    async (name: string) => {
      if (!renameTarget) return;
      await api.updateProject(renameTarget.id, { name });
      setRenameTarget(null);
      refresh();
    },
    [renameTarget, refresh],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await api.deleteProject(deleteTarget.id);
    setDeleteTarget(null);
    refresh();
  }, [deleteTarget, refresh]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-white/40" />
          <p className="text-sm text-white/40">読み込み中…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 p-4 pb-10 md:max-w-2xl md:p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-start justify-between gap-4 pt-2"
      >
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid size={20} strokeWidth={1.5} className="text-white/60" />
            <p className="font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
              ワークスペース
            </p>
          </div>
          <p className="mt-1 max-w-xs text-sm text-white/50">
            プロジェクトを選んで開発を始めましょう
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenSettings}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/50 transition-colors hover:bg-white/15"
            title="設定"
          >
            <Settings size={18} strokeWidth={1.5} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowImport(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/50 transition-colors hover:bg-white/15"
            title="インポート"
          >
            <Download size={18} strokeWidth={1.5} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreate(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/15"
            title="新規作成"
          >
            <Plus size={20} strokeWidth={2} />
          </motion.button>
        </div>
      </motion.header>

      {/* Summary */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">プロジェクト数</p>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-mono text-4xl font-semibold tabular-nums text-white md:text-5xl">
                {projects.length}
              </span>
              <span className="text-sm text-white/50">件</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Project cards */}
      <div className="flex flex-col gap-3">
        {projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card flex flex-col items-center gap-3 py-12"
          >
            <FolderOpen size={32} className="text-white/15" />
            <p className="text-sm text-white/30">プロジェクトがありません</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/15"
              >
                新規作成
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/15"
              >
                インポート
              </button>
            </div>
          </motion.div>
        )}

        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="glass-card group relative flex items-center gap-3">
              <button
                onClick={() => onOpenProject(project)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5">
                  <FolderOpen size={18} className="text-white/60" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{project.name}</p>
                  {project.description && (
                    <p className="mt-0.5 truncate text-xs text-white/40">{project.description}</p>
                  )}
                  <p className="mt-0.5 text-[10px] text-white/25">
                    {new Date(project.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </button>

              {/* Action menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/10 hover:text-white/60"
                >
                  <MoreHorizontal size={16} />
                </button>
                <AnimatePresence>
                  {menuOpen === project.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-9 z-10 w-36 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/95 shadow-xl backdrop-blur-xl"
                    >
                      <button
                        onClick={() => { setRenameTarget(project); setMenuOpen(null); }}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-white/70 hover:bg-white/5"
                      >
                        <Pencil size={13} /> 名前を変更
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(project); setMenuOpen(null); }}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/5"
                      >
                        <Trash2 size={13} /> 削除
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <InputModal
            title="新しいプロジェクト"
            placeholder="プロジェクト名"
            secondaryPlaceholder="説明（任意）"
            submitLabel="作成"
            onSubmit={handleCreate}
            onClose={() => setShowCreate(false)}
          />
        )}
        {showImport && (
          <ImportModal
            onImported={refresh}
            onClose={() => setShowImport(false)}
          />
        )}
        {renameTarget && (
          <InputModal
            title="名前を変更"
            placeholder="新しい名前"
            initialValue={renameTarget.name}
            submitLabel="変更"
            onSubmit={handleRename}
            onClose={() => setRenameTarget(null)}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm
            name={deleteTarget.name}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
