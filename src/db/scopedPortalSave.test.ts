import { describe, expect, it } from 'vitest';
import { baselineOf } from './syncEngine';
import { planScopedPortalChanges } from './scopedPortalSave';
import type { AppDataSnapshot } from './firestoreData';
import { FIRESTORE_COLLECTIONS } from './firestoreProfile';

describe('planScopedPortalChanges', () => {
  const coordinatorProfile = {
    id: 'uid-c',
    role: 'coordinator' as const,
    email: 'coord@test.no',
    displayName: 'C',
    coordinatorId: 'coord-1',
    createdAt: '',
  };

  it('koordinator skriver bare egne barn og sender ikke sletting', () => {
    const snapshot: AppDataSnapshot = {
      children: [
        {
          id: 'child-1',
          internKode: 'A',
          fornavn: 'A',
          fodselsaar: 2010,
          kjonn: 'gutt',
          skoleNavn: 'S',
          klassetrinn: '5',
          interesser: [],
          bakgrunnskontekst: '',
          fotoTema: 'skole',
          samtykkeFoto: true,
          samtykkeHistorie: true,
          status: 'utkast',
          behovSammendrag: '',
          opprettetDato: '2026-01-01',
          sistOppdatert: '2026-01-02',
          koordinatorId: 'coord-1',
        },
        {
          id: 'child-2',
          internKode: 'B',
          fornavn: 'B',
          fodselsaar: 2010,
          kjonn: 'jente',
          skoleNavn: 'S',
          klassetrinn: '5',
          interesser: [],
          bakgrunnskontekst: '',
          fotoTema: 'skole',
          samtykkeFoto: true,
          samtykkeHistorie: true,
          status: 'utkast',
          behovSammendrag: '',
          opprettetDato: '2026-01-01',
          sistOppdatert: '2026-01-01',
          koordinatorId: 'coord-2',
        },
      ],
    };
    const baselines = {
      children: baselineOf([]),
    };
    const { changes } = planScopedPortalChanges(coordinatorProfile, baselines, snapshot);
    expect(changes.every((c) => c.kind === 'set')).toBe(true);
    expect(changes.some((c) => c.id === 'child-1')).toBe(true);
    expect(changes.some((c) => c.id === 'child-2')).toBe(false);
  });

  it('fadder oppretter bare egne spørsmål', () => {
    const sponsorProfile = {
      id: 'uid-s',
      role: 'sponsor' as const,
      email: 'fad@test.no',
      displayName: 'F',
      sponsorId: 'sponsor-9',
      createdAt: '',
    };
    const snapshot: AppDataSnapshot = {
      inquiries: [
        {
          id: 'inq-1',
          fadderId: 'sponsor-9',
          fadderNavn: 'F',
          barnId: 'child-1',
          barnNavn: 'A',
          sporsmaal: 'Hei',
          datoSendt: '2026-01-01',
          status: 'mottatt',
        },
        {
          id: 'inq-2',
          fadderId: 'sponsor-other',
          fadderNavn: 'X',
          barnId: 'child-2',
          barnNavn: 'B',
          sporsmaal: 'Hei',
          datoSendt: '2026-01-01',
          status: 'mottatt',
        },
      ],
    };
    const baselines = { inquiries: new Map() };
    const { changes } = planScopedPortalChanges(sponsorProfile, baselines, snapshot);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      kind: 'set',
      collection: FIRESTORE_COLLECTIONS.inquiries,
      id: 'inq-1',
    });
  });
});
