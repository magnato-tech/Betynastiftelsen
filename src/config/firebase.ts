import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
/** getAuth har riktig lagring og redirect/popup-resolver innebygd. Ikke bytt til initializeAuth uten resolver. */
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;
