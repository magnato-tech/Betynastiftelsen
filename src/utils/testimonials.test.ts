import { describe, expect, it } from 'vitest';
import type { AdultGraduateStory } from '../types';
import {
  getStoryDisplayPhotos,
  getTestimonialFrontPageChecklist,
  isFrontPageTestimonial,
} from './testimonials';

const base: AdultGraduateStory = {
  id: '1',
  navn: 'Test',
  historie: 'Hei',
  samtykkeDokumentert: true,
  godkjentAvAdmin: true,
  fremhevetPaaForside: true,
  category: 'graduate',
  bildeUrl: 'foto.jpg',
};

describe('isFrontPageTestimonial', () => {
  it('viser godkjent graduate med bilde', () => {
    expect(isFrontPageTestimonial(base)).toBe(true);
  });
  it('tillater barn/ungdom-kategori når øvrige krav er oppfylt', () => {
    expect(isFrontPageTestimonial({ ...base, category: 'child' })).toBe(true);
  });
  it('skjuler uten bilde', () => {
    expect(isFrontPageTestimonial({ ...base, bildeUrl: undefined })).toBe(false);
  });
});

describe('getTestimonialFrontPageChecklist', () => {
  it('markerer alle ok for gyldig forsideskort', () => {
    const items = getTestimonialFrontPageChecklist(base);
    expect(items.every((i) => i.ok)).toBe(true);
  });

  it('viser manglende bilde og samtykke', () => {
    const items = getTestimonialFrontPageChecklist({
      ...base,
      bildeUrl: undefined,
      samtykkeDokumentert: false,
    });
    expect(items.find((i) => i.id === 'photo')?.ok).toBe(false);
    expect(items.find((i) => i.id === 'consent')?.ok).toBe(false);
  });
});

describe('getStoryDisplayPhotos', () => {
  it('returnerer da og naa', () => {
    const photos = getStoryDisplayPhotos({
      ...base,
      barneBildeUrl: 'barn.jpg',
      voksenBildeUrl: 'voksen.jpg',
      bildeUrl: undefined,
    });
    expect(photos.child).toBe('/barn.jpg');
    expect(photos.adult).toBe('/voksen.jpg');
  });
});
