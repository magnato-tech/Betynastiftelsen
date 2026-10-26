import { describe, expect, it } from 'vitest';
import type { Inquiry, PaymentAllocation, SponsorAssignment } from '../types';
import { makeChild, makeCoordinator, makeFact, makePhoto, makeReport } from '../test/testData';
import {
  activeChildrenOfCoordinator,
  childCoordinatorState,
  childrenNeedingCoordinator,
  planChildMove,
  type ChildMoveSnapshot,
} from './coordinatorAssignment';

const ka = makeCoordinator({ id: 'coord-a' });
const kArkivert = makeCoordinator({ id: 'coord-x', aktiv: false });
const coordinators = [ka, makeCoordinator({ id: 'coord-b' }), kArkivert];

describe('childCoordinatorState', () => {
  it('ok når koordinatoren finnes og er aktiv', () => {
    expect(childCoordinatorState(makeChild({ koordinatorId: 'coord-a' }), coordinators)).toEqual({
      state: 'ok',
      coordinator: ka,
    });
  });

  it('mangler når id er tom eller ukjent', () => {
    expect(childCoordinatorState(makeChild({ koordinatorId: '' }), coordinators).state).toBe('mangler');
    expect(childCoordinatorState(makeChild({ koordinatorId: 'finnes-ikke' }), coordinators)).toEqual({
      state: 'mangler',
    });
  });

  it('arkivert når koordinatoren har aktiv === false, og returnerer koordinatoren', () => {
    expect(childCoordinatorState(makeChild({ koordinatorId: 'coord-x' }), coordinators)).toEqual({
      state: 'arkivert',
      coordinator: kArkivert,
    });
  });
});

describe('childrenNeedingCoordinator', () => {
  it('tar bare aktive elever uten gyldig koordinator', () => {
    const children = [
      makeChild({ id: 'ok', koordinatorId: 'coord-a' }),
      makeChild({ id: 'tom', koordinatorId: '' }),
      makeChild({ id: 'arkivert-k', koordinatorId: 'coord-x' }),
      makeChild({ id: 'avsluttet', koordinatorId: '', status: 'avsluttet' }),
    ];
    expect(childrenNeedingCoordinator(children, coordinators).map((c) => c.id)).toEqual(['tom', 'arkivert-k']);
  });
});

describe('activeChildrenOfCoordinator', () => {
  it('gir kun aktive elever til koordinatoren', () => {
    const children = [
      makeChild({ id: 'c1', koordinatorId: 'coord-a' }),
      makeChild({ id: 'c2', koordinatorId: 'coord-b' }),
      makeChild({ id: 'c3', koordinatorId: 'coord-a', status: 'avsluttet' }),
    ];
    expect(activeChildrenOfCoordinator(children, 'coord-a').map((c) => c.id)).toEqual(['c1']);
  });
});

describe('planChildMove', () => {
  const sponsorAssignment = (over: Partial<SponsorAssignment>): SponsorAssignment => ({
    id: 'sa',
    sponsorId: 's1',
    childId: 'child-a',
    koordinatorId: 'coord-a',
    startDato: '2026-01-01',
    andelOre: 25000,
    ...over,
  });
  const allocation = (over: Partial<PaymentAllocation>): PaymentAllocation => ({
    id: 'pa',
    paymentId: 'p1',
    sponsorId: 's1',
    maal: 'barn',
    childId: 'child-a',
    koordinatorId: 'coord-a',
    periode: '2026-10',
    amountOre: 25000,
    ...over,
  });
  const inquiry = (over: Partial<Inquiry>): Inquiry => ({
    id: 'inq',
    fadderId: 's1',
    fadderNavn: 'Fadder',
    barnId: 'child-a',
    barnNavn: 'Barn A',
    sporsmaal: '?',
    datoSendt: '2026-10-01',
    status: 'besvart',
    ...over,
  });
  const snapshot = (over: Partial<ChildMoveSnapshot> = {}): ChildMoveSnapshot => ({
    children: [
      makeChild({ id: 'child-a', internKode: 'T-01', koordinatorId: 'coord-a' }),
      makeChild({ id: 'child-b', internKode: 'T-02', koordinatorId: 'coord-a' }),
    ],
    reports: [],
    facts: [],
    catalogPhotos: [],
    inquiries: [],
    sponsorAssignments: [],
    paymentAllocations: [],
    ...over,
  });

  it('finner rapporter, fakta, bilder, spørsmål, tildelinger og betalinger for eleven', () => {
    const plan = planChildMove(
      snapshot({
        reports: [makeReport({ id: 'rep-a', barnId: 'child-a' }), makeReport({ id: 'rep-b', barnId: 'child-b' })],
        facts: [makeFact({ id: 'fact-a', barnId: 'child-a' })],
        catalogPhotos: [makePhoto({ id: 'ph-a', barnIds: ['child-a', 'child-b'] })],
        inquiries: [inquiry({ id: 'inq-a', barnId: 'child-a' })],
        sponsorAssignments: [sponsorAssignment({ id: 'sa-a' }), sponsorAssignment({ id: 'sa-b', childId: 'child-b' })],
        paymentAllocations: [allocation({ id: 'pa-a' }), allocation({ id: 'pa-b', maal: 'buffer', childId: undefined })],
      }),
      'child-a',
      'coord-b'
    );
    expect(plan).toEqual({
      childId: 'child-a',
      fromCoordinatorId: 'coord-a',
      toCoordinatorId: 'coord-b',
      reportIds: ['rep-a'],
      factIds: ['fact-a'],
      catalogPhotoIds: ['ph-a'],
      inquiryIds: ['inq-a'],
      sponsorAssignmentIds: ['sa-a'],
      paymentAllocationIds: ['pa-a'],
    });
  });

  it('matcher bilder på internKode, men ikke på fornavn', () => {
    const plan = planChildMove(
      snapshot({
        catalogPhotos: [makePhoto({ id: 'ph-kode', barnIds: ['T-01'] }), makePhoto({ id: 'ph-navn', barnIds: ['Barn A'] })],
      }),
      'child-a',
      'coord-b'
    );
    expect(plan.catalogPhotoIds).toEqual(['ph-kode']);
  });

  it('hopper over poster som allerede peker på målkoordinatoren', () => {
    const plan = planChildMove(
      snapshot({
        reports: [makeReport({ id: 'rep-ny', barnId: 'child-a', koordinatorId: 'coord-b' })],
        sponsorAssignments: [sponsorAssignment({ id: 'sa-ny', koordinatorId: 'coord-b' })],
      }),
      'child-a',
      'coord-b'
    );
    expect(plan.reportIds).toEqual([]);
    expect(plan.sponsorAssignmentIds).toEqual([]);
  });

  it('kaster Error når eleven ikke finnes', () => {
    expect(() => planChildMove(snapshot(), 'finnes-ikke', 'coord-b')).toThrow('Fant ikke eleven.');
  });
});
