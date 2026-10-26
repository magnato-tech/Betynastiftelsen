import { firestoreEnabled as firestoreConfigured } from '../config/firebase';

export const STORAGE_KEY_PREFIX = 'betyna_v1_';

/**
 * Når databasen er konfigurert, er den eneste kilden til innhold.
 * Nettleseren husker bare språk. Eldre lagret innhold fjernes én gang.
 */
const LOCAL_CONTENT_KEYS = [
  'children', 'sponsors', 'reports', 'milestones', 'inquiries', 'payments', 'campaigns',
  'fieldFacts', 'stories', 'auditLogs', 'notifications', 'cms', 'catalogPhotos', 'emailOutbox',
  'emailAutoSend', 'contentLock',
];

function purgeLocalContent() {
  if (!firestoreConfigured) return;
  try {
    for (const key of LOCAL_CONTENT_KEYS) localStorage.removeItem(STORAGE_KEY_PREFIX + key);
  } catch {
    /* privat modus */
  }
}
purgeLocalContent();

export function writeLocal(storageKey: string, json: string) {
  if (firestoreConfigured && !storageKey.endsWith('language')) return;
  localStorage.setItem(storageKey, json);
}

export function loadLocalState<T>(key: string): T | undefined {
  if (firestoreConfigured && key !== 'language') return undefined;
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? (JSON.parse(item) as T) : undefined;
  } catch {
    return undefined;
  }
}
