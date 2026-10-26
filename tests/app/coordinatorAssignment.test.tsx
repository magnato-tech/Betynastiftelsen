// @vitest-environment jsdom
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Inquiry, PaymentAllocation, SponsorAssignment } from '../../src/types';
import { logForPerson } from '../../src/utils/personLog';
import { makeChild, makeCoordinator, makeFact, makePhoto, makeReport, makeSponsor } from '../../src/test/testData';
import { canAssignSponsor } from '../../src/utils/coordinatorAssignment';
import { mountApp, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

const ka = { type: 'coordinator' as const, id: 'coord-a', navn: 'Koordinator A' };
const kb = { type: 'coordinator' as const, id: 'coord-b', navn: 'Kari B' };

const koordinatorer = () => [
  makeCoordinator({ id: 'coord-a' }),
  makeCoordinator({ id: 'coord-b', fornavn: 'Kari', etternavn: 'B' }),
  makeCoordinator({ id: 'coord-x', aktiv: false }),
];

const inquiry: Inquiry = {
  id: 'inq-a',
  fadderId: 's1',
  fadderNavn: 'Fadder',
  barnId: 'child-a',
  barnNavn: 'Barn A',
  sporsmaal: 'Hvordan går det?',
  datoSendt: '2026-10-01',
  status: 'besvart',
  koordinatorId: 'coord-a',
};

const assignment: SponsorAssignment = {
  id: 'sa-a',
  sponsorId: 's1',
  childId: 'child-a',
  koordinatorId: 'coord-a',
  startDato: '2026-01-01',
  andelOre: 25000,
};

const allocation: PaymentAllocation = {
  id: 'pa-a',
  paymentId: 'p1',
  sponsorId: 's1',
  maal: 'barn',
  childId: 'child-a',
  koordinatorId: 'coord-a',
  periode: '2026-10',
  amountOre: 25000,
};

/** Elev child-a med rapport, fakta, bilde, spørsmål, tildeling og betaling; child-b er en annen elev hos samme koordinator. */
const medHistorikk = (extra: Record<string, unknown> = {}) =>
  mountApp({
    coordinators: koordinatorer(),
    children: [
      makeChild({ id: 'child-a', internKode: 'T-01', koordinatorId: 'coord-a' }),
      makeChild({ id: 'child-b', internKode: 'T-02', fornavn: 'Barn B', koordinatorId: 'coord-a' }),
    ],
    reports: [makeReport({ id: 'rep-a', barnId: 'child-a', koordinatorId: 'coord-a' })],
    facts: [makeFact({ id: 'fact-a', barnId: 'child-a', koordinatorId: 'coord-a' })],
    catalogPhotos: [makePhoto({ id: 'ph-a', barnIds: ['child-a'], koordinatorId: 'coord-a' })],
    inquiries: [inquiry],
    sponsorAssignments: [assignment],
    paymentAllocations: [allocation],
    ...extra,
  });

describe('flytting av elev mellom koordinatorer', () => {
  it('reassignChildCoordinator flytter eleven og alle poster som følger eleven', () => {
    const m = medHistorikk();
    m.run((a) => a.reassignChildCoordinator('child-a', 'coord-b'));

    expect(m.app.childrenList.find((c) => c.id === 'child-a')).toMatchObject({ koordinatorId: 'coord-b' });
    expect(m.app.childrenList.find((c) => c.id === 'child-b')).toMatchObject({ koordinatorId: 'coord-a' });
    expect(m.app.reports[0]).toMatchObject({ koordinatorId: 'coord-b', koordinatorNavn: 'Kari B' });
    expect(m.app.fieldFacts[0].koordinatorId).toBe('coord-b');
    expect(m.app.catalogPhotos[0].koordinatorId).toBe('coord-b');
    expect(m.app.inquiries[0].koordinatorId).toBe('coord-b');
    expect(m.app.sponsorAssignments[0].koordinatorId).toBe('coord-b');
    expect(m.app.paymentAllocations[0].koordinatorId).toBe('coord-b');
  });

  it('logger flytting med subject på både gammel og ny koordinator', () => {
    const m = medHistorikk();
    m.run((a) => a.reassignChildCoordinator('child-a', 'coord-b'));

    const fra = logForPerson(m.app.auditLogs, ka);
    expect(fra).toHaveLength(1);
    expect(fra[0]).toMatchObject({ handling: 'Elev flyttet fra koordinator' });
    expect(fra[0].detaljer).toBe('Barn A (T-01) – fra Koordinator A til Kari B');

    const til = logForPerson(m.app.auditLogs, kb);
    expect(til).toHaveLength(1);
    expect(til[0]).toMatchObject({ handling: 'Elev flyttet til koordinator' });
    expect(til[0].detaljer).toBe('Barn A (T-01) – fra Koordinator A til Kari B');
  });

  it('kaster Error ved arkivert mål, ukjent mål og samme koordinator', () => {
    const m = medHistorikk();
    expect(() => m.run((a) => a.reassignChildCoordinator('child-a', 'coord-x'))).toThrow('er arkivert');
    expect(() => m.run((a) => a.reassignChildCoordinator('child-a', 'finnes-ikke'))).toThrow('Fant ikke koordinatoren.');
    expect(() => m.run((a) => a.reassignChildCoordinator('child-a', 'coord-a'))).toThrow(
      'Eleven følges allerede av denne koordinatoren.'
    );
    // Ingen endringer når flyttingen avvises
    expect(m.app.childrenList.find((c) => c.id === 'child-a')?.koordinatorId).toBe('coord-a');
    expect(m.app.reports[0].koordinatorId).toBe('coord-a');
  });

  it('reassignAllChildren flytter bare aktive elever og returnerer antallet', () => {
    const m = medHistorikk({
      children: [
        makeChild({ id: 'child-a', internKode: 'T-01', koordinatorId: 'coord-a' }),
        makeChild({ id: 'child-b', internKode: 'T-02', fornavn: 'Barn B', koordinatorId: 'coord-a' }),
        makeChild({ id: 'child-c', internKode: 'T-03', koordinatorId: 'coord-a', status: 'avsluttet' }),
      ],
    });
    let antall = -1;
    m.run((a) => {
      antall = a.reassignAllChildren('coord-a', 'coord-b');
    });
    expect(antall).toBe(2);
    expect(m.app.childrenList.map((c) => c.koordinatorId)).toEqual(['coord-b', 'coord-b', 'coord-a']);
  });

  it('archiveCoordinatorAndMoveChildren flytter elevene først og arkiverer deretter koordinatoren', async () => {
    const m = medHistorikk();
    await act(async () => {
      await m.app.archiveCoordinatorAndMoveChildren('coord-a', 'coord-b');
    });
    expect(m.app.childrenList.every((c) => c.koordinatorId === 'coord-b')).toBe(true);
    expect(m.app.coordinators.find((c) => c.id === 'coord-a')?.aktiv).toBe(false);
    expect(logForPerson(m.app.auditLogs, ka)[0].handling).toBe('Avsluttet');
  });
});

describe('arkiveringsvern for koordinatorer', () => {
  it('deactivatePerson for koordinator med aktive elever kaster feil og arkiverer ikke', async () => {
    const m = medHistorikk();
    await expect(m.app.deactivatePerson(ka)).rejects.toThrow(
      'Kan ikke arkivere: Koordinator A følger 2 aktive elev(er). Flytt elevene til en annen koordinator først.'
    );
    expect(m.app.coordinators.find((c) => c.id === 'coord-a')?.aktiv).toBe(true);
  });

  it('koordinator uten aktive elever kan arkiveres', async () => {
    const m = medHistorikk({ children: [makeChild({ id: 'child-a', koordinatorId: 'coord-b' })] });
    await act(async () => {
      await m.app.deactivatePerson(ka);
    });
    expect(m.app.coordinators.find((c) => c.id === 'coord-a')?.aktiv).toBe(false);
  });
});

describe('fadderkobling krever aktiv koordinator for barnet', () => {
  const sponsor = { id: 's1', navn: 'Fadder Ett' };

  it('assignSponsorToChild kaster Error når barnet mangler koordinator', () => {
    const m = mountApp({
      coordinators: koordinatorer(),
      children: [makeChild({ id: 'child-a', fornavn: 'Ola', koordinatorId: '' })],
      sponsors: [makeSponsor(sponsor)],
    });
    expect(() => m.run((a) => a.assignSponsorToChild('child-a', 's1'))).toThrow(
      'Kan ikke koble Ola til fadder: barnet har ingen aktiv koordinator i Kongo. Velg koordinator for barnet først.'
    );
    expect(m.app.childrenList[0].tildeltFadderId).toBeUndefined();
  });

  it('assignSponsorToChild kaster Error når koordinatoren er arkivert', () => {
    const m = mountApp({
      coordinators: koordinatorer(),
      children: [makeChild({ id: 'child-a', koordinatorId: 'coord-x' })],
      sponsors: [makeSponsor(sponsor)],
    });
    expect(() => m.run((a) => a.assignSponsorToChild('child-a', 's1'))).toThrow('Kan ikke koble');
    expect(m.app.childrenList[0].tildeltFadderId).toBeUndefined();
  });

  it('assignSponsorToChild virker når barnet har aktiv koordinator', () => {
    const m = mountApp({
      coordinators: koordinatorer(),
      children: [makeChild({ id: 'child-a', koordinatorId: 'coord-a' })],
      sponsors: [makeSponsor(sponsor)],
    });
    m.run((a) => a.assignSponsorToChild('child-a', 's1'));
    expect(m.app.childrenList[0].tildeltFadderId).toBe('s1');
  });
});

describe('canAssignSponsor', () => {
  it('er true bare for aktiv koordinator', () => {
    const coords = koordinatorer();
    expect(canAssignSponsor(makeChild({ koordinatorId: 'coord-a' }), coords)).toBe(true);
    expect(canAssignSponsor(makeChild({ koordinatorId: '' }), coords)).toBe(false);
    expect(canAssignSponsor(makeChild({ koordinatorId: 'coord-x' }), coords)).toBe(false);
  });
});
