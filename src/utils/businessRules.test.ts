import { describe, expect, it } from 'vitest';
import {
  childrenForCoordinator,
  findCoordinator,
  inquiriesForCoordinator,
  reportsForCoordinator,
  sortChildrenForCoordinatorRegister,
  type CoordinatorRegisterSortKey,
} from './coordinatorScope';
import {
  catalogPhotosForChild,
  childMatchesPhotoTag,
  coordinatorChildProfileSection,
  isCoordinatorChildProfileSection,
  normalizePhotoTag,
  parseCoordinatorChildProfileId,
  photoTaggedForChild,
  reportsForChild,
} from './photoCatalog';
import { paymentsInRange, paymentTotals, sortPayments, type PaymentSortKey } from './paymentRegister';
import { buildNewsletterRecipients, isValidEmail } from '../newsletter/recipients';
import { buildAdminContentQueue, buildAdminContentRegister, seedStoryFromFacts, sortAdminContentItems } from './adminContentQueue';
import { buildFieldFact, factsWaitingForStory } from './fieldFacts';
import { filterSponsorsLastDays, filterSponsorsSince } from './sponsorMetrics';
import { addChildId, childIdsOfSponsor, childNamesOfSponsor, childrenOfSponsor, migrateSponsorsChildIds, removeChildId } from './sponsorChildren';
import { coordinatorDisplayName } from './coordinatorDisplay';
import { makeChild, makeCoordinator, makeFact, makePayment, makePhoto, makeReport, makeSponsor } from '../test/testData';
import type { Inquiry } from '../types';

