import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import { db, firestoreEnabled } from '../config/firebase';
import {
  loadAllFromFirestore,
  loadPortalFromFirestore,
  loadPublicFromFirestore,
} from './firestoreData';
import type { AppDataSnapshot } from './firestoreData';
import type { FirestoreUser } from './firestoreProfile';
import { formatSaveError } from './firestoreSyncConstants';

export type FirestoreHydration = {
  [K in keyof AppDataSnapshot]?: AppDataSnapshot[K];
};

/** Data fra databasen. full = alt innhold (innlogget admin), ellers bare det offentlige. */
export interface HydrationPayload {
  data: FirestoreHydration;
  full: boolean;
}

export function useFirestoreSyncHydration(params: {
  authReady: boolean;
  firebaseUser: User | null;
  firestoreUserProfile: FirestoreUser | null;
  firestoreProfileLoading: boolean;
  setFirestoreAccessMessage: Dispatch<SetStateAction<string | null>>;
  onFullLoadReset: () => void;
}) {
  const {
    authReady,
    firebaseUser,
    firestoreUserProfile,
    firestoreProfileLoading,
    setFirestoreAccessMessage,
    onFullLoadReset,
  } = params;

  const fullLoadedRef = useRef(false);
  const [hydration, setHydration] = useState<HydrationPayload | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'off'>(
    firestoreEnabled ? 'loading' : 'off'
  );

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
      onFullLoadReset();
      return;
    }
    if (firestoreProfileLoading || !firestoreUserProfile) return;
    const portalRole = firestoreUserProfile.role;
    if (portalRole !== 'admin' && portalRole !== 'coordinator' && portalRole !== 'sponsor') {
      fullLoadedRef.current = false;
      onFullLoadReset();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const nektet: string[] = [];
        const data =
          portalRole === 'admin'
            ? await loadAllFromFirestore(db, { onDenied: (navn) => nektet.push(navn) })
            : await loadPortalFromFirestore(db, firestoreUserProfile);
        if (!cancelled && data) {
          fullLoadedRef.current = true;
          setHydration({ data, full: true });
          if (nektet.length > 0) {
            setFirestoreAccessMessage(
              `Mangler lesetilgang til: ${nektet.join(', ')}. Resten er lastet og lagres som vanlig.`
            );
          }
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
  }, [authReady, firebaseUser?.uid, firestoreUserProfile, firestoreProfileLoading, onFullLoadReset, setFirestoreAccessMessage]);

  const markFullLoadedAfterImport = () => {
    fullLoadedRef.current = true;
  };

  const resetFullLoaded = () => {
    fullLoadedRef.current = false;
  };

  return {
    hydration,
    setHydration,
    loadState,
    fullLoadedRef,
    markFullLoadedAfterImport,
    resetFullLoaded,
  };
}
