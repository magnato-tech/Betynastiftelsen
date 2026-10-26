import { deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { DocumentReference, Firestore } from 'firebase/firestore';
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
      // Rydder opp etter tidligere innlogginger der status ble stående som invitert.
      if (status === 'invitert') await markerInvitasjonAktiv(db, directoryId);
      return synkroniserProfil(userRef, profile, entry);
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
    createdAt: new Date().toISOString(),
  };
  // Firestore tåler ikke undefined-verdier, så koblings-id-er tas med kun når de finnes.
  if (entry.coordinatorId !== undefined) profile.coordinatorId = entry.coordinatorId;
  if (entry.sponsorId !== undefined) profile.sponsorId = entry.sponsorId;

  await setDoc(userRef, profile, { merge: true });

  if (status === 'invitert') await markerInvitasjonAktiv(db, directoryId);

  return { ok: true, profile };
}

/** Invitert → aktiv ved innlogging. Feiler den, skal innloggingen likevel gå gjennom. */
async function markerInvitasjonAktiv(db: Firestore, directoryId: string): Promise<void> {
  try {
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.userDirectory, directoryId), { status: 'aktiv' });
  } catch (err) {
    console.warn('Kunne ikke sette invitasjonen til aktiv.', err);
  }
}

/** Oppdaterer `users/{uid}` med endringer fra `userDirectory` (rolle, navn, koblinger). */
async function synkroniserProfil(
  userRef: DocumentReference,
  profile: FirestoreUser,
  entry: FirestoreUserDirectoryEntry
): Promise<EnsureFirestoreUserResult> {
  const displayName = entry.displayName?.trim() || profile.displayName;
  const synced: FirestoreUser = { ...profile, role: entry.role, displayName };
  const patch: Record<string, unknown> = {};

  if (profile.role !== entry.role) patch.role = entry.role;
  if (profile.displayName !== displayName) patch.displayName = displayName;

  // Fjernet i katalogen = slett feltet i profilen (undefined kan ikke skrives).
  for (const felt of ['coordinatorId', 'sponsorId'] as const) {
    const verdi = entry[felt];
    if (verdi === profile[felt]) continue;
    if (verdi === undefined) {
      patch[felt] = deleteField();
      delete synced[felt];
    } else {
      patch[felt] = verdi;
      synced[felt] = verdi;
    }
  }

  if (Object.keys(patch).length === 0) return { ok: true, profile };

  try {
    await updateDoc(userRef, patch);
  } catch (err) {
    // Innlogging skal ikke feile; databasereglene avgjør tilgang ut fra den lagrede profilen.
    console.warn('Kunne ikke synkronisere brukerprofilen fra katalogen ved innlogging.', err);
    return { ok: true, profile };
  }
  return { ok: true, profile: synced };
}

export async function fetchFirestoreUser(
  db: Firestore,
  uid: string
): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.users, uid));
  return snap.exists() ? (snap.data() as FirestoreUser) : null;
}
