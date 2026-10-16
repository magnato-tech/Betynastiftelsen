// @vitest-environment jsdom
import React from 'react';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SponsorPortal } from '../../src/components/sponsor/SponsorPortal';
import type { AppNotification } from '../../src/types';
import {
  makeChild,
  makeCoordinator,
  makeFact,
  makePayment,
  makeReport,
  makeSponsor,
} from '../../src/test/testData';
import { mountApp, useAppTestLifecycle, type AppApi } from './harness';

useAppTestLifecycle();

const notif = (o: Partial<AppNotification>): AppNotification => ({
  id: 'n',
  targetRole: 'admin',
  title: 't',
  message: 'm',
  timestamp: '2026-10-16 10:00',
  type: 'inquiry_new',
  read: false,
  ...o,
});

const world = () => ({
  coordinators: [makeCoordinator({ id: 'k1' }), makeCoordinator({ id: 'k2' })],
  children: [
    makeChild({ id: 'c1', fornavn: 'Ange', internKode: 'BET-CD-01', koordinatorId: 'k1', tildeltFadderId: 's1', bakgrunnskontekst: 'Bakgrunn om Ange', interesser: ['Fotball'], behovSammendrag: 'Skolesaker til Ange' }),
    makeChild({ id: 'c2', fornavn: 'Beni', internKode: 'BET-CD-02', koordinatorId: 'k2', tildeltFadderId: 's2', bakgrunnskontekst: 'Bakgrunn om Beni' }),
    makeChild({ id: 'c3', fornavn: 'Cedric', internKode: 'BET-CD-03', koordinatorId: 'k1', bakgrunnskontekst: 'Bakgrunn om Cedric' }),
  ],
  sponsors: [
    makeSponsor({ id: 's1', navn: 'Fadder Ett', tildeltBarnIds: ['c1'] }),
    makeSponsor({ id: 's2', navn: 'Fadder To', tildeltBarnIds: ['c2'] }),
    makeSponsor({ id: 's3', navn: 'Fadder Tre', tildeltBarnIds: [] }),
  ],
  reports: [
    makeReport({ id: 'r1', barnId: 'c1', barnNavn: 'Ange', status: 'godkjent', tittelNorsk: 'GODKJENT-ANGE', innholdNorsk: 'Norsk innhold Ange', tittelFransk: 'FRANSK-ANGE', innholdFransk: 'Contenu francais Ange' }),
    makeReport({ id: 'r2', barnId: 'c1', barnNavn: 'Ange', status: 'innsendt', tittelNorsk: 'INNSENDT-ANGE' }),
    makeReport({ id: 'r3', barnId: 'c1', barnNavn: 'Ange', status: 'avvist', tittelNorsk: 'AVVIST-ANGE' }),
    makeReport({ id: 'r4', barnId: 'c1', barnNavn: 'Ange', status: 'kladd', tittelNorsk: 'KLADD-ANGE' }),
    makeReport({ id: 'r5', barnId: 'c2', barnNavn: 'Beni', status: 'godkjent', tittelNorsk: 'GODKJENT-BENI' }),
  ],
  milestones: [
    { id: 'm1', barnId: 'c1', barnNavn: 'Ange', dato: '2026-09-01', kategori: 'skole', tittelFransk: 'f', beskrivelseFransk: 'f', tittelNorsk: 'MILEPAEL-ANGE', beskrivelseNorsk: 'b', koordinatorNavn: 'K', opprettetDato: '2026-09-01' },
    { id: 'm2', barnId: 'c2', barnNavn: 'Beni', dato: '2026-09-01', kategori: 'skole', tittelFransk: 'f', beskrivelseFransk: 'f', tittelNorsk: 'MILEPAEL-BENI', beskrivelseNorsk: 'b', koordinatorNavn: 'K', opprettetDato: '2026-09-01' },
  ],
  inquiries: [
    { id: 'q1', fadderId: 's1', fadderNavn: 'Fadder Ett', barnId: 'c1', barnNavn: 'Ange', sporsmaal: 'SPORSMAAL-S1', datoSendt: '2026-10-01', status: 'mottatt' as const },
    { id: 'q2', fadderId: 's2', fadderNavn: 'Fadder To', barnId: 'c2', barnNavn: 'Beni', sporsmaal: 'SPORSMAAL-S2', datoSendt: '2026-10-01', status: 'besvart' as const, svarTekst: 'SVAR-TIL-S2', svarDato: '2026-10-02' },
  ],
  payments: [
    makePayment({ id: 'p1', fadderId: 's1', fadderNavn: 'Fadder Ett', referanse: 'REF-S1', status: 'forventet', belop: 250 }),
    makePayment({ id: 'p2', fadderId: 's2', fadderNavn: 'Fadder To', referanse: 'REF-S2', belop: 350 }),
  ],
  fieldFacts: [makeFact({ id: 'f1', barnId: 'c1', trivsel: 'INTERN-FAKTA-ANGE' })],
});

