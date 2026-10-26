// @vitest-environment jsdom
import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { childIdsOfSponsor, childrenOfSponsor } from '../../src/utils/sponsorChildren';
import { makeChild, makeCoordinator, makeSponsor } from '../../src/test/testData';
import { mountApp, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

const base = (extra: Record<string, unknown> = {}) => ({
  coordinators: [makeCoordinator({ id: 'k1' })],
  children: [
    makeChild({ id: 'c1', fornavn: 'Ange', koordinatorId: 'k1' }),
    makeChild({ id: 'c2', fornavn: 'Beni', koordinatorId: 'k1' }),
  ],
  sponsors: [
    makeSponsor({ id: 's1', navn: 'Fadder Ett', epost: 'ett@example.com' }),
    makeSponsor({ id: 's2', navn: 'Fadder To', epost: 'to@example.com' }),
  ],
  ...extra,
});

const newSponsor = {
  navn: 'Ny Fadder',
  epost: 'ny@example.com',
  telefon: '123',
  poststed: 'Oslo',
  maanedsbelop: 250 as const,
  betalingsmetode: 'vipps' as const,
};

describe('Administrasjon av faddere (Norge)', () => {
  it('admin kan registrere fadder: id, kilde admin, aktiv, ingen barn', () => {
    const m = mountApp();
    let id = '';
    m.run((a) => {
      id = a.addSponsor(newSponsor);
    });
    expect(id).toMatch(/^sponsor-/);
    expect(m.app.sponsors[0]).toMatchObject({ id, navn: 'Ny Fadder', registrertKilde: 'admin', betalingsstatus: 'aktiv', tildeltBarnIds: [], startDato: '2026-10-16', maanedsbelop: 250 });
  });
  it('registrering logges', () => {
    const m = mountApp();
    m.run((a) => a.addSponsor(newSponsor));
    expect(m.app.auditLogs[0].handling).toBe('La til fadder');
  });
  it('velkomst-e-post koes IKKE som standard', () => {
    const m = mountApp();
    m.run((a) => a.addSponsor(newSponsor));
    expect(m.app.emailOutbox).toHaveLength(0);
  });
  it('velkomst-e-post koes naar den er slaatt paa, til fadderens adresse', () => {
    const m = mountApp();
    m.run((a) => a.setEmailAutoSendEvent('sponsor_welcome', true));
    m.run((a) => a.addSponsor(newSponsor));
    expect(m.app.emailOutbox).toHaveLength(1);
    expect(m.app.emailOutbox[0]).toMatchObject({ toEmails: ['ny@example.com'], templateId: 'sponsor_welcome', kind: 'system', status: 'venter_nøkkel' });
  });
  it('velkomst-e-post har ingen barneprofil og ingen intern kode', () => {
    const m = mountApp();
    m.run((a) => a.setEmailAutoSendEvent('sponsor_welcome', true));
    m.run((a) => a.addSponsor(newSponsor));
    expect(m.app.emailOutbox[0].body).toContain('Ny Fadder');
    expect(m.app.emailOutbox[0].body).not.toMatch(/BET-|etternavn/i);
  });
  it('e-post som sendes OK faar status sendt og Resend-id', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 200, ok: true, json: async () => ({ ok: true, id: 'res_1' }) })));
    const m = mountApp();
    m.run((a) => a.setEmailAutoSendEvent('sponsor_welcome', true));
    await act(async () => {
      m.app.addSponsor(newSponsor);
    });
    expect(m.app.emailOutbox[0]).toMatchObject({ status: 'sendt', note: 'Resend res_1' });
  });
  it('e-post der Resend feiler faar status feilet med melding', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 502, ok: false, json: async () => ({ ok: false, message: 'Resend nede' }) })));
    const m = mountApp();
    m.run((a) => a.setEmailAutoSendEvent('sponsor_welcome', true));
    await act(async () => {
      m.app.addSponsor(newSponsor);
    });
    expect(m.app.emailOutbox[0]).toMatchObject({ status: 'feilet', note: 'Resend nede' });
  });
  it('e-post uten konfigurert noekkel (503) blir liggende som utkast', async () => {
    const m = mountApp();
    m.run((a) => a.setEmailAutoSendEvent('sponsor_welcome', true));
    await act(async () => {
      m.app.addSponsor(newSponsor);
    });
    expect(m.app.emailOutbox[0].status).toBe('venter_nøkkel');
  });
  it('nettverksfeil ved e-post stopper ikke registreringen', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const m = mountApp();
    m.run((a) => a.setEmailAutoSendEvent('sponsor_welcome', true));
    await act(async () => {
      m.app.addSponsor(newSponsor);
    });
    expect(m.app.sponsors).toHaveLength(1);
    expect(m.app.emailOutbox[0].status).toBe('venter_nøkkel');
  });
  it('e-post koes ikke naar fadderens adresse er ugyldig', () => {
    const m = mountApp();
    m.run((a) => a.setEmailAutoSendEvent('sponsor_welcome', true));
    m.run((a) => a.addSponsor({ ...newSponsor, epost: 'ikke-epost' }));
    expect(m.app.emailOutbox).toHaveLength(0);
    expect(m.app.sponsors).toHaveLength(1);
  });
});

