// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { Child, SponsorAssignment } from '../../src/types';
import { childSubject, logForPerson, sponsorSubject } from '../../src/utils/personLog';
import { makeChild, makeCoordinator, makeSponsor } from '../../src/test/testData';
import { mountApp, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

// Harness-klokken står på 2026-10-16.
const IDAG = '2026-10-16';

const barn = (o: Partial<Child> = {}) => makeChild({ id: 'c1', koordinatorId: 'coord-a', ...o });

const gammelTildeling: SponsorAssignment = {
  id: 'asg-old',
  sponsorId: 's1',
  childId: 'c1',
  koordinatorId: 'coord-a',
  startDato: '2026-01-01',
  andelOre: 25000,
};

/** Barn c1 følges av s1 (Fadder A). s2 (Fadder B) er ledig. */
const medFadder = (childOverrides: Partial<Child> = {}, extra: Record<string, unknown> = {}) =>
  mountApp({
    coordinators: [makeCoordinator({ id: 'coord-a' }), makeCoordinator({ id: 'coord-b', fornavn: 'Kari', etternavn: 'B' })],
    children: [barn({ tildeltFadderId: 's1', ...childOverrides })],
    sponsors: [
      makeSponsor({ id: 's1', navn: 'Fadder A', tildeltBarnIds: ['c1'] }),
      makeSponsor({ id: 's2', navn: 'Fadder B' }),
    ],
    sponsorAssignments: [gammelTildeling],
    ...extra,
  });

describe('updateChild (admin endrer barnets opplysninger)', () => {
  it('endrer valgte felt, ignorerer beskyttede felt og logger på barnet', () => {
    const m = medFadder();
    m.run((a) =>
      a.updateChild('c1', {
        skoleNavn: 'Ny skole',
        koordinatorId: 'coord-b',
        tildeltFadderId: 's2',
        status: 'avsluttet',
        id: 'annen',
      })
    );
    const child = m.app.childrenList[0];
    expect(child).toMatchObject({ id: 'c1', skoleNavn: 'Ny skole', koordinatorId: 'coord-a', tildeltFadderId: 's1', status: 'aktiv' });

    const logg = logForPerson(m.app.auditLogs, childSubject(child));
    expect(logg).toHaveLength(1);
    expect(logg[0]).toMatchObject({ handling: 'Endret opplysninger om barnet', gjelderType: 'child', gjelderId: 'c1' });
    expect(logg[0].detaljer).toBe('skoleNavn: Testskole → Ny skole');
  });

  it('varsler barnets koordinator med endrede felt', () => {
    const m = medFadder();
    m.run((a) => a.updateChild('c1', { skoleNavn: 'Ny skole', fornavn: 'Ange' }));
    const varsel = m.app.notifications.find((n) => n.type === 'child_updated');
    expect(varsel).toMatchObject({
      targetRole: 'coordinator',
      recipientId: 'coord-a',
      title: 'Opplysninger om Ange er oppdatert',
      actionSection: 'eleves',
      relatedEntityId: 'c1',
      read: false,
    });
    expect(varsel?.message).toBe('Administrator har endret: skole, fornavn.');
  });

  it('ingen faktisk endring gir ingen logg og ingen varsel', () => {
    const m = medFadder();
    m.run((a) => a.updateChild('c1', { skoleNavn: 'Testskole', status: 'avsluttet' }));
    expect(m.app.auditLogs).toHaveLength(0);
    expect(m.app.notifications).toHaveLength(0);
  });

  it('barn uten koordinator logger, men varsler ingen', () => {
    const m = medFadder({ koordinatorId: '' });
    m.run((a) => a.updateChild('c1', { skoleNavn: 'Ny skole' }));
    expect(m.app.auditLogs).toHaveLength(1);
    expect(m.app.notifications.filter((n) => n.type === 'child_updated')).toHaveLength(0);
  });
});

describe('reassignChildSponsor (bytte av fadder)', () => {
  it('holder alle tre koblingene konsistente og logger på barn, gammel og ny fadder', () => {
    const m = medFadder();
    m.run((a) => a.reassignChildSponsor('c1', 's2'));

    expect(m.app.childrenList[0].tildeltFadderId).toBe('s2');
    expect(m.app.sponsors.find((s) => s.id === 's1')?.tildeltBarnIds).toEqual([]);
    expect(m.app.sponsors.find((s) => s.id === 's2')?.tildeltBarnIds).toEqual(['c1']);

    const gammel = m.app.sponsorAssignments.find((a) => a.id === 'asg-old');
    expect(gammel?.sluttDato).toBe(IDAG);
    const aapne = m.app.sponsorAssignments.filter((a) => a.childId === 'c1' && !a.sluttDato);
    expect(aapne).toHaveLength(1);
    expect(aapne[0]).toMatchObject({ sponsorId: 's2', koordinatorId: 'coord-a', startDato: IDAG, andelOre: 25000 });

    const detaljer = 'Barn A (T-01): fra Fadder A til Fadder B';
    const barnLogg = logForPerson(m.app.auditLogs, childSubject(m.app.childrenList[0]));
    expect(barnLogg[0]).toMatchObject({ handling: 'Fadder byttet', detaljer });
    expect(logForPerson(m.app.auditLogs, sponsorSubject({ id: 's1', navn: 'Fadder A' }))[0]).toMatchObject({
      handling: 'Fadder byttet',
      detaljer,
    });
    expect(logForPerson(m.app.auditLogs, sponsorSubject({ id: 's2', navn: 'Fadder B' }))[0]).toMatchObject({
      handling: 'Fadder byttet',
      detaljer,
    });
  });

  it('varsler den nye fadderen og sender ingen e-post', () => {
    const m = medFadder();
    m.run((a) => a.reassignChildSponsor('c1', 's2'));
    expect(m.app.notifications.find((n) => n.type === 'sponsor_assigned')).toMatchObject({
      targetRole: 'sponsor',
      recipientId: 's2',
    });
    expect(m.app.emailOutbox).toHaveLength(0);
  });

  it('kaster Error ved samme fadder, ukjent fadder, avsluttet fadder og barn uten aktiv koordinator, uten endringer', () => {
    const m = medFadder({}, {
      sponsors: [
        makeSponsor({ id: 's1', navn: 'Fadder A', tildeltBarnIds: ['c1'] }),
        makeSponsor({ id: 's2', navn: 'Fadder B' }),
        makeSponsor({ id: 's3', navn: 'Fadder C', avsluttet: '2026-09-01' }),
      ],
    });
    expect(() => m.run((a) => a.reassignChildSponsor('c1', 's1'))).toThrow('følges allerede av Fadder A');
    expect(() => m.run((a) => a.reassignChildSponsor('c1', 'finnes-ikke'))).toThrow('Fant ikke fadderen.');
    expect(() => m.run((a) => a.reassignChildSponsor('c1', 's3'))).toThrow('er avsluttet');

    expect(m.app.childrenList[0].tildeltFadderId).toBe('s1');
    expect(m.app.auditLogs).toHaveLength(0);
    expect(m.app.sponsorAssignments.find((a) => a.id === 'asg-old')?.sluttDato).toBeUndefined();
  });

  it('kaster Error når barnet ikke har aktiv koordinator', () => {
    const m = medFadder({ koordinatorId: 'coord-x' });
    expect(() => m.run((a) => a.reassignChildSponsor('c1', 's2'))).toThrow('Kan ikke koble Barn A til fadder');
    expect(m.app.childrenList[0].tildeltFadderId).toBe('s1');
  });
});

describe('removeChildSponsor (fjern fadder)', () => {
  it('fjerner fadderen fra alle tre koblingene, og barnet forblir aktivt', () => {
    const m = medFadder();
    m.run((a) => a.removeChildSponsor('c1'));

    expect(m.app.childrenList[0]).toMatchObject({ status: 'aktiv', tildeltFadderId: undefined });
    expect(m.app.sponsors.find((s) => s.id === 's1')?.tildeltBarnIds).toEqual([]);
    expect(m.app.sponsorAssignments.find((a) => a.id === 'asg-old')?.sluttDato).toBe(IDAG);

    const barnLogg = logForPerson(m.app.auditLogs, childSubject(m.app.childrenList[0]));
    expect(barnLogg[0].handling).toBe('Fadder fjernet');
    expect(logForPerson(m.app.auditLogs, sponsorSubject({ id: 's1', navn: 'Fadder A' }))[0].handling).toBe('Fadder fjernet');
  });

  it('kaster Error når barnet ikke har fadder', () => {
    const m = medFadder({ tildeltFadderId: undefined });
    expect(() => m.run((a) => a.removeChildSponsor('c1'))).toThrow('har ingen fadder å fjerne');
  });
});

describe('SponsorAssignment ved vanlige handlinger', () => {
  it('assignSponsorToChild avslutter åpen tildeling, oppretter ny og logger på barnet', () => {
    const m = medFadder({ tildeltFadderId: undefined }, { sponsorAssignments: [] });
    m.run((a) => a.assignSponsorToChild('c1', 's2'));
    const aapne = m.app.sponsorAssignments.filter((a) => !a.sluttDato);
    expect(aapne).toHaveLength(1);
    expect(aapne[0]).toMatchObject({ sponsorId: 's2', childId: 'c1', koordinatorId: 'coord-a', startDato: IDAG, andelOre: 25000 });
    expect(logForPerson(m.app.auditLogs, childSubject(m.app.childrenList[0]))[0].handling).toBe('Tildelte fadder');
  });

  it('assignSponsorToChild til samme fadder endrer ingenting', () => {
    const m = medFadder();
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    expect(m.app.sponsorAssignments.find((a) => a.id === 'asg-old')?.sluttDato).toBeUndefined();
    expect(m.app.sponsorAssignments).toHaveLength(1);
    expect(m.app.auditLogs).toHaveLength(0);
  });

  it('endSponsorship avslutter åpen tildeling og logger på barnet', () => {
    const m = medFadder();
    m.run((a) => a.endSponsorship('c1'));
    expect(m.app.sponsorAssignments.find((a) => a.id === 'asg-old')?.sluttDato).toBe(IDAG);
    expect(m.app.childrenList[0]).toMatchObject({ status: 'avsluttet', tildeltFadderId: undefined });
    expect(logForPerson(m.app.auditLogs, childSubject(m.app.childrenList[0]))[0].handling).toBe('Avsluttet oppfølging');
  });

  it('reopenChild og flytting av koordinator logger også på barnet', () => {
    const m = medFadder({ status: 'avsluttet', tildeltFadderId: undefined }, { sponsorAssignments: [] });
    m.run((a) => a.reopenChild('c1'));
    expect(logForPerson(m.app.auditLogs, childSubject(m.app.childrenList[0]))[0].handling).toBe('Gjenåpnet oppfølging');

    m.run((a) => a.reassignChildCoordinator('c1', 'coord-b'));
    const barnLogg = logForPerson(m.app.auditLogs, childSubject(m.app.childrenList[0]));
    expect(barnLogg.map((l) => l.handling)).toContain('Elev flyttet');
  });
});

describe('barn som personlogg-subject', () => {
  it('deactivatePerson avviser barn', async () => {
    const m = medFadder();
    await expect(m.app.deactivatePerson(childSubject(m.app.childrenList[0]))).rejects.toThrow(
      'Barn kan ikke slettes eller deaktiveres her.'
    );
  });
});
