import { useCallback, useRef } from 'react';
import { firestoreEnabled } from '../config/firebase';
import { useFirestoreSyncAuth } from './useFirestoreSyncAuth';
import { useFirestoreSyncHydration } from './useFirestoreSyncHydration';
import { useFirestoreSyncPersist } from './useFirestoreSyncPersist';

export type { FirestoreHydration, HydrationPayload } from './useFirestoreSyncHydration';
export type { SaveState, SaveStatus } from './useFirestoreSyncPersist';

export function useFirestoreAppSync() {
  const authSync = useFirestoreSyncAuth();
  const persistResetRef = useRef<() => void>(() => {});
  // Må være stabil: den står i avhengighetene til innlastingen, og en ny funksjon per
  // tegning lastet alle data på nytt og overskrev endringer som ikke var lagret ennå.
  const onFullLoadReset = useCallback(() => persistResetRef.current(), []);

  const hydrationSync = useFirestoreSyncHydration({
    authReady: authSync.authReady,
    firebaseUser: authSync.firebaseUser,
    firestoreUserProfile: authSync.firestoreUserProfile,
    firestoreProfileLoading: authSync.firestoreProfileLoading,
    setFirestoreAccessMessage: authSync.setFirestoreAccessMessage,
    onFullLoadReset,
  });

  const persistSync = useFirestoreSyncPersist({
    firestoreUserProfile: authSync.firestoreUserProfile,
    setHydration: hydrationSync.setHydration,
    markFullLoadedAfterImport: hydrationSync.markFullLoadedAfterImport,
    onSignOutReset: hydrationSync.resetFullLoaded,
  });
  persistResetRef.current = persistSync.resetPersistState;

  const signOutFirebase = useCallback(async () => {
    await authSync.signOutFirebase();
    hydrationSync.resetFullLoaded();
    persistSync.resetPersistState();
  }, [authSync, hydrationSync, persistSync]);

  return {
    firestoreEnabled,
    firebaseUser: authSync.firebaseUser,
    firestoreUserProfile: authSync.firestoreUserProfile,
    firestoreProfileLoading: authSync.firestoreProfileLoading,
    firestoreAccessMessage: authSync.firestoreAccessMessage,
    backendActive: persistSync.backendActive,
    hydration: hydrationSync.hydration,
    confirmHydrated: persistSync.confirmHydrated,
    loadState: hydrationSync.loadState,
    importMessage: persistSync.importMessage,
    authError: authSync.authError,
    saveStatus: persistSync.saveStatus,
    signInWithGoogle: authSync.signInWithGoogle,
    sendEmailSignInLink: authSync.sendEmailSignInLink,
    signInWithGoogleRedirect: authSync.signInWithGoogleRedirect,
    signOutFirebase,
    importBrowserToFirestore: persistSync.importBrowserToFirestore,
    registerSnapshotProvider: persistSync.registerSnapshotProvider,
    schedulePersist: persistSync.schedulePersist,
    saveNow: persistSync.saveNow,
    readOnly: persistSync.readOnly,
    enterReadOnly: persistSync.enterReadOnly,
    exitReadOnly: persistSync.exitReadOnly,
    setImportMessage: persistSync.setImportMessage,
  };
}
