import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import {
  CMS_PUBLIC_DOC_ID,
  FIRESTORE_COLLECTIONS,
  SETTINGS_EMAIL_DOC_ID,
  SYSTEM_SEED_LOCK_DOC_ID,
} from './firestoreProfile';
import { LIVE_LAUNCH_VERSION, createSeedLock } from './seedPolicy';
import type { AppDataSnapshot } from './appDataSnapshot';
import type { FirestoreUserDirectoryEntry } from './firestoreProfile';
import { emailToDirectoryDocId } from './firestoreUser';
import { fetchSeedLock } from './firestoreDataLoad';

async function existingIds(db: Firestore, name: string): Promise<Set<string>> {
  const snap = await getDocs(collection(db, name));
  return new Set(snap.docs.map((d) => d.id));
}

async function writeCreateOnly<T extends { id: string }>(
  db: Firestore,
  collectionName: string,
  items: T[],
  existing: Set<string>
): Promise<number> {
  let written = 0;
  let batch = writeBatch(db);
  let ops = 0;
  for (const item of items) {
    if (existing.has(item.id)) continue;
    batch.set(doc(db, collectionName, item.id), item);
    existing.add(item.id);
    written += 1;
    ops += 1;
    if (ops >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
  return written;
}

/** Første import: det som ligger i nettleseren nå. Oppretter bare nye id-er. */
export async function importBrowserSnapshotToFirestore(
  db: Firestore,
  snapshot: AppDataSnapshot,
  uid: string,
  email: string
): Promise<{ written: number; skippedLock: boolean }> {
  const lock = await fetchSeedLock(db);
  if (lock) return { written: 0, skippedLock: true };

  await setDoc(
    doc(db, FIRESTORE_COLLECTIONS.users, uid),
    {
      id: uid,
      role: 'admin',
      email,
      displayName: email.split('@')[0],
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );

  const pairs: [string, { id: string }[]][] = [
    [FIRESTORE_COLLECTIONS.coordinators, snapshot.coordinators],
    [FIRESTORE_COLLECTIONS.sponsors, snapshot.sponsors],
    [FIRESTORE_COLLECTIONS.children, snapshot.children],
    [FIRESTORE_COLLECTIONS.catalogPhotos, snapshot.catalogPhotos],
    [FIRESTORE_COLLECTIONS.facts, snapshot.facts],
    [FIRESTORE_COLLECTIONS.reports, snapshot.reports],
    [FIRESTORE_COLLECTIONS.milestones, snapshot.milestones],
    [FIRESTORE_COLLECTIONS.inquiries, snapshot.inquiries],
    [FIRESTORE_COLLECTIONS.payments, snapshot.payments],
    [FIRESTORE_COLLECTIONS.sponsorAssignments, snapshot.sponsorAssignments ?? []],
    [FIRESTORE_COLLECTIONS.recurringCharges, snapshot.recurringCharges ?? []],
    [FIRESTORE_COLLECTIONS.paymentAllocations, snapshot.paymentAllocations ?? []],
    [FIRESTORE_COLLECTIONS.campaigns, snapshot.campaigns],
    [FIRESTORE_COLLECTIONS.testimonials, snapshot.testimonials],
    [FIRESTORE_COLLECTIONS.notifications, snapshot.notifications],
    [FIRESTORE_COLLECTIONS.auditLogs, snapshot.auditLogs],
    [FIRESTORE_COLLECTIONS.emailOutbox, snapshot.emailOutbox ?? []],
  ];

  let written = 0;
  for (const [name, items] of pairs) {
    const existing = await existingIds(db, name);
    written += await writeCreateOnly(db, name, items, existing);
  }

  const cmsRef = doc(db, FIRESTORE_COLLECTIONS.cms, CMS_PUBLIC_DOC_ID);
  const cmsExists = (await getDoc(cmsRef)).exists();
  if (!cmsExists) {
    await setDoc(cmsRef, snapshot.cms);
    written += 1;
  }

  const settingsRef = doc(db, FIRESTORE_COLLECTIONS.settings, SETTINGS_EMAIL_DOC_ID);
  if (!(await getDoc(settingsRef)).exists()) {
    await setDoc(settingsRef, snapshot.emailAutoSend);
    written += 1;
  }

  const nextLock = createSeedLock(LIVE_LAUNCH_VERSION);
  await setDoc(doc(db, FIRESTORE_COLLECTIONS.system, SYSTEM_SEED_LOCK_DOC_ID), nextLock);
  written += 1;

  return { written, skippedLock: false };
}

/** Påmelding fra forsiden. Ett nytt fadder-dokument, uten barn og uten betaling. */
export async function saveWebsiteSponsor(
  db: Firestore,
  id: string,
  data: {
    navn: string;
    epost: string;
    telefon: string;
    poststed: string;
    maanedsbelop: number;
    betalingsmetode: 'vipps' | 'avtalegiro' | 'bank';
    vippsAgreementId?: string;
    vippsConfirmationUrl?: string;
    vippsAgreementStatus?: 'PENDING' | 'ACTIVE' | 'STOPPED' | 'EXPIRED';
  }
): Promise<void> {
  const payload: Record<string, unknown> = {
    navn: data.navn.trim(),
    epost: data.epost.trim(),
    telefon: data.telefon.trim(),
    poststed: data.poststed.trim(),
    maanedsbelop: data.maanedsbelop,
    betalingsmetode: data.betalingsmetode,
    betalingsstatus: 'aktiv',
    startDato: new Date().toISOString().slice(0, 10),
    tildeltBarnIds: [],
    registrertKilde: 'nettside',
  };
  if (data.vippsAgreementId) payload.vippsAgreementId = data.vippsAgreementId;
  if (data.vippsConfirmationUrl) payload.vippsConfirmationUrl = data.vippsConfirmationUrl;
  if (data.vippsAgreementStatus) payload.vippsAgreementStatus = data.vippsAgreementStatus;
  await setDoc(doc(db, FIRESTORE_COLLECTIONS.sponsors, id), payload);
}

/** Admin legger inn koordinator/fadder (og evt. admin) før første innlogging. */
export async function saveUserDirectoryEntry(
  db: Firestore,
  entry: FirestoreUserDirectoryEntry
): Promise<void> {
  const email = emailToDirectoryDocId(entry.email);
  const payload: FirestoreUserDirectoryEntry = {
    email,
    role: entry.role,
    status: entry.status ?? 'invitert',
    displayName: entry.displayName?.trim() || email.split('@')[0],
  };
  if (entry.role === 'coordinator' && entry.coordinatorId) {
    payload.coordinatorId = entry.coordinatorId;
  }
  if (entry.role === 'sponsor' && entry.sponsorId) {
    payload.sponsorId = entry.sponsorId;
  }
  await setDoc(doc(db, FIRESTORE_COLLECTIONS.userDirectory, email), payload, { merge: true });
}

export async function updateUserDirectoryStatus(
  db: Firestore,
  email: string,
  status: FirestoreUserDirectoryEntry['status']
): Promise<void> {
  const id = emailToDirectoryDocId(email);
  await setDoc(doc(db, FIRESTORE_COLLECTIONS.userDirectory, id), { status, email: id }, { merge: true });
}

/** Leser alle rader i userDirectory (dokument-id = e-post). Brukes av personkortet for å finne tilknyttet innlogging. */
export async function listUserDirectoryEntries(
  db: Firestore
): Promise<(FirestoreUserDirectoryEntry & { email: string })[]> {
  const snap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.userDirectory));
  return snap.docs.map((d) => ({ ...(d.data() as FirestoreUserDirectoryEntry), email: d.id }));
}

/** Sletter én rad i userDirectory. Brukes når en koordinator/fadder slettes helt. */
export async function deleteUserDirectoryEntry(db: Firestore, email: string): Promise<void> {
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.userDirectory, emailToDirectoryDocId(email)));
}

export type DbChange =
  | { kind: 'set'; collection: string; id: string; data: unknown }
  | { kind: 'delete'; collection: string; id: string };

/** Skriver og sletter i grupper. Kaster feil videre slik at lagringen kan vise den og prøve igjen. */
export async function commitChanges(db: Firestore, changes: DbChange[]): Promise<void> {
  let batch = writeBatch(db);
  let ops = 0;
  for (const ch of changes) {
    const ref = doc(db, ch.collection, ch.id);
    if (ch.kind === 'set') batch.set(ref, ch.data as Record<string, unknown>);
    else batch.delete(ref);
    ops += 1;
    if (ops >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
}
