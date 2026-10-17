import type { UserDirectoryStatus } from './firestoreProfile';

export function normalizeUserDirectoryStatus(
  raw: UserDirectoryStatus | undefined | null
): UserDirectoryStatus {
  if (raw === 'invitert' || raw === 'sperret' || raw === 'aktiv') return raw;
  return 'aktiv';
}

export function canLoginWithDirectoryStatus(status: UserDirectoryStatus): boolean {
  return status === 'aktiv' || status === 'invitert';
}
