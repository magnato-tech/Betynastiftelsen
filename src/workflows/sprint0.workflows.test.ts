import { describe, expect, it } from 'vitest';
import { makeChild, makeCoordinator, makeReport, makeSponsor } from '../test/testData';
import { childrenForCoordinator, reportsForCoordinator } from '../utils/coordinatorScope';
import { filterSponsorsLastDays } from '../utils/sponsorMetrics';

/**
 * Sprint 0 — brukerne skal kunne utføre handlingene i docs/WORKFLOWS.md.
 * Testene bruker egne små testdata (src/test/testData.ts). Kjør: npm test
 */
const NOW = new Date('2026-10-15T12:00:00');

const children = [
  makeChild({ id: 'c1', fornavn: 'Barn 1', koordinatorId: 'coord-a', tildeltFadderId: 's1' }),
  makeChild({ id: 'c2', fornavn: 'Barn 2', koordinatorId: 'coord-a', tildeltFadderId: 's1' }),
  makeChild({ id: 'c3', fornavn: 'Barn 3', koordinatorId: 'coord-b' }),
  makeChild({ id: 'c4', fornavn: 'Barn 4', koordinatorId: 'coord-b', status: 'avsluttet' }),
];
const sponsors = [
  makeSponsor({ id: 's1', startDato: '2026-01-10', tildeltBarnIds: ['c1', 'c2'], registrertKilde: 'admin' }),
  makeSponsor({ id: 's2', startDato: '2026-10-13', tildeltBarnIds: [], registrertKilde: 'nettside' }),
  makeSponsor({ id: 's3', startDato: '2026-10-14', tildeltBarnIds: [], registrertKilde: 'nettside' }),
];
const reports = [
  makeReport({ id: 'r1', barnId: 'c1', koordinatorId: 'coord-a', status: 'godkjent' }),
  makeReport({ id: 'r2', barnId: 'c2', koordinatorId: 'coord-a', status: 'innsendt' }),
  makeReport({ id: 'r3', barnId: 'c3', koordinatorId: 'coord-b', status: 'innsendt' }),
];
const coordinators = [makeCoordinator({ id: 'coord-a' }), makeCoordinator({ id: 'coord-b' })];

describe('Sprint 0 testsett (workflows)', () => {
  it('ADM-01: nye faddere siste 7 dager kan listes', () => {
    const last7 = filterSponsorsLastDays(sponsors, 7, NOW);
    expect(last7.map((s) => s.id)).toEqual(expect.arrayContaining(['s2', 's3']));
    expect(last7.map((s) => s.id)).not.toContain('s1');
  });

  it('ADM-02: fadderliste har kilde admin eller nettside', () => {
    expect(sponsors.every((s) => s.registrertKilde === 'admin' || s.registrertKilde === 'nettside')).toBe(true);
  });

  it('ADM-03: barn uten fadder kan kobles til ventende fadder', () => {
    const unassigned = children.filter((c) => !c.tildeltFadderId && c.status === 'aktiv');
    expect(unassigned.map((c) => c.id)).toEqual(['c3']);
    const waiting = sponsors.find((s) => s.id === 's2');
    expect(waiting?.tildeltBarnIds ?? []).toEqual([]);
  });

  it('ADM-04: rapport kan være godkjent for fadder', () => {
    const forChild = reports.filter((r) => r.barnId === 'c1');
    expect(forChild.some((r) => r.status === 'godkjent')).toBe(true);
  });

  it('FAD-01: etablert fadder har tildelt barn', () => {
    const sponsor = sponsors.find((s) => s.id === 's1');
    expect(sponsor?.tildeltBarnIds).toEqual(['c1', 'c2']);
    const first = children.find((c) => c.id === sponsor?.tildeltBarnIds[0]);
    expect(first?.fornavn).toBe('Barn 1');
  });

  it('FAD-02: ny fadder uten barn har ingen tildeling ennå', () => {
    expect(sponsors.find((s) => s.id === 's3')?.tildeltBarnIds ?? []).toEqual([]);
  });

  it('KOORD-01: koordinatorer ser bare egne aktive barn', () => {
    expect(coordinators).toHaveLength(2);
    expect(childrenForCoordinator(children, 'coord-a').map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(childrenForCoordinator(children, 'coord-b').map((c) => c.id)).toEqual(['c3']);
  });

  it('KOORD-02: rapport tilhører koordinatorens barn', () => {
    const own = reportsForCoordinator(reports, 'coord-a');
    expect(own.every((r) => r.koordinatorId === 'coord-a')).toBe(true);
    expect(own.map((r) => r.barnId)).toEqual(['c1', 'c2']);
    expect(own.map((r) => r.barnId)).not.toContain('c3');
  });

  it('PUB-01: interesse via nettside tildeler ikke barn automatisk', () => {
    const fromSite = sponsors.filter((s) => s.registrertKilde === 'nettside');
    expect(fromSite.length).toBeGreaterThan(0);
    expect(fromSite.every((s) => s.tildeltBarnIds.length === 0)).toBe(true);
  });
});
