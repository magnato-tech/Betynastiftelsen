// @vitest-environment jsdom
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { baselineOf, isSuspiciousWipe, planCollectionSync } from '../../src/db/syncEngine';
import { makeCampaign, makeChild, makeCoordinator, makeSponsor } from '../../src/test/testData';
import { fakeSync } from './fakeSync';
import { mountApp, stored, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

const lastPersisted = () => fakeSync.persisted.at(-1) as Record<string, any>;

describe('Innlasting fra databasen (hydration)', () => {
  it('full innlasting er fasit: lister settes til det databasen har', () => {
    const m = mountApp({ children: [makeChild({ id: 'c1' })], sponsors: [makeSponsor({ id: 's1' })], coordinators: [makeCoordinator({ id: 'k1' })] });
    expect(m.app.childrenList.map((c) => c.id)).toEqual(['c1']);
    expect(m.app.sponsors.map((s) => s.id)).toEqual(['s1']);
    expect(m.app.coordinators.map((c) => c.id)).toEqual(['k1']);
  });
  it('tom samling i databasen gir tom liste i appen', () => {
    const m = mountApp({ children: [] });
    expect(m.app.childrenList).toEqual([]);
  });
  it('lagring slaas paa foerst naar innlastingen er bekreftet', () => {
    const m = mountApp({ children: [makeChild({ id: 'c1' })] });
    expect(fakeSync.confirmed).toHaveLength(1);
    expect(m.app.firestoreBackendActive).toBe(true);
  });
  it('delvis (offentlig) innlasting bekreftes IKKE og slaar ikke paa lagring', () => {
    const m = mountApp({}, undefined, {
      hydration: { data: { campaigns: [makeCampaign({ id: 'pub' })], testimonials: [] }, full: false },
    });
    expect(m.app.campaigns.map((c) => c.id)).toEqual(['pub']);
    expect(fakeSync.confirmed).toHaveLength(0);
    expect(m.app.firestoreBackendActive).toBe(false);
  });
  it('offentlig innlasting rorer ikke barn, faddere eller betalinger', () => {
    localStorage.setItem('betyna_v1_children', JSON.stringify([makeChild({ id: 'lokal' })]));
    const m = mountApp({}, undefined, {
      keepStorage: true,
      hydration: { data: { campaigns: [], testimonials: [] }, full: false },
    });
    expect(m.app.childrenList.map((c) => c.id)).toEqual(['lokal']);
  });
  it('emailAutoSend fra databasen overstyrer standard', () => {
    const m = mountApp({ emailAutoSend: { inquiry_answered: false, report_approved: true, sponsor_welcome: true, payment_registered: true } });
    expect(m.app.emailAutoSend).toEqual({ inquiry_answered: false, report_approved: true, sponsor_welcome: true, payment_registered: true });
  });
  it('standard e-postinnstillinger: kun "svar paa sporsmaal" er paa', () => {
    const m = mountApp();
    expect(m.app.emailAutoSend).toEqual({ inquiry_answered: true, report_approved: false, sponsor_welcome: false, payment_registered: false });
  });
});

describe('Automatisk lagring: alt som gjoeres sendes til lagringsmotoren', () => {
  it('nytt barn havner i neste lagrede snapshot', () => {
    const m = mountApp();
    const before = fakeSync.persisted.length;
    m.run((a) => a.addChild({ fornavn: 'Ange' }));
    expect(fakeSync.persisted.length).toBeGreaterThan(before);
    expect(lastPersisted().children.map((c: any) => c.fornavn)).toEqual(['Ange']);
  });
  it('snapshotet har alle 15 samlinger pluss cms og innstillinger', () => {
    mountApp();
    expect(Object.keys(lastPersisted()).sort()).toEqual(
      ['auditLogs', 'catalogPhotos', 'children', 'cms', 'coordinators', 'emailAutoSend', 'emailOutbox', 'facts', 'inquiries', 'language', 'mediaLibrary', 'milestones', 'notifications', 'payments', 'campaigns', 'reports', 'sponsors', 'testimonials'].sort(),
    );
  });
  it.each([
    ['fadder', (m: ReturnType<typeof mountApp>) => m.run((a) => a.addSponsor({ navn: 'X', epost: 'x@y.no', telefon: '', poststed: '', maanedsbelop: 250, betalingsmetode: 'vipps' })), 'sponsors'],
    ['rapport', (m: ReturnType<typeof mountApp>) => m.run((a) => a.submitReport({ barnId: '' })), 'reports'],
    ['henvendelse', (m: ReturnType<typeof mountApp>) => m.run((a) => a.submitInquiry('s', 'c', 'q')), 'inquiries'],
    ['kampanje', (m: ReturnType<typeof mountApp>) => m.run((a) => a.addCampaign({ tittel: 'K', beskrivelse: '', maalbelop: 1, enhetBeskrivelse: '', status: 'aktiv', barnIds: [] })), 'campaigns'],
    ['historie', (m: ReturnType<typeof mountApp>) => m.run((a) => a.addStory({ navn: 'N', historie: 'H', samtykkeDokumentert: true, godkjentAvAdmin: false })), 'testimonials'],
    ['revisjonslogg', (m: ReturnType<typeof mountApp>) => m.run((a) => a.addAuditLog('h', 'd')), 'auditLogs'],
  ])('%s lagres i snapshot', (_n, act2, key) => {
    const m = mountApp();
    act2(m);
    expect(lastPersisted()[key].length).toBeGreaterThan(0);
  });
  it('varsler lagres i snapshot', () => {
    const m = mountApp({ children: [makeChild({ id: 'c1' })], sponsors: [makeSponsor({ id: 's1' })] });
    m.run((a) => a.assignSponsorToChild('c1', 's1'));
    expect(lastPersisted().notifications).toHaveLength(1);
  });
  it('endring av e-postinnstilling lagres', () => {
    const m = mountApp();
    m.run((a) => a.setEmailAutoSendEvent('sponsor_welcome', true));
    expect(lastPersisted().emailAutoSend.sponsor_welcome).toBe(true);
  });
  it('CMS-endring lagres', () => {
    const m = mountApp();
    m.run((a) => a.updateCmsSection('steps', [{ number: 1, title: 'Steg', description: 'Beskrivelse' }]));
    expect(lastPersisted().cms.steps).toHaveLength(1);
  });
  it('sletting fjernes fra snapshot (slik at motoren kan slette i databasen)', () => {
    const m = mountApp({ campaigns: [makeCampaign({ id: 'camp-a', tittel: 'Skolesaker' })] });
    m.run((a) => a.deleteCampaign('camp-a'));
    expect(lastPersisted().campaigns).toEqual([]);
  });
  it('innlastede dokumenter uten endring gir ingen skriving mot baseline', () => {
    const children = [makeChild({ id: 'c1' }), makeChild({ id: 'c2' })];
    const m = mountApp({ children });
    const plan = planCollectionSync(baselineOf(children), m.app.childrenList);
    expect(plan.sets).toEqual([]);
    expect(plan.deletes).toEqual([]);
  });
  it('en endring gir noyaktig en skriving og ingen sletting', () => {
    const children = [makeChild({ id: 'c1' }), makeChild({ id: 'c2' })];
    const m = mountApp({ children });
    m.run((a) => a.updateChild('c1', { fornavn: 'Endret' }));
    const plan = planCollectionSync(baselineOf(children), m.app.childrenList);
    expect(plan.sets.map((c) => c.id)).toEqual(['c1']);
    expect(plan.deletes).toEqual([]);
  });
  it('alle samlinger som appen laster er ogsaa med i hver lagring (ingen glemt samling)', () => {
    mountApp({ children: [makeChild({ id: 'c1' })] });
    const loaded = Object.keys(fakeSync.confirmed[0] as object);
    expect(Object.keys(lastPersisted())).toEqual(expect.arrayContaining(loaded));
  });
});

describe('KJENT AVVIK F-14: filter i appen kan utloese sletting i databasen', () => {
  const hydrated = () => mountApp({ campaigns: [makeCampaign({ id: 'camp-l', tittel: 'Lærebøker til skolen', beskrivelse: 'Nye lærebøker til klassen' })] });

  it('kampanjen som ligger i databasen vises ikke i appen', () => {
    const m = hydrated();
    expect((fakeSync.confirmed[0] as any).campaigns).toHaveLength(1);
    expect(m.app.campaigns).toHaveLength(0);
  });
  it('lagringsmotoren vil derfor slette kampanjen fra databasen ved neste lagring', () => {
    const m = hydrated();
    const baseline = baselineOf((fakeSync.confirmed[0] as any).campaigns);
    const plan = planCollectionSync(baseline, lastPersisted().campaigns);
    expect(plan.deletes).toEqual(['camp-l']);
  });
  it('vernet mot masse-sletting stopper ikke dette (kun samlinger med 3+ dokumenter beskyttes)', () => {
    const m = hydrated();
    const baseline = baselineOf((fakeSync.confirmed[0] as any).campaigns);
    const plan = planCollectionSync(baseline, lastPersisted().campaigns);
    expect(isSuspiciousWipe(baseline, plan.deletes)).toBe(false);
    expect(m.app.campaigns).toHaveLength(0);
  });
  it('vernet mot masse-sletting hjelper naar 3+ filtreres bort samtidig', () => {
    const camps = ['a', 'b', 'c'].map((x) => makeCampaign({ id: `camp-${x}`, tittel: 'Lærebøker ' + x }));
    mountApp({ campaigns: camps });
    const baseline = baselineOf(camps);
    const plan = planCollectionSync(baseline, lastPersisted().campaigns);
    expect(isSuspiciousWipe(baseline, plan.deletes)).toBe(true);
  });
});

describe('Lokal lagring (kun naar Firestore er av)', () => {
  it('innhold leses fra localStorage ved oppstart', () => {
    const m = mountApp({ children: [makeChild({ id: 'c1' })] }, undefined, { local: true });
    expect(m.app.childrenList.map((c) => c.id)).toEqual(['c1']);
  });
  it('endringer skrives til localStorage', () => {
    const m = mountApp({}, undefined, { local: true });
    m.run((a) => a.addSponsor({ navn: 'X', epost: 'x@y.no', telefon: '', poststed: '', maanedsbelop: 250, betalingsmetode: 'vipps' }));
    expect(stored<unknown[]>('sponsors')).toHaveLength(1);
  });
  it('tom start: ingenting er lagret foer noe skjer (men tomme lister skrives)', () => {
    mountApp({}, undefined, { local: true });
    expect(stored<unknown[]>('children')).toEqual([]);
  });
  it('ødelagt localStorage-verdi gir tom liste, ikke krasj', () => {
    localStorage.setItem('betyna_v1_children', '{ikke json');
    const m = mountApp({}, undefined, { keepStorage: true });
    expect(m.app.childrenList).toEqual([]);
  });
  it('spraak lagres og leses', () => {
    const m = mountApp({}, undefined, { local: true });
    m.run((a) => a.setLanguage('fr'));
    expect(stored<string>('language')).toBe('fr');
    m.utils.unmount();
    const again = mountApp({}, undefined, { keepStorage: true });
    expect(again.app.language).toBe('fr');
  });
  it.each([['en', 'fr'], ['no', 'no'], ['fr', 'fr'], ['xx', 'no'], [null, 'no']])('lagret spraak %s tolkes som %s', (raw, expected) => {
    localStorage.clear();
    localStorage.setItem('betyna_v1_language', JSON.stringify(raw));
    const m = mountApp({}, undefined, { keepStorage: true });
    expect(m.app.language).toBe(expected);
  });
  it('storage-hendelse fra annen fane oppdaterer kampanjer, innhold og spraak', () => {
    const m = mountApp();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'betyna_v1_language', newValue: JSON.stringify('fr') }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'betyna_v1_campaigns', newValue: JSON.stringify([makeCampaign({ id: 'x', tittel: 'Fra annen fane' })]) }));
    });
    expect(m.app.language).toBe('fr');
    expect(m.app.campaigns.map((c) => c.id)).toEqual(['x']);
  });
  it('storage-hendelse med ugyldig JSON ignoreres', () => {
    const m = mountApp();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'betyna_v1_cms', newValue: '{ikke json' }));
    });
    expect(m.app.cmsContent.steps).toEqual([]);
  });
  it('storage-hendelse for andre nokler ignoreres', () => {
    const m = mountApp();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'noe-annet', newValue: JSON.stringify('fr') }));
    });
    expect(m.app.language).toBe('no');
  });
});

