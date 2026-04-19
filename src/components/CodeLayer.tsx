import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Highlight, themes } from 'prism-react-renderer';
import { Save, ChevronDown, ChevronUp, FileCode2, Pencil, ListTree, RotateCcw } from 'lucide-react';
import type { FileEntry, InspectorElement } from '../types';
import { FileTree } from './FileTree';
import { ValueSlider, detectEditableValues, type EditableValue } from './ValueSlider';
import { UnsavedDiscardModal } from './UnsavedDiscardModal';
import * as api from '../api/client';

const COPY_UNSAVED_MESSAGE =
  '\u5909\u66f4\u304c\u4fdd\u5b58\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002\u7834\u68c4\u3057\u3066\u623b\u308a\u307e\u3059\u304b\uff1f';
const COPY_DISCARD_CONFIRM = '\u7834\u68c4\u3057\u3066\u623b\u308b';
const COPY_BACK_TO_LIST = '\u30d5\u30a1\u30a4\u30eb\u4e00\u89a7\u306b\u623b\u308b';

type Props = {
  projectId: string;
  tree: FileEntry[];
  selectedElement: InspectorElement | null;
  onTreeRefresh: () => void;
  onFileChanged: () => void;
  onFileSelect?: (path: string, code: string) => void;
  /** When user returns to the file tree; parent should clear inspector selection to avoid reopening. */
  onReturnToFileList?: () => void;
  /** Whether there are unsaved edits (workspace / tab leave guard). */
  onDirtyChange?: (dirty: boolean) => void;
  /** レイアウト用（スプリットパネルで高さを親に合わせる） */
  className?: string;
};

type PendingDiscard = 'list' | { kind: 'file'; path: string };

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    html: 'markup', htm: 'markup', css: 'css',
    js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
    json: 'json', svg: 'markup', md: 'markdown',
  };
  return map[ext] || 'markup';
}

function findMatchLines(code: string, element: InspectorElement): number[] {
  const lines = code.split('\n');
  const matches: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (element.id && line.includes(`id="${element.id}"`)) { matches.push(i); continue; }
    for (const cls of element.classes) {
      if (line.includes(cls)) { matches.push(i); break; }
    }
    if (matches.indexOf(i) === -1 && element.tag) {
      const tagPattern = `<${element.tag}`;
      if (line.includes(tagPattern) && element.text) {
        const shortText = element.text.slice(0, 20);
        if (shortText && (line.includes(shortText) || (lines[i + 1] && lines[i + 1].includes(shortText)))) {
          matches.push(i);
        }
      }
    }
  }
  return matches;
}

