import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { readCmsPreviewFlags } from '../utils/cmsPreview';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firestoreEnabled =
  import.meta.env.VITE_FIRESTORE_ENABLED === 'true' &&
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

function getApp(): FirebaseApp | null {
  if (!firestoreEnabled) return null;
  if (!getApps().length) return initializeApp(firebaseConfig);
  return getApps()[0]!;
}

export const firebaseApp = getApp();

/**
 * CMS-forhåndsvisningen (iframe) viser bare offentlig innhold og trenger ingen innlogging.
 * Startet Auth der, sjekket den den delte innloggingen på nytt og kunne slette den,
 * slik at admin ble logget ut av siden rundt (betyna.no, 26.10.2026).
 */
const isEmbeddedCmsPreview =
  typeof window !== 'undefined' && readCmsPreviewFlags().embedded;

/** getAuth har riktig lagring og redirect/popup-resolver innebygd. Ikke bytt til initializeAuth uten resolver. */
export const auth = firebaseApp && !isEmbeddedCmsPreview ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;

/** Kun lokalt: VITE_USE_EMULATORS=true kobler til Firebase-emulatorene i stedet for ekte database. */
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  if (db) connectFirestoreEmulator(db, '127.0.0.1', 8080);
  if (auth) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    (window as unknown as { __betynaAuth?: typeof auth }).__betynaAuth = auth;
  }
}
