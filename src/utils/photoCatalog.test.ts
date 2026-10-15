import { describe, expect, it } from 'vitest';
import { INITIAL_CATALOG_PHOTOS, INITIAL_CHILDREN } from '../data/initialData';
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
  const ephraim = baseChild({ id: 'child-01', fornavn: 'Ephraim', internKode: 'BET-CD-01' });
  const jonathan = baseChild({ id: 'child-05', fornavn: 'Jonathan', internKode: 'BET-CD-05' });
  const ephraim2 = baseChild({ id: 'child-99', fornavn: 'Ephraim', internKode: 'BET-CD-99' });

  it('matcher id, intern kode og fornavn', () => {
    expect(childMatchesPhotoTag(ephraim, 'child-01')).toBe(true);
    expect(childMatchesPhotoTag(ephraim, 'BET-CD-01')).toBe(true);
    expect(childMatchesPhotoTag(ephraim, 'ephraim')).toBe(true);
    expect(childMatchesPhotoTag(jonathan, 'Ephraim')).toBe(false);
  });

  it('viser delt bilde på alle merket barn (barnIds)', () => {
    const shared = photo(['child-01', 'child-05'], 'shared');
    expect(photoTaggedForChild(shared, ephraim)).toBe(true);
    expect(photoTaggedForChild(shared, jonathan)).toBe(true);
    expect(catalogPhotosForChild([shared], ephraim).map((p) => p.id)).toEqual(['shared']);
    expect(catalogPhotosForChild([shared], jonathan).map((p) => p.id)).toEqual(['shared']);
  });

  it('viser bilde merket med fornavn på alle profiler med det navnet', () => {
    const byName = photo(['Ephraim'], 'name-tag');
    expect(catalogPhotosForChild([byName], ephraim)).toHaveLength(1);
    expect(catalogPhotosForChild([byName], ephraim2)).toHaveLength(1);
    expect(catalogPhotosForChild([byName], jonathan)).toHaveLength(0);
  });

  it('viser ikke umerket barns bilder', () => {
    const onlyEphraim = photo(['child-01']);
    expect(catalogPhotosForChild([onlyEphraim], jonathan)).toHaveLength(0);
  });

  it('seed: delt klassebilde vises på Ephraim og Dorcas', () => {
    const eph = INITIAL_CHILDREN.find((c) => c.id === 'child-01')!;
    const dor = INITIAL_CHILDREN.find((c) => c.id === 'child-02')!;
    const sam = INITIAL_CHILDREN.find((c) => c.id === 'child-03')!;
    const ephPhotos = catalogPhotosForChild(INITIAL_CATALOG_PHOTOS, eph).map((p) => p.id);
    const dorPhotos = catalogPhotosForChild(INITIAL_CATALOG_PHOTOS, dor).map((p) => p.id);
    expect(ephPhotos).toContain('photo-cat-01');
    expect(dorPhotos).toContain('photo-cat-01');
    expect(catalogPhotosForChild(INITIAL_CATALOG_PHOTOS, sam).map((p) => p.id)).not.toContain('photo-cat-01');
    expect(ephPhotos).toContain('photo-cat-04');
  });
});

describe('rapporter på barneprofil', () => {
  const reports: Report[] = [
    {
      id: 'r-old',
      barnId: 'child-01',
      barnNavn: 'Ephraim',
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
      barnNavn: 'Ephraim',
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
      barnNavn: 'Dorcas',
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