describe('coordinatorScope: hvilke barn en koordinator ser', () => {
  const kids = [
    makeChild({ id: 'a', koordinatorId: 'k1' }),
    makeChild({ id: 'b', koordinatorId: 'k2' }),
    makeChild({ id: 'c', koordinatorId: 'k1', status: 'avsluttet' }),
    makeChild({ id: 'd', koordinatorId: 'k1', status: 'arkivert' }),
    makeChild({ id: 'e', koordinatorId: '' }),
  ];
  it('kun egne aktive barn', () => expect(childrenForCoordinator(kids, 'k1').map((c) => c.id)).toEqual(['a']));
  it('annen koordinator ser ikke k1 sine barn', () => expect(childrenForCoordinator(kids, 'k2').map((c) => c.id)).toEqual(['b']));
  it('ukjent koordinator ser ingen barn', () => expect(childrenForCoordinator(kids, 'k9')).toEqual([]));
  it('tom koordinator-id ser kun barn uten koordinator', () => expect(childrenForCoordinator(kids, '').map((c) => c.id)).toEqual(['e']));
  it('rapporter filtreres paa koordinator', () => {
    const reps = [makeReport({ id: '1', koordinatorId: 'k1' }), makeReport({ id: '2', koordinatorId: 'k2' })];
    expect(reportsForCoordinator(reps, 'k1').map((r) => r.id)).toEqual(['1']);
    expect(reportsForCoordinator(reps, 'k3')).toEqual([]);
  });
  it('findCoordinator finner riktig eller undefined', () => {
    const cs = [makeCoordinator({ id: 'k1' }), makeCoordinator({ id: 'k2' })];
    expect(findCoordinator(cs, 'k2')?.id).toBe('k2');
    expect(findCoordinator(cs, 'k9')).toBeUndefined();
  });
  it('visningsnavn har Brazzaville', () => {
    expect(coordinatorDisplayName(makeCoordinator({ fornavn: 'Kari', etternavn: 'K' }))).toBe('Kari K (Brazzaville)');
  });

  const inq = (o: Partial<Inquiry>): Inquiry => ({
    id: 'q', fadderId: 's', fadderNavn: 'F', barnId: 'a', barnNavn: 'A', sporsmaal: 'x', datoSendt: '2026-10-01', status: 'mottatt', ...o,
  });
  it('koordinator ser kun henvendelser som er sendt videre om egne barn', () => {
    const list = [
      inq({ id: '1', status: 'venter_koordinator' }),
      inq({ id: '2', status: 'mottatt' }),
      inq({ id: '3', status: 'under_behandling' }),
      inq({ id: '4', status: 'besvart' }),
      inq({ id: '5', status: 'venter_koordinator', barnId: 'b' }),
      inq({ id: '6', status: 'besvart', koordinatorId: 'k1' }),
    ];
    expect(inquiriesForCoordinator(list, kids, 'k1').map((i) => i.id).sort()).toEqual(['1', '3', '6']);
  });
  it('koordinator ser ALDRI henvendelser om andres barn selv om status er videresendt', () => {
    const list = [inq({ id: '5', status: 'venter_koordinator', barnId: 'b' })];
    expect(inquiriesForCoordinator(list, kids, 'k1')).toEqual([]);
  });
  it('koordinator ser ikke nye (mottatt) henvendelser fra fadder foer admin har sendt dem videre', () => {
    expect(inquiriesForCoordinator([inq({ status: 'mottatt' })], kids, 'k1')).toEqual([]);
  });

  describe('sortering av elevregister', () => {
    const rows = [
      makeChild({ id: '1', internKode: 'BET-10', fornavn: 'Zoe', skoleNavn: 'B-skole', klassetrinn: '10', fodselsaar: 2010, status: 'aktiv', tildeltFadderId: 's' }),
      makeChild({ id: '2', internKode: 'BET-2', fornavn: 'Ane', skoleNavn: 'A-skole', klassetrinn: '2', fodselsaar: 2015, status: 'aktiv' }),
      makeChild({ id: '3', internKode: 'BET-3', fornavn: 'Øyvind', skoleNavn: 'C-skole', klassetrinn: '3', fodselsaar: 2013, status: 'avsluttet' }),
    ];
    const counts = { reports: { '1': 5, '2': 1, '3': 3 }, milestones: { '1': 0, '2': 9, '3': 4 } };
    const order = (key: CoordinatorRegisterSortKey, dir: 'asc' | 'desc') => sortChildrenForCoordinatorRegister(rows, key, dir, counts).map((c) => c.id);
    it.each<[CoordinatorRegisterSortKey, string[]]>([
      ['internKode', ['2', '3', '1']],
      ['fornavn', ['2', '1', '3']],
      ['skoleNavn', ['2', '1', '3']],
      ['klassetrinn', ['2', '3', '1']],
      ['fadderstatus', ['2', '3', '1']],
      ['fodselsaar', ['1', '3', '2']],
      ['rapporter', ['2', '3', '1']],
      ['milepaler', ['1', '3', '2']],
      ['status', ['2', '1', '3']],
    ])('stigende paa %s', (key, expected) => expect(order(key, 'asc')).toEqual(expected));
    it.each<CoordinatorRegisterSortKey>(['internKode', 'fornavn', 'skoleNavn', 'klassetrinn', 'fodselsaar', 'rapporter', 'milepaler'])('synkende %s er omvendt av stigende', (key) => {
      expect(order(key, 'desc')).toEqual([...order(key, 'asc')].reverse());
    });
    it('numerisk sortering av koder (BET-2 foer BET-10)', () => expect(order('internKode', 'asc').slice(0, 1)).toEqual(['2']));
    it('endrer ikke inndata', () => {
      const copy = rows.map((r) => r.id);
      order('fornavn', 'desc');
      expect(rows.map((r) => r.id)).toEqual(copy);
    });
  });
});

