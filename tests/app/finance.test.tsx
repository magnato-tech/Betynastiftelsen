// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { paymentTotals } from '../../src/utils/paymentRegister';
import { makeCampaign, makeChild, makeCoordinator, makePayment, makeSponsor } from '../../src/test/testData';
import type { Inquiry } from '../../src/types';
import { mountApp, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

const inquiry = (o: Partial<Inquiry> = {}): Inquiry => ({
  id: 'q1',
  fadderId: 's1',
  fadderNavn: 'Fadder Ett',
  barnId: 'c1',
  barnNavn: 'Ange',
  sporsmaal: 'Hvordan gaar det?',
  datoSendt: '2026-10-01',
  status: 'mottatt',
  ...o,
});

const world = (extra: Record<string, unknown> = {}) => ({
  coordinators: [makeCoordinator({ id: 'k1' })],
  children: [makeChild({ id: 'c1', fornavn: 'Ange', koordinatorId: 'k1', tildeltFadderId: 's1' })],
  sponsors: [makeSponsor({ id: 's1', navn: 'Fadder Ett', epost: 'ett@example.com', tildeltBarnIds: ['c1'] })],
  ...extra,
});

describe('Henvendelser fra fadder', () => {
  it('ny henvendelse faar status mottatt, dato og navn fra fadder og barn', () => {
    const m = mountApp(world());
    m.run((a) => a.submitInquiry('s1', 'c1', 'Hvordan gaar det?'));
    expect(m.app.inquiries[0]).toMatchObject({ fadderId: 's1', fadderNavn: 'Fadder Ett', barnId: 'c1', barnNavn: 'Ange', status: 'mottatt', datoSendt: '2026-10-16', sporsmaal: 'Hvordan gaar det?' });
  });
  it('admin varsles med forkortet sporsmaal (maks 80 tegn)', () => {
    const m = mountApp(world());
    const long = 'x'.repeat(200);
    m.run((a) => a.submitInquiry('s1', 'c1', long));
    const n = m.app.notifications[0];
    expect(n.targetRole).toBe('admin');
    expect(n.message).toContain('x'.repeat(80) + '...');
    expect(n.message).not.toContain('x'.repeat(81));
  });
  it('kort sporsmaal faar ikke "..."', () => {
    const m = mountApp(world());
    m.run((a) => a.submitInquiry('s1', 'c1', 'Kort'));
    expect(m.app.notifications[0].message).not.toContain('...');
  });
  it('henvendelse logges', () => {
    const m = mountApp(world());
    m.run((a) => a.submitInquiry('s1', 'c1', 'Hei'));
    expect(m.app.auditLogs[0].handling).toBe('Fadder sendte spørsmål');
  });
  it('KJENT AVVIK F-06: henvendelse godtas for et barn fadderen ikke er tildelt', () => {
    const m = mountApp(world({ children: [makeChild({ id: 'c1' }), makeChild({ id: 'c2', fornavn: 'Annet barn' })] }));
    m.run((a) => a.submitInquiry('s1', 'c2', 'Spor om annet barn'));
    expect(m.app.inquiries[0]).toMatchObject({ fadderId: 's1', barnId: 'c2' });
  });
  it('KJENT AVVIK F-06: tomt sporsmaal og ukjent fadder/barn godtas i handlingen (kun UI stopper tomt)', () => {
    const m = mountApp(world());
    m.run((a) => a.submitInquiry('ukjent', 'ukjent', ''));
    expect(m.app.inquiries[0]).toMatchObject({ fadderNavn: 'Fadder', barnNavn: 'Fadderbarn', sporsmaal: '' });
  });
});

describe('Behandling av henvendelser (admin og koordinator)', () => {
  const withInq = (i: Partial<Inquiry> = {}) => mountApp(world({ inquiries: [inquiry(i)] }));

  it('admin svarer: status besvart, svartekst og dato', () => {
    const m = withInq();
    m.run((a) => a.answerInquiry('q1', 'Det gaar bra.'));
    expect(m.app.inquiries[0]).toMatchObject({ status: 'besvart', svarTekst: 'Det gaar bra.', svarDato: '2026-10-16' });
  });
  it('svar logges', () => {
    const m = withInq();
    m.run((a) => a.answerInquiry('q1', 'Svar'));
    // Systemmeldingen til fadderen logges også, så svaret er ikke nødvendigvis øverst.
    expect(m.app.auditLogs.some((l) => l.handling === 'Besvarte spørsmål')).toBe(true);
  });
  it('svar paavirker ikke andre henvendelser', () => {
    const m = mountApp(world({ inquiries: [inquiry(), inquiry({ id: 'q2' })] }));
    m.run((a) => a.answerInquiry('q1', 'Svar'));
    expect(m.app.inquiries.find((i) => i.id === 'q2')?.status).toBe('mottatt');
  });
  it('admin videresender til koordinator: status venter_koordinator og tekst paa fransk', () => {
    const m = withInq();
    m.run((a) => a.forwardInquiryToCoordinator('q1'));
    expect(m.app.inquiries[0].status).toBe('venter_koordinator');
    expect(m.app.inquiries[0].koordinatorNotatFr).toContain('coordinateur');
  });
  it('videresending med eget notat bruker notatet', () => {
    const m = withInq();
    m.run((a) => a.forwardInquiryToCoordinator('q1', 'Peux-tu verifier?'));
    expect(m.app.inquiries[0].koordinatorNotatFr).toBe('Peux-tu verifier?');
  });
  it('koordinator svarer paa feltet: status under_behandling og notat lagres', () => {
    const m = withInq({ status: 'venter_koordinator' });
    m.run((a) => a.coordinatorReplyToInquiry('q1', 'Il va bien.'));
    expect(m.app.inquiries[0]).toMatchObject({ status: 'under_behandling', koordinatorNotatFr: 'Il va bien.' });
  });
  it('koordinatorsvar publiseres IKKE til fadder (ingen svarTekst)', () => {
    const m = withInq({ status: 'venter_koordinator' });
    m.run((a) => a.coordinatorReplyToInquiry('q1', 'Il va bien.'));
    expect(m.app.inquiries[0].svarTekst).toBeUndefined();
  });
  it('hele kjeden: mottatt -> videresendt -> koordinatorsvar -> admin svar', () => {
    const m = withInq();
    m.run((a) => a.forwardInquiryToCoordinator('q1'));
    m.tick();
    m.run((a) => a.coordinatorReplyToInquiry('q1', 'Il va bien.'));
    m.tick();
    m.run((a) => a.answerInquiry('q1', 'Det gaar bra.'));
    expect(m.app.inquiries[0]).toMatchObject({ status: 'besvart', svarTekst: 'Det gaar bra.', koordinatorNotatFr: 'Il va bien.' });
  });
  it('handling paa ukjent henvendelse endrer ingenting', () => {
    const m = withInq();
    m.run((a) => a.coordinatorReplyToInquiry('ukjent', 'x'));
    expect(m.app.inquiries[0].status).toBe('mottatt');
  });
});

describe('RETTET: henvendelsesvarsler (F-19)', () => {
  const withInq = () => mountApp(world({ inquiries: [inquiry()] }));
  it('RETTET F-19: svar fra admin gir varsel til fadderen', () => {
    const m = withInq();
    m.run((a) => a.answerInquiry('q1', 'Svar'));
    expect(m.app.inquiries[0].status).toBe('besvart');
    const tilFadder = m.app.notifications.filter((n) => n.targetRole === 'sponsor');
    expect(tilFadder).toHaveLength(1);
    expect(tilFadder[0].recipientId).toBe(m.app.inquiries[0].fadderId);
  });
  it('RETTET F-19: e-post om besvart henvendelse koes med standardinnstilling paa', () => {
    const m = withInq();
    expect(m.app.emailAutoSend.inquiry_answered).toBe(true);
    m.run((a) => a.answerInquiry('q1', 'Svar'));
    expect(m.app.emailOutbox.length).toBeGreaterThan(0);
  });
  it('RETTET F-19: videresending varsler koordinatoren til barnet, med barnenavn', () => {
    const m = withInq();
    m.run((a) => a.forwardInquiryToCoordinator('q1'));
    expect(m.app.notifications[0]).toMatchObject({ targetRole: 'coordinator', recipientId: 'k1', type: 'inquiry_forwarded' });
    expect(m.app.notifications[0].title).not.toContain('()');
    expect(m.app.inquiries[0].koordinatorId).toBe('k1');
  });
});

describe('Betalinger og avstemming', () => {
  const pays = () => [
    makePayment({ id: 'p1', fadderId: 's1', fadderNavn: 'Fadder Ett', belop: 250, status: 'fullfort', dato: '2026-10-01' }),
    makePayment({ id: 'p2', fadderId: 's1', fadderNavn: 'Fadder Ett', belop: 250, status: 'forventet', dato: '2026-11-01' }),
    makePayment({ id: 'p3', fadderNavn: 'Giver', belop: 500, type: 'aksjon', aksjonId: 'camp-a', status: 'fullfort', dato: '2026-10-05' }),
  ];
  it('avstemming setter status avstemt paa riktig betaling', () => {
    const m = mountApp(world({ payments: pays() }));
    m.run((a) => a.reconcilePayment('p1'));
    expect(m.app.payments.map((p) => p.status)).toEqual(['avstemt', 'forventet', 'fullfort']);
  });
  it('avstemming logges', () => {
    const m = mountApp(world({ payments: pays() }));
    m.run((a) => a.reconcilePayment('p1'));
    expect(m.app.auditLogs[0].handling).toBe('Avstemte betaling');
  });
  it('totaler regnes riktig etter avstemming', () => {
    const m = mountApp(world({ payments: pays() }));
    m.run((a) => a.reconcilePayment('p1'));
    expect(paymentTotals(m.app.payments)).toEqual({ total: 1000, aksjon: 500, fadder: 500, avstemt: 250, avstemmingsgrad: 25 });
  });
  it('avstemming av fadderbetaling koer IKKE e-post som standard', () => {
    const m = mountApp(world({ payments: pays() }));
    m.run((a) => a.reconcilePayment('p1'));
    expect(m.app.emailOutbox).toHaveLength(0);
  });
  it('avstemming av fadderbetaling koer kvitterings-e-post naar slaatt paa', () => {
    const m = mountApp(world({ payments: pays() }));
    m.run((a) => a.setEmailAutoSendEvent('payment_registered', true));
    m.run((a) => a.reconcilePayment('p1'));
    expect(m.app.emailOutbox[0]).toMatchObject({ toEmails: ['ett@example.com'], templateId: 'payment_registered' });
  });
  it('avstemming av aksjonsbetaling (uten fadder) sender ingen e-post', () => {
    const m = mountApp(world({ payments: pays() }));
    m.run((a) => a.setEmailAutoSendEvent('payment_registered', true));
    m.run((a) => a.reconcilePayment('p3'));
    expect(m.app.emailOutbox).toHaveLength(0);
  });
  it('avstemming av ukjent betaling endrer ingen betalinger', () => {
    const m = mountApp(world({ payments: pays() }));
    m.run((a) => a.reconcilePayment('ukjent'));
    expect(m.app.payments.map((p) => p.status)).toEqual(['fullfort', 'forventet', 'fullfort']);
  });
  it('KJENT AVVIK F-25: avstemming av ukjent betaling logges likevel som "Avstemte betaling"', () => {
    const m = mountApp(world({ payments: pays() }));
    m.run((a) => a.reconcilePayment('ukjent'));
    expect(m.app.auditLogs[0].handling).toBe('Avstemte betaling');
  });
  it('dobbel avstemming er idempotent', () => {
    const m = mountApp(world({ payments: pays() }));
    m.run((a) => a.reconcilePayment('p1'));
    m.run((a) => a.reconcilePayment('p1'));
    expect(m.app.payments[0].status).toBe('avstemt');
  });
});

describe('Kampanjer og aksjonsgaver', () => {
  const camp = () => [makeCampaign({ id: 'camp-a', tittel: 'Skolesaker', maalbelop: 1000, innsamletBelop: 900, antallGivere: 9 })];
  it('gave oeker innsamlet beloep og antall givere', () => {
    const m = mountApp({ campaigns: camp() });
    m.run((a) => a.donateToCampaign('camp-a', 50, 'Ola', 'vipps'));
    expect(m.app.campaigns[0]).toMatchObject({ innsamletBelop: 950, antallGivere: 10, status: 'aktiv' });
  });
  it('gave som naar maalet fullfoerer kampanjen', () => {
    const m = mountApp({ campaigns: camp() });
    m.run((a) => a.donateToCampaign('camp-a', 100, 'Ola', 'bank'));
    expect(m.app.campaigns[0].status).toBe('fullfort');
  });
  it('gave over maalet er tillatt og holder kampanjen fullfort', () => {
    const m = mountApp({ campaigns: camp() });
    m.run((a) => a.donateToCampaign('camp-a', 5000, 'Ola', 'vipps'));
    expect(m.app.campaigns[0]).toMatchObject({ innsamletBelop: 5900, status: 'fullfort' });
  });
  it('gave oppretter betaling av type aksjon knyttet til kampanjen', () => {
    const m = mountApp({ campaigns: camp() });
    m.run((a) => a.donateToCampaign('camp-a', 50, 'Ola', 'vipps'));
    expect(m.app.payments[0]).toMatchObject({ type: 'aksjon', aksjonId: 'camp-a', aksjonTittel: 'Skolesaker', belop: 50, fadderNavn: 'Ola', metode: 'vipps' });
    expect(m.app.payments[0].referanse).toMatch(/^AKSJ-2026-\d{4}$/);
  });
  it('anonym gave faar "Anonym giver"', () => {
    const m = mountApp({ campaigns: camp() });
    m.run((a) => a.donateToCampaign('camp-a', 50, '', 'vipps'));
    expect(m.app.payments[0].fadderNavn).toBe('Anonym giver');
  });
  it('gave til en kampanje paavirker ikke andre kampanjer', () => {
    const m = mountApp({ campaigns: [...camp(), makeCampaign({ id: 'camp-b', innsamletBelop: 10 })] });
    m.run((a) => a.donateToCampaign('camp-a', 50, 'Ola', 'vipps'));
    expect(m.app.campaigns.find((c) => c.id === 'camp-b')?.innsamletBelop).toBe(10);
  });
  it('KJENT AVVIK F-25: negativ gave reduserer innsamlet beloep', () => {
    const m = mountApp({ campaigns: camp() });
    m.run((a) => a.donateToCampaign('camp-a', -500, 'Ola', 'vipps'));
    expect(m.app.campaigns[0].innsamletBelop).toBe(400);
    expect(m.app.payments[0].belop).toBe(-500);
  });
  it('KJENT AVVIK F-25: gave paa 0 telles som giver', () => {
    const m = mountApp({ campaigns: camp() });
    m.run((a) => a.donateToCampaign('camp-a', 0, 'Ola', 'vipps'));
    expect(m.app.campaigns[0].antallGivere).toBe(10);
  });
  it('KJENT AVVIK F-25: gave til ukjent kampanje gir foreldreloes betaling med tittel "Aksjon"', () => {
    const m = mountApp({ campaigns: camp() });
    m.run((a) => a.donateToCampaign('finnes-ikke', 50, 'Ola', 'vipps'));
    expect(m.app.payments[0]).toMatchObject({ aksjonId: 'finnes-ikke', aksjonTittel: 'Aksjon', status: 'fullfort' });
  });
  it('KJENT AVVIK F-25: gaver markeres "fullfort" uten bankbekreftelse', () => {
    const m = mountApp({ campaigns: camp() });
    m.run((a) => a.donateToCampaign('camp-a', 50, 'Ola', 'vipps'));
    expect(m.app.payments[0].status).toBe('fullfort');
  });
  it('admin kan opprette, endre og slette kampanje', () => {
    const m = mountApp();
    let id = '';
    m.run((a) => {
      id = a.addCampaign({ tittel: 'Ny', beskrivelse: 'b', maalbelop: 100, enhetBeskrivelse: '', status: 'aktiv', barnIds: [] });
    });
    expect(m.app.campaigns[0]).toMatchObject({ id, innsamletBelop: 0, antallGivere: 0 });
    m.run((a) => a.updateCampaign(id, { tittel: 'Endret' }));
    expect(m.app.campaigns[0].tittel).toBe('Endret');
    m.run((a) => a.deleteCampaign(id));
    expect(m.app.campaigns).toHaveLength(0);
    expect(m.app.auditLogs.map((l) => l.handling)).toEqual(expect.arrayContaining(['Opprettet aksjon', 'Oppdaterte aksjon', 'Slettet aksjon']));
  });
  it('KJENT AVVIK F-14: kampanje som nevner "laerebøker" fjernes stille fra visningen', () => {
    const m = mountApp({ campaigns: [makeCampaign({ id: 'camp-l', tittel: 'Lærebøker til skolen', beskrivelse: 'Nye lærebøker' })] });
    expect(m.app.campaigns).toHaveLength(0);
  });
  it('KJENT AVVIK F-14: admin kan ikke opprette kampanje med ordet "katalogisering" - den forsvinner ved neste last', () => {
    const m = mountApp({}, undefined, { local: true });
    m.run((a) => {
      a.addCampaign({ tittel: 'Katalogisering av biblioteket', beskrivelse: 'x', maalbelop: 100, enhetBeskrivelse: '', status: 'aktiv', barnIds: [] });
    });
    expect(m.app.campaigns).toHaveLength(1); // finnes i denne visningen ...
    expect(JSON.parse(localStorage.getItem('betyna_v1_campaigns') ?? '[]')).toHaveLength(1);
    m.utils.unmount();
    const again = mountApp({}, undefined, { keepStorage: true });
    expect(again.app.campaigns).toHaveLength(0);
  });
});
