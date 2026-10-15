import { describe, expect, it } from 'vitest';
import { makeChild, makeSponsor } from '../test/testData';
import {
  addChildId,
  childIdsOfSponsor,
  childrenOfSponsor,
  migrateSponsorsChildIds,
  removeChildId,
} from './sponsorChildren';

describe('sponsorChildren', () => {
  it('reads legacy tildeltBarnId as a one-item list', () => {
    expect(childIdsOfSponsor({ tildeltBarnId: 'child-a' })).toEqual(['child-a']);
    expect(childIdsOfSponsor({ tildeltBarnIds: [] })).toEqual([]);
  });

  it('lets one sponsor keep several children', () => {
    const children = [
      makeChild({ id: 'child-a', fornavn: 'Barn A' }),
      makeChild({ id: 'child-b', fornavn: 'Barn B' }),
      makeChild({ id: 'child-c', fornavn: 'Barn C' }),
    ];
    const ids = addChildId(addChildId([], 'child-a'), 'child-b');
    expect(ids).toEqual(['child-a', 'child-b']);
    const [sponsor] = migrateSponsorsChildIds([makeSponsor({ tildeltBarnIds: ids })]);
    expect(childrenOfSponsor(children, sponsor).map((c) => c.fornavn)).toEqual(
      expect.arrayContaining(['Barn A', 'Barn B'])
    );
    expect(childrenOfSponsor(children, sponsor).map((c) => c.fornavn)).not.toContain('Barn C');
    expect(removeChildId(ids, 'child-a')).toEqual(['child-b']);
  });
});
