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
  /** Innlogget Firestore-profil (f.eks. admin som ser som fadder). */
  profile: null as null | { role: string; displayName: string; email: string },
  readOnlyCalls: [] as string[],
  reset() {
    this.hydration = null;
    this.confirmed = [];
    this.persisted = [];
    this.backendActive = false;
    this.profile = null;
    this.readOnlyCalls = [];
  },
};

export function useFakeSync() {
  const [hydration] = useState(fakeSync.hydration);
  const [backendActive, setBackendActive] = useState(fakeSync.backendActive);
  const [readOnly, setReadOnly] = useState(false);
  return {
    firestoreEnabled: false,
    firebaseUser: null,
    firestoreUserProfile: fakeSync.profile as never,
    readOnly,
    enterReadOnly: () => {
      fakeSync.readOnlyCalls.push('enter');
      setReadOnly(true);
    },
    exitReadOnly: async () => {
      fakeSync.readOnlyCalls.push('exit');
      setReadOnly(false);
    },
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
