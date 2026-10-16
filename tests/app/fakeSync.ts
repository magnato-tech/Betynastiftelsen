import { useState } from 'react';

/**
 * Erstatter useFirestoreAppSync i apptester. Appen faar data akkurat slik den gjor i
 * produksjon (som en "hydration" fra databasen), men uten nettverk.
 */
export const fakeSync = {
  hydration: null as null | { data: Record<string, unknown>; full: boolean },
  confirmed: [] as unknown[],
  persisted: [] as unknown[],
  backendActive: false,
  reset() {
    this.hydration = null;
    this.confirmed = [];
    this.persisted = [];
    this.backendActive = false;
  },
};

export function useFakeSync() {
  const [hydration] = useState(fakeSync.hydration);
  const [backendActive, setBackendActive] = useState(fakeSync.backendActive);
  return {
    firestoreEnabled: false,
    firebaseUser: null,
    firestoreUserProfile: null,
    firestoreProfileLoading: false,
    firestoreAccessMessage: null,
    backendActive,
    hydration,
    confirmHydrated: (data: unknown) => {
      fakeSync.confirmed.push(data);
      setBackendActive(true);
    },
    loadState: 'off' as const,
    importMessage: null,
    authError: null,
    saveStatus: { state: 'idle' as const, lastSavedAt: null, error: null },
    signInWithGoogle: async () => undefined,
    sendEmailSignInLink: async () => undefined,
    signInWithGoogleRedirect: async () => undefined,
    importBrowserToFirestore: async () => undefined,
    registerSnapshotProvider: () => undefined,
    schedulePersist: (snapshot: unknown) => {
      fakeSync.persisted.push(snapshot);
    },
    setImportMessage: () => undefined,
  };
}
