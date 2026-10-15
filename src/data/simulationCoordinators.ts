import type { Coordinator } from '../types';

export const INITIAL_COORDINATORS: Coordinator[] = [
  {
    id: 'coord-01',
    fornavn: 'Jean-Baptiste',
    etternavn: 'Mukeba',
    epost: 'jb.mukeba@betyna.test',
    telefon: '+242 06 12 34 01',
    distrikt: 'Brazzaville — Masina & Poto-Poto',
    aktiv: true,
  },
  {
    id: 'coord-02',
    fornavn: 'Dieudonné',
    etternavn: 'Nkouka',
    epost: 'd.nkouka@betyna.test',
    telefon: '+242 06 12 34 02',
    distrikt: 'Brazzaville — Bacongo & Moungali',
    aktiv: true,
  },
  {
    id: 'coord-03',
    fornavn: 'Brigitte',
    etternavn: 'Mabiala',
    epost: 'b.mabiala@betyna.test',
    telefon: '+242 06 12 34 03',
    distrikt: 'Brazzaville — Talangaï & Mfilou',
    aktiv: true,
  },
];

export function coordinatorDisplayName(c: Coordinator): string {
  return `${c.fornavn} ${c.etternavn} (Brazzaville)`;
}

export const CHILD_COORDINATOR_MAP: Record<string, string> = {
  'child-01': 'coord-01',
  'child-02': 'coord-01',
  'child-03': 'coord-01',
  'child-04': 'coord-01',
  'child-05': 'coord-02',
  'child-06': 'coord-02',
  'child-07': 'coord-02',
  'child-08': 'coord-03',
  'child-09': 'coord-03',
  'child-10': 'coord-03',
};
