import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailLink,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth';
import {
  clearStoredAuthError,
  completeFirebaseAuthRedirect,
  readStoredAuthError,
} from './firebaseAuthRedirect';
import { formatFirebaseAuthError } from './firebaseAuthErrors';
import { auth, db, firestoreEnabled } from '../config/firebase';
import { readBrowserStateSnapshot } from './browserStateSnapshot';
import {
  commitChanges,
  importBrowserSnapshotToFirestore,
  loadAllFromFirestore,
  loadPortalFromFirestore,
  loadPublicFromFirestore,
  type DbChange,
} from './firestoreData';
import { CMS_PUBLIC_DOC_ID, FIRESTORE_COLLECTIONS, SETTINGS_EMAIL_DOC_ID, type FirestoreUser } from './firestoreProfile';
import type { AppDataSnapshot } from './firestoreData';
import { ensureFirestoreUserOnLogin } from './firestoreUser';
import { markPortalIntent } from '../utils/portalIntent';
import {
  baselineOf,
  isSuspiciousWipe,
  planCollectionSync,
  planSingleSync,
  stableJson,
  type Baseline,
} from './syncEngine';
import { assertNoAdminOnlyWrites, planScopedPortalChanges } from './scopedPortalSave';

export type FirestoreHydration = {
  [K in keyof AppDataSnapshot]?: AppDataSnapshot[K];
};

/** Data fra databasen. full = alt innhold (innlogget admin), ellers bare det offentlige. */
export interface HydrationPayload {
  data: FirestoreHydration;
  full: boolean;
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
export interface SaveStatus {
  state: SaveState;
  lastSavedAt: number | null;
  error: string | null;
}

type ListKey =
  | 'coordinators'
  | 'children'
  | 'sponsors'
  | 'catalogPhotos'
  | 'facts'
  | 'reports'
  | 'milestones'
  | 'inquiries'
  | 'payments'
  | 'campaigns'
  | 'testimonials'
  | 'notifications'
  | 'auditLogs'
  | 'emailOutbox';

/** Alle lister som lagres automatisk: navn i appen, samling i databasen. */
const SYNCED_LISTS: { key: ListKey; collection: string }[] = [
  { key: 'coordinators', collection: FIRESTORE_COLLECTIONS.coordinators },
  { key: 'children', collection: FIRESTORE_COLLECTIONS.children },
  { key: 'sponsors', collection: FIRESTORE_COLLECTIONS.sponsors },
  { key: 'catalogPhotos', collection: FIRESTORE_COLLECTIONS.catalogPhotos },
  { key: 'facts', collection: FIRESTORE_COLLECTIONS.facts },
  { key: 'reports', collection: FIRESTORE_COLLECTIONS.reports },
  { key: 'milestones', collection: FIRESTORE_COLLECTIONS.milestones },
  { key: 'inquiries', collection: FIRESTORE_COLLECTIONS.inquiries },
  { key: 'payments', collection: FIRESTORE_COLLECTIONS.payments },
  { key: 'campaigns', collection: FIRESTORE_COLLECTIONS.campaigns },
  { key: 'testimonials', collection: FIRESTORE_COLLECTIONS.testimonials },
  { key: 'notifications', collection: FIRESTORE_COLLECTIONS.notifications },
  { key: 'auditLogs', collection: FIRESTORE_COLLECTIONS.auditLogs },
  { key: 'emailOutbox', collection: FIRESTORE_COLLECTIONS.emailOutbox },
];

const SAVE_DELAY_MS = 600;
const RETRY_DELAY_MS = 8000;
const EMAIL_FOR_SIGN_IN_KEY = 'betyna_email_for_sign_in';

function formatSaveError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code.includes('permission-denied')) {
    return 'Ingen tilgang til å lagre. Logg inn som administrator og prøv igjen.';
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'Ingen kontakt med databasen. Endringene lagres så snart nettet er tilbake.';
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Kunne ikke lagre. Prøver igjen.';
}

class SuspiciousWipeError extends Error {}

