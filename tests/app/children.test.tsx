// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { makeChild, makeCoordinator, makeFact, makeSponsor } from '../../src/test/testData';
import { mountApp, stored, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

/** App med to aktive koordinatorer og coord-a som innlogget koordinator (fallback for addChild). */
const medKoordinatorer = (extra: Record<string, unknown> = {}) => {
  const m = mountApp({ coordinators: [makeCoordinator({ id: 'coord-a' }), makeCoordinator({ id: 'coord-b' })], ...extra });
  m.run((a) => a.setCurrentCoordinatorId('coord-a'));
  return m;
};

describe('Registrering av barn (koordinator/admin)', () => {
  it('appen starter helt tom uten innebygde data', () => {
    const m = mountApp();
    expect(m.app.childrenList).toEqual([]);
    expect(m.app.sponsors).toEqual([]);
    expect(m.app.reports).toEqual([]);
    expect(m.app.payments).toEqual([]);
    expect(m.app.fieldFacts).toEqual([]);
    expect(m.app.coordinators).toEqual([]);
    expect(m.app.notifications).toEqual([]);
    expect(m.app.auditLogs).toEqual([]);
    expect(m.app.campaigns).toEqual([]);
    expect(m.app.stories).toEqual([]);
  });

  it('nytt barn faar id, intern kode, aktiv status og dagens dato', () => {
    const m = medKoordinatorer();
    m.run((a) => a.addChild({ fornavn: 'Ange', skoleNavn: 'Skole X', klassetrinn: '5' }));
    const [c] = m.app.childrenList;
    expect(c.id).toBe('child-01');
    expect(c.internKode).toBe('BET-CD-01');
    expect(c.status).toBe('aktiv');
    expect(c.opprettetDato).toBe('2026-10-16');
    expect(c.sistOppdatert).toBe('2026-10-16');
    expect(c.fornavn).toBe('Ange');
    expect(c.skoleNavn).toBe('Skole X');
  });

  it('flere barn faar fortlopende id og kode', () => {
    const m = medKoordinatorer();
    m.run((a) => a.addChild({ fornavn: 'A' }));
    m.run((a) => a.addChild({ fornavn: 'B' }));
    m.run((a) => a.addChild({ fornavn: 'C' }));
    expect(m.app.childrenList.map((c) => c.id)).toEqual(['child-01', 'child-02', 'child-03']);
    expect(m.app.childrenList.map((c) => c.internKode)).toEqual(['BET-CD-01', 'BET-CD-02', 'BET-CD-03']);
  });

  it('nytt barn havner i koordinatorens koe for "skriv historien" (fakta med status sendt)', () => {
    const m = medKoordinatorer();
    m.run((a) => a.addChild({ fornavn: 'Ange' }));
    expect(m.app.fieldFacts).toHaveLength(1);
    expect(m.app.fieldFacts[0]).toMatchObject({ barnId: 'child-01', status: 'sendt', fornavn: 'Ange' });
  });

  it('registrering skrives til revisjonsloggen', () => {
    const m = medKoordinatorer();
    m.run((a) => a.setRole('admin'));
    m.run((a) => a.addChild({ fornavn: 'Ange' }));
    expect(m.app.auditLogs[0]).toMatchObject({ handling: 'Registrerte nytt barn', brukerRolle: 'Administrator (Norge)' });
    expect(m.app.auditLogs[0].detaljer).toContain('Ange');
  });

  it('barnet knyttes til innlogget koordinator naar koordinatorId ikke oppgis', () => {
    const m = medKoordinatorer({ children: [] });
    m.run((a) => a.setCurrentCoordinatorId('coord-a'));
    m.run((a) => a.addChild({ fornavn: 'Ange' }));
    expect(m.app.childrenList[0].koordinatorId).toBe('coord-a');
  });

  it('oppgitt koordinatorId har forrang', () => {
    const m = medKoordinatorer();
    m.run((a) => a.setCurrentCoordinatorId('coord-a'));
    m.run((a) => a.addChild({ fornavn: 'Ange', koordinatorId: 'coord-b' }));
    expect(m.app.childrenList[0].koordinatorId).toBe('coord-b');
  });

  it('barn uten gyldig koordinator avvises (ingen innlogget koordinator og ingen oppgitt)', () => {
    const m = mountApp({ coordinators: [makeCoordinator({ id: 'coord-a' })] });
    expect(() => m.run((a) => a.addChild({ fornavn: 'Ange' }))).toThrow('Eleven må knyttes til en aktiv koordinator.');
    expect(m.app.childrenList).toEqual([]);
  });

  it('barn kan ikke knyttes til en arkivert koordinator', () => {
    const m = mountApp({ coordinators: [makeCoordinator({ id: 'coord-x', aktiv: false })] });
    expect(() => m.run((a) => a.addChild({ fornavn: 'Ange', koordinatorId: 'coord-x' }))).toThrow(
      'Eleven må knyttes til en aktiv koordinator.'
    );
    expect(m.app.childrenList).toEqual([]);
  });

  it('registrering uten koordinator avvises ogsaa i localStorage-modus (koordinatorer lastes ikke derfra)', () => {
    const m = mountApp({}, undefined, { local: true });
    expect(() => m.run((a) => a.addChild({ fornavn: 'Ange', koordinatorId: 'coord-a' }))).toThrow(
      'Eleven må knyttes til en aktiv koordinator.'
    );
    expect(stored<unknown[]>('children') ?? []).toEqual([]);
  });

  it('barn i koordinatorens liste er kun egne aktive barn', () => {
    const m = mountApp({
      coordinators: [],
      children: [
        makeChild({ id: 'c1', koordinatorId: 'k1' }),
        makeChild({ id: 'c2', koordinatorId: 'k2' }),
        makeChild({ id: 'c3', koordinatorId: 'k1', status: 'avsluttet' }),
      ],
    });
    m.run((a) => a.setCurrentCoordinatorId('k1'));
    expect(m.app.coordinatorChildren.map((c) => c.id)).toEqual(['c1']);
  });
});

describe('KJENT AVVIK: registrering av barn skaper data som ikke er oppgitt (F-18, F-22)', () => {
  it('F-22: samtykke til foto og historie settes til JA som standard naar det ikke er oppgitt', () => {
    const m = medKoordinatorer();
    m.run((a) => a.addChild({ fornavn: 'Ange' }));
    expect(m.app.childrenList[0].samtykkeFoto).toBe(true);
    expect(m.app.childrenList[0].samtykkeHistorie).toBe(true);
  });
  it('F-22: eksplisitt nei til samtykke respekteres', () => {
    const m = medKoordinatorer();
    m.run((a) => a.addChild({ fornavn: 'Ange', samtykkeFoto: false, samtykkeHistorie: false }));
    expect(m.app.childrenList[0].samtykkeFoto).toBe(false);
    expect(m.app.childrenList[0].samtykkeHistorie).toBe(false);
  });
  it('F-18: manglende skole, klassetrinn, interesser og bakgrunn fylles med oppdiktede standardverdier', () => {
    const m = medKoordinatorer();
    m.run((a) => a.addChild({ fornavn: 'Ange' }));
    const c = m.app.childrenList[0];
    expect(c.skoleNavn).toContain('Sainte-Thérèse');
    expect(c.klassetrinn).toContain('3. klasse');
    expect(c.interesser).toEqual(['Tegning', 'Matematikk']);
    expect(c.bakgrunnskontekst).toContain('samtykke fra foresatte');
    expect(c.fodselsaar).toBe(2017);
  });
  it('F-18: tomt fornavn blir "Elev" i stedet for aa avvise registreringen', () => {
    const m = medKoordinatorer();
    m.run((a) => a.addChild({}));
    expect(m.app.childrenList[0].fornavn).toBe('Elev');
  });
  it('F-17: ny id kan kollidere med eksisterende barn naar rekken har hull (to barn med samme id)', () => {
    const m = medKoordinatorer({
      children: [makeChild({ id: 'child-02', fornavn: 'Eksisterende 2' }), makeChild({ id: 'child-03', fornavn: 'Eksisterende 3' })],
    });
    m.run((a) => a.addChild({ fornavn: 'Nytt barn' }));
    const ids = m.app.childrenList.map((c) => c.id);
    expect(ids.filter((id) => id === 'child-03')).toHaveLength(2);
  });
});

describe('Historie til fadder (koordinatorfakta -> admin publiserer)', () => {
  const base = () => ({
    children: [makeChild({ id: 'c1', fornavn: 'Ange', koordinatorId: 'k1' })],
    fieldFacts: [makeFact({ id: 'f1', barnId: 'c1', barnNavn: 'Ange' })],
  });
  const draft = { fornavn: 'Ange', skoleNavn: 'Ny skole', klassetrinn: '6', trivsel: 'Redigert trivsel', historie: 'Ange liker matte.' };

  it('koordinator sender fakta og det havner foerst i koeen', () => {
    const m = mountApp(base());
    m.run((a) => a.submitFieldFact('c1', '  Leker med venner  '));
    expect(m.app.fieldFacts[0]).toMatchObject({ barnId: 'c1', trivsel: 'Leker med venner', status: 'sendt', koordinatorId: 'k1' });
  });
  it('tomt faktum avvises', () => {
    const m = mountApp(base());
    m.run((a) => a.submitFieldFact('c1', '   '));
    expect(m.app.fieldFacts).toHaveLength(1);
  });
  it('faktum for ukjent barn avvises', () => {
    const m = mountApp(base());
    m.run((a) => a.submitFieldFact('finnes-ikke', 'tekst'));
    expect(m.app.fieldFacts).toHaveLength(1);
  });
  it('publisering oppdaterer faktum og barnets historie', () => {
    const m = mountApp(base());
    m.run((a) => a.publishChildStory('f1', draft));
    expect(m.app.fieldFacts[0]).toMatchObject({ status: 'publisert', skoleNavn: 'Ny skole', klassetrinn: '6', trivsel: 'Redigert trivsel' });
    expect(m.app.childrenList[0]).toMatchObject({ bakgrunnskontekst: 'Ange liker matte.', skoleNavn: 'Ny skole', klassetrinn: '6', sistOppdatert: '2026-10-16' });
  });
  it('publisering uten historietekst gjor ingenting', () => {
    const m = mountApp(base());
    m.run((a) => a.publishChildStory('f1', { ...draft, historie: '   ' }));
    expect(m.app.fieldFacts[0].status).toBe('sendt');
    expect(m.app.childrenList[0].bakgrunnskontekst).toBe('');
  });
  it('publisering av ukjent faktum gjor ingenting', () => {
    const m = mountApp(base());
    m.run((a) => a.publishChildStory('nei', draft));
    expect(m.app.fieldFacts[0].status).toBe('sendt');
  });
  it('publisering skriver revisjonslogg', () => {
    const m = mountApp(base());
    m.run((a) => a.publishChildStory('f1', draft));
    expect(m.app.auditLogs[0].handling).toBe('Publiserte historie til fadder');
  });
  it('publisering paavirker ikke andre barn', () => {
    const m = mountApp({
      children: [makeChild({ id: 'c1' }), makeChild({ id: 'c2', fornavn: 'Annet', bakgrunnskontekst: 'Uendret' })],
      fieldFacts: [makeFact({ id: 'f1', barnId: 'c1' })],
    });
    m.run((a) => a.publishChildStory('f1', draft));
    expect(m.app.childrenList[1].bakgrunnskontekst).toBe('Uendret');
  });
});

describe('Oppdatering av barneprofil', () => {
  it('updateChild endrer bare valgte felt og oppdaterer sistOppdatert', () => {
    const m = mountApp({ children: [makeChild({ id: 'c1', fornavn: 'Ange', sistOppdatert: '2020-01-01' })] });
    m.run((a) => a.updateChild('c1', { skoleNavn: 'Ny skole' }));
    expect(m.app.childrenList[0]).toMatchObject({ fornavn: 'Ange', skoleNavn: 'Ny skole', sistOppdatert: '2026-10-16' });
  });
  it('updateChild for ukjent id endrer ingenting', () => {
    const m = mountApp({ children: [makeChild({ id: 'c1' })] });
    m.run((a) => a.updateChild('ukjent', { fornavn: 'X' }));
    expect(m.app.childrenList[0].fornavn).toBe('Barn A');
  });
  it('updateChild logger handlingen', () => {
    const m = mountApp({ children: [makeChild({ id: 'c1' })] });
    m.run((a) => a.updateChild('c1', { fornavn: 'Y' }));
    expect(m.app.auditLogs[0].handling).toBe('Oppdaterte barneprofil');
  });
  it('updateChild kan avslutte et barn uten at fadderkoblingen ryddes (bruk endSponsorship)', () => {
    const m = mountApp({
      children: [makeChild({ id: 'c1', tildeltFadderId: 's1' })],
      sponsors: [makeSponsor({ id: 's1', tildeltBarnIds: ['c1'] })],
    });
    m.run((a) => a.updateChild('c1', { status: 'avsluttet' }));
    expect(m.app.childrenList[0].tildeltFadderId).toBe('s1');
    expect(m.app.sponsors[0].tildeltBarnIds).toEqual(['c1']);
  });
});

describe('Barnebilder: innsending og godkjenning', () => {
  const kid = (o = {}) => makeChild({ id: 'c1', fornavn: 'Ange', koordinatorId: 'k1', tildeltFadderId: 's1', ...o });
  const setup = (child = kid()) =>
    mountApp({
      children: [child],
      coordinators: [makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'K' })],
      sponsors: [makeSponsor({ id: 's1', tildeltBarnIds: ['c1'] })],
    });

  it('innsendt bilde blir ventende og varsler admin', () => {
    const m = setup();
    m.run((a) => a.submitChildPhoto('c1', 'data:image/png;base64,AAA', 'Classe'));
    expect(m.app.childrenList[0]).toMatchObject({ ventendeFotoUrl: 'data:image/png;base64,AAA', ventendeFotoStatus: 'innsendt', ventendeFotoBeskrivelseFr: 'Classe' });
    expect(m.app.childrenList[0].publisertFotoUrl).toBeUndefined();
    const n = m.app.notifications.find((x) => x.type === 'photo_needs_approval');
    expect(n).toMatchObject({ targetRole: 'admin', relatedEntityId: 'c1' });
  });
  it('bilde uten samtykke avvises helt', () => {
    const m = setup(kid({ samtykkeFoto: false }));
    m.run((a) => a.submitChildPhoto('c1', 'data:image/png;base64,AAA', 'x'));
    expect(m.app.childrenList[0].ventendeFotoUrl).toBeUndefined();
    expect(m.app.notifications).toHaveLength(0);
  });
  it('bilde for ukjent barn avvises', () => {
    const m = setup();
    m.run((a) => a.submitChildPhoto('nei', 'data:x', 'x'));
    expect(m.app.notifications).toHaveLength(0);
  });
  it('ventende bilde er IKKE synlig som publisert foer godkjenning', () => {
    const m = setup();
    m.run((a) => a.submitChildPhoto('c1', 'data:image/png;base64,AAA', 'x'));
    expect(m.app.childrenList[0].publisertFotoUrl).toBeUndefined();
  });
  it('godkjenning publiserer bildet og tømmer ventende felt', () => {
    const m = setup();
    m.run((a) => a.submitChildPhoto('c1', 'data:image/png;base64,AAA', 'x'));
    m.tick();
    m.run((a) => a.approveChildPhoto('c1'));
    expect(m.app.childrenList[0]).toMatchObject({ publisertFotoUrl: 'data:image/png;base64,AAA' });
    expect(m.app.childrenList[0].ventendeFotoUrl).toBeUndefined();
    expect(m.app.childrenList[0].ventendeFotoStatus).toBeUndefined();
  });
  it('godkjenning varsler tildelt fadder og koordinator', () => {
    const m = setup();
    m.run((a) => a.submitChildPhoto('c1', 'data:image/png;base64,AAA', 'x'));
    m.tick();
    m.run((a) => a.approveChildPhoto('c1'));
    const approved = m.app.notifications.filter((n) => n.type === 'photo_approved');
    expect(approved.map((n) => `${n.targetRole}:${n.recipientId}`).sort()).toEqual(['coordinator:k1', 'sponsor:s1']);
  });
  it('godkjenning uten fadder varsler bare koordinator', () => {
    const m = setup(kid({ tildeltFadderId: undefined }));
    m.run((a) => a.submitChildPhoto('c1', 'data:image/png;base64,AAA', 'x'));
    m.tick();
    m.run((a) => a.approveChildPhoto('c1'));
    const approved = m.app.notifications.filter((n) => n.type === 'photo_approved');
    expect(approved.map((n) => n.targetRole)).toEqual(['coordinator']);
  });
  it('godkjenning uten ventende bilde gjor ingenting', () => {
    const m = setup();
    m.run((a) => a.approveChildPhoto('c1'));
    expect(m.app.childrenList[0].publisertFotoUrl).toBeUndefined();
    expect(m.app.notifications).toHaveLength(0);
  });
  it('avvisning fjerner ventende bilde, setter status avvist og varsler koordinator', () => {
    const m = setup();
    m.run((a) => a.submitChildPhoto('c1', 'data:image/png;base64,AAA', 'x'));
    m.tick();
    m.run((a) => a.rejectChildPhoto('c1', 'Uskarpt'));
    expect(m.app.childrenList[0].ventendeFotoUrl).toBeUndefined();
    expect(m.app.childrenList[0].ventendeFotoStatus).toBe('avvist');
    const n = m.app.notifications.find((x) => x.type === 'photo_rejected');
    expect(n).toMatchObject({ targetRole: 'coordinator', recipientId: 'k1' });
    expect(n?.message).toContain('Uskarpt');
  });
  it('avvisning beholder allerede publisert bilde', () => {
    const m = setup(kid({ publisertFotoUrl: 'data:gammelt' }));
    m.run((a) => a.submitChildPhoto('c1', 'data:nytt', 'x'));
    m.tick();
    m.run((a) => a.rejectChildPhoto('c1', 'nei'));
    expect(m.app.childrenList[0].publisertFotoUrl).toBe('data:gammelt');
  });
  it('avvisning av ukjent barn gjor ingenting', () => {
    const m = setup();
    m.run((a) => a.rejectChildPhoto('nei', 'x'));
    expect(m.app.notifications).toHaveLength(0);
  });
  it('katalogbilde uten merking av barn avvises', () => {
    const m = setup();
    let id = 'x';
    m.run((a) => {
      id = a.addCatalogPhoto({ barnIds: ['  ', ''], url: 'u', beskrivelseFr: 'b', koordinatorId: 'k1', dato: '2026-10-16', status: 'innsendt' });
    });
    expect(id).toBe('');
    expect(m.app.catalogPhotos).toHaveLength(0);
  });
  it('katalogbilde lagres med trimmede barn-tagger', () => {
    const m = setup();
    m.run((a) => {
      a.addCatalogPhoto({ barnIds: [' c1 ', 'Ange'], url: 'u', beskrivelseFr: 'b', koordinatorId: 'k1', dato: '2026-10-16', status: 'innsendt' });
    });
    expect(m.app.catalogPhotos[0].barnIds).toEqual(['c1', 'Ange']);
    expect(m.app.catalogPhotos[0].id).toMatch(/^photo-cat-/);
  });
  it('katalogbilde kan oppdateres (godkjennes)', () => {
    const m = setup();
    let id = '';
    m.run((a) => {
      id = a.addCatalogPhoto({ barnIds: ['c1'], url: 'u', beskrivelseFr: 'b', koordinatorId: 'k1', dato: '2026-10-16', status: 'innsendt' });
    });
    m.run((a) => a.updateCatalogPhoto(id, { status: 'publisert' }));
    expect(m.app.catalogPhotos[0].status).toBe('publisert');
  });
});