export function CodeLayer({
  projectId,
  tree,
  selectedElement,
  onTreeRefresh,
  onFileChanged,
  onFileSelect,
  onReturnToFileList,
  onDirtyChange,
  className = '',
}: Props) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [editedCode, setEditedCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTree, setShowTree] = useState(true);
  const [highlightLines, setHighlightLines] = useState<number[]>([]);
  const [editableValues, setEditableValues] = useState<EditableValue[]>([]);
  const [activeSlider, setActiveSlider] = useState<EditableValue | null>(null);
  const [editScrollTop, setEditScrollTop] = useState(0);
  const [pendingDiscard, setPendingDiscard] = useState<PendingDiscard | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editScrollDidRun = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isDirty = Boolean(selectedFile && editedCode !== code);

  const loadFile = useCallback(
    async (path: string) => {
      try {
        const { content } = await api.readFile(projectId, path);
        setCode(content);
        setEditedCode(content);
        setSelectedFile(path);
        setIsEditing(false);
        setHighlightLines([]);
        setActiveSlider(null);
        setEditScrollTop(0);
        setEditableValues(detectEditableValues(content));
        onFileSelect?.(path, content);
      } catch {
        setCode('');
        setEditedCode('');
        setEditableValues([]);
      }
    },
    [projectId, onFileSelect],
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!selectedElement) return;
    if (editedCode !== code) return;

    if (selectedElement.sourceFile && selectedElement.sourceLine != null) {
      const lineIdx = Math.max(0, selectedElement.sourceLine - 1);
      void (async () => {
        try {
          const { content } = await api.readFile(projectId, selectedElement.sourceFile!);
          setCode(content);
          setEditedCode(content);
          setSelectedFile(selectedElement.sourceFile!);
          setIsEditing(false);
          setHighlightLines([lineIdx]);
          setEditableValues(detectEditableValues(content));
          onFileSelect?.(selectedElement.sourceFile!, content);
          setShowTree(false);
          setTimeout(() => {
            const lineEl = codeRef.current?.querySelector(`[data-line="${lineIdx}"]`);
            lineEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 120);
        } catch {
          /* ignore */
        }
      })();
      return;
    }

    if (code) {
      const matches = findMatchLines(code, selectedElement);
      setHighlightLines(matches);
      if (matches.length > 0 && codeRef.current) {
        setTimeout(() => {
          const lineEl = codeRef.current?.querySelector(`[data-line="${matches[0]}"]`);
          lineEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [selectedElement, code, projectId, onFileSelect, editedCode]);

  const saveAndRefresh = useCallback(
    async (newCode: string) => {
      if (!selectedFile) return;
      try {
        await api.writeFile(projectId, selectedFile, newCode);
        onFileChanged();
      } catch { /* ignore */ }
    },
    [projectId, selectedFile, onFileChanged],
  );

  const handleSliderChange = useCallback(
    (val: EditableValue, newRaw: string) => {
      const lines = code.split('\n');
      const line = lines[val.line];
      if (!line) return;
      const before = line.substring(0, val.col);
      const after = line.substring(val.col + val.raw.length);
      lines[val.line] = before + newRaw + after;
      const newCode = lines.join('\n');
      setCode(newCode);
      setEditedCode(newCode);
      setEditableValues(detectEditableValues(newCode));
      setActiveSlider((prev) =>
        prev ? { ...prev, raw: newRaw, numValue: parseFloat(newRaw) || 0, col: val.col } : null,
      );
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveAndRefresh(newCode), 250);
    },
    [code, saveAndRefresh],
  );

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  const handleSave = useCallback(async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      await api.writeFile(projectId, selectedFile, editedCode);
      setCode(editedCode);
      setIsEditing(false);
      setEditableValues(detectEditableValues(editedCode));
      onFileSelect?.(selectedFile, editedCode);
      onTreeRefresh();
      onFileChanged();
    } finally {
      setSaving(false);
    }
  }, [projectId, selectedFile, editedCode, onTreeRefresh, onFileChanged, onFileSelect]);

  const handleCancelEdit = useCallback(() => {
    setEditedCode(code);
    setIsEditing(false);
    setEditScrollTop(0);
  }, [code]);

  const performBackToFileList = useCallback(() => {
    setSelectedFile(null);
    setCode('');
    setEditedCode('');
    setIsEditing(false);
    setHighlightLines([]);
    setEditableValues([]);
    setActiveSlider(null);
    setEditScrollTop(0);
    setShowTree(true);
    setPendingDiscard(null);
    onFileSelect?.('', '');
    onReturnToFileList?.();
  }, [onFileSelect, onReturnToFileList]);

  const requestBackToFileList = useCallback(() => {
    if (isDirty) {
      setPendingDiscard('list');
      return;
    }
    performBackToFileList();
  }, [isDirty, performBackToFileList]);

  const handleConfirmDiscard = useCallback(() => {
    if (!pendingDiscard) return;
    if (pendingDiscard === 'list') {
      setPendingDiscard(null);
      performBackToFileList();
    } else {
      const path = pendingDiscard.path;
      setPendingDiscard(null);
      void loadFile(path);
      setShowTree(false);
    }
  }, [pendingDiscard, performBackToFileList, loadFile]);

  const handleFileSelectFromTree = useCallback(
    (entry: FileEntry) => {
      if (entry.kind !== 'file') return;
      if (isDirty) {
        setPendingDiscard({ kind: 'file', path: entry.path });
        return;
      }
      void loadFile(entry.path);
      setShowTree(false);
    },
    [loadFile, isDirty],
  );

  useLayoutEffect(() => {
    if (!isEditing) {
      editScrollDidRun.current = false;
      return;
    }
    if (editScrollDidRun.current) return;
    editScrollDidRun.current = true;
    const ta = editTextareaRef.current;
    if (!ta) return;
    const lineIdx =
      highlightLines[0] ??
      (selectedElement?.sourceLine != null ? Math.max(0, selectedElement.sourceLine - 1) : 0);
    const lh = parseFloat(getComputedStyle(ta).lineHeight);
    const lineHeightPx = Number.isFinite(lh) && lh > 0 ? lh : 19.5;
    requestAnimationFrame(() => {
      const t = editTextareaRef.current;
      if (!t) return;
      const target = lineIdx * lineHeightPx;
      t.scrollTop = Math.max(0, target - t.clientHeight / 2 + lineHeightPx / 2);
      setEditScrollTop(t.scrollTop);
    });
  }, [isEditing, highlightLines, selectedElement?.sourceLine]);

  const language = selectedFile ? detectLanguage(selectedFile) : 'markup';

  const isValueEditable = (lineIdx: number, tokenContent: string): EditableValue | null => {
    for (const ev of editableValues) {
      if (ev.line !== lineIdx) continue;
      if (tokenContent.includes(ev.raw)) return ev;
    }
    return null;
  };

  const fromInspectorSource =
    Boolean(selectedElement?.sourceFile && selectedElement.sourceLine != null);

  const renderCodeLines = (source: string, interactiveTokens: boolean) => (
    <Highlight theme={themes.nightOwl} code={source} language={language}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <div className="overflow-x-auto">
          {tokens.map((line, lineIdx) => {
            const isHL = highlightLines.includes(lineIdx);
            const glow = isHL && fromInspectorSource;
            return (
              <div
                key={lineIdx}
                data-line={lineIdx}
                {...getLineProps({ line })}
                className={`flex ${
                  isHL
                    ? `rounded bg-emerald-500/15 ring-1 ring-emerald-400/40 ${glow ? 'code-line-inspector-glow' : ''}`
                    : ''
                }`}
              >
                <span className="mr-4 inline-block w-8 select-none text-right text-white/20">
                  {lineIdx + 1}
                </span>
                <span>
                  {line.map((token, tokenIdx) => {
                    const ev = interactiveTokens ? isValueEditable(lineIdx, token.content) : null;
                    if (ev) {
                      const tokenProps = getTokenProps({ token });
                      const isActive = activeSlider?.line === ev.line && activeSlider?.col === ev.col;
                      return (
                        <span
                          key={tokenIdx}
                          {...tokenProps}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveSlider(ev)}
                          onKeyDown={(e) => e.key === 'Enter' && setActiveSlider(ev)}
                          className={`cursor-pointer rounded px-0.5 font-bold transition-colors ${
                            isActive
                              ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/40'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                          style={{
                            ...tokenProps.style,
                            fontWeight: 700,
                          }}
                        />
                      );
                    }
                    return <span key={tokenIdx} {...getTokenProps({ token })} />;
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Highlight>
  );

  return (
    <div className={`flex min-h-0 flex-1 flex-col bg-black/95 backdrop-blur-xl ${className}`}>
      <AnimatePresence>
        {pendingDiscard && (
          <UnsavedDiscardModal
            key="unsaved"
            message={COPY_UNSAVED_MESSAGE}
            confirmLabel={COPY_DISCARD_CONFIRM}
            onDiscard={handleConfirmDiscard}
            onCancel={() => setPendingDiscard(null)}
          />
        )}
      </AnimatePresence>

      <div className="shrink-0 border-b border-white/5">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            {selectedFile && (
              <>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={requestBackToFileList}
                  title={COPY_BACK_TO_LIST}
                  className="flex h-9 min-h-[44px] shrink-0 items-center gap-1 rounded-lg bg-white/5 px-2.5 text-[10px] font-medium text-white/60 transition-colors hover:bg-white/10 md:h-8 md:min-h-0"
                >
                  <ListTree size={12} />
                  <span>一覧</span>
                </motion.button>
                <button
                  type="button"
                  onClick={() => setShowTree((v) => !v)}
                  title="一覧を下に表示"
                  className="flex h-9 min-h-[44px] shrink-0 items-center gap-1 rounded-lg bg-white/5 px-2.5 text-[10px] font-medium text-white/50 transition-colors hover:bg-white/10 md:h-8 md:min-h-0"
                >
                  <FileCode2 size={12} />
                  {showTree ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                </button>
              </>
            )}
            {selectedFile && (
              <span className="truncate font-mono text-[11px] text-emerald-400">{selectedFile}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {selectedFile && !isEditing && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(true)}
                className="flex h-9 min-h-[44px] items-center gap-1 rounded-lg bg-white/5 px-2.5 text-[10px] text-white/50 hover:bg-white/10 md:h-8 md:min-h-0"
              >
                <Pencil size={10} />
                <span>編集</span>
              </motion.button>
            )}
            {isEditing && (
              <>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex h-9 min-h-[44px] items-center gap-1 rounded-lg bg-white/5 px-2.5 text-[10px] text-white/50 hover:bg-white/10 disabled:opacity-40 md:h-8 md:min-h-0"
                >
                  <RotateCcw size={10} />
                  <span>キャンセル</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex h-9 min-h-[44px] items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-40 md:h-8 md:min-h-0"
                >
                  <Save size={10} />
                  <span>{saving ? '保存中…' : '保存'}</span>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeSlider && !isEditing && (
          <div className="shrink-0 border-b border-white/5 px-3 py-2">
            <ValueSlider
              value={activeSlider}
              onChange={(newRaw) => handleSliderChange(activeSlider, newRaw)}
              onClose={() => setActiveSlider(null)}
            />
          </div>
        )}
      </AnimatePresence>

      <div className="min-h-0 flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {showTree && !selectedFile ? (
            <motion.div key="tree" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-2">
              <FileTree tree={tree} selectedPath={selectedFile} onSelect={handleFileSelectFromTree} />
            </motion.div>
          ) : selectedFile ? (
            <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} ref={codeRef}>
              {isEditing ? (
                <div className="relative h-[min(70vh,calc(100vh-11rem))] min-h-[240px] overflow-hidden md:min-h-[320px]">
                  <textarea
                    ref={editTextareaRef}
                    value={editedCode}
                    onChange={(e) => setEditedCode(e.target.value)}
                    onScroll={(e) => setEditScrollTop(e.currentTarget.scrollTop)}
                    spellCheck={false}
                    className="absolute inset-0 z-10 m-0 h-full w-full resize-none overflow-auto whitespace-pre border-0 bg-transparent p-4 font-mono text-xs leading-relaxed text-transparent caret-emerald-300 outline-none selection:bg-emerald-500/25"
                  />
                  <div
                    className="pointer-events-none absolute left-0 right-0 top-0 z-0 whitespace-pre p-4 font-mono text-xs leading-relaxed"
                    style={{ transform: `translateY(-${editScrollTop}px)` }}
                  >
                    {renderCodeLines(editedCode, false)}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-xs leading-relaxed">
                  {renderCodeLines(code, true)}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 p-8 text-center">
              <FileCode2 size={24} className="text-white/20" />
              <p className="text-xs text-white/30">ファイルを選んでコードを表示</p>
            </motion.div>
          )}
        </AnimatePresence>

        {showTree && selectedFile && (
          <div className="border-t border-white/5 p-2">
            <FileTree tree={tree} selectedPath={selectedFile} onSelect={handleFileSelectFromTree} />
          </div>
        )}
      </div>
    </div>
  );
}

export type { Props as CodeLayerProps };