function portal(section: string, as: { sponsor?: string } = { sponsor: 's1' }) {
  const m = mountApp(world(), () => <SponsorPortal activeSection={section} setActiveSection={() => undefined} />);
  m.run((a) => {
    a.setRole('sponsor');
    if (as.sponsor) a.setCurrentSponsorId(as.sponsor);
  });
  const text = () => m.utils.container.textContent ?? '';
  return { m, text };
}

describe('Fadderportalen: fadder ser bare eget barn', () => {
  it('profil viser eget barn og egen skole', () => {
    const { text } = portal('barn');
    expect(text()).toContain('Fadderoppfølging for Ange');
    expect(text()).toContain('Bakgrunn om Ange');
    expect(text()).toContain('Fotball');
  });
  it.each(['Beni', 'Cedric', 'Bakgrunn om Beni', 'Bakgrunn om Cedric', 'Fadder To', 'BET-CD-02', 'BET-CD-03'])(
    'profil viser IKKE "%s" (andre barn/faddere)',
    (secret) => {
      const { text } = portal('barn');
      expect(text()).not.toContain(secret);
    },
  );
  it.each(['INTERN-FAKTA-ANGE', 'FRANSK-ANGE', 'Contenu francais'])('profil viser ikke internt/fransk innhold "%s"', (secret) => {
    const { text } = portal('barn');
    expect(text()).not.toContain(secret);
  });
  it('fadder uten tildelt barn ser "Venter paa tildeling" og ingen barnedata', () => {
    const { text } = portal('barn', { sponsor: 's3' });
    expect(text()).toContain('Venter på tildeling av fadderbarn');
    for (const s of ['Ange', 'Beni', 'Cedric']) expect(text()).not.toContain(s);
  });
  it('ukjent fadder-id viser ventende-side uten krasj og uten data', () => {
    const { text } = portal('barn', { sponsor: 'finnes-ikke' });
    expect(text()).toContain('Venter på tildeling');
    expect(text()).not.toContain('Ange');
  });
  it('ingen fadder valgt (tom id) viser ingen barn', () => {
    const { text } = portal('barn', {});
    expect(text()).not.toContain('Ange');
    expect(text()).not.toContain('Beni');
  });
  it('fadder to ser kun sitt barn', () => {
    const { text } = portal('barn', { sponsor: 's2' });
    expect(text()).toContain('Fadderoppfølging for Beni');
    expect(text()).not.toContain('Ange');
  });
});

describe('Fadderportalen: rapporter og milepaeler', () => {
  it('viser kun godkjente rapporter om eget barn', () => {
    const { text } = portal('rapporter');
    expect(text()).toContain('GODKJENT-ANGE');
  });
  it.each(['INNSENDT-ANGE', 'AVVIST-ANGE', 'KLADD-ANGE', 'GODKJENT-BENI'])('rapporter viser IKKE "%s"', (secret) => {
    const { text } = portal('rapporter');
    expect(text()).not.toContain(secret);
  });
  it('rapporter viser norsk tekst, ikke fransk original', () => {
    const { text } = portal('rapporter');
    expect(text()).toContain('Norsk innhold Ange');
    expect(text()).not.toContain('Contenu francais');
  });
  it('tidslinje viser eget barns milepael og ikke andres', () => {
    const { text } = portal('tidslinje');
    expect(text()).toContain('MILEPAEL-ANGE');
    expect(text()).not.toContain('MILEPAEL-BENI');
  });
  it('fadder to ser kun egne rapporter', () => {
    const { text } = portal('rapporter', { sponsor: 's2' });
    expect(text()).toContain('GODKJENT-BENI');
    expect(text()).not.toContain('GODKJENT-ANGE');
  });
});