describe('Rolle, spraak og oversettelser', () => {
  it('starter som besokende og norsk', () => {
    const m = mountApp();
    expect(m.app.role).toBe('public');
    expect(m.app.language).toBe('no');
    expect(document.documentElement.lang).toBe('nb');
  });
  it('fransk setter html lang=fr', () => {
    const m = mountApp();
    m.run((a) => a.setLanguage('fr'));
    expect(document.documentElement.lang).toBe('fr');
  });
  it('t() gir noekkelen tilbake for ukjent noekkel, eller gitt fallback', () => {
    const m = mountApp();
    expect(m.app.t('finnes.ikke.noe')).toBe('finnes.ikke.noe');
    expect(m.app.t('finnes.ikke.noe', 'Reserve')).toBe('Reserve');
  });
  it('revisjonslogg merkes med rolle og navn', () => {
    const m = mountApp({ sponsors: [makeSponsor({ id: 's1', navn: 'Fadder Ett' })], coordinators: [makeCoordinator({ id: 'k1', fornavn: 'Kari' })] });
    m.run((a) => a.setRole('sponsor'));
    m.run((a) => a.setCurrentSponsorId('s1'));
    m.run((a) => a.addAuditLog('h', 'd'));
    expect(m.app.auditLogs[0]).toMatchObject({ brukerRolle: 'Fadder (Norge)', brukerNavn: 'Fadder Ett' });
    m.run((a) => a.setRole('coordinator'));
    m.run((a) => a.setCurrentCoordinatorId('k1'));
    m.run((a) => a.addAuditLog('h2', 'd'));
    expect(m.app.auditLogs[0]).toMatchObject({ brukerRolle: 'Koordinator (Kongo)', brukerNavn: 'Kari' });
    m.run((a) => a.setRole('admin'));
    m.run((a) => a.addAuditLog('h3', 'd'));
    expect(m.app.auditLogs[0]).toMatchObject({ brukerRolle: 'Administrator (Norge)', brukerNavn: 'Admin' });
  });
  it('nyeste logglinje ligger oeverst', () => {
    const m = mountApp();
    m.run((a) => a.addAuditLog('forste', ''));
    m.tick();
    m.run((a) => a.addAuditLog('andre', ''));
    expect(m.app.auditLogs.map((l) => l.handling)).toEqual(['andre', 'forste']);
  });
  it('KJENT AVVIK F-10: rolle kan byttes av hvem som helst (prototype-rollebytter er paa)', () => {
    const m = mountApp();
    m.run((a) => a.setRole('admin'));
    expect(m.app.role).toBe('admin');
  });
});

