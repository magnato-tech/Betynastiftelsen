/**
 * Firestore-profil for Betyna.
 * Dokument-ID = samme id som i TypeScript (child-01, sponsor-01, …).
 * Feltnavn er 1:1 med src/types — ingen omdøping ved import.
 *
 * Bilder: lagre Storage-sti (children/{id}/photo.jpg), ikke data-URL.
 */
export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  /** Invitasjon før første innlogging — dokument-ID = e-post (lowercase). */
  userDirectory: 'userDirectory',
  coordinators: 'coordinators',
  children: 'children',
  sponsors: 'sponsors',
  facts: 'facts',
  reports: 'reports',
  milestones: 'milestones',
  inquiries: 'inquiries',
  payments: 'payments',
  campaigns: 'campaigns',
  testimonials: 'testimonials',
  notifications: 'notifications',
  auditLogs: 'auditLogs',
  cms: 'cms',
  newsletterLogs: 'newsletterLogs',
  emailOutbox: 'emailOutbox',
  catalogPhotos: 'catalogPhotos',
  mediaLibrary: 'mediaLibrary',
  settings: 'settings',
  system: 'system',
} as const;

/** Relasjoner (fremmednøkler). Firestore har ikke JOIN — appen slår opp via id. */
export const FIRESTORE_RELATIONS = [
  { from: 'users', field: 'coordinatorId', to: 'coordinators', card: 'n:1' as const },
  { from: 'users', field: 'sponsorId', to: 'sponsors', card: 'n:1' as const },
  { from: 'children', field: 'koordinatorId', to: 'coordinators', card: 'n:1' as const },
  { from: 'children', field: 'tildeltFadderId', to: 'sponsors', card: 'n:1' as const },
  { from: 'sponsors', field: 'tildeltBarnIds[]', to: 'children', card: '1:n' as const },
  { from: 'facts', field: 'barnId', to: 'children', card: 'n:1' as const },
  { from: 'facts', field: 'koordinatorId', to: 'coordinators', card: 'n:1' as const },
  { from: 'reports', field: 'barnId', to: 'children', card: 'n:1' as const },
  { from: 'reports', field: 'koordinatorId', to: 'coordinators', card: 'n:1' as const },
  { from: 'milestones', field: 'barnId', to: 'children', card: 'n:1' as const },
  { from: 'inquiries', field: 'fadderId', to: 'sponsors', card: 'n:1' as const },
  { from: 'inquiries', field: 'barnId', to: 'children', card: 'n:1' as const },
  { from: 'inquiries', field: 'koordinatorId', to: 'coordinators', card: 'n:1' as const },
  { from: 'payments', field: 'fadderId', to: 'sponsors', card: 'n:1' as const },
  { from: 'payments', field: 'aksjonId', to: 'campaigns', card: 'n:1' as const },
  { from: 'campaigns', field: 'barnIds[]', to: 'children', card: 'n:n' as const },
  { from: 'catalogPhotos', field: 'barnIds[]', to: 'children', card: 'n:n' as const },
  { from: 'catalogPhotos', field: 'koordinatorId', to: 'coordinators', card: 'n:1' as const },
] as const;

export const SETTINGS_EMAIL_DOC_ID = 'emailAutoSend';
export const SYSTEM_SEED_LOCK_DOC_ID = 'seedLock';

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];

/** Én CMS-dokument-ID for offentlig side. */
export const CMS_PUBLIC_DOC_ID = 'public';

export interface FirestoreUser {
  id: string;
  role: 'admin' | 'coordinator' | 'sponsor';
  email: string;
  displayName: string;
  coordinatorId?: string;
  sponsorId?: string;
  createdAt: string;
}

export type UserDirectoryStatus = 'aktiv' | 'invitert' | 'sperret';

/** Admin legger inn brukere her; ved Google-innlogging kopieres til `users/{authUid}`. */
export interface FirestoreUserDirectoryEntry {
  email: string;
  role: 'admin' | 'coordinator' | 'sponsor';
  /** Mangler felt = behandles som `aktiv` i appen. */
  status?: UserDirectoryStatus;
  displayName?: string;
  coordinatorId?: string;
  sponsorId?: string;
}

export const FIRESTORE_INDEXES: {
  collection: FirestoreCollectionName;
  fields: string[];
}[] = [
  { collection: 'children', fields: ['koordinatorId', 'status'] },
  { collection: 'children', fields: ['tildeltFadderId'] },
  { collection: 'sponsors', fields: ['startDato'] },
  { collection: 'sponsors', fields: ['tildeltBarnIds'] },
  { collection: 'facts', fields: ['status', 'dato'] },
  { collection: 'facts', fields: ['koordinatorId', 'dato'] },
  { collection: 'facts', fields: ['barnId'] },
  { collection: 'reports', fields: ['status', 'dato'] },
  { collection: 'reports', fields: ['koordinatorId', 'dato'] },
  { collection: 'reports', fields: ['barnId', 'status'] },
  { collection: 'milestones', fields: ['barnId', 'dato'] },
  { collection: 'inquiries', fields: ['fadderId', 'datoSendt'] },
  { collection: 'inquiries', fields: ['koordinatorId', 'status'] },
  { collection: 'inquiries', fields: ['status'] },
  { collection: 'payments', fields: ['fadderId', 'dato'] },
  { collection: 'notifications', fields: ['targetRole', 'recipientId'] },
  { collection: 'campaigns', fields: ['status'] },
  { collection: 'catalogPhotos', fields: ['koordinatorId', 'dato'] },
];

/** Rekkefølge ved første import (foreldre før barn). */
export const FIRESTORE_IMPORT_ORDER: FirestoreCollectionName[] = [
  FIRESTORE_COLLECTIONS.coordinators,
  FIRESTORE_COLLECTIONS.sponsors,
  FIRESTORE_COLLECTIONS.children,
  FIRESTORE_COLLECTIONS.catalogPhotos,
  FIRESTORE_COLLECTIONS.facts,
  FIRESTORE_COLLECTIONS.reports,
  FIRESTORE_COLLECTIONS.milestones,
  FIRESTORE_COLLECTIONS.inquiries,
  FIRESTORE_COLLECTIONS.payments,
  FIRESTORE_COLLECTIONS.campaigns,
  FIRESTORE_COLLECTIONS.testimonials,
  FIRESTORE_COLLECTIONS.notifications,
  FIRESTORE_COLLECTIONS.auditLogs,
  FIRESTORE_COLLECTIONS.cms,
  FIRESTORE_COLLECTIONS.newsletterLogs,
  FIRESTORE_COLLECTIONS.emailOutbox,
  FIRESTORE_COLLECTIONS.settings,
];
