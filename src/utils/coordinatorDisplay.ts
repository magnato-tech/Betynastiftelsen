import type { Coordinator } from '../types';

export function coordinatorDisplayName(c: Coordinator): string {
  return `${c.fornavn} ${c.etternavn} (Brazzaville)`;
}
