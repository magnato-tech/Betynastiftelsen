import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import {
  CMS_PUBLIC_DOC_ID,
  FIRESTORE_COLLECTIONS,
  SETTINGS_EMAIL_DOC_ID,
  SYSTEM_SEED_LOCK_DOC_ID,
} from './firestoreProfile';
import type { SeedLock } from './seedPolicy';
import { LIVE_LAUNCH_VERSION, createSeedLock } from './seedPolicy';

import type { AppDataSnapshot } from './appDataSnapshot';
import type { FirestoreUser, FirestoreUserDirectoryEntry } from './firestoreProfile';
import { emailToDirectoryDocId } from './firestoreUser';

export type { AppDataSnapshot };

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

export async function fetchSeedLock(db: Firestore): Promise<SeedLock | null> {
  const ref = doc(db, FIRESTORE_COLLECTIONS.system, SYSTEM_SEED_LOCK_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as SeedLock;
  return data.completed ? data : null;
}

/**
 * Offentlig lag: det alle besøkende kan lese uten innlogging (jf. firestore.rules).
 * Vitnesbyrd må spørres med filter, ellers avviser reglene hele spørringen.
 */
export async function loadPublicFromFirestore(
  db: Firestore
): Promise<Partial<Pick<AppDataSnapshot, 'cms' | 'campaigns' | 'testimonials'>>> {
  const [cmsSnap, campaignSnap, testimonialSnap] = await Promise.all([
    getDoc(doc(db, FIRESTORE_COLLECTIONS.cms, CMS_PUBLIC_DOC_ID)),
    getDocs(collection(db, FIRESTORE_COLLECTIONS.campaigns)),
    getDocs(
      query(
        collection(db, FIRESTORE_COLLECTIONS.testimonials),
        where('godkjentAvAdmin', '==', true)
      )
    ),
  ]);
  return {
    cms: cmsSnap.exists() ? (cmsSnap.data() as AppDataSnapshot['cms']) : undefined,
    campaigns: campaignSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as AppDataSnapshot['campaigns'][number]
    ),
    testimonials: testimonialSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as AppDataSnapshot['testimonials'][number]
    ),
  };
}

export async function loadAllFromFirestore(db: Firestore): Promise<Partial<AppDataSnapshot> | null> {
  const lock = await fetchSeedLock(db);
  if (!lock) return null;

  const loadList = async <T extends { id: string }>(name: string): Promise<T[]> => {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  };

  const cmsSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.cms, CMS_PUBLIC_DOC_ID));
  const emailSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.settings, SETTINGS_EMAIL_DOC_ID));

  return {
    coordinators: await loadList<AppDataSnapshot['coordinators'][number]>(
      FIRESTORE_COLLECTIONS.coordinators
    ),
    children: await loadList<AppDataSnapshot['children'][number]>(FIRESTORE_COLLECTIONS.children),
    sponsors: await loadList<AppDataSnapshot['sponsors'][number]>(FIRESTORE_COLLECTIONS.sponsors),
    catalogPhotos: await loadList<AppDataSnapshot['catalogPhotos'][number]>(
      FIRESTORE_COLLECTIONS.catalogPhotos
    ),
    mediaLibrary: await loadList<AppDataSnapshot['mediaLibrary'][number]>(
      FIRESTORE_COLLECTIONS.mediaLibrary
    ),
    facts: await loadList<AppDataSnapshot['facts'][number]>(FIRESTORE_COLLECTIONS.facts),
    reports: await loadList<AppDataSnapshot['reports'][number]>(FIRESTORE_COLLECTIONS.reports),
    milestones: await loadList<AppDataSnapshot['milestones'][number]>(
      FIRESTORE_COLLECTIONS.milestones
    ),
    inquiries: await loadList<AppDataSnapshot['inquiries'][number]>(FIRESTORE_COLLECTIONS.inquiries),
    payments: await loadList<AppDataSnapshot['payments'][number]>(FIRESTORE_COLLECTIONS.payments),
    campaigns: await loadList<AppDataSnapshot['campaigns'][number]>(FIRESTORE_COLLECTIONS.campaigns),
    testimonials: await loadList<AppDataSnapshot['testimonials'][number]>(
      FIRESTORE_COLLECTIONS.testimonials
    ),
    notifications: await loadList<AppDataSnapshot['notifications'][number]>(
      FIRESTORE_COLLECTIONS.notifications
    ),
    auditLogs: await loadList<AppDataSnapshot['auditLogs'][number]>(FIRESTORE_COLLECTIONS.auditLogs),
    emailOutbox: await loadList<AppDataSnapshot['emailOutbox'][number]>(
      FIRESTORE_COLLECTIONS.emailOutbox
    ),
    cms: cmsSnap.exists() ? (cmsSnap.data() as AppDataSnapshot['cms']) : undefined,
    emailAutoSend: emailSnap.exists()
      ? (emailSnap.data() as AppDataSnapshot['emailAutoSend'])
      : undefined,
  };
}

