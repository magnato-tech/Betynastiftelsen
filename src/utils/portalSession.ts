import type { FirestoreUser } from '../db/firestoreProfile';
import type { UserRole } from '../types';

/** Første fane i portalen etter innlogging eller oppfrisking. */
export function defaultPortalSection(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'godkjenning';
    case 'coordinator':
      return 'eleves';
    case 'sponsor':
      return 'barn';
    default:
      return 'home';
  }
}

export function defaultPortalSectionForProfile(profile: FirestoreUser): string {
  return defaultPortalSection(profile.role);
}
