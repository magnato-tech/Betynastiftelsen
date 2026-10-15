import { describe, expect, it } from 'vitest';
import { INITIAL_CHILDREN, INITIAL_SPONSORS, INITIAL_REPORTS } from '../data/initialData';
import { INITIAL_COORDINATORS } from '../data/simulationCoordinators';
import { childrenForCoordinator, reportsForCoordinator } from '../utils/coordinatorScope';
import { filterSponsorsLastDays } from '../utils/sponsorMetrics';

/**
 * Sprint 0 — brukerne skal kunne utføre handlingene i docs/WORKFLOWS.md.
 * Kjør: npm test
 */
describe('Sprint 0 testsett (workflows)', () => {
  it('ADM-01: admin ser nye faddere siste 7 dager', () => {
    const last7 = filterSponsorsLastDays(INITIAL_SPONSORS, 7);
    expect(last7.map((s) => s.id)).toEqual(expect.arrayContaining(['sponsor-05', 'sponsor-06']));
    expect(last7.find((s) => s.id === 'sponsor-07')).toBeUndefined();
  });

  it('ADM-02: full fadderliste har kilde admin eller nettside', () => {
    expect(INITIAL_SPONSORS.length).toBeGreaterThanOrEqual(7);
    expect(INITIAL_SPONSORS.every((s) => s.registrertKilde === 'admin' || s.registrertKilde === 'nettside')).toBe(true);
  });

  it('ADM-03: det finnes barn uten fadder som kan kobles', () => {
    const unassigned = INITIAL_CHILDREN.filter((c) => !c.tildeltFadderId && c.status === 'aktiv');
    expect(unassigned.map((c) => c.id)).toEqual(expect.arrayContaining(['child-05']));
    const waitingSponsor = INITIAL_SPONSORS.find((s) => s.id === 'sponsor-05');
    expect(waitingSponsor?.tildeltBarnId).toBe('');
  });

  it('ADM-04: det finnes rapport som venter eller er godkjent for fadder', () => {
    const forEphraim = INITIAL_REPORTS.filter((r) => r.barnId === 'child-01');
    expect(forEphraim.some((r) => r.status === 'godkjent')).toBe(true);
  });

  it('FAD-01: etablert fadder har tildelt barn', () => {
    const kari = INITIAL_SPONSORS.find((s) => s.id === 'sponsor-01');
    const child = INITIAL_CHILDREN.find((c) => c.id === kari?.tildeltBarnId);
    expect(child?.fornavn).toBe('Ephraim');
  });

  it('FAD-02: ny fadder uten barn kan ikke se en tildeling ennå', () => {
    const erik = INITIAL_SPONSORS.find((s) => s.id === 'sponsor-05');
    expect(erik?.tildeltBarnId).toBe('');
  });

  it('KOORD-01: tre koordinatorer ser bare egne barn', () => {
    expect(INITIAL_COORDINATORS).toHaveLength(3);
    expect(childrenForCoordinator(INITIAL_CHILDREN, 'coord-01')).toHaveLength(4);
    expect(childrenForCoordinator(INITIAL_CHILDREN, 'coord-02')).toHaveLength(3);
    expect(childrenForCoordinator(INITIAL_CHILDREN, 'coord-03')).toHaveLength(3);
    const jbIds = childrenForCoordinator(INITIAL_CHILDREN, 'coord-01').map((c) => c.id);
    expect(jbIds).not.toContain('child-05');
  });

  it('KOORD-02: rapport og foto tilhører koordinatorens barn', () => {
    const jbReports = reportsForCoordinator(INITIAL_REPORTS, 'coord-01');
    expect(jbReports.every((r) => r.koordinatorId === 'coord-01')).toBe(true);
    expect(jbReports.map((r) => r.barnId)).toEqual(expect.arrayContaining(['child-01', 'child-02', 'child-03']));
    expect(jbReports.map((r) => r.barnId)).not.toContain('child-05');
    const jonathan = INITIAL_REPORTS.find((r) => r.id === 'rep-04');
    expect(jonathan?.koordinatorId).toBe('coord-02');
    const ephraim = INITIAL_CHILDREN.find((c) => c.id === 'child-01');
    expect(ephraim?.koordinatorId).toBe('coord-01');
    expect(ephraim?.samtykkeFoto).toBe(true);
  });

  it('PUB-01: interesse via nettside skal ikke auto-tildele barn (regel i seed + type)', () => {
    const fromSite = INITIAL_SPONSORS.filter((s) => s.registrertKilde === 'nettside');
    expect(fromSite.some((s) => s.tildeltBarnId === '')).toBe(true);
  });
});
