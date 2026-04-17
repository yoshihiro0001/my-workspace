import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Settings, Bot, Eye, Save,
  Info, RotateCcw, CheckCircle2, KeyRound, ChevronDown,
} from 'lucide-react';
import type { AppSettings, AIProvider } from '../types';
import * as db from '../lib/db';

const AI_PROVIDERS: { key: AIProvider; label: string; description: string }[] = [
  { key: 'anthropic', label: 'Anthropic (Claude)', description: 'Claude API を使用' },
  { key: 'openai',    label: 'OpenAI',             description: 'GPT API を使用' },
  { key: 'mock',      label: 'モック（デモ用）',   description: 'API不要。ローカルで動作確認' },
];

const ANTHROPIC_MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6（推奨）' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5（高速・低コスト）' },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6（最高精度）' },
];

const OPENAI_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o（推奨）' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini（高速・低コスト）' },
];

type Props = {
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => void;
  onReset: () => void;
  onBack: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SettingsView({ settings, onUpdate, onReset, onBack }: Props) {
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    db.getStorageEstimate().then(setStorage);
  }, []);

  const showFlash = useCallback((msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2000);
  }, []);

  const models = settings.aiProvider === 'anthropic' ? ANTHROPIC_MODELS
    : settings.aiProvider === 'openai' ? OPENAI_MODELS
    : [];

  const isApiConfigured = settings.aiProvider === 'mock' || settings.aiApiKey.length > 10;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 p-4 pb-10 md:max-w-2xl md:p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3 pt-2"
      >
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/15">
          <ArrowLeft size={18} strokeWidth={2} />
        </motion.button>
        <div className="flex items-center gap-2">
          <Settings size={18} strokeWidth={1.5} className="text-white/60" />
          <p className="font-display text-xl font-semibold tracking-tight text-white md:text-2xl">設定</p>
        </div>
      </motion.header>

      {/* Flash */}
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass rounded-2xl p-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <p className="text-sm text-emerald-300">{flash}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Connection */}
      <Section icon={Bot} title="AI 接続" badge={isApiConfigured ? '接続準備OK' : '未設定'} badgeColor={isApiConfigured ? 'text-emerald-400 bg-emerald-500/10' : 'text-yellow-400 bg-yellow-500/10'}>
        <FieldLabel label="AI プロバイダ" />
        <div className="flex flex-col gap-2">
          {AI_PROVIDERS.map((prov) => (
            <button key={prov.key}
              onClick={() => onUpdate({ aiProvider: prov.key, aiModel: prov.key === 'mock' ? '' : (prov.key === 'anthropic' ? ANTHROPIC_MODELS[0].id : OPENAI_MODELS[0].id) })}
              className={`glass rounded-2xl p-3 text-left transition-all ${
                settings.aiProvider === prov.key ? 'ring-1 ring-white/30' : 'opacity-60 hover:opacity-80'
              }`}>
              <p className="text-sm font-medium text-white">{prov.label}</p>
              <p className="text-xs text-white/40 mt-0.5">{prov.description}</p>
            </button>
          ))}
        </div>

        {settings.aiProvider !== 'mock' && (
          <>
            <FieldLabel label="API キー" />
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                <KeyRound size={15} />
              </div>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={settings.aiApiKey}
                onChange={(e) => onUpdate({ aiApiKey: e.target.value })}
                placeholder={settings.aiProvider === 'anthropic' ? 'sk-ant-api03-...' : 'sk-...'}
                className="w-full rounded-xl bg-white/10 pl-9 pr-16 py-3 text-sm text-white font-mono placeholder:text-white/20 outline-none focus:ring-1 focus:ring-white/20"
              />
              <button onClick={() => setShowApiKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs text-white/40 hover:text-white/60">
                {showApiKey ? '隠す' : '表示'}
              </button>
            </div>
            <p className="text-xs text-white/30 mt-1">
              キーはこのブラウザにのみ保存されます。サーバーには送信されません。
            </p>
          </>
        )}

        {settings.aiProvider !== 'mock' && models.length > 0 && (
          <>
            <FieldLabel label="モデル" />
            <div className="relative">
              <select
                value={settings.aiModel}
                onChange={(e) => onUpdate({ aiModel: e.target.value })}
                className="w-full appearance-none rounded-xl bg-white/10 px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-white/20"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-black text-white">{m.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </>
        )}
      </Section>

      {/* Preview */}
      <Section icon={Eye} title="プレビュー">
        <FieldLabel label="デフォルトデバイス" />
        <div className="flex gap-2">
          {(['mobile', 'tablet', 'desktop'] as const).map((d) => (
            <button key={d} onClick={() => onUpdate({ defaultDevice: d })}
              className={`flex-1 rounded-xl py-2.5 text-xs font-medium transition-colors ${
                settings.defaultDevice === d
                  ? 'bg-white/15 text-white ring-1 ring-white/20'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}>
              {d === 'mobile' ? 'スマホ' : d === 'tablet' ? 'タブレット' : 'PC'}
            </button>
          ))}
        </div>
      </Section>

      {/* Save settings */}
      <Section icon={Save} title="保存設定">
        <FieldLabel label={`バージョン履歴の保持件数: ${settings.maxVersions}件`} />
        <input type="range" min={3} max={30} value={settings.maxVersions}
          onChange={(e) => onUpdate({ maxVersions: Number(e.target.value) })}
          className="w-full accent-white/60" />
      </Section>

      {/* Reset */}
      {!confirmReset ? (
        <button onClick={() => setConfirmReset(true)}
          className="glass-card flex items-center gap-3 transition-colors hover:bg-white/10">
          <RotateCcw size={16} className="text-white/40 shrink-0" />
          <p className="text-sm text-white/50">設定を初期状態に戻す</p>
        </button>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card flex flex-col gap-3">
          <p className="text-sm text-white/60 text-center">設定を初期状態に戻しますか？</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmReset(false)}
              className="flex-1 rounded-full bg-white/10 py-2 text-xs font-medium text-white/60">キャンセル</button>
            <button onClick={() => { onReset(); setConfirmReset(false); showFlash('設定をリセットしました'); }}
              className="flex-1 rounded-full bg-white/15 py-2 text-xs font-medium text-white">リセット</button>
          </div>
        </motion.div>
      )}

      {/* App info */}
      <Section icon={Info} title="アプリ情報">
        <div className="flex flex-col gap-2">
          <InfoRow label="バージョン" value={settings.appVersion} />
          <InfoRow label="AI プロバイダ" value={AI_PROVIDERS.find((p) => p.key === settings.aiProvider)?.label ?? '不明'} />
          {storage && (
            <InfoRow label="ストレージ使用量" value={`${formatBytes(storage.usage)} / ${formatBytes(storage.quota)}`} />
          )}
          <InfoRow label="データ保存先" value="サーバー（実ファイル + Git）" />
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, badge, badgeColor, children }: {
  icon: typeof Settings;
  title: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="glass-panel flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} strokeWidth={1.5} className="text-white/50" />
          <p className="text-sm font-semibold text-white">{title}</p>
        </div>
        {badge && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor ?? 'text-white/50 bg-white/5'}`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </motion.section>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <p className="text-xs font-medium text-white/40 mt-1">{label}</p>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs font-mono text-white/60">{value}</span>
    </div>
  );
}
