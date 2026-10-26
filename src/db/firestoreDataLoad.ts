import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { PaymentAllocation, RecurringCharge, SponsorAssignment } from '../types';
import {
  CMS_PUBLIC_DOC_ID,
  FIRESTORE_COLLECTIONS,
  SETTINGS_EMAIL_DOC_ID,
  SYSTEM_SEED_LOCK_DOC_ID,
} from './firestoreProfile';
import type { SeedLock } from './seedPolicy';
import type { AppDataSnapshot } from './appDataSnapshot';
import type { FirestoreUser } from './firestoreProfile';

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

export async function loadAllFromFirestore(
  db: Firestore,
  options?: { onDenied?: (collectionName: string) => void }
): Promise<Partial<AppDataSnapshot> | null> {
  const lock = await fetchSeedLock(db);
  if (!lock) return null;

  const erAvslatt = (err: unknown) =>
    ((err as { code?: string })?.code ?? '').includes('permission-denied');

  /** Én samling: ved manglende lesetilgang blir den en tom liste, resten lastes. */
  const loadList = async <T extends { id: string }>(name: string): Promise<T[]> => {
    try {
      const snap = await getDocs(collection(db, name));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
    } catch (err) {
      if (!erAvslatt(err)) throw err;
      options?.onDenied?.(name);
      return [];
    }
  };

  /** Ett dokument: ved manglende lesetilgang behandles det som om det ikke finnes. */
  const loadDoc = async (collectionName: string, docId: string) => {
    try {
      return await getDoc(doc(db, collectionName, docId));
    } catch (err) {
      if (!erAvslatt(err)) throw err;
      options?.onDenied?.(collectionName);
      return null;
    }
  };

  // CMS leses uten unntak: et tomt CMS her ville blitt lagret over nettsiden.
  const cmsSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.cms, CMS_PUBLIC_DOC_ID));
  const emailSnap = await loadDoc(FIRESTORE_COLLECTIONS.settings, SETTINGS_EMAIL_DOC_ID);
  const chargeJobSnap = await loadDoc(FIRESTORE_COLLECTIONS.system, 'vippsChargeJob');

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
    sponsorAssignments: await loadList<AppDataSnapshot['sponsorAssignments'][number]>(
      FIRESTORE_COLLECTIONS.sponsorAssignments
    ),
    recurringCharges: await loadList<AppDataSnapshot['recurringCharges'][number]>(
      FIRESTORE_COLLECTIONS.recurringCharges
    ),
    paymentAllocations: await loadList<AppDataSnapshot['paymentAllocations'][number]>(
      FIRESTORE_COLLECTIONS.paymentAllocations
    ),
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
    cms: cmsSnap?.exists() ? (cmsSnap.data() as AppDataSnapshot['cms']) : undefined,
    emailAutoSend: emailSnap?.exists()
      ? (emailSnap.data() as AppDataSnapshot['emailAutoSend'])
      : undefined,
    vippsChargeJob: chargeJobSnap?.exists()
      ? (chargeJobSnap.data() as AppDataSnapshot['vippsChargeJob'])
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
    sponsorAssignments: [],
    recurringCharges: [],
    paymentAllocations: [],
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
      paymentAllocations: profile.coordinatorId
        ? (
            await getDocs(
              query(
                collection(db, FIRESTORE_COLLECTIONS.paymentAllocations),
                where('koordinatorId', '==', profile.coordinatorId)
              )
            )
          ).docs.map((d) => ({ id: d.id, ...d.data() }) as PaymentAllocation)
        : [],
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
      payments: (
        await getDocs(
          query(
            collection(db, FIRESTORE_COLLECTIONS.payments),
            where('fadderId', '==', profile.sponsorId)
          )
        )
      ).docs.map((d) => ({ id: d.id, ...d.data() }) as AppDataSnapshot['payments'][number]),
      sponsorAssignments: (
        await getDocs(
          query(
            collection(db, FIRESTORE_COLLECTIONS.sponsorAssignments),
            where('sponsorId', '==', profile.sponsorId)
          )
        )
      ).docs.map((d) => ({ id: d.id, ...d.data() }) as SponsorAssignment),
      recurringCharges: (
        await getDocs(
          query(
            collection(db, FIRESTORE_COLLECTIONS.recurringCharges),
            where('sponsorId', '==', profile.sponsorId)
          )
        )
      ).docs.map((d) => ({ id: d.id, ...d.data() }) as RecurringCharge),
      paymentAllocations: (
        await getDocs(
          query(
            collection(db, FIRESTORE_COLLECTIONS.paymentAllocations),
            where('sponsorId', '==', profile.sponsorId)
          )
        )
      ).docs.map((d) => ({ id: d.id, ...d.data() }) as PaymentAllocation),
      notifications: await loadList(FIRESTORE_COLLECTIONS.notifications),
    };
  }

  return { ...emptyLists, ...publicPart };
}
