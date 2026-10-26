import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { auth, db } from '../config/firebase';
import { readBrowserStateSnapshot } from './browserStateSnapshot';
import {
  commitChanges,
  importBrowserSnapshotToFirestore,
  loadAllFromFirestore,
  type AppDataSnapshot,
  type DbChange,
} from './firestoreData';
import { CMS_PUBLIC_DOC_ID, FIRESTORE_COLLECTIONS, SETTINGS_EMAIL_DOC_ID } from './firestoreProfile';
import type { FirestoreUser } from './firestoreProfile';
import {
  baselineOf,
  isSuspiciousWipe,
  planCollectionSync,
  planSingleSync,
  stableJson,
  type Baseline,
} from './syncEngine';
import { assertNoAdminOnlyWrites, planScopedPortalChanges } from './scopedPortalSave';
import {
  formatSaveError,
  RETRY_DELAY_MS,
  SAVE_DELAY_MS,
  SuspiciousWipeError,
  SYNCED_LISTS,
  type ListKey,
} from './firestoreSyncConstants';
import type { FirestoreHydration, HydrationPayload } from './useFirestoreSyncHydration';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
export interface SaveStatus {
  state: SaveState;
  lastSavedAt: number | null;
  error: string | null;
}

export function useFirestoreSyncPersist(params: {
  firestoreUserProfile: FirestoreUser | null;
  setHydration: Dispatch<SetStateAction<HydrationPayload | null>>;
  markFullLoadedAfterImport: () => void;
  onSignOutReset: () => void;
}) {
  const { firestoreUserProfile, setHydration, markFullLoadedAfterImport, onSignOutReset } = params;

  const [backendActive, setBackendActive] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: 'idle', lastSavedAt: null, error: null });
  const snapshotRef = useRef<(() => AppDataSnapshot) | null>(null);

  const readyRef = useRef(false);
  const listBaselines = useRef<Partial<Record<ListKey, Baseline>>>({});
  const cmsBaseline = useRef<string | null>(null);
  const emailBaseline = useRef<string | null>(null);
  const latestRef = useRef<AppDataSnapshot | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);
  const rerunRef = useRef(false);
  const dirtyRef = useRef(false);
  /** Skrivebeskyttet mens admin ser som fadder/koordinator. Bare «vis som»-loggen lagres da. */
  const readOnlyRef = useRef(false);
  const [readOnly, setReadOnly] = useState(false);
  /** Satt av exitReadOnly: neste innlasting fra databasen skal slå på lagring igjen. */
  const releaseOnHydrateRef = useRef(false);

  const resetPersistState = useCallback(() => {
    readyRef.current = false;
    setBackendActive(false);
    onSignOutReset();
  }, [onSignOutReset]);

  const confirmHydrated = useCallback((data: FirestoreHydration, options?: { enableSave?: boolean }) => {
    const baselines: Partial<Record<ListKey, Baseline>> = {};
    for (const { key } of SYNCED_LISTS) {
      baselines[key] = baselineOf((data[key] ?? []) as { id: string }[]);
    }
    listBaselines.current = baselines;
    cmsBaseline.current = data.cms ? stableJson(data.cms) : null;
    emailBaseline.current = data.emailAutoSend ? stableJson(data.emailAutoSend) : null;
    latestRef.current = null;
    dirtyRef.current = false;
    const enableSave = options?.enableSave ?? true;
    readyRef.current = enableSave;
    setBackendActive(enableSave);
    if (releaseOnHydrateRef.current) {
      // Ny innlasting etter «vis som»: lagring er trygg igjen
      releaseOnHydrateRef.current = false;
      readOnlyRef.current = false;
      setReadOnly(false);
    }
  }, []);

  const planChanges = useCallback(
    (snapshot: AppDataSnapshot) => {
      // Skrivebeskyttet: bare «vis som»-loggen skal lagres, resten hoppes over
      const ro = readOnlyRef.current;
      const profile = firestoreUserProfile;
      if (!ro && profile && (profile.role === 'coordinator' || profile.role === 'sponsor')) {
        const scoped = planScopedPortalChanges(profile, listBaselines.current, snapshot);
        assertNoAdminOnlyWrites(scoped.changes);
        return scoped;
      }

      const changes: DbChange[] = [];
      const nextLists: Partial<Record<ListKey, Baseline>> = {};
      for (const { key, collection } of SYNCED_LISTS) {
        if (ro && key !== 'auditLogs') continue;
        const baseline = listBaselines.current[key] ?? new Map();
        const items = snapshot[key] as { id: string }[];
        const plan = planCollectionSync(baseline, items);
        if (isSuspiciousWipe(baseline, plan.deletes)) {
          throw new SuspiciousWipeError(
            `Lagringen ble stoppet: alt i «${collection}» ville blitt slettet på én gang. Last siden på nytt.`
          );
        }
        nextLists[key] = plan.next;
        for (const item of plan.sets) changes.push({ kind: 'set', collection, id: item.id, data: item });
        for (const id of plan.deletes) changes.push({ kind: 'delete', collection, id });
      }
      if (ro) {
        const commitAuditOnly = () => {
          listBaselines.current = { ...listBaselines.current, ...nextLists };
        };
        return { changes, commit: commitAuditOnly };
      }
      const cms = planSingleSync(cmsBaseline.current, snapshot.cms);
      if (cms.write) {
        changes.push({ kind: 'set', collection: FIRESTORE_COLLECTIONS.cms, id: CMS_PUBLIC_DOC_ID, data: cms.data });
      }
      const email = planSingleSync(emailBaseline.current, snapshot.emailAutoSend);
      if (email.write) {
        changes.push({
          kind: 'set',
          collection: FIRESTORE_COLLECTIONS.settings,
          id: SETTINGS_EMAIL_DOC_ID,
          data: email.data,
        });
      }
      const commit = () => {
        listBaselines.current = nextLists;
        cmsBaseline.current = cms.json;
        emailBaseline.current = email.json;
      };
      return { changes, commit };
    },
    [firestoreUserProfile]
  );

  const flush = useCallback(async (manual = false) => {
    if (!db || !readyRef.current || !latestRef.current) return;
    if (flushingRef.current) {
      rerunRef.current = true;
      return;
    }
    flushingRef.current = true;
    try {
      const { changes, commit } = planChanges(latestRef.current);
      if (changes.length === 0) {
        dirtyRef.current = false;
        if (manual) {
          // Manuell lagring skal alltid gi tilbakemelding, også når ingenting har endret seg
          setSaveStatus({ state: 'saved', lastSavedAt: Date.now(), error: null });
        } else {
          setSaveStatus((s) => (s.state === 'saving' ? { ...s, state: 'saved' } : s));
        }
        return;
      }
      setSaveStatus((s) => ({ ...s, state: 'saving', error: null }));
      await commitChanges(db, changes);
      commit();
      dirtyRef.current = rerunRef.current;
      setSaveStatus({ state: 'saved', lastSavedAt: Date.now(), error: null });
    } catch (err) {
      setSaveStatus((s) => ({ ...s, state: 'error', error: formatSaveError(err) }));
      if (!(err instanceof SuspiciousWipeError)) {
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => void flush(), RETRY_DELAY_MS);
      }
    } finally {
      flushingRef.current = false;
      if (rerunRef.current) {
        rerunRef.current = false;
        void flush();
      }
    }
  }, [planChanges]);

  const schedulePersist = useCallback(
    (snapshot: AppDataSnapshot) => {
      latestRef.current = snapshot;
      if (!db || !readyRef.current) return;
      try {
        if (planChanges(snapshot).changes.length === 0) {
          dirtyRef.current = false;
          return;
        }
      } catch {
        /* feilen vises når lagringen kjører */
      }
      dirtyRef.current = true;
      setSaveStatus((s) => (s.state === 'saving' ? s : { ...s, state: 'saving', error: null }));
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [flush, planChanges]
  );

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current && !flushingRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    const onOnline = () => void flush();
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('online', onOnline);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [flush]);

  /** Slår av lagring mens admin ser som fadder/koordinator. */
  const enterReadOnly = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      // Redigeringer gjort rett før bytte lagres som admin, ikke forkastes
      if (dirtyRef.current) void flush();
    }
    readOnlyRef.current = true;
    setReadOnly(true);
  }, [flush]);

  /** Forkaster lokale endringer ved å laste fra databasen på nytt, og slår så på lagring igjen. */
  const exitReadOnly = useCallback(async () => {
    if (!db) {
      readOnlyRef.current = false;
      setReadOnly(false);
      return;
    }
    releaseOnHydrateRef.current = true;
    const data = await loadAllFromFirestore(db).catch(() => null);
    if (data) {
      // confirmHydrated slår på lagring når innholdet er tatt inn i appen
      setHydration({ data, full: true });
      return;
    }
    releaseOnHydrateRef.current = false;
    setSaveStatus((s) => ({
      state: 'error',
      lastSavedAt: s.lastSavedAt,
      error: 'Kunne ikke laste data på nytt etter visning. Last siden på nytt.',
    }));
  }, [setHydration]);

  const saveNow = useCallback(async () => {
    if (readOnlyRef.current) return;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (!db || !readyRef.current) return;
    if (!latestRef.current) {
      // Ingenting endret siden innlasting: alt ligger allerede i databasen
      setSaveStatus({ state: 'saved', lastSavedAt: Date.now(), error: null });
      return;
    }
    await flush(true);
  }, [flush]);

  const importBrowserToFirestore = useCallback(async () => {
    if (!db || !auth?.currentUser) {
      throw new Error('Logg inn med Google først');
    }
    const snapshot = snapshotRef.current?.() ?? readBrowserStateSnapshot();
    const result = await importBrowserSnapshotToFirestore(
      db,
      snapshot,
      auth.currentUser.uid,
      auth.currentUser.email ?? ''
    );
    if (result.skippedLock) {
      setImportMessage('Import er allerede gjort (seed-lås finnes). Ingenting ble overskrevet.');
      return result;
    }
    setImportMessage(`Lagret ${result.written} dokumenter fra denne nettleseren.`);
    markFullLoadedAfterImport();
    const data = await loadAllFromFirestore(db);
    if (data) setHydration({ data, full: true });
    return result;
  }, [markFullLoadedAfterImport, setHydration]);

  const registerSnapshotProvider = useCallback((fn: () => AppDataSnapshot) => {
    snapshotRef.current = fn;
  }, []);

  return {
    backendActive,
    confirmHydrated,
    schedulePersist,
    saveNow,
    registerSnapshotProvider,
    importBrowserToFirestore,
    importMessage,
    setImportMessage,
    saveStatus,
    resetPersistState,
    readOnly,
    enterReadOnly,
    exitReadOnly,
  };
}
