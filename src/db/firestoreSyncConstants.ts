import { FIRESTORE_COLLECTIONS } from './firestoreProfile';

export type ListKey =
  | 'coordinators'
  | 'children'
  | 'sponsors'
  | 'catalogPhotos'
  | 'mediaLibrary'
  | 'facts'
  | 'reports'
  | 'milestones'
  | 'inquiries'
  | 'payments'
  | 'sponsorAssignments'
  | 'campaigns'
  | 'testimonials'
  | 'notifications'
  | 'auditLogs'
  | 'emailOutbox';

/** Alle lister som lagres automatisk: navn i appen, samling i databasen. */
export const SYNCED_LISTS: { key: ListKey; collection: string }[] = [
  { key: 'coordinators', collection: FIRESTORE_COLLECTIONS.coordinators },
  { key: 'children', collection: FIRESTORE_COLLECTIONS.children },
  { key: 'sponsors', collection: FIRESTORE_COLLECTIONS.sponsors },
  { key: 'catalogPhotos', collection: FIRESTORE_COLLECTIONS.catalogPhotos },
  { key: 'mediaLibrary', collection: FIRESTORE_COLLECTIONS.mediaLibrary },
  { key: 'facts', collection: FIRESTORE_COLLECTIONS.facts },
  { key: 'reports', collection: FIRESTORE_COLLECTIONS.reports },
  { key: 'milestones', collection: FIRESTORE_COLLECTIONS.milestones },
  { key: 'inquiries', collection: FIRESTORE_COLLECTIONS.inquiries },
  { key: 'payments', collection: FIRESTORE_COLLECTIONS.payments },
  { key: 'sponsorAssignments', collection: FIRESTORE_COLLECTIONS.sponsorAssignments },
  { key: 'campaigns', collection: FIRESTORE_COLLECTIONS.campaigns },
  { key: 'testimonials', collection: FIRESTORE_COLLECTIONS.testimonials },
  { key: 'notifications', collection: FIRESTORE_COLLECTIONS.notifications },
  { key: 'auditLogs', collection: FIRESTORE_COLLECTIONS.auditLogs },
  { key: 'emailOutbox', collection: FIRESTORE_COLLECTIONS.emailOutbox },
];

export const SAVE_DELAY_MS = 600;
export const RETRY_DELAY_MS = 8000;
export const EMAIL_FOR_SIGN_IN_KEY = 'betyna_email_for_sign_in';

export function formatSaveError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code.includes('permission-denied')) {
    return 'Ingen tilgang til å lagre. Logg inn som administrator og prøv igjen.';
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'Ingen kontakt med databasen. Endringene lagres så snart nettet er tilbake.';
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Kunne ikke lagre. Prøver igjen.';
}

export class SuspiciousWipeError extends Error {}
