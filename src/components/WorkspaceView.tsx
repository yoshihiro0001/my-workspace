import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Code2, Save, GitCommit, History,
  CheckCircle2, Loader2, Sparkles,
} from 'lucide-react';
import type { Project, FileEntry, InspectorElement, GitLogEntry, AppSettings } from '../types';
import { PreviewLayer, type PreviewHandle } from './PreviewLayer';
import { CodeLayer } from './CodeLayer';
import { AgentLayer } from './AgentLayer';
import * as api from '../api/client';

type Props = {
  project: Project;
  settings: AppSettings;
  onBack: () => void;
};

export function WorkspaceView({ project, settings, onBack }: Props) {
  const [tree, setTree] = useState<FileEntry[]>([]);
  const [showCode, setShowCode] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedElement, setSelectedElement] = useState<InspectorElement | null>(null);
  const [gitLog, setGitLog] = useState<GitLogEntry[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState('');
  const previewRef = useRef<PreviewHandle>(null);

  const refreshTree = useCallback(async () => {
    try {
      const t = await api.getFileTree(project.id);
      setTree(t);
    } catch { /* ignore */ }
  }, [project.id]);

  useEffect(() => {
    refreshTree();
  }, [refreshTree]);

  const handleElementSelected = useCallback((el: InspectorElement) => {
    setSelectedElement(el);
    setShowCode(true);
  }, []);

  const handleFileChanged = useCallback(() => {
    previewRef.current?.refresh();
  }, []);

  const handleFileSelect = useCallback((path: string, code: string) => {
    setCurrentFile(path);
    setCurrentCode(code);
  }, []);

  const handleApplyAICode = useCallback(
    async (newCode: string) => {
      if (!currentFile) return;
      try {
        await api.writeFile(project.id, currentFile, newCode);
        setCurrentCode(newCode);
        previewRef.current?.refresh();
        refreshTree();
        showFlashMessage('AI の修正を適用しました');
      } catch {
        showFlashMessage('適用に失敗しました');
      }
    },
    [project.id, currentFile, refreshTree],
  );

  const handleCommit = useCallback(async () => {
    setCommitting(true);
    try {
      await api.gitCommit(project.id);
      showFlashMessage('保存しました（コミット完了）');
    } catch {
      showFlashMessage('保存に失敗しました');
    }
    setCommitting(false);
  }, [project.id]);

  const handleShowHistory = useCallback(async () => {
    try {
      const log = await api.gitLog(project.id);
      setGitLog(log);
      setShowHistory(true);
    } catch { /* ignore */ }
  }, [project.id]);

  const handleRevert = useCallback(async (hash: string) => {
    try {
      await api.gitRevert(project.id, hash);
      showFlashMessage('復元しました');
      setShowHistory(false);
      refreshTree();
      previewRef.current?.refresh();
    } catch {
      showFlashMessage('復元に失敗しました');
    }
  }, [project.id, refreshTree]);

  function showFlashMessage(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      {/* Top bar */}
      <div className="relative z-40 flex items-center justify-between gap-2 border-b border-white/5 bg-black/90 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2 overflow-hidden">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10"
          >
            <ArrowLeft size={16} />
          </motion.button>
          <p className="truncate text-sm font-semibold text-white">{project.name}</p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Code toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCode((v) => !v)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              showCode ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
            title="コード"
          >
            <Code2 size={16} />
          </motion.button>

          {/* AI Agent */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAgent(true)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              showAgent ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
            title="AI アシスタント"
          >
            <Sparkles size={14} />
          </motion.button>

          {/* Commit */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCommit}
            disabled={committing}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40 transition-colors hover:bg-white/10 disabled:opacity-40"
            title="保存（コミット）"
          >
            {committing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          </motion.button>

          {/* History */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShowHistory}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40 transition-colors hover:bg-white/10"
            title="履歴"
          >
            <History size={14} />
          </motion.button>
        </div>
      </div>

      {/* Flash message */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-4 right-4 top-14 z-50 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/90 px-4 py-2.5 backdrop-blur-xl"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <p className="text-sm text-emerald-300">{flash}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview */}
      <div className="relative flex-1">
        <PreviewLayer
          ref={previewRef}
          previewUrl={api.previewUrl(project.id)}
          onElementSelected={handleElementSelected}
        />

        {/* Code layer */}
        <AnimatePresence>
          {showCode && (
            <CodeLayer
              projectId={project.id}
              tree={tree}
              selectedElement={selectedElement}
              onTreeRefresh={refreshTree}
              onFileChanged={handleFileChanged}
              onFileSelect={handleFileSelect}
              onClose={() => setShowCode(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Agent layer */}
      <AnimatePresence>
        {showAgent && (
          <AgentLayer
            projectId={project.id}
            currentFile={currentFile}
            currentCode={currentCode}
            aiSettings={{
              provider: settings.aiProvider,
              apiKey: settings.aiApiKey,
              model: settings.aiModel,
              systemPrompt: settings.aiSystemPrompt,
            }}
            onApplyCode={handleApplyAICode}
            onClose={() => setShowAgent(false)}
          />
        )}
      </AnimatePresence>

      {/* History overlay */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-auto rounded-t-[1.5rem] border-t border-white/10 bg-black/95 p-4 backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center gap-2">
                <GitCommit size={16} className="text-white/50" />
                <p className="text-sm font-semibold text-white">バージョン履歴</p>
              </div>

              {gitLog.length === 0 ? (
                <p className="py-8 text-center text-xs text-white/30">履歴がありません</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {gitLog.map((entry, i) => (
                    <div key={entry.hash} className="glass rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white">{entry.message}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-white/30">
                            {entry.hash.slice(0, 7)} ・ {new Date(entry.date).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        {i > 0 && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRevert(entry.hash)}
                            className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium text-white/60 hover:bg-white/15"
                          >
                            復元
                          </motion.button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