describe('Fadderportalen: spoersmaal - ingen direkte kontakt med barnet', () => {
  it('viser kun egne henvendelser og svar', () => {
    const { text } = portal('sporsmaal');
    expect(text()).toContain('SPORSMAAL-S1');
    expect(text()).not.toContain('SPORSMAAL-S2');
    expect(text()).not.toContain('SVAR-TIL-S2');
  });
  it('sier eksplisitt at fadderen aldri kommuniserer direkte med barnet', () => {
    const { text } = portal('sporsmaal');
    expect(text()).toContain('Fadderen kommuniserer aldri direkte med barnet.');
  });
  it('skjemaet har ingen mottakervelger, kun spoersmaalsfelt til stiftelsen', () => {
    const { m } = portal('sporsmaal');
    const c = m.utils.container;
    expect(c.querySelectorAll('select')).toHaveLength(0);
    expect(c.querySelectorAll('input[type="email"], input[type="tel"]')).toHaveLength(0);
    expect(c.querySelectorAll('textarea')).toHaveLength(1);
    expect(c.textContent).toContain('Send et spørsmål til stiftelsen');
  });
  it('innsendt sporsmaal blir en henvendelse fra riktig fadder om riktig barn, og gaar til admin', () => {
    const { m } = portal('sporsmaal');
    const ta = m.utils.container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: 'Hvordan gaar det paa skolen?' } });
    fireEvent.submit(ta.closest('form') as HTMLFormElement);
    const created = m.app.inquiries.find((i) => i.sporsmaal === 'Hvordan gaar det paa skolen?');
    expect(created).toMatchObject({ fadderId: 's1', barnId: 'c1', status: 'mottatt' });
    const n = m.app.notifications.filter((x) => x.type === 'inquiry_new');
    expect(n).toHaveLength(1);
    expect(n[0].targetRole).toBe('admin');
    expect(m.app.notifications.some((x) => x.targetRole === 'coordinator')).toBe(false);
  });
  it('tomt sporsmaal (kun mellomrom) sendes ikke', () => {
    const { m } = portal('sporsmaal');
    const ta = m.utils.container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '    ' } });
    fireEvent.submit(ta.closest('form') as HTMLFormElement);
    expect(m.app.inquiries).toHaveLength(2);
  });
});

describe('Fadderportalen: betalinger', () => {
  it('viser kun egne betalinger', () => {
    const { text } = portal('betalinger');
    expect(text()).toContain('REF-S1');
    expect(text()).not.toContain('REF-S2');
  });
  it('KJENT AVVIK F-26: "forventet" (ikke mottatt) betaling vises som "Betalt & avstemt"', () => {
    const { text } = portal('betalinger');
    expect(text()).toContain('Betalt & avstemt');
  });
});

describe('KJENT AVVIK F-24: intern kode vises for fadder (produktkrav: skal ikke vises)', () => {
  it('profilen viser "Intern referanse" med barnets interne kode', () => {
    const { text } = portal('barn');
    expect(text()).toContain('Intern referanse');
    expect(text()).toContain('BET-CD-01');
  });
  it('tidslinjen viser barnets interne kode i overskriften', () => {
    const { text } = portal('tidslinje');
    expect(text()).toContain('BET-CD-01');
  });
});

