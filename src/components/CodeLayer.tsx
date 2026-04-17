import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Highlight, themes } from 'prism-react-renderer';
import { X, Save, ChevronDown, ChevronUp, FileCode2, Pencil } from 'lucide-react';
import type { FileEntry, InspectorElement } from '../types';
import { FileTree } from './FileTree';
import { ValueSlider, detectEditableValues, type EditableValue } from './ValueSlider';
import * as api from '../api/client';

type Props = {
  projectId: string;
  tree: FileEntry[];
  selectedElement: InspectorElement | null;
  onTreeRefresh: () => void;
  onFileChanged: () => void;
  onClose: () => void;
  onFileSelect?: (path: string, code: string) => void;
};

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
  projectId, tree, selectedElement, onTreeRefresh, onFileChanged, onClose, onFileSelect,
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
  const codeRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    if (selectedElement && code) {
      const matches = findMatchLines(code, selectedElement);
      setHighlightLines(matches);
      if (matches.length > 0 && codeRef.current) {
        setTimeout(() => {
          const lineEl = codeRef.current?.querySelector(`[data-line="${matches[0]}"]`);
          lineEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [selectedElement, code]);

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
      onTreeRefresh();
      onFileChanged();
    } finally {
      setSaving(false);
    }
  }, [projectId, selectedFile, editedCode, onTreeRefresh, onFileChanged]);

  const handleFileSelectFromTree = useCallback(
    (entry: FileEntry) => {
      if (entry.kind === 'file') {
        loadFile(entry.path);
        setShowTree(false);
      }
    },
    [loadFile],
  );

  const language = selectedFile ? detectLanguage(selectedFile) : 'markup';

  const isValueEditable = (lineIdx: number, tokenContent: string): EditableValue | null => {
    for (const ev of editableValues) {
      if (ev.line !== lineIdx) continue;
      if (tokenContent.includes(ev.raw)) return ev;
    }
    return null;
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute inset-x-0 bottom-0 z-30 flex max-h-[55vh] flex-col rounded-t-[1.5rem] border-t border-white/10 bg-black/95 backdrop-blur-xl"
    >
      <div className="flex items-center justify-center py-2">
        <div className="h-1 w-10 rounded-full bg-white/20" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 pb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <button
            onClick={() => setShowTree((v) => !v)}
            className="flex h-7 items-center gap-1 rounded-lg bg-white/5 px-2 text-[10px] font-medium text-white/50 transition-colors hover:bg-white/10"
          >
            <FileCode2 size={12} />
            {showTree ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
          </button>
          {selectedFile && (
            <span className="truncate font-mono text-[11px] text-emerald-400">{selectedFile}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {selectedFile && !isEditing && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsEditing(true)}
              className="flex h-7 items-center gap-1 rounded-lg bg-white/5 px-2.5 text-[10px] text-white/50 hover:bg-white/10"
            >
              <Pencil size={10} />
              <span>編集</span>
            </motion.button>
          )}
          {isEditing && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
              disabled={saving}
              className="flex h-7 items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-40"
            >
              <Save size={10} />
              <span>{saving ? '保存中…' : '保存'}</span>
            </motion.button>
          )}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Slider bar */}
      <AnimatePresence>
        {activeSlider && (
          <div className="border-b border-white/5 px-4 py-2">
            <ValueSlider
              value={activeSlider}
              onChange={(newRaw) => handleSliderChange(activeSlider, newRaw)}
              onClose={() => setActiveSlider(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {showTree && !selectedFile ? (
            <motion.div key="tree" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-2">
              <FileTree tree={tree} selectedPath={selectedFile} onSelect={handleFileSelectFromTree} />
            </motion.div>
          ) : selectedFile ? (
            <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} ref={codeRef}>
              {isEditing ? (
                <textarea
                  value={editedCode}
                  onChange={(e) => setEditedCode(e.target.value)}
                  spellCheck={false}
                  className="min-h-[30vh] w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-white/80 outline-none"
                />
              ) : (
                <Highlight theme={themes.nightOwl} code={code} language={language}>
                  {({ tokens, getLineProps, getTokenProps }) => (
                    <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
                      {tokens.map((line, lineIdx) => {
                        const isHL = highlightLines.includes(lineIdx);
                        return (
                          <div
                            key={lineIdx}
                            data-line={lineIdx}
                            {...getLineProps({ line })}
                            className={`flex ${isHL ? 'rounded bg-emerald-500/15 ring-1 ring-emerald-500/30' : ''}`}
                          >
                            <span className="mr-4 inline-block w-8 select-none text-right text-white/20">
                              {lineIdx + 1}
                            </span>
                            <span>
                              {line.map((token, tokenIdx) => {
                                const ev = isValueEditable(lineIdx, token.content);
                                if (ev && !isEditing) {
                                  const tokenProps = getTokenProps({ token });
                                  const isActive = activeSlider?.line === ev.line && activeSlider?.col === ev.col;
                                  return (
                                    <span
                                      key={tokenIdx}
                                      {...tokenProps}
                                      onClick={() => setActiveSlider(ev)}
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
                    </pre>
                  )}
                </Highlight>
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
    </motion.div>
  );
}

export type { Props as CodeLayerProps };
export { CodeLayer as default };