describe('Tildeling av fadder til barn', () => {
  it('tildeling kobler begge veier (barn.tildeltFadderId og fadder.tildeltBarnIds)', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    expect(m.app.childrenList.find((c) => c.id === 'c1')?.tildeltFadderId).toBe('s1');
    expect(m.app.sponsors.find((s) => s.id === 's1')?.tildeltBarnIds).toEqual(['c1']);
  });
  it('en fadder kan ha flere barn', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    m.run((a) => a.assignSponsorToChild('c2', 's1'));
    expect(m.app.sponsors.find((s) => s.id === 's1')?.tildeltBarnIds).toEqual(['c1', 'c2']);
  });
  it('hvert barn har bare en fadder: omtildeling flytter barnet', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    m.run((a) => a.assignSponsorToChild('c1', 's2'));
    expect(m.app.sponsors.find((s) => s.id === 's1')?.tildeltBarnIds).toEqual([]);
    expect(m.app.sponsors.find((s) => s.id === 's2')?.tildeltBarnIds).toEqual(['c1']);
    expect(m.app.childrenList.find((c) => c.id === 'c1')?.tildeltFadderId).toBe('s2');
  });
  it('tildeling til samme fadder to ganger gir ikke duplikat', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    expect(m.app.sponsors.find((s) => s.id === 's1')?.tildeltBarnIds).toEqual(['c1']);
  });
  it('tildeling varsler fadderen (kun den fadderen)', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    expect(m.app.notifications).toHaveLength(1);
    expect(m.app.notifications[0]).toMatchObject({ targetRole: 'sponsor', recipientId: 's1', type: 'sponsor_assigned', relatedEntityId: 'c1' });
  });
  it('tildeling logges med fadder og barn', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    expect(m.app.auditLogs[0]).toMatchObject({ handling: 'Tildelte fadder' });
    expect(m.app.auditLogs[0].detaljer).toContain('Fadder Ett');
  });
  it('tildeling endrer ikke andre barn', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    expect(m.app.childrenList.find((c) => c.id === 'c2')?.tildeltFadderId).toBeUndefined();
  });
  it('fadder ser etter tildeling bare det tildelte barnet (hjelpefunksjoner)', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    const s1 = m.app.sponsors.find((s) => s.id === 's1');
    expect(childrenOfSponsor(m.app.childrenList, s1).map((c) => c.id)).toEqual(['c1']);
  });
  it('avslutning fjerner koblingen begge veier og setter barnet til avsluttet', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    m.run((a) => a.endSponsorship('c1'));
    const child = m.app.childrenList.find((c) => c.id === 'c1');
    expect(child).toMatchObject({ status: 'avsluttet' });
    expect(child?.tildeltFadderId).toBeUndefined();
    expect(m.app.sponsors.find((s) => s.id === 's1')?.tildeltBarnIds).toEqual([]);
  });
  it('avslutning logges', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    m.run((a) => a.endSponsorship('c1'));
    expect(m.app.auditLogs[0].handling).toBe('Avsluttet oppfølging');
  });
  it('avslutning av ukjent barn gjor ingenting', () => {
    const m = mountApp(base());
    m.run((a) => a.endSponsorship('ukjent'));
    expect(m.app.auditLogs).toHaveLength(0);
  });
  it('avslutning av barn uten fadder er trygt', () => {
    const m = mountApp(base());
    m.run((a) => a.endSponsorship('c2'));
    expect(m.app.childrenList.find((c) => c.id === 'c2')?.status).toBe('avsluttet');
  });
  it('avslutning beholder andre barn hos samme fadder', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    m.run((a) => a.assignSponsorToChild('c2', 's1'));
    m.run((a) => a.endSponsorship('c1'));
    expect(m.app.sponsors.find((s) => s.id === 's1')?.tildeltBarnIds).toEqual(['c2']);
  });
  it('gammelt datafelt tildeltBarnId (enkelt) leses som liste', () => {
    expect(childIdsOfSponsor({ tildeltBarnId: 'c9' })).toEqual(['c9']);
    expect(childIdsOfSponsor({ tildeltBarnIds: [], tildeltBarnId: 'c9' })).toEqual(['c9']);
    expect(childIdsOfSponsor(undefined)).toEqual([]);
  });
  it('fadder lastet fra gammelt format migreres til tildeltBarnIds', () => {
    const m = mountApp({ sponsors: [{ ...makeSponsor({ id: 's1' }), tildeltBarnIds: undefined, tildeltBarnId: 'c1' }] }, undefined, { local: true });
    expect(m.app.sponsors[0].tildeltBarnIds).toEqual(['c1']);
  });
});

