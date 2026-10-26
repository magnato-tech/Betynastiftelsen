import { describe, expect, it } from 'vitest';
import type { AppDataSnapshot } from '../db/appDataSnapshot';
import type { Child, Coordinator, Inquiry, PaymentRecord, Report, Sponsor } from '../types';
import { findBrokenLinks, linksToCoordinator, linksToSponsor } from './dataIntegrity';

const koordinator = (id: string): Coordinator =>
  ({ id, fornavn: id, etternavn: 'Test', epost: '', telefon: '', distrikt: '', aktiv: true }) as Coordinator;

const barn = (id: string, extra: Partial<Child> = {}): Child =>
  ({
    id,
    internKode: id,
    fornavn: id,
    status: 'aktiv',
    koordinatorId: 'k1',
    tildeltFadderId: undefined,
    ...extra,
  }) as Child;

const fadder = (id: string, extra: Partial<Sponsor> = {}): Sponsor =>
  ({ id, navn: id, tildeltBarnIds: [], ...extra }) as Sponsor;

const rapport = (id: string, extra: Partial<Report> = {}): Report =>
  ({ id, barnId: 'b1', koordinatorId: 'k1', ...extra }) as Report;

const betaling = (id: string, fadderId?: string): PaymentRecord =>
  ({ id, fadderId, fadderNavn: 'x', belop: 100, dato: '2026-01-01', type: 'fadderbidrag', metode: 'vipps', status: 'fullfort', referanse: '' }) as PaymentRecord;

const henvendelse = (id: string, extra: Partial<Inquiry> = {}): Inquiry =>
  ({ id, fadderId: '', barnId: '', ...extra }) as Inquiry;

/** Ren, konsistent datasett: alle lenker peker på eksisterende poster. */
function rentDatasett(): Partial<AppDataSnapshot> {
  return {
    coordinators: [koordinator('k1')],
    children: [barn('b1', { koordinatorId: 'k1', tildeltFadderId: 's1' })],
    sponsors: [fadder('s1', { tildeltBarnIds: ['b1'] })],
    reports: [rapport('r1', { barnId: 'b1', koordinatorId: 'k1' })],
    payments: [betaling('p1', 's1')],
  };
}

describe('findBrokenLinks', () => {
  it('gir tom liste for et rent datasett', () => {
    expect(findBrokenLinks(rentDatasett())).toEqual([]);
  });

  it('rapporterer barn som peker på manglende fadder og rapport som peker på manglende barn', () => {
    const data = rentDatasett();
    data.children = [barn('b1', { koordinatorId: 'k1', tildeltFadderId: 'finnes-ikke' })];
    data.reports = [rapport('r1', { barnId: 'mangler', koordinatorId: 'k1' })];

    const issues = findBrokenLinks(data);

    expect(issues).toContainEqual({
      collection: 'children',
      id: 'b1',
      field: 'tildeltFadderId',
      missingId: 'finnes-ikke',
      pointsTo: 'sponsors',
    });
    expect(issues).toContainEqual({
      collection: 'reports',
      id: 'r1',
      field: 'barnId',
      missingId: 'mangler',
      pointsTo: 'children',
    });
    expect(issues).toHaveLength(2);
  });

  it('ignorerer tomme og udefinerte lenkefelt', () => {
    const data = rentDatasett();
    data.children = [barn('b1', { koordinatorId: 'k1', tildeltFadderId: undefined })];
    data.inquiries = [henvendelse('h1', { fadderId: '', barnId: 'b1', koordinatorId: undefined })];
    data.sponsors = [fadder('s1', { tildeltBarnIds: ['', 'b1'] })];

    expect(findBrokenLinks(data)).toEqual([]);
  });

  it('sjekker id-lister (tildeltBarnIds) mot barn', () => {
    const data = rentDatasett();
    data.sponsors = [fadder('s1', { tildeltBarnIds: ['b1', 'borte'] })];

    expect(findBrokenLinks(data)).toEqual([
      {
        collection: 'sponsors',
        id: 's1',
        field: 'tildeltBarnIds',
        missingId: 'borte',
        pointsTo: 'children',
      },
    ]);
  });
});

describe('linksToCoordinator', () => {
  it('teller barn og rapporter for en koordinator', () => {
    const data = rentDatasett();
    data.children = [barn('b1', { koordinatorId: 'k1' }), barn('b2', { koordinatorId: 'k1' })];
    data.reports = [rapport('r1', { koordinatorId: 'k1' })];

    expect(linksToCoordinator(data, 'k1')).toEqual([
      { collection: 'children', count: 2 },
      { collection: 'reports', count: 1 },
    ]);
  });

  it('returnerer tom liste for en koordinator uten lenker', () => {
    expect(linksToCoordinator(rentDatasett(), 'ukoblet')).toEqual([]);
  });
});

describe('linksToSponsor', () => {
  it('teller aktive barn og betalinger', () => {
    const data = rentDatasett();
    data.children = [
      barn('b1', { tildeltFadderId: 's1', status: 'aktiv' }),
      barn('b2', { tildeltFadderId: 's1', status: 'utkast' }),
    ];
    data.payments = [betaling('p1', 's1'), betaling('p2', 's1'), betaling('p3')];

    expect(linksToSponsor(data, 's1')).toEqual([
      { collection: 'children', count: 2 },
      { collection: 'payments', count: 2 },
    ]);
  });

  it('teller ikke avsluttede barn, og gir tom liste når fadderen kun har slike og ingen betalinger', () => {
    const data = rentDatasett();
    data.children = [barn('b1', { tildeltFadderId: 's1', status: 'avsluttet' })];
    data.payments = [];

    expect(linksToSponsor(data, 's1')).toEqual([]);
  });
});
