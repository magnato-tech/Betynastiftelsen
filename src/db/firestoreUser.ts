import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { isBootstrapAdminEmail } from '../config/bootstrapAdmins';
import {
  FIRESTORE_COLLECTIONS,
  type FirestoreUser,
  type FirestoreUserDirectoryEntry,
} from './firestoreProfile';
import {
  canLoginWithDirectoryStatus,
  normalizeUserDirectoryStatus,
} from './userDirectoryStatus';

export function emailToDirectoryDocId(email: string): string {
  return email.trim().toLowerCase();
}

export type FirestoreLoginDeniedReason = 'unknown' | 'sperret';

export type EnsureFirestoreUserResult =
  | { ok: true; profile: FirestoreUser }
  | { ok: false; reason: FirestoreLoginDeniedReason };

/** Oppretter `users/{uid}` fra `userDirectory` eller bootstrap-admin ved første innlogging. */
export async function ensureFirestoreUserOnLogin(
  db: Firestore,
  uid: string,
  email: string,
  displayName?: string | null
): Promise<EnsureFirestoreUserResult> {
  const directoryId = emailToDirectoryDocId(email);
  const userRef = doc(db, FIRESTORE_COLLECTIONS.users, uid);
  const existing = await getDoc(userRef);
  if (existing.exists()) {
    const profile = existing.data() as FirestoreUser;
    const dirSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.userDirectory, directoryId));
    if (dirSnap.exists()) {
      const entry = dirSnap.data() as FirestoreUserDirectoryEntry;
      const status = normalizeUserDirectoryStatus(entry.status);
      if (!canLoginWithDirectoryStatus(status)) {
        return { ok: false, reason: 'sperret' };
      }
    } else if (!isBootstrapAdminEmail(email)) {
      return { ok: false, reason: 'unknown' };
    }
    return { ok: true, profile };
  }

  const dirSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.userDirectory, directoryId));
  let entry: FirestoreUserDirectoryEntry | null = null;
  if (dirSnap.exists()) {
    entry = dirSnap.data() as FirestoreUserDirectoryEntry;
  } else if (isBootstrapAdminEmail(email)) {
    entry = {
      email: directoryId,
      role: 'admin',
      status: 'aktiv',
      displayName: displayName?.trim() || directoryId.split('@')[0],
    };
  } else {
    return { ok: false, reason: 'unknown' };
  }

  const status = normalizeUserDirectoryStatus(entry.status);
  if (!canLoginWithDirectoryStatus(status)) {
    return { ok: false, reason: 'sperret' };
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

  if (status === 'invitert') {
    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.userDirectory, directoryId),
      { status: 'aktiv' },
      { merge: true }
    );
  }

  return { ok: true, profile };
}

export async function fetchFirestoreUser(
  db: Firestore,
  uid: string
): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.users, uid));
  return snap.exists() ? (snap.data() as FirestoreUser) : null;
}
