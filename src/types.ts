// ── Server API types ──

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

export type FileEntry = {
  name: string;
  path: string;
  kind: 'file' | 'folder';
  children?: FileEntry[];
};

export type GitLogEntry = {
  hash: string;
  message: string;
  date: string;
  author: string;
};

export type GitStatus = {
  modified: string[];
  created: string[];
  deleted: string[];
  staged: string[];
  isClean: boolean;
};

export type InspectorElement = {
  type: 'element-selected';
  tag: string;
  id: string;
  classes: string[];
  text: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
  rect: { x: number; y: number; width: number; height: number };
  html: string;
};

// ── Settings (browser-local, IndexedDB) ──

export type AIProvider = 'anthropic' | 'openai' | 'mock';

export type AppSettings = {
  aiProvider: AIProvider;
  aiApiKey: string;
  aiModel: string;
  aiSystemPrompt: string;
  defaultDevice: 'mobile' | 'tablet' | 'desktop';
  maxVersions: number;
  trashAutoDeleteDays: number;
  appVersion: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'mock',
  aiApiKey: '',
  aiModel: '',
  aiSystemPrompt:
    'あなたはWebアプリの開発者です。\nユーザーの指示に従い、提供されたコードを修正してください。\n修正後のコード全文のみを返してください。\n説明・コメント・マークダウンは不要です。',
  defaultDevice: 'mobile',
  maxVersions: 10,
  trashAutoDeleteDays: 30,
  appVersion: '0.2.0',
};
