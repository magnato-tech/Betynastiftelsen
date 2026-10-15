import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { isBootstrapAdminEmail } from '../config/bootstrapAdmins';
import {
  FIRESTORE_COLLECTIONS,
  type FirestoreUser,
  type FirestoreUserDirectoryEntry,
} from './firestoreProfile';

export function emailToDirectoryDocId(email: string): string {
  return email.trim().toLowerCase();
}

/** Oppretter `users/{uid}` fra `userDirectory` eller bootstrap-admin ved første innlogging. */
export async function ensureFirestoreUserOnLogin(
  db: Firestore,
  uid: string,
  email: string,
  displayName?: string | null
): Promise<FirestoreUser | null> {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.users, uid);
  const existing = await getDoc(userRef);
  if (existing.exists()) {
    return existing.data() as FirestoreUser;
  }

  const directoryId = emailToDirectoryDocId(email);
  const dirSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.userDirectory, directoryId));
  let entry: FirestoreUserDirectoryEntry | null = null;
  if (dirSnap.exists()) {
    entry = dirSnap.data() as FirestoreUserDirectoryEntry;
  } else if (isBootstrapAdminEmail(email)) {
    entry = {
      email: directoryId,
      role: 'admin',
      displayName: displayName?.trim() || directoryId.split('@')[0],
    };
  } else {
    return null;
  }

  const profile: FirestoreUser = {
    id: uid,
    role: entry.role,
    email: directoryId,
    displayName: entry.displayName || displayName?.trim() || directoryId.split('@')[0],
    coordinatorId: entry.coordinatorId,
    sponsorId: entry.sponsorId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(userRef, profile, { merge: true });
  return profile;
}

export async function fetchFirestoreUser(
  db: Firestore,
  uid: string
): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.users, uid));
  return snap.exists() ? (snap.data() as FirestoreUser) : null;
}
