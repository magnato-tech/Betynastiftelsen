import { describe, expect, it } from 'vitest';
import type { Child } from '../types';
import {
  childrenForCoordinator,
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
  it('childrenForCoordinator returns only matching active children', () => {
    const list = [child('a', 'coord-01'), child('b', 'coord-02'), child('c', 'coord-01')];
    expect(childrenForCoordinator(list, 'coord-01').map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('sortChildrenForCoordinatorRegister toggles name and report counts', () => {
    const list = [
      child('a', 'coord-01', { internKode: 'BET-CD-02', fornavn: 'Zeta', fodselsaar: 2017 }),
      child('b', 'coord-01', { internKode: 'BET-CD-01', fornavn: 'Alfa', fodselsaar: 2016, tildeltFadderId: 'sp-1' }),
    ];
    const counts = { reports: { a: 3, b: 1 }, milestones: { a: 0, b: 2 } };
    const byName = sortChildrenForCoordinatorRegister(list, 'fornavn', 'asc', counts);
    expect(byName.map((c) => c.fornavn)).toEqual(['Alfa', 'Zeta']);
    const byNameDesc = sortChildrenForCoordinatorRegister(list, 'fornavn', 'desc', counts);
    expect(byNameDesc.map((c) => c.fornavn)).toEqual(['Zeta', 'Alfa']);
    const byReports = sortChildrenForCoordinatorRegister(list, 'rapporter', 'desc', counts);
    expect(byReports.map((c) => c.id)).toEqual(['a', 'b']);
  });
});
