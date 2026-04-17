import { openDB, type IDBPDatabase } from 'idb';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const DB_NAME = 'my-workspace';
const DB_VERSION = 2;

interface SettingsDB {
  meta: { key: string; value: { key: string; value: string } };
}

let dbPromise: Promise<IDBPDatabase<SettingsDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SettingsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const row = await db.get('meta', 'settings');
  if (!row) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function putSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('meta', { key: 'settings', value: JSON.stringify(settings) });
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
  }
  return null;
}
