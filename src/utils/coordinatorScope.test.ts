import { describe, expect, it } from 'vitest';
import type { Child } from '../types';
import {
  childrenForCoordinator,
  migrateChildrenCoordinatorIds,
  sortChildrenForCoordinatorRegister,
} from './coordinatorScope';

const child = (id: string, koordinatorId: string, extra: Partial<Child> = {}): Child => ({
  id,
  internKode: extra.internKode || id,
  fornavn: extra.fornavn || id,
  fodselsaar: extra.fodselsaar ?? 2015,
  kjonn: 'gutt',
  skoleNavn: extra.skoleNavn || 'Test',
  klassetrinn: extra.klassetrinn || '4',
  interesser: [],
  bakgrunnskontekst: '',
  fotoTema: 'skole',
  samtykkeFoto: true,
  samtykkeHistorie: true,
  status: extra.status || 'aktiv',
  behovSammendrag: '',
  opprettetDato: '2026-01-01',
  sistOppdatert: '2026-01-01',
  tildeltFadderId: extra.tildeltFadderId,
  koordinatorId,
});

describe('coordinatorScope', () => {
  it('fills missing koordinatorId from the seed map', () => {
    const list = [child('child-01', ''), child('child-05', 'coord-02')];
    list[0].koordinatorId = undefined as unknown as string;
    const migrated = migrateChildrenCoordinatorIds(list);
    expect(migrated[0].koordinatorId).toBe('coord-01');
    expect(migrated[1].koordinatorId).toBe('coord-02');
  });

  it('childrenForCoordinator returns only matching active children', () => {
    const list = [child('a', 'coord-01'), child('b', 'coord-02'), child('c', 'coord-01')];
    expect(childrenForCoordinator(list, 'coord-01').map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('migrateChildrenCoordinatorIds fills missing ids from seed map', () => {
    const stale = [
      { ...child('child-01', ''), koordinatorId: '' as unknown as string },
      { ...child('child-05', ''), koordinatorId: undefined as unknown as string },
      child('child-02', 'coord-01'),
    ];
    const migrated = migrateChildrenCoordinatorIds(stale);
    expect(migrated.find((c) => c.id === 'child-01')?.koordinatorId).toBe('coord-01');
    expect(migrated.find((c) => c.id === 'child-05')?.koordinatorId).toBe('coord-02');
    expect(migrated.find((c) => c.id === 'child-02')?.koordinatorId).toBe('coord-01');
    expect(childrenForCoordinator(migrated, 'coord-01').map((c) => c.id)).toEqual(['child-01', 'child-02']);
  });

  it('sortChildrenForCoordinatorRegister toggles name and report counts', () => {
    const list = [
      child('a', 'coord-01', { internKode: 'BET-CD-02', fornavn: 'Samuel', fodselsaar: 2017 }),
      child('b', 'coord-01', { internKode: 'BET-CD-01', fornavn: 'Ephraim', fodselsaar: 2016, tildeltFadderId: 'sp-1' }),
    ];
    const counts = { reports: { a: 3, b: 1 }, milestones: { a: 0, b: 2 } };
    const byName = sortChildrenForCoordinatorRegister(list, 'fornavn', 'asc', counts);
    expect(byName.map((c) => c.fornavn)).toEqual(['Ephraim', 'Samuel']);
    const byNameDesc = sortChildrenForCoordinatorRegister(list, 'fornavn', 'desc', counts);
    expect(byNameDesc.map((c) => c.fornavn)).toEqual(['Samuel', 'Ephraim']);
    const byReports = sortChildrenForCoordinatorRegister(list, 'rapporter', 'desc', counts);
    expect(byReports.map((c) => c.id)).toEqual(['a', 'b']);
  });
});