describe('photoCatalog: bilder og profil', () => {
  const child = makeChild({ id: 'child-7', internKode: 'BET-CD-07', fornavn: 'Ange' });
  it('profilseksjon har prefiks og kan leses tilbake', () => {
    const s = coordinatorChildProfileSection('child-7');
    expect(s).toBe('profil:child-7');
    expect(parseCoordinatorChildProfileId(s)).toBe('child-7');
    expect(isCoordinatorChildProfileSection(s)).toBe(true);
  });
  it.each([['oversikt'], ['profil:'], ['profil:   '], ['']])('seksjon %j er ikke en barneprofil', (s) => {
    expect(parseCoordinatorChildProfileId(s)).toBeNull();
    expect(isCoordinatorChildProfileSection(s)).toBe(false);
  });
  it.each([['  ANGE '], ['ange'], ['child-7'], ['CHILD-7'], ['bet-cd-07'], ['BET-CD-07']])('tag %j matcher barnet', (tag) => {
    expect(childMatchesPhotoTag(child, tag)).toBe(true);
  });
  it.each([[''], ['   '], ['ang'], ['child-8'], ['Beni']])('tag %j matcher ikke', (tag) => {
    expect(childMatchesPhotoTag(child, tag)).toBe(false);
  });
  it('normalisering fjerner mellomrom og store bokstaver', () => expect(normalizePhotoTag('  AbC ')).toBe('abc'));
  it('bilde med flere tagger vises paa alle merkede barn', () => {
    const photo = makePhoto({ barnIds: ['child-7', 'child-8'] });
    expect(photoTaggedForChild(photo, child)).toBe(true);
    expect(photoTaggedForChild(photo, makeChild({ id: 'child-8' }))).toBe(true);
    expect(photoTaggedForChild(photo, makeChild({ id: 'child-9', internKode: 'X', fornavn: 'Y' }))).toBe(false);
  });
  it('bilde merket med fornavn vises paa ALLE barn med samme fornavn (designvalg: risiko for feil barn)', () => {
    const photo = makePhoto({ barnIds: ['Ange'] });
    expect(photoTaggedForChild(photo, makeChild({ id: 'x1', internKode: 'x1', fornavn: 'Ange' }))).toBe(true);
    expect(photoTaggedForChild(photo, makeChild({ id: 'x2', internKode: 'x2', fornavn: 'ange' }))).toBe(true);
  });
  it('katalog filtrerer til barnets bilder', () => {
    const photos = [makePhoto({ id: '1', barnIds: ['child-7'] }), makePhoto({ id: '2', barnIds: ['child-8'] })];
    expect(catalogPhotosForChild(photos, child).map((p) => p.id)).toEqual(['1']);
  });
  it('rapporter for barn sorteres nyeste foerst, deretter id synkende', () => {
    const reps = [
      makeReport({ id: 'r1', barnId: 'child-7', dato: '2026-01-01' }),
      makeReport({ id: 'r3', barnId: 'child-7', dato: '2026-03-01' }),
      makeReport({ id: 'r2', barnId: 'child-7', dato: '2026-03-01' }),
      makeReport({ id: 'x', barnId: 'andre', dato: '2027-01-01' }),
    ];
    expect(reportsForChild(reps, 'child-7').map((r) => r.id)).toEqual(['r3', 'r2', 'r1']);
  });
});

