import { describe, expect, it } from 'vitest';
import type { CatalogPhoto, Child, Report } from '../types';
import {
  catalogPhotosForChild,
  childMatchesPhotoTag,
  coordinatorChildProfileSection,
  parseCoordinatorChildProfileId,
  photoTaggedForChild,
  reportsForChild,
} from './photoCatalog';

const baseChild = (overrides: Partial<Child> & Pick<Child, 'id' | 'fornavn' | 'internKode'>): Child => ({
  fodselsaar: 2016,
  kjonn: 'gutt',
  skoleNavn: 'École Primaire Sainte-Thérèse, Brazzaville',
  klassetrinn: '4ème',
  interesser: [],
  bakgrunnskontekst: 'Prototype',
  fotoTema: 'skole',
  samtykkeFoto: true,
  samtykkeHistorie: true,
  status: 'aktiv',
  behovSammendrag: '',
  opprettetDato: '2026-01-01',
  sistOppdatert: '2026-10-15',
  koordinatorId: 'coord-01',
  ...overrides,
});

const photo = (barnIds: string[], id = 'p1'): CatalogPhoto => ({
  id,
  barnIds,
  url: '/school.jpg',
  beskrivelseFr: 'Classe',
  koordinatorId: 'coord-01',
  dato: '2026-10-01',
  status: 'publisert',
});

describe('koordinator barneprofil — navigasjon', () => {
  it('bygger og parser profil-seksjon', () => {
    expect(coordinatorChildProfileSection('child-01')).toBe('profil:child-01');
    expect(parseCoordinatorChildProfileId('profil:child-01')).toBe('child-01');
    expect(parseCoordinatorChildProfileId('eleves')).toBeNull();
  });
});

describe('bildemerking og delte bilder', () => {
  const alfa = baseChild({ id: 'child-01', fornavn: 'Alfa', internKode: 'BET-CD-01' });
  const jonathan = baseChild({ id: 'child-05', fornavn: 'Beta', internKode: 'BET-CD-05' });
  const alfa2 = baseChild({ id: 'child-99', fornavn: 'Alfa', internKode: 'BET-CD-99' });

  it('matcher id, intern kode og fornavn', () => {
    expect(childMatchesPhotoTag(alfa, 'child-01')).toBe(true);
    expect(childMatchesPhotoTag(alfa, 'BET-CD-01')).toBe(true);
    expect(childMatchesPhotoTag(alfa, 'alfa')).toBe(true);
    expect(childMatchesPhotoTag(jonathan, 'Alfa')).toBe(false);
  });

  it('viser delt bilde på alle merket barn (barnIds)', () => {
    const shared = photo(['child-01', 'child-05'], 'shared');
    expect(photoTaggedForChild(shared, alfa)).toBe(true);
    expect(photoTaggedForChild(shared, jonathan)).toBe(true);
    expect(catalogPhotosForChild([shared], alfa).map((p) => p.id)).toEqual(['shared']);
    expect(catalogPhotosForChild([shared], jonathan).map((p) => p.id)).toEqual(['shared']);
  });

  it('viser bilde merket med fornavn på alle profiler med det navnet', () => {
    const byName = photo(['Alfa'], 'name-tag');
    expect(catalogPhotosForChild([byName], alfa)).toHaveLength(1);
    expect(catalogPhotosForChild([byName], alfa2)).toHaveLength(1);
    expect(catalogPhotosForChild([byName], jonathan)).toHaveLength(0);
  });

  it('viser ikke umerket barns bilder', () => {
    const onlyAlfa = photo(['child-01']);
    expect(catalogPhotosForChild([onlyAlfa], jonathan)).toHaveLength(0);
  });

  it('delt klassebilde vises bare på merkede barn', () => {
    const other = baseChild({ id: 'child-03', fornavn: 'Zeta', internKode: 'BET-CD-03' });
    const catalog = [photo(['child-01', 'child-05'], 'class'), photo(['child-01'], 'single')];
    expect(catalogPhotosForChild(catalog, alfa).map((p) => p.id)).toEqual(
      expect.arrayContaining(['class', 'single'])
    );
    expect(catalogPhotosForChild(catalog, jonathan).map((p) => p.id)).toEqual(['class']);
    expect(catalogPhotosForChild(catalog, other)).toHaveLength(0);
  });
});

describe('rapporter på barneprofil', () => {
  const reports: Report[] = [
    {
      id: 'r-old',
      barnId: 'child-01',
      barnNavn: 'Alfa',
      koordinatorId: 'coord-01',
      koordinatorNavn: 'JB',
      dato: '2026-05-15',
      tittelFransk: 'Ancien',
      innholdFransk: '',
      tittelNorsk: '',
      innholdNorsk: '',
      skoleprestasjon: '',
      oppmoteProsent: 90,
      status: 'godkjent',
    },
    {
      id: 'r-new',
      barnId: 'child-01',
      barnNavn: 'Alfa',
      koordinatorId: 'coord-01',
      koordinatorNavn: 'JB',
      dato: '2026-09-25',
      tittelFransk: 'Récent',
      innholdFransk: '',
      tittelNorsk: '',
      innholdNorsk: '',
      skoleprestasjon: '',
      oppmoteProsent: 96,
      status: 'innsendt',
    },
    {
      id: 'r-other',
      barnId: 'child-02',
      barnNavn: 'Gamma',
      koordinatorId: 'coord-01',
      koordinatorNavn: 'JB',
      dato: '2026-09-20',
      tittelFransk: 'Autre',
      innholdFransk: '',
      tittelNorsk: '',
      innholdNorsk: '',
      skoleprestasjon: '',
      oppmoteProsent: 98,
      status: 'godkjent',
    },
  ];

  it('filtrerer og sorterer rapporter for ett barn', () => {
    const list = reportsForChild(reports, 'child-01');
    expect(list.map((r) => r.id)).toEqual(['r-new', 'r-old']);
    expect(reportsForChild(reports, 'child-02')).toHaveLength(1);
    expect(reportsForChild(reports, 'child-99')).toHaveLength(0);
  });
});
