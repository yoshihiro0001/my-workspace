import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Bot, User, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  explanation?: string;
};

type AISettings = {
  provider: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
};

type Props = {
  projectId: string;
  currentFile: string | null;
  currentCode: string;
  aiSettings?: AISettings;
  onApplyCode: (code: string) => void;
  onClose: () => void;
};

const SUGGESTIONS = [
  'この色をもっと明るくして',
  'フォントサイズを大きくして',
  'ボタンを角丸にして',
  '余白を広くして',
  'ダークモードにして',
  'アニメーションを追加して',
];

export function AgentLayer({
  currentFile,
  currentCode,
  aiSettings,
  onApplyCode,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (aiSettings) {
          headers['X-AI-Settings'] = JSON.stringify(aiSettings);
        }
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: text.trim(),
            file: currentFile,
            code: currentCode,
          }),
        });
        const data = await res.json();

        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.explanation || data.error || '修正を提案します',
          code: data.code,
          explanation: data.explanation,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            content: '接続エラーが発生しました。設定を確認してください。',
          },
        ]);
      }
      setLoading(false);
    },
    [loading, currentFile, currentCode],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-[1.5rem] border-t border-white/10 bg-black/95 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" />
            <p className="text-sm font-semibold text-white">AI アシスタント</p>
            {currentFile && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/40">
                {currentFile}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-auto p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Bot size={32} className="text-white/15" />
              <p className="text-xs text-white/30">
                {currentFile
                  ? `${currentFile} について指示してください`
                  : 'ファイルを選んでから指示してください'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={`flex gap-2 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      msg.role === 'user'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-500/15 text-white/90'
                        : 'glass text-white/80'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {msg.code && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ml-8 mt-2"
                  >
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span className="text-[10px] font-medium text-emerald-400">
                            修正案が準備できました
                          </span>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onApplyCode(msg.code!)}
                          className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30"
                        >
                          適用する
                        </motion.button>
                      </div>
                      {msg.explanation && (
                        <p className="mt-2 text-[10px] leading-relaxed text-white/40">
                          {msg.explanation}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20">
                  <Loader2 size={12} className="animate-spin text-purple-400" />
                </div>
                <div className="glass rounded-2xl px-3.5 py-2.5">
                  <span className="text-xs text-white/40">考え中…</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-white/5 px-4 py-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="指示を入力…"
            disabled={loading || !currentFile}
            className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:ring-1 focus:ring-white/15 disabled:opacity-40"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={loading || !input.trim() || !currentFile}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 transition-colors hover:bg-purple-500/30 disabled:opacity-30"
          >
            <Send size={16} />
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