describe('paymentRegister', () => {
  const pays = [
    makePayment({ id: 'a', dato: '2026-10-01', fadderNavn: 'Åse', belop: 250, type: 'fadderbidrag', metode: 'vipps', status: 'avstemt', referanse: 'B' }),
    makePayment({ id: 'b', dato: '2026-10-15', fadderNavn: 'Ola', belop: 500, type: 'aksjon', metode: 'bank', status: 'fullfort', referanse: 'A' }),
    makePayment({ id: 'c', dato: '2026-11-01', fadderNavn: 'Berit', belop: 350, type: 'fadderbidrag', metode: 'avtalegiro', status: 'forventet', referanse: 'C' }),
  ];
  it.each([
    ['2026-10-01', '2026-10-15', ['a', 'b']],
    ['2026-10-02', '2026-10-31', ['b']],
    ['', '', ['a', 'b', 'c']],
    ['2026-11-01', '', ['c']],
    ['', '2026-10-01', ['a']],
    ['2027-01-01', '2027-12-31', []],
  ])('periode %s - %s', (from, to, ids) => {
    expect(paymentsInRange(pays, from, to).map((p) => p.id)).toEqual(ids);
  });
  it.each<[PaymentSortKey, 'asc' | 'desc', string[]]>([
    ['dato', 'asc', ['a', 'b', 'c']],
    ['dato', 'desc', ['c', 'b', 'a']],
    ['belop', 'asc', ['a', 'c', 'b']],
    ['belop', 'desc', ['b', 'c', 'a']],
    ['giver', 'asc', ['c', 'b', 'a']],
    ['type', 'asc', ['b', 'c', 'a']],
    ['metode', 'asc', ['c', 'b', 'a']],
    ['referanse', 'asc', ['b', 'a', 'c']],
    ['status', 'asc', ['a', 'c', 'b']],
  ])('sortering %s %s', (key, dir, ids) => {
    expect(sortPayments(pays, key, dir).map((p) => p.id)).toEqual(ids);
  });
  it('totaler: sum, fordeling og avstemmingsgrad', () => {
    expect(paymentTotals(pays)).toEqual({ total: 1100, aksjon: 500, fadder: 600, avstemt: 250, avstemmingsgrad: 23 });
  });
  it('tom liste gir 0 og ingen avstemmingsgrad (ikke deling paa null)', () => {
    expect(paymentTotals([])).toEqual({ total: 0, aksjon: 0, fadder: 0, avstemt: 0, avstemmingsgrad: null });
  });
  it('alt avstemt gir 100 %', () => {
    expect(paymentTotals([makePayment({ status: 'avstemt', belop: 10 })]).avstemmingsgrad).toBe(100);
  });
  it('sortering endrer ikke inndata', () => {
    const ids = pays.map((p) => p.id);
    sortPayments(pays, 'belop', 'desc');
    expect(pays.map((p) => p.id)).toEqual(ids);
  });
  it('KJENT AVVIK F-25: negative og desimale belop summeres uten kontroll', () => {
    expect(paymentTotals([makePayment({ belop: -100 }), makePayment({ belop: 0.1 }), makePayment({ belop: 0.2 })]).total).toBeCloseTo(0.2 - 100 + 0.1, 5);
  });
});

describe('nyhetsbrev: mottakere', () => {
  const sponsors = [
    makeSponsor({ id: 's1', navn: 'A', epost: 'a@example.com' }),
    makeSponsor({ id: 's2', navn: 'B', epost: 'ugyldig' }),
    makeSponsor({ id: 's3', navn: 'C', epost: 'A@Example.com' }),
    makeSponsor({ id: 's4', navn: 'D', epost: '  d@example.com ' }),
  ];
  const coords = [
    makeCoordinator({ id: 'k1', epost: 'k1@example.com' }),
    makeCoordinator({ id: 'k2', epost: 'k2@example.com', aktiv: false }),
    makeCoordinator({ id: 'k3', epost: 'a@example.com' }),
    makeCoordinator({ id: 'k4', epost: '' }),
  ];
  it('faddere: bare gyldige, uten duplikater (uavhengig av store/smaa bokstaver)', () => {
    expect(buildNewsletterRecipients(sponsors, coords, 'sponsors').map((r) => r.email)).toEqual(['a@example.com', 'd@example.com']);
  });
  it('koordinatorer: bare aktive med gyldig e-post', () => {
    expect(buildNewsletterRecipients(sponsors, coords, 'coordinators').map((r) => r.email)).toEqual(['k1@example.com', 'a@example.com']);
  });
  it('alle: foerste forekomst vinner ved duplikat mellom grupper', () => {
    const all = buildNewsletterRecipients(sponsors, coords, 'all');
    expect(all.map((r) => r.email)).toEqual(['a@example.com', 'd@example.com', 'k1@example.com']);
    expect(all[0].role).toBe('sponsor');
  });
  it('tomme lister gir tomt resultat', () => expect(buildNewsletterRecipients([], [], 'all')).toEqual([]));
  it.each([
    ['a@b.no', true], ['a.b+c@d.e.no', true], ['  a@b.no  ', true],
    ['a@b', false], ['@b.no', false], ['a@.no', false], ['a@b..no', true], ['a b@c.no', false], ['', false], ['a@@b.no', false],
  ])('isValidEmail(%j) = %s', (e, ok) => expect(isValidEmail(e)).toBe(ok));
  it('mottakerlisten viser aldri barn eller intern informasjon', () => {
    for (const r of buildNewsletterRecipients(sponsors, coords, 'all')) {
      expect(Object.keys(r).sort()).toEqual(['email', 'name', 'role']);
    }
  });
});