describe('Varsler er avgrenset per rolle og mottaker', () => {
  const notifs = [
    notif({ id: 'a1', targetRole: 'admin' }),
    notif({ id: 's1a', targetRole: 'sponsor', recipientId: 's1' }),
    notif({ id: 's2a', targetRole: 'sponsor', recipientId: 's2' }),
    notif({ id: 'k1a', targetRole: 'coordinator', recipientId: 'k1' }),
    notif({ id: 'k2a', targetRole: 'coordinator', recipientId: 'k2' }),
    notif({ id: 'all', targetRole: 'all' }),
    notif({ id: 'sAll', targetRole: 'sponsor' }),
    notif({ id: 'kAll', targetRole: 'coordinator' }),
  ];
  const as = (role: 'admin' | 'sponsor' | 'coordinator' | 'public', id?: string) => {
    const m = mountApp({ notifications: notifs });
    m.run((a: AppApi) => {
      a.setRole(role);
      if (role === 'sponsor' && id) a.setCurrentSponsorId(id);
      if (role === 'coordinator' && id) a.setCurrentCoordinatorId(id);
    });
    return m;
  };
  const ids = (m: ReturnType<typeof as>) => m.app.currentRoleNotifications.map((n) => n.id).sort();

  it('admin ser admin- og alle-varsler', () => expect(ids(as('admin'))).toEqual(['a1', 'all']));
  it('fadder 1 ser kun egne + generelle fadder-/alle-varsler', () => expect(ids(as('sponsor', 's1'))).toEqual(['all', 's1a', 'sAll']));
  it('fadder 2 ser ikke fadder 1 sine varsler', () => expect(ids(as('sponsor', 's2'))).not.toContain('s1a'));
  it('koordinator 1 ser kun egne + generelle', () => expect(ids(as('coordinator', 'k1'))).toEqual(['all', 'k1a', 'kAll']));
  it('koordinator 2 ser ikke koordinator 1 sine varsler', () => expect(ids(as('coordinator', 'k2'))).not.toContain('k1a'));
  it('besokende ser kun varsler til alle', () => expect(ids(as('public'))).toEqual(['all']));
  it('fadder ser aldri admin- eller koordinatorvarsler', () => {
    const got = ids(as('sponsor', 's1'));
    expect(got).not.toContain('a1');
    expect(got).not.toContain('k1a');
  });
  it('antall uleste teller bare synlige varsler', () => {
    const m = as('sponsor', 's1');
    expect(m.app.unreadNotificationCount).toBe(3);
  });
  it('"marker alle som lest" for fadder 1 rorer ikke andres varsler', () => {
    const m = as('sponsor', 's1');
    m.run((a) => a.markAllNotificationsAsRead());
    const byId = Object.fromEntries(m.app.notifications.map((n) => [n.id, n.read]));
    expect(byId.s1a).toBe(true);
    expect(byId.s2a).toBe(false);
    expect(byId.a1).toBe(false);
    expect(byId.k1a).toBe(false);
  });
  it('marker enkeltvarsel som lest', () => {
    const m = as('admin');
    m.run((a) => a.markNotificationAsRead('a1'));
    expect(m.app.notifications.find((n) => n.id === 'a1')?.read).toBe(true);
    expect(m.app.notifications.find((n) => n.id === 'all')?.read).toBe(false);
  });
  it('slett varsel fjerner kun det varselet', () => {
    const m = as('admin');
    m.run((a) => a.deleteNotification('a1'));
    expect(m.app.notifications.some((n) => n.id === 'a1')).toBe(false);
    expect(m.app.notifications).toHaveLength(notifs.length - 1);
  });
  it('rollebytte endrer synlige varsler umiddelbart', () => {
    const m = as('admin');
    m.run((a) => a.setRole('public'));
    expect(ids(m)).toEqual(['all']);
  });
});

describe('Ingen kanal fra fadder til barn eller koordinator', () => {
  const inWorld = () => mountApp(world());
  it('appen har ingen handling for aa sende melding til barn', () => {
    const m = inWorld();
    const names = Object.keys(m.app);
    const suspicious = names.filter((n) => !n.startsWith('firestore') && /message|melding|chat|sendTilBarn|contactChild/i.test(n));
    expect(suspicious).toEqual([]);
  });
  it('fadderens henvendelse varsler bare admin, aldri koordinator', () => {
    const m = inWorld();
    m.run((a) => a.submitInquiry('s1', 'c1', 'Hei'));
    expect(m.app.notifications.every((n) => n.targetRole === 'admin')).toBe(true);
  });
  it('koordinatorens feltsvar skaper ikke varsel til fadder (admin maa kvalitetssikre)', () => {
    const m = mountApp({
      ...world(),
      inquiries: [{ id: 'q9', fadderId: 's1', fadderNavn: 'Fadder Ett', barnId: 'c1', barnNavn: 'Ange', sporsmaal: 'x', datoSendt: '2026-10-01', status: 'venter_koordinator' as const }],
    });
    m.run((a) => a.coordinatorReplyToInquiry('q9', 'Reponse du terrain'));
    expect(m.app.notifications.filter((n) => n.targetRole === 'sponsor')).toHaveLength(0);
    expect(m.app.inquiries.find((i) => i.id === 'q9')?.svarTekst).toBeUndefined();
  });
  it('koordinatorens franske notat er ikke i fadderens henvendelsesvisning foer admin har svart', () => {
    const m = mountApp(
      {
        ...world(),
        inquiries: [{ id: 'q9', fadderId: 's1', fadderNavn: 'Fadder Ett', barnId: 'c1', barnNavn: 'Ange', sporsmaal: 'x', datoSendt: '2026-10-01', status: 'venter_koordinator' as const }],
      },
      () => <SponsorPortal activeSection="sporsmaal" setActiveSection={() => undefined} />,
    );
    m.run((a) => {
      a.setRole('sponsor');
      a.setCurrentSponsorId('s1');
    });
    m.run((a) => a.coordinatorReplyToInquiry('q9', 'NOTAT-FRA-KOORDINATOR'));
    expect(m.utils.container.textContent).not.toContain('NOTAT-FRA-KOORDINATOR');
  });
});
