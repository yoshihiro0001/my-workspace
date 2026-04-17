import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, GitBranch, FileArchive,
  Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';

type ImportMethod = 'zip' | 'git';

type Props = {
  onImported: () => void;
  onClose: () => void;
};

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || `HTTP ${res.status}` };
  }
}

export function ImportModal({ onImported, onClose }: Props) {
  const [method, setMethod] = useState<ImportMethod>('zip');
  const [name, setName] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!name.trim()) {
      setName(file.name.replace(/\.zip$/i, ''));
    }
    setError(null);
  }, [name]);

  const handleImportZip = useCallback(async () => {
    if (!selectedFile || !name.trim()) return;
    setLoading(true);
    setError(null);

    const sizeMB = selectedFile.size / 1024 / 1024;
    if (sizeMB > 10) {
      setStatusText(`アップロード中… (${sizeMB.toFixed(0)} MB)`);
    } else {
      setStatusText('アップロード中…');
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', name.trim());

      setStatusText(sizeMB > 10 ? 'サーバーで展開中… (大きいファイルは時間がかかります)' : '展開中…');

      const res = await fetch('/api/projects/import/zip', {
        method: 'POST',
        body: formData,
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data.error as string) || `インポート失敗 (HTTP ${res.status})`);
      setSuccess(true);
      setStatusText('');
      setTimeout(() => { onImported(); onClose(); }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ZIP インポートに失敗しました');
      setStatusText('');
    } finally {
      setLoading(false);
    }
  }, [selectedFile, name, onImported, onClose]);

  const handleImportGit = useCallback(async () => {
    if (!gitUrl.trim() || !name.trim()) return;
    setLoading(true);
    setError(null);
    setStatusText('クローン中…');
    try {
      const res = await fetch('/api/projects/import/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: gitUrl.trim(), name: name.trim() }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data.error as string) || `クローン失敗 (HTTP ${res.status})`);
      setSuccess(true);
      setStatusText('');
      setTimeout(() => { onImported(); onClose(); }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Git クローンに失敗しました');
      setStatusText('');
    } finally {
      setLoading(false);
    }
  }, [gitUrl, name, onImported, onClose]);

  const handleSubmit = useCallback(() => {
    if (method === 'zip') handleImportZip();
    else handleImportGit();
  }, [method, handleImportZip, handleImportGit]);

  const canSubmit =
    name.trim() &&
    !loading &&
    !success &&
    (method === 'zip' ? !!selectedFile : !!gitUrl.trim());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={loading ? undefined : onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel flex w-full max-w-sm flex-col gap-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-white">プロジェクトをインポート</p>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/50 transition-colors hover:bg-white/15 disabled:opacity-30"
          >
            <X size={14} />
          </button>
        </div>

        {/* Method tabs */}
        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
          {([
            { id: 'zip' as const, label: 'ZIP ファイル', icon: FileArchive },
            { id: 'git' as const, label: 'Git リポジトリ', icon: GitBranch },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setMethod(id); setError(null); }}
              disabled={loading}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
                method === id
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Project name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="プロジェクト名"
          disabled={loading}
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:ring-1 focus:ring-white/20 disabled:opacity-40"
        />

        {/* Method-specific input */}
        <AnimatePresence mode="wait">
          {method === 'zip' ? (
            <motion.div
              key="zip"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-col gap-2"
            >
              <input
                ref={fileRef}
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-left transition-colors hover:border-white/25 hover:bg-white/10 disabled:opacity-40"
              >
                <Upload size={18} className="shrink-0 text-white/30" />
                <div className="min-w-0 flex-1">
                  {selectedFile ? (
                    <>
                      <p className="truncate text-sm font-medium text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                        {selectedFile.size > 20 * 1024 * 1024 && ' — 大きいファイルは時間がかかる場合があります'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-white/50">ZIP ファイルを選択</p>
                      <p className="text-[10px] text-white/30">
                        タップしてファイルを選択（最大 500 MB）
                      </p>
                    </>
                  )}
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="git"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-2"
            >
              <input
                type="url"
                value={gitUrl}
                onChange={(e) => setGitUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
                placeholder="https://github.com/user/repo.git"
                disabled={loading}
                className="w-full rounded-xl bg-white/10 px-4 py-3 font-mono text-xs text-white outline-none placeholder:text-white/30 focus:ring-1 focus:ring-white/20 disabled:opacity-40"
              />
              <p className="px-1 text-[10px] text-white/25">
                公開リポジトリの HTTPS URL を入力
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status / Error / Success */}
        <AnimatePresence>
          {loading && statusText && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2"
            >
              <Loader2 size={12} className="shrink-0 animate-spin text-blue-400" />
              <p className="text-xs text-blue-400">{statusText}</p>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-xs text-red-400">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2"
            >
              <CheckCircle2 size={14} className="text-emerald-400" />
              <p className="text-xs text-emerald-400">インポート完了！</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
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
            disabled={!canSubmit}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/15 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'インポート中…' : 'インポート'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
