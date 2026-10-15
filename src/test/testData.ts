/**
 * Små, nøytrale byggere for testdata. Brukes bare av tester.
 * Ingenting herfra følger med appen, og appen har ingen innebygde data.
 */
import type {
  Campaign,
  CatalogPhoto,
  Child,
  Coordinator,
  FieldFact,
  PaymentRecord,
  Report,
  Sponsor,
} from '../types';

export const makeChild = (overrides: Partial<Child> = {}): Child => ({
  id: 'child-a',
  internKode: 'T-01',
  fornavn: 'Barn A',
  fodselsaar: 2016,
  kjonn: 'gutt',
  skoleNavn: 'Testskole',
  klassetrinn: '4',
  interesser: [],
  bakgrunnskontekst: '',
  fotoTema: 'skole',
  samtykkeFoto: true,
  samtykkeHistorie: true,
  status: 'aktiv',
  behovSammendrag: '',
  opprettetDato: '2026-01-01',
  sistOppdatert: '2026-01-01',
  koordinatorId: 'coord-a',
  ...overrides,
});

export const makeCoordinator = (overrides: Partial<Coordinator> = {}): Coordinator => ({
  id: 'coord-a',
  fornavn: 'Koordinator',
  etternavn: 'A',
  epost: 'koordinator.a@example.com',
  telefon: '',
  distrikt: 'Test',
  aktiv: true,
  ...overrides,
});

export const makeSponsor = (overrides: Partial<Sponsor> = {}): Sponsor => ({
  id: 'sponsor-a',
  navn: 'Fadder A',
  epost: 'fadder.a@example.com',
  telefon: '',
  poststed: 'Test',
  maanedsbelop: 250,
  betalingsmetode: 'vipps',
  betalingsstatus: 'aktiv',
  startDato: '2026-01-01',
  tildeltBarnIds: [],
  registrertKilde: 'admin',
  ...overrides,
});

export const makeReport = (overrides: Partial<Report> = {}): Report => ({
  id: 'rep-a',
  barnId: 'child-a',
  barnNavn: 'Barn A',
  koordinatorId: 'coord-a',
  koordinatorNavn: 'Koordinator A',
  dato: '2026-09-01',
  tittelFransk: '',
  innholdFransk: '',
  tittelNorsk: '',
  innholdNorsk: '',
  skoleprestasjon: '',
  oppmoteProsent: 90,
  status: 'innsendt',
  ...overrides,
});

export const makeFact = (overrides: Partial<FieldFact> = {}): FieldFact => ({
  id: 'fact-a',
  barnId: 'child-a',
  barnNavn: 'Barn A',
  koordinatorId: 'coord-a',
  dato: '2026-09-01',
  fornavn: 'Barn A',
  skoleNavn: 'Testskole',
  klassetrinn: '4',
  trivsel: 'Trives godt i klassen.',
  status: 'sendt',
  ...overrides,
});

export const makePayment = (overrides: Partial<PaymentRecord> = {}): PaymentRecord => ({
  id: 'pay-a',
  fadderNavn: 'Giver A',
  belop: 250,
  dato: '2026-10-01',
  type: 'fadderbidrag',
  metode: 'vipps',
  status: 'fullfort',
  referanse: 'REF-A',
  ...overrides,
});

export const makeCampaign = (overrides: Partial<Campaign> = {}): Campaign => ({
  id: 'camp-a',
  tittel: 'Testaksjon',
  beskrivelse: 'Beskrivelse',
  maalbelop: 1000,
  innsamletBelop: 0,
  enhetBeskrivelse: '',
  status: 'aktiv',
  antallGivere: 0,
  barnIds: ['child-a'],
  ...overrides,
});

export const makePhoto = (overrides: Partial<CatalogPhoto> = {}): CatalogPhoto => ({
  id: 'photo-a',
  barnIds: ['child-a'],
  url: '/test.jpg',
  beskrivelseFr: 'Classe',
  koordinatorId: 'coord-a',
  dato: '2026-10-01',
  status: 'publisert',
  ...overrides,
});
