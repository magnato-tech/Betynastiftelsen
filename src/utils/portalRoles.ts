import type { UserRole } from '../types';
import type { FirestoreUser } from '../db/firestoreProfile';

/** Hvilke portaler brukeren kan åpne etter innlogging (ikke visningsmodus for anonyme). */
export function portalRolesForProfile(profile: FirestoreUser | null | undefined): UserRole[] {
  if (!profile) return ['public'];
  switch (profile.role) {
    case 'admin':
      return ['public', 'sponsor', 'coordinator', 'admin'];
    case 'coordinator':
      return ['coordinator', 'public'];
    case 'sponsor':
      return ['sponsor', 'public'];
    default:
      return ['public'];
  }
}

export function canOpenPortalRole(
  profile: FirestoreUser | null | undefined,
  target: UserRole
): boolean {
  return portalRolesForProfile(profile).includes(target);
}

export function isAdminProfile(profile: FirestoreUser | null | undefined): boolean {
  return profile?.role === 'admin';
}
