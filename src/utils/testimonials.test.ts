import { describe, expect, it } from 'vitest';
import type { AdultGraduateStory } from '../types';
import { getStoryDisplayPhotos, isFrontPageTestimonial } from './testimonials';

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
  it('skjuler barn i løpet', () => {
    expect(isFrontPageTestimonial({ ...base, category: 'child' })).toBe(false);
  });
  it('skjuler uten bilde', () => {
    expect(isFrontPageTestimonial({ ...base, bildeUrl: undefined })).toBe(false);
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
