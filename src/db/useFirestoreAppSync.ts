import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
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
  importBrowserSnapshotToFirestore,
  loadAllFromFirestore,
  persistCms,
  persistCollection,
  persistEmailAutoSend,
  fetchSeedLock,
} from './firestoreData';
import { FIRESTORE_COLLECTIONS, type FirestoreUser } from './firestoreProfile';
import type { AppDataSnapshot } from './firestoreData';
import { ensureFirestoreUserOnLogin } from './firestoreUser';

export type FirestoreHydration = {
  [K in keyof AppDataSnapshot]?: AppDataSnapshot[K];
};

export function useFirestoreAppSync() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [backendActive, setBackendActive] = useState(false);
  const [hydration, setHydration] = useState<FirestoreHydration | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'off'>(
    firestoreEnabled ? 'loading' : 'off'
  );
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(() => readStoredAuthError());
  const [firestoreUserProfile, setFirestoreUserProfile] = useState<FirestoreUser | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotRef = useRef<(() => AppDataSnapshot) | null>(null);

  useEffect(() => {
    if (!auth) return () => {};
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) setAuthError(null);
    });
    void completeFirebaseAuthRedirect(auth).catch((err) =>
      setAuthError(formatFirebaseAuthError(err))
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const email = firebaseUser?.email;
    if (!db || !firebaseUser?.uid || !email) {
      setFirestoreUserProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const profile = await ensureFirestoreUserOnLogin(
          db,
          firebaseUser.uid,
          email,
          firebaseUser.displayName
        );
        if (!cancelled) setFirestoreUserProfile(profile);
      } catch {
        if (!cancelled) setFirestoreUserProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid, firebaseUser?.email, firebaseUser?.displayName]);

  useEffect(() => {
    if (!db || !firestoreEnabled) {
      setLoadState('off');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const lock = await fetchSeedLock(db);
        if (!lock) {
          if (!cancelled) setLoadState('ready');
          return;
        }
        const data = await loadAllFromFirestore(db);
        if (!cancelled && data) {
          setHydration(data);
          setBackendActive(true);
        }
      } catch {
        /* nettverk / regler */
      }
      if (!cancelled) setLoadState('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    setBackendActive(true);
    const data = await loadAllFromFirestore(db);
    if (data) setHydration(data);
    return result;
  }, []);

  const registerSnapshotProvider = useCallback((fn: () => AppDataSnapshot) => {
    snapshotRef.current = fn;
  }, []);

  const schedulePersist = useCallback(
    (snapshot: AppDataSnapshot) => {
      if (!db || !backendActive) return;
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(async () => {
        if (!db) return;
        try {
          await Promise.all([
            persistCollection(db, FIRESTORE_COLLECTIONS.children, snapshot.children),
            persistCollection(db, FIRESTORE_COLLECTIONS.sponsors, snapshot.sponsors),
            persistCollection(db, FIRESTORE_COLLECTIONS.reports, snapshot.reports),
            persistCollection(db, FIRESTORE_COLLECTIONS.milestones, snapshot.milestones),
            persistCollection(db, FIRESTORE_COLLECTIONS.inquiries, snapshot.inquiries),
            persistCollection(db, FIRESTORE_COLLECTIONS.payments, snapshot.payments),
            persistCollection(db, FIRESTORE_COLLECTIONS.campaigns, snapshot.campaigns),
            persistCollection(db, FIRESTORE_COLLECTIONS.facts, snapshot.facts),
            persistCollection(db, FIRESTORE_COLLECTIONS.testimonials, snapshot.testimonials),
            persistCollection(db, FIRESTORE_COLLECTIONS.notifications, snapshot.notifications),
            persistCollection(db, FIRESTORE_COLLECTIONS.auditLogs, snapshot.auditLogs),
            persistCollection(db, FIRESTORE_COLLECTIONS.catalogPhotos, snapshot.catalogPhotos),
            persistCollection(db, FIRESTORE_COLLECTIONS.emailOutbox, snapshot.emailOutbox ?? []),
            persistCollection(db, FIRESTORE_COLLECTIONS.coordinators, snapshot.coordinators),
            persistCms(db, snapshot.cms),
            persistEmailAutoSend(db, snapshot.emailAutoSend),
          ]);
        } catch {
          /* stille — admin ser data lokalt til neste lagring */
        }
      }, 900);
    },
    [backendActive]
  );

  return {
    firestoreEnabled,
    firebaseUser,
    firestoreUserProfile,
    backendActive,
    hydration,
    loadState,
    importMessage,
    authError,
    signInWithGoogle,
    signInWithGoogleRedirect,
    importBrowserToFirestore,
    registerSnapshotProvider,
    schedulePersist,
    setImportMessage,
  };
}
