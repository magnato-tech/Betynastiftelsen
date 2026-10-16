import type { AdultGraduateStory, CmsTestimonialsSection } from '../types';

export const DEFAULT_TESTIMONIALS_SECTION: CmsTestimonialsSection = {
  enabled: true,
  kicker: 'Dokumenterte resultater',
  title: 'Ekte vitnesbyrd fra faddere og voksne mottakere',
  subtitle:
    'Mennesker Betyna hjalp som barn — og som nå er voksne og selv har sagt ja til å dele sin historie. Barn som fortsatt er i løpet, vises ikke her.',
  gridColumns: 3,
};

export function withTestimonialsSectionDefaults(
  section?: CmsTestimonialsSection
): CmsTestimonialsSection {
  return {
    ...DEFAULT_TESTIMONIALS_SECTION,
    ...section,
    gridColumns: section?.gridColumns === 2 ? 2 : 3,
  };
}

export function resolvePublicImageUrl(url?: string): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
}

export function storyHasPublicPhoto(story: AdultGraduateStory): boolean {
  return Boolean(
    resolvePublicImageUrl(story.bildeUrl) ||
      resolvePublicImageUrl(story.voksenBildeUrl) ||
      resolvePublicImageUrl(story.barneBildeUrl)
  );
}

/** Godkjent vitnesbyrd som kan vises på forsiden (runde 3). */
export function isFrontPageTestimonial(story: AdultGraduateStory): boolean {
  if (story.category === 'child') return false;
  if (!story.godkjentAvAdmin || !story.samtykkeDokumentert) return false;
  if (story.fremhevetPaaForside === false) return false;
  return storyHasPublicPhoto(story);
}

export type StoryDisplayPhotos = {
  child?: string;
  adult?: string;
  single?: string;
};

export function getStoryDisplayPhotos(story: AdultGraduateStory): StoryDisplayPhotos {
  const child = resolvePublicImageUrl(story.barneBildeUrl);
  const adult = resolvePublicImageUrl(story.voksenBildeUrl) ?? resolvePublicImageUrl(story.bildeUrl);
  if (child && adult) return { child, adult };
  if (adult) return { single: adult };
  if (child) return { single: child };
  return {};
}
