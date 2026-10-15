import { describe, expect, it } from 'vitest';
import { INITIAL_CHILDREN } from '../data/initialData';
import {
  addChildId,
  childIdsOfSponsor,
  childrenOfSponsor,
  migrateSponsorsChildIds,
  removeChildId,
} from './sponsorChildren';

describe('sponsorChildren', () => {
  it('reads legacy tildeltBarnId as a one-item list', () => {
    expect(childIdsOfSponsor({ tildeltBarnId: 'child-01' })).toEqual(['child-01']);
    expect(childIdsOfSponsor({ tildeltBarnIds: [] })).toEqual([]);
  });

  it('lets one sponsor keep several children', () => {
    const ids = addChildId(addChildId([], 'child-01'), 'child-06');
    expect(ids).toEqual(['child-01', 'child-06']);
    const [kari] = migrateSponsorsChildIds([
      {
        id: 'sponsor-01',
        navn: 'Kari',
        epost: 'k@test.no',
        telefon: '',
        poststed: 'Bergen',
        maanedsbelop: 350,
        betalingsmetode: 'vipps',
        betalingsstatus: 'aktiv',
        startDato: '2025-01-01',
        tildeltBarnIds: ids,
      },
    ]);
    expect(childrenOfSponsor(INITIAL_CHILDREN, kari).map((c) => c.fornavn)).toEqual(
      expect.arrayContaining(['Ephraim', 'Grace'])
    );
    expect(removeChildId(ids, 'child-01')).toEqual(['child-06']);
  });
});