describe('Milepaeler', () => {
  const setup = () =>
    mountApp({
      children: [makeChild({ id: 'c1', fornavn: 'Ange', koordinatorId: 'k1', tildeltFadderId: 's1' })],
      sponsors: [makeSponsor({ id: 's1', tildeltBarnIds: ['c1'] })],
    });
  const data = {
    barnId: 'c1',
    barnNavn: '',
    dato: '2026-10-10',
    kategori: 'skole' as const,
    tittelFransk: 'Examen reussi',
    beskrivelseFransk: 'Bravo',
    tittelNorsk: 'Bestod eksamen',
    beskrivelseNorsk: 'Bra jobba',
    koordinatorNavn: 'Kari',
  };
  it('lager milepael med id, opprettetDato og barnenavn fra profilen', () => {
    const m = setup();
    m.run((a) => a.addMilestone(data));
    expect(m.app.milestones[0]).toMatchObject({ barnId: 'c1', barnNavn: 'Ange', opprettetDato: '2026-10-16', tittelNorsk: 'Bestod eksamen' });
    expect(m.app.milestones[0].id).toMatch(/^milestone-/);
  });
  it('varsler fadder og koordinator', () => {
    const m = setup();
    m.run((a) => a.addMilestone(data));
    const n = m.app.notifications.filter((x) => x.type === 'milestone_logged');
    expect(n.map((x) => `${x.targetRole}:${x.recipientId}`).sort()).toEqual(['coordinator:k1', 'sponsor:s1']);
  });
  it('milepael for barn uten fadder varsler bare koordinator', () => {
    const m = mountApp({ children: [makeChild({ id: 'c1', koordinatorId: 'k1' })] });
    m.run((a) => a.addMilestone(data));
    expect(m.app.notifications.map((n) => n.targetRole)).toEqual(['coordinator']);
  });
  it('kan oppdateres og slettes', () => {
    const m = setup();
    let id = '';
    m.run((a) => {
      id = a.addMilestone(data);
    });
    m.run((a) => a.updateMilestone(id, { tittelNorsk: 'Endret' }));
    expect(m.app.milestones[0].tittelNorsk).toBe('Endret');
    m.run((a) => a.deleteMilestone(id));
    expect(m.app.milestones).toHaveLength(0);
    expect(m.app.auditLogs.map((l) => l.handling)).toEqual(expect.arrayContaining(['Registrerte milepæl', 'Oppdaterte milepæl', 'Slettet milepæl']));
  });
  it('KJENT AVVIK F-16: milepaelen faar ikke koordinatorId (regler for koordinator-lesing krever feltet)', () => {
    const m = setup();
    m.run((a) => a.addMilestone(data));
    expect((m.app.milestones[0] as unknown as Record<string, unknown>).koordinatorId).toBeUndefined();
  });
});
