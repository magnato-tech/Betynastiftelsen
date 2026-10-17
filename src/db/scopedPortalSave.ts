import type { AppDataSnapshot } from './firestoreData';
import type { DbChange } from './firestoreData';
import { CMS_PUBLIC_DOC_ID, FIRESTORE_COLLECTIONS, SETTINGS_EMAIL_DOC_ID, type FirestoreUser } from './firestoreProfile';
import { baselineOf, planCollectionSync, type Baseline } from './syncEngine';
import type { CatalogPhoto, Child, FieldFact, Inquiry, Report } from '../types';
import type { ChildMilestone } from '../types';

type ListKey =
  | 'coordinators'
  | 'children'
  | 'sponsors'
  | 'catalogPhotos'
  | 'facts'
  | 'reports'
  | 'milestones'
  | 'inquiries'
  | 'payments'
  | 'campaigns'
  | 'testimonials'
  | 'notifications'
  | 'auditLogs'
  | 'emailOutbox';

const SYNCED_LISTS: { key: ListKey; collection: string }[] = [
  { key: 'coordinators', collection: FIRESTORE_COLLECTIONS.coordinators },
  { key: 'children', collection: FIRESTORE_COLLECTIONS.children },
  { key: 'sponsors', collection: FIRESTORE_COLLECTIONS.sponsors },
  { key: 'catalogPhotos', collection: FIRESTORE_COLLECTIONS.catalogPhotos },
  { key: 'facts', collection: FIRESTORE_COLLECTIONS.facts },
  { key: 'reports', collection: FIRESTORE_COLLECTIONS.reports },
  { key: 'milestones', collection: FIRESTORE_COLLECTIONS.milestones },
  { key: 'inquiries', collection: FIRESTORE_COLLECTIONS.inquiries },
  { key: 'payments', collection: FIRESTORE_COLLECTIONS.payments },
  { key: 'campaigns', collection: FIRESTORE_COLLECTIONS.campaigns },
  { key: 'testimonials', collection: FIRESTORE_COLLECTIONS.testimonials },
  { key: 'notifications', collection: FIRESTORE_COLLECTIONS.notifications },
  { key: 'auditLogs', collection: FIRESTORE_COLLECTIONS.auditLogs },
  { key: 'emailOutbox', collection: FIRESTORE_COLLECTIONS.emailOutbox },
];

const COORDINATOR_KEYS = new Set<ListKey>([
  'children',
  'facts',
  'reports',
  'milestones',
  'catalogPhotos',
  'inquiries',
]);

function coordinatorChildIds(snapshot: AppDataSnapshot, coordinatorId: string): Set<string> {
  return new Set(
    (snapshot.children ?? [])
      .filter((c) => c.koordinatorId === coordinatorId)
      .map((c) => c.id)
  );
}

function coordinatorMayWrite(
  key: ListKey,
  item: { id: string },
  coordinatorId: string,
  childIds: Set<string>
): boolean {
  switch (key) {
    case 'children':
      return (item as Child).koordinatorId === coordinatorId;
    case 'facts':
      return (item as FieldFact).koordinatorId === coordinatorId;
    case 'reports':
      return (item as Report).koordinatorId === coordinatorId;
    case 'catalogPhotos':
      return (item as CatalogPhoto).koordinatorId === coordinatorId;
    case 'milestones':
      return childIds.has((item as ChildMilestone).barnId);
    case 'inquiries': {
      const inq = item as Inquiry;
      if (inq.koordinatorId === coordinatorId) return true;
      return childIds.has(inq.barnId);
    }
    default:
      return false;
  }
}

function sponsorMayWrite(item: Inquiry, sponsorId: string): boolean {
  return item.fadderId === sponsorId;
}

export interface ScopedPlanResult {
  changes: DbChange[];
  commit: () => void;
}

/** Rollefiltrert lagring uten sletting og uten CMS/e-postinnstillinger. */
export function planScopedPortalChanges(
  profile: FirestoreUser,
  listBaselines: Partial<Record<ListKey, Baseline>>,
  snapshot: AppDataSnapshot
): ScopedPlanResult {
  const changes: DbChange[] = [];
  const nextLists: Partial<Record<ListKey, Baseline>> = { ...listBaselines };

  if (profile.role === 'coordinator' && profile.coordinatorId) {
    const coordinatorId = profile.coordinatorId;
    const childIds = coordinatorChildIds(snapshot, coordinatorId);

    for (const { key, collection } of SYNCED_LISTS) {
      if (!COORDINATOR_KEYS.has(key)) continue;
      const baseline = listBaselines[key] ?? new Map();
      const items = (snapshot[key] ?? []) as { id: string }[];
      const plan = planCollectionSync(baseline, items);
      plan.deletes = [];
      const ownedSets = plan.sets.filter((item) => coordinatorMayWrite(key, item, coordinatorId, childIds));
      nextLists[key] = baselineOf(items);
      for (const item of ownedSets) {
        changes.push({ kind: 'set', collection, id: item.id, data: item });
      }
    }
  } else if (profile.role === 'sponsor' && profile.sponsorId) {
    const sponsorId = profile.sponsorId;
    const baseline = listBaselines.inquiries ?? new Map();
    const items = (snapshot.inquiries ?? []) as Inquiry[];
    const plan = planCollectionSync(baseline, items);
    plan.deletes = [];
    const ownedSets = plan.sets.filter((item) => sponsorMayWrite(item, sponsorId));
    nextLists.inquiries = baselineOf(items);
    for (const item of ownedSets) {
      changes.push({
        kind: 'set',
        collection: FIRESTORE_COLLECTIONS.inquiries,
        id: item.id,
        data: item,
      });
    }
  }

  const commit = () => {
    Object.assign(listBaselines, nextLists);
  };

  return { changes, commit };
}

export function assertNoAdminOnlyWrites(changes: DbChange[]): void {
  for (const ch of changes) {
    if (ch.collection === FIRESTORE_COLLECTIONS.cms && ch.id === CMS_PUBLIC_DOC_ID) {
      throw new Error('Portalbruker kan ikke lagre CMS');
    }
    if (ch.collection === FIRESTORE_COLLECTIONS.settings && ch.id === SETTINGS_EMAIL_DOC_ID) {
      throw new Error('Portalbruker kan ikke lagre e-postinnstillinger');
    }
    if (ch.kind === 'delete') {
      throw new Error('Portalbruker kan ikke slette dokumenter');
    }
  }
}