describe('Innhold (CMS, historier)', () => {
  const story = { navn: 'Marie', historie: 'Hun ble laerer.', samtykkeDokumentert: true, godkjentAvAdmin: false };
  it('legg til, endre og slett vitnesbyrd', () => {
    const m = mountApp();
    m.run((a) => a.addStory(story));
    const id = m.app.stories[0].id;
    expect(m.app.stories[0]).toMatchObject({ navn: 'Marie', godkjentAvAdmin: false });
    m.run((a) => a.updateStory(id, { godkjentAvAdmin: true }));
    expect(m.app.stories[0].godkjentAvAdmin).toBe(true);
    m.run((a) => a.deleteStory(id));
    expect(m.app.stories).toEqual([]);
    expect(m.app.auditLogs.map((l) => l.handling)).toEqual(expect.arrayContaining(['Opprettet vitnesbyrd', 'Oppdaterte vitnesbyrd', 'Slettet vitnesbyrd']));
  });
  it('nytt vitnesbyrd er ikke godkjent som standard i testdata og krever eksplisitt godkjenning', () => {
    const m = mountApp();
    m.run((a) => a.addStory(story));
    expect(m.app.stories.filter((s) => s.godkjentAvAdmin)).toHaveLength(0);
  });
  it('CMS-seksjon kan oppdateres og logges', () => {
    const m = mountApp();
    m.run((a) => a.updateCmsSection('kpiStats', [{ id: 'k', value: '1', label: 'l', sublabel: 's' }]));
    expect(m.app.cmsContent.kpiStats).toHaveLength(1);
    expect(m.app.auditLogs[0].handling).toBe('Oppdaterte CMS-innhold');
  });
  it('CMS-oppdatering beholder andre seksjoner', () => {
    const m = mountApp();
    const hero = m.app.cmsContent.hero;
    m.run((a) => a.updateCmsSection('kpiStats', []));
    expect(m.app.cmsContent.hero).toEqual(hero);
  });
  it('"tilbakestill CMS" gjor ingenting (laast)', () => {
    const m = mountApp();
    m.run((a) => a.updateCmsSection('kpiStats', [{ id: 'k', value: '1', label: 'l', sublabel: 's' }]));
    m.run((a) => a.resetAllCms());
    m.run((a) => a.resetCmsSection('kpiStats'));
    expect(m.app.cmsContent.kpiStats).toHaveLength(1);
  });
  it('e-postinnstilling kan skrus av og paa og logges', () => {
    const m = mountApp();
    m.run((a) => a.setEmailAutoSendEvent('inquiry_answered', false));
    expect(m.app.emailAutoSend.inquiry_answered).toBe(false);
    expect(m.app.auditLogs[0].handling).toBe('E-postvarsler');
  });
  it('utsendingskoe kan oppdateres', () => {
    const m = mountApp();
    let id = '';
    m.run((a) => {
      id = a.addEmailOutboxItem({ kind: 'newsletter', subject: 's', body: 'b', toEmails: ['a@b.no'], status: 'venter_nøkkel' }).id;
    });
    m.run((a) => a.updateEmailOutboxItem(id, { status: 'sendt' }));
    expect(m.app.emailOutbox[0].status).toBe('sendt');
  });
});