describe('KJENT AVVIK: tildeling uten kontroll (F-15, F-23)', () => {
  it('F-23: tildeling til ukjent fadder-id godtas (barnet peker paa ikke-eksisterende fadder)', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 'spoekelse'));
    expect(m.app.childrenList.find((c) => c.id === 'c1')?.tildeltFadderId).toBe('spoekelse');
  });
  it('F-23: tildeling av ukjent barn skriver likevel logg og varsel-forsoek uten barn', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('ukjent-barn', 's1'));
    expect(m.app.auditLogs[0].handling).toBe('Tildelte fadder');
    expect(m.app.sponsors.find((s) => s.id === 's1')?.tildeltBarnIds).toEqual(['ukjent-barn']);
  });
  it('F-23: avsluttet barn kan faa ny fadder uten at status gjenopprettes', () => {
    const m = mountApp(base({ children: [makeChild({ id: 'c1', status: 'avsluttet', koordinatorId: 'k1' })] }));
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    expect(m.app.childrenList[0]).toMatchObject({ status: 'avsluttet', tildeltFadderId: 's1' });
  });
  it('F-15: to kilder til sannhet - barnets tildeltFadderId kan endres uten at fadderens liste folger med', () => {
    const m = mountApp(base());
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    m.run((a) => a.updateChild('c1', { tildeltFadderId: 's2' }));
    const s1 = m.app.sponsors.find((s) => s.id === 's1');
    const s2 = m.app.sponsors.find((s) => s.id === 's2');
    expect(s1?.tildeltBarnIds).toEqual(['c1']);
    expect(s2?.tildeltBarnIds).toEqual([]);
    expect(m.app.childrenList.find((c) => c.id === 'c1')?.tildeltFadderId).toBe('s2');
  });
  it('F-15: fadderens barneliste og barnets fadderfelt kan vaere uenige fra databasen (ingen konsistenssjekk ved innlasting)', () => {
    const m = mountApp({
      children: [makeChild({ id: 'c1', tildeltFadderId: 's2' })],
      sponsors: [makeSponsor({ id: 's1', tildeltBarnIds: ['c1'] }), makeSponsor({ id: 's2', tildeltBarnIds: [] })],
    });
    // Portalen (fadderens liste) og sikkerhetsreglene (barnets felt) peker paa hver sin fadder.
    expect(childrenOfSponsor(m.app.childrenList, m.app.sponsors[0]).map((c) => c.id)).toEqual(['c1']);
    expect(m.app.childrenList[0].tildeltFadderId).toBe('s2');
  });
});

describe('Offentlig fadderregistrering (nettside)', () => {
  const data = { navn: 'Pia', epost: 'pia@example.com', telefon: '1', poststed: 'Bergen', maanedsbelop: 350, betalingsmetode: 'vipps' as const };
  it('registrerer fadder med kilde nettside og ingen barn', () => {
    const m = mountApp();
    let id = '';
    m.run((a) => {
      id = a.registerNewSponsorInterest(data);
    });
    expect(m.app.sponsors[0]).toMatchObject({ id, registrertKilde: 'nettside', tildeltBarnIds: [], maanedsbelop: 350 });
  });
  it('logger at admin maa koble barn manuelt', () => {
    const m = mountApp();
    m.run((a) => a.registerNewSponsorInterest(data));
    expect(m.app.auditLogs[0].detaljer).toContain('Admin må koble barn manuelt');
  });
  it('registrering oppretter en betaling med status "forventet" (ikke betalt ennå)', () => {
    const m = mountApp();
    m.run((a) => a.registerNewSponsorInterest(data));
    expect(m.app.payments).toHaveLength(1);
    expect(m.app.payments[0]).toMatchObject({ status: 'forventet', belop: 350, type: 'fadderbidrag' });
    expect(m.app.payments[0].status).not.toBe('fullfort');
    expect(m.app.payments[0].referanse).toMatch(/^VIPPS-202610-\d{4}$/);
  });
  it('KJENT AVVIK F-25: registrering validerer ikke e-post, navn eller beloep', () => {
    const m = mountApp();
    m.run((a) => a.registerNewSponsorInterest({ ...data, navn: '', epost: 'x', maanedsbelop: -5 }));
    expect(m.app.sponsors).toHaveLength(1);
    expect(m.app.payments[0].belop).toBe(-5);
  });
  it('registrering sender ikke velkomst-e-post (kun admin-registrering gjor det)', () => {
    const m = mountApp();
    m.run((a) => a.setEmailAutoSendEvent('sponsor_welcome', true));
    m.run((a) => a.registerNewSponsorInterest(data));
    expect(m.app.emailOutbox).toHaveLength(0);
  });
});