describe('adminContentQueue og fieldFacts', () => {
  const facts = [
    makeFact({ id: 'f2', dato: '2026-09-02', status: 'sendt' }),
    makeFact({ id: 'f1', dato: '2026-09-01', status: 'sendt' }),
    makeFact({ id: 'f3', dato: '2026-09-03', status: 'publisert' }),
    makeFact({ id: 'f4', dato: '2026-09-04', status: 'ikke_sendt' }),
  ];
  const reps = [
    makeReport({ id: 'r1', dato: '2026-08-30', status: 'innsendt' }),
    makeReport({ id: 'r2', dato: '2026-09-10', status: 'godkjent', godkjentDato: '2026-09-12', tittelNorsk: 'Tittel' }),
    makeReport({ id: 'r3', dato: '2026-09-11', status: 'avvist' }),
    makeReport({ id: 'r4', dato: '2026-09-11', status: 'kladd' }),
  ];
  it('koe: kun fakta med status sendt og innsendte rapporter, eldste foerst', () => {
    expect(buildAdminContentQueue(facts, reps).map((i) => i.id)).toEqual(['r1', 'f1', 'f2']);
  });
  it('avviste rapporter og kladder er ikke i godkjenningskoen', () => {
    const ids = buildAdminContentQueue(facts, reps).map((i) => i.id);
    expect(ids).not.toContain('r3');
    expect(ids).not.toContain('r4');
  });
  it('register: koe pluss publiserte rapporter med godkjentDato', () => {
    const reg = buildAdminContentRegister(facts, reps);
    expect(reg.map((i) => `${i.id}:${i.status}`)).toEqual(['r1:venter', 'f1:venter', 'f2:venter', 'r2:publisert']);
    expect(reg.at(-1)?.dato).toBe('2026-09-12');
  });
  it('koen viser fransk original til admin (excerpt), registeret norsk tittel', () => {
    const q = buildAdminContentQueue([], [makeReport({ status: 'innsendt', innholdFransk: 'FR' })]);
    expect(q[0].excerpt).toBe('FR');
  });
  it('sortering paa status og barn, synkende og stigende', () => {
    const items = buildAdminContentRegister(facts, reps);
    expect(sortAdminContentItems(items, 'status', 'asc')[0].status).toBe('publisert');
    expect(sortAdminContentItems(items, 'status', 'desc')[0].status).toBe('venter');
    expect(sortAdminContentItems(items, 'dato', 'asc')[0].dato <= sortAdminContentItems(items, 'dato', 'asc')[1].dato).toBe(true);
  });
  it('historieutkast bruker fornavn, klasse, skole og trimmet trivsel', () => {
    expect(seedStoryFromFacts({ fornavn: 'Ange', skoleNavn: 'Skole', klassetrinn: '4', trivsel: '  Liker matte.  ' })).toBe('Ange går i 4 ved Skole.\n\nLiker matte.');
  });
  it('buildFieldFact kopierer barnedata, trimmer og setter status sendt', () => {
    const f = buildFieldFact({ child: makeChild({ id: 'c1', fornavn: 'Ange', skoleNavn: 'S', klassetrinn: '4' }), koordinatorId: 'k1', trivsel: '  hei  ', dato: '2026-01-01' });
    expect(f).toMatchObject({ barnId: 'c1', barnNavn: 'Ange', koordinatorId: 'k1', trivsel: 'hei', status: 'sendt', dato: '2026-01-01', skoleNavn: 'S', klassetrinn: '4' });
    expect(f.id).toMatch(/^fact-\d+$/);
  });
  it('buildFieldFact bruker dagens dato som standard', () => {
    expect(buildFieldFact({ child: makeChild(), koordinatorId: 'k', trivsel: 'x' }).dato).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('factsWaitingForStory rorer ikke inndata', () => {
    const ids = facts.map((f) => f.id);
    factsWaitingForStory(facts);
    expect(facts.map((f) => f.id)).toEqual(ids);
  });
});

describe('sponsorMetrics og sponsorChildren', () => {
  const sponsors = [
    makeSponsor({ id: 'a', startDato: '2026-10-01' }),
    makeSponsor({ id: 'b', startDato: '2026-10-15' }),
    makeSponsor({ id: 'c', startDato: '2026-09-01' }),
  ];
  it('filterSponsorsSince er inklusiv og nyeste foerst', () => {
    expect(filterSponsorsSince(sponsors, '2026-10-01').map((s) => s.id)).toEqual(['b', 'a']);
    expect(filterSponsorsSince(sponsors, '2026-10-16')).toEqual([]);
  });
  it('filterSponsorsLastDays regner fra gitt dato', () => {
    expect(filterSponsorsLastDays(sponsors, 30, new Date(2026, 9, 16)).map((s) => s.id)).toEqual(['b', 'a']);
    expect(filterSponsorsLastDays(sponsors, 60, new Date(2026, 9, 16)).map((s) => s.id)).toEqual(['b', 'a', 'c']);
  });
  it('childIdsOfSponsor filtrerer tomme verdier', () => {
    expect(childIdsOfSponsor({ tildeltBarnIds: ['a', '', 'b'] })).toEqual(['a', 'b']);
    expect(childIdsOfSponsor(null)).toEqual([]);
  });
  it('childrenOfSponsor gir bare tildelte barn', () => {
    const kids = [makeChild({ id: 'a' }), makeChild({ id: 'b' }), makeChild({ id: 'c' })];
    expect(childrenOfSponsor(kids, { tildeltBarnIds: ['a', 'c', 'finnes-ikke'] }).map((c) => c.id)).toEqual(['a', 'c']);
    expect(childrenOfSponsor(kids, undefined)).toEqual([]);
  });
  it('childNamesOfSponsor viser fornavn eller tankestrek', () => {
    const kids = [makeChild({ id: 'a', fornavn: 'Ange' }), makeChild({ id: 'b', fornavn: 'Beni' })];
    expect(childNamesOfSponsor(kids, { tildeltBarnIds: ['a', 'b'] })).toBe('Ange, Beni');
    expect(childNamesOfSponsor(kids, { tildeltBarnIds: [] })).toBe('\u2014');
  });
  it('addChildId og removeChildId er idempotente og rene', () => {
    const ids = ['a'];
    expect(addChildId(ids, 'a')).toBe(ids);
    expect(addChildId(ids, 'b')).toEqual(['a', 'b']);
    expect(ids).toEqual(['a']);
    expect(removeChildId(['a', 'b'], 'a')).toEqual(['b']);
    expect(removeChildId(['a'], 'x')).toEqual(['a']);
  });
  it('migrateSponsorsChildIds fyller tildeltBarnIds fra gammelt felt', () => {
    const out = migrateSponsorsChildIds([{ ...makeSponsor({ id: 'x' }), tildeltBarnIds: undefined as unknown as string[], ...({ tildeltBarnId: 'c1' } as object) }]);
    expect(out[0].tildeltBarnIds).toEqual(['c1']);
  });
});