/** Koordinator/fadder: les det Firestore-reglene tillater (filtrert per dokument). Admin bruker loadAllFromFirestore. */
export async function loadPortalFromFirestore(
  db: Firestore,
  profile: FirestoreUser
): Promise<Partial<AppDataSnapshot>> {
  const loadList = async <T extends { id: string }>(name: string): Promise<T[]> => {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  };

  const publicPart = await loadPublicFromFirestore(db);
  const emptyLists: Partial<AppDataSnapshot> = {
    coordinators: [],
    sponsors: [],
    children: [],
    catalogPhotos: [],
    mediaLibrary: [],
    facts: [],
    reports: [],
    milestones: [],
    inquiries: [],
    payments: [],
    notifications: [],
    auditLogs: [],
    emailOutbox: [],
  };

  if (profile.role === 'coordinator' && profile.coordinatorId) {
    const coordSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.coordinators, profile.coordinatorId));
    const coordinators = coordSnap.exists()
      ? [{ id: coordSnap.id, ...coordSnap.data() } as AppDataSnapshot['coordinators'][number]]
      : [];
    return {
      ...emptyLists,
      ...publicPart,
      coordinators,
      children: await loadList(FIRESTORE_COLLECTIONS.children),
      catalogPhotos: await loadList(FIRESTORE_COLLECTIONS.catalogPhotos),
      facts: await loadList(FIRESTORE_COLLECTIONS.facts),
      reports: await loadList(FIRESTORE_COLLECTIONS.reports),
      milestones: await loadList(FIRESTORE_COLLECTIONS.milestones),
      inquiries: await loadList(FIRESTORE_COLLECTIONS.inquiries),
      notifications: await loadList(FIRESTORE_COLLECTIONS.notifications),
    };
  }

  if (profile.role === 'sponsor' && profile.sponsorId) {
    const sponsorSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.sponsors, profile.sponsorId));
    const sponsors = sponsorSnap.exists()
      ? [{ id: sponsorSnap.id, ...sponsorSnap.data() } as AppDataSnapshot['sponsors'][number]]
      : [];
    return {
      ...emptyLists,
      ...publicPart,
      sponsors,
      children: await loadList(FIRESTORE_COLLECTIONS.children),
      reports: await loadList(FIRESTORE_COLLECTIONS.reports),
      milestones: await loadList(FIRESTORE_COLLECTIONS.milestones),
      inquiries: await loadList(FIRESTORE_COLLECTIONS.inquiries),
      payments: await loadList(FIRESTORE_COLLECTIONS.payments),
      notifications: await loadList(FIRESTORE_COLLECTIONS.notifications),
    };
  }

  return { ...emptyLists, ...publicPart };
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
  }
): Promise<void> {
  await setDoc(doc(db, FIRESTORE_COLLECTIONS.sponsors, id), {
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
  });
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