export function useFirestoreAppSync() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const fullLoadedRef = useRef(false);
  const [backendActive, setBackendActive] = useState(false);
  const [hydration, setHydration] = useState<HydrationPayload | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'off'>(
    firestoreEnabled ? 'loading' : 'off'
  );
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(() => readStoredAuthError());
  const [firestoreUserProfile, setFirestoreUserProfile] = useState<FirestoreUser | null>(null);
  const [firestoreProfileLoading, setFirestoreProfileLoading] = useState(false);
  const [firestoreAccessMessage, setFirestoreAccessMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: 'idle', lastSavedAt: null, error: null });
  const snapshotRef = useRef<(() => AppDataSnapshot) | null>(null);

  // Lagringsmotor: det siste vi vet ligger i databasen, og siste tilstand i appen.
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

  useEffect(() => {
    if (!auth) return () => {};
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (user) setAuthError(null);
    });
    void completeFirebaseAuthRedirect(auth).catch((err) =>
      setAuthError(formatFirebaseAuthError(err))
    );
    void (async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) return;
      try {
        const email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
        if (!email) {
          setAuthError('Åpne innloggingslenken i samme nettleser, eller be om ny lenke.');
          return;
        }
        markPortalIntent();
        await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
        clearStoredAuthError();
        setAuthError(null);
      } catch (err) {
        setAuthError(formatFirebaseAuthError(err));
      }
    })();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const email = firebaseUser?.email;
    if (!db || !firebaseUser?.uid || !email) {
      setFirestoreUserProfile(null);
      setFirestoreProfileLoading(false);
      setFirestoreAccessMessage(null);
      return;
    }
    let cancelled = false;
    setFirestoreProfileLoading(true);
    setFirestoreAccessMessage(null);
    (async () => {
      try {
        const profile = await ensureFirestoreUserOnLogin(
          db,
          firebaseUser.uid,
          email,
          firebaseUser.displayName
        );
        if (cancelled) return;
        setFirestoreUserProfile(profile);
        if (!profile) {
          setFirestoreAccessMessage(
            'Denne Google-kontoen finnes ikke i userDirectory og er ikke satt opp som administrator. Be en eksisterende admin legge inn e-posten din i Firestore, eller logg inn med en admin-konto.'
          );
        }
      } catch (err) {
        if (!cancelled) {
          setFirestoreUserProfile(null);
          setFirestoreAccessMessage(formatFirebaseAuthError(err));
        }
      } finally {
        if (!cancelled) setFirestoreProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid, firebaseUser?.email, firebaseUser?.displayName]);

  /** Lag 1: offentlig innhold leses av alle, uten innlogging. */
  useEffect(() => {
    if (!db || !firestoreEnabled) {
      setLoadState('off');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const publicData = await loadPublicFromFirestore(db);
        if (!cancelled && !fullLoadedRef.current) setHydration({ data: publicData, full: false });
      } catch {
        /* nettverk / regler: siden viser det som allerede ligger i appen */
      }
      if (!cancelled) setLoadState('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Lag 2: alt innhold etter at users/{uid} finnes (admin får full lasting). */
  useEffect(() => {
    if (!db || !firestoreEnabled || !authReady) return;
    if (!firebaseUser) {
      fullLoadedRef.current = false;
      readyRef.current = false;
      setBackendActive(false);
      return;
    }
    if (firestoreProfileLoading || !firestoreUserProfile) return;
    const portalRole = firestoreUserProfile.role;
    if (portalRole !== 'admin' && portalRole !== 'coordinator' && portalRole !== 'sponsor') {
      fullLoadedRef.current = false;
      readyRef.current = false;
      setBackendActive(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data =
          portalRole === 'admin'
            ? await loadAllFromFirestore(db)
            : await loadPortalFromFirestore(db, firestoreUserProfile);
        if (!cancelled && data) {
          fullLoadedRef.current = true;
          setHydration({ data, full: true });
        } else if (!cancelled && portalRole === 'admin') {
          setFirestoreAccessMessage(
            (prev) =>
              prev ??
              'Kunne ikke laste administrasjonsdata. Sjekk at system/seedLock finnes i Firestore og at reglene er deployet.'
          );
        }
      } catch (err) {
        if (!cancelled) {
          setFirestoreAccessMessage(formatSaveError(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, firebaseUser?.uid, firestoreUserProfile, firestoreProfileLoading]);

  /**
   * Kalles av appen etter at full lasting er satt inn i tilstanden.
   * Først da vet vi hva som ligger i databasen, og lagring slås på.
   */
  const confirmHydrated = useCallback((data: FirestoreHydration, options?: { enableSave?: boolean }) => {
    const baselines: Partial<Record<ListKey, Baseline>> = {};
    for (const { key } of SYNCED_LISTS) {
      baselines[key] = baselineOf((data[key] ?? []) as { id: string }[]);
    }
    listBaselines.current = baselines;
    cmsBaseline.current = data.cms ? stableJson(data.cms) : null;
    emailBaseline.current = data.emailAutoSend ? stableJson(data.emailAutoSend) : null;
    // Tilstanden i appen før denne lastingen er utdatert og må aldri lagres.
    latestRef.current = null;
    dirtyRef.current = false;
    const enableSave = options?.enableSave ?? true;
    readyRef.current = enableSave;
    setBackendActive(enableSave);
  }, []);

  /** Regner ut endringer mot det som ligger i databasen. */
  const planChanges = useCallback(
    (snapshot: AppDataSnapshot) => {
      const profile = firestoreUserProfile;
      if (profile && (profile.role === 'coordinator' || profile.role === 'sponsor')) {
        const scoped = planScopedPortalChanges(profile, listBaselines.current, snapshot);
        assertNoAdminOnlyWrites(scoped.changes);
        return scoped;
      }

      const changes: DbChange[] = [];
      const nextLists: Partial<Record<ListKey, Baseline>> = {};
      for (const { key, collection } of SYNCED_LISTS) {
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

  const flush = useCallback(async () => {
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
        setSaveStatus((s) => (s.state === 'saving' ? { ...s, state: 'saved' } : s));
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

  /** Kalles hver gang innholdet i appen endres. Lagrer automatisk etter et lite opphold. */
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

  // Ikke la noen lukke siden midt i en lagring, og prøv på nytt når nettet kommer tilbake.
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

  const prepareGoogleSignIn = useCallback(async () => {
    if (!auth) throw new Error('Firestore er ikke konfigurert');
    await setPersistence(auth, browserLocalPersistence);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Firestore er ikke konfigurert');
    setAuthError(null);
    await prepareGoogleSignIn();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      throw new Error(message);
    }
  }, [prepareGoogleSignIn]);

  const sendEmailSignInLink = useCallback(async (email: string) => {
    if (!auth) throw new Error('Firestore er ikke konfigurert');
    setAuthError(null);
    await prepareGoogleSignIn();
    const trimmed = email.trim().toLowerCase();
    const actionCodeSettings = {
      url: window.location.href.split('?')[0].split('#')[0],
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, trimmed, actionCodeSettings);
    window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, trimmed);
  }, [prepareGoogleSignIn]);

  const signInWithGoogleRedirect = useCallback(async () => {
    if (!auth) throw new Error('Firestore er ikke konfigurert');
    setAuthError(null);
    clearStoredAuthError();
    try {
      sessionStorage.setItem('betyna_return_to', 'admin:innstillinger');
    } catch {
      /* ignore */
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

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
    fullLoadedRef.current = true;
    const data = await loadAllFromFirestore(db);
    if (data) setHydration({ data, full: true });
    return result;
  }, []);

  const registerSnapshotProvider = useCallback((fn: () => AppDataSnapshot) => {
    snapshotRef.current = fn;
  }, []);

  return {
    firestoreEnabled,
    firebaseUser,
    firestoreUserProfile,
    firestoreProfileLoading,
    firestoreAccessMessage,
    backendActive,
    hydration,
    confirmHydrated,
    loadState,
    importMessage,
    authError,
    saveStatus,
    signInWithGoogle,
    sendEmailSignInLink,
    signInWithGoogleRedirect,
    importBrowserToFirestore,
    registerSnapshotProvider,
    schedulePersist,
    setImportMessage,
  };
}
