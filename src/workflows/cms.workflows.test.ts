import { describe, expect, it } from 'vitest';
import type { AdultGraduateStory } from '../types';
import { getTestimonialFrontPageBlockers, isFrontPageTestimonial } from '../utils/testimonials';
import { visibleHomeModules } from '../utils/cmsHomeLayout';
import { EMPTY_CMS_CONTENT } from '../db/seedPolicy';

const baseStory = (): AdultGraduateStory => ({
  id: 's1',
  navn: 'Test',
  historie: 'Sitat her som er langt nok.',
  aarFullfort: 2024,
  godkjentAvAdmin: true,
  samtykkeDokumentert: true,
  bildeUrl: 'foto.jpg',
  category: 'graduate',
  fremhevetPaaForside: true,
});

describe('CMS arbeidsflyt: bibliotek og forside', () => {
  it('vitnesbyrd uten bilde er i biblioteket men ikke på forsiden', () => {
    const st = { ...baseStory(), bildeUrl: undefined };
    expect(isFrontPageTestimonial(st)).toBe(false);
    expect(getTestimonialFrontPageBlockers(st)).toContain('Mangler bilde');
  });

  it('skjult vitnesbyrd forsvinner fra forsiden', () => {
    const st = { ...baseStory(), fremhevetPaaForside: false };
    expect(isFrontPageTestimonial(st)).toBe(false);
  });

  it('homeLayout kan skjule vitnesbyrd-modulen', () => {
    const cms = {
      ...EMPTY_CMS_CONTENT,
      homeLayout: [
        { moduleId: 'hero', visible: true },
        { moduleId: 'stories', visible: false },
        { moduleId: 'steps', visible: true },
        { moduleId: 'kpis', visible: true },
        { moduleId: 'about', visible: true },
        { moduleId: 'cta', visible: true },
        { moduleId: 'behov', visible: true },
      ],
    };
    expect(visibleHomeModules(cms as any)).not.toContain('stories');
  });
});
