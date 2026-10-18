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

/** Forklaring til admin (infoboks / modal) om forsidesynlighet. */
export const FRONT_PAGE_TESTIMONIAL_ADMIN_HELP =
  'Kun kort som oppfyller alle krav telles i rutenettet over: bilde, dokumentert samtykke, admin-godkjenning, og ikke merket skjult. Kategori (fadder, barn/ungdom, fullført elev) begrenser ikke forsiden — admin velger selv. «På forsiden» og «Skjult» styrer om kortet skal med. Kolonnevalg 2/3 er layout når nok kort er klare.';

/** Godkjent vitnesbyrd som kan vises på forsiden (runde 3). */
export function isFrontPageTestimonial(story: AdultGraduateStory): boolean {
  return getTestimonialFrontPageBlockers(story).length === 0;
}

/** Hvorfor et vitnesbyrd ikke vises på forsiden (tom = vises). */
export function getTestimonialFrontPageBlockers(story: AdultGraduateStory): string[] {
  const reasons: string[] = [];
  if (!story.samtykkeDokumentert) {
    reasons.push('Mangler dokumentert samtykke');
  }
  if (!story.godkjentAvAdmin) {
    reasons.push('Mangler admin-godkjenning');
  }
  if (!storyHasPublicPhoto(story)) {
    reasons.push('Mangler bilde');
  }
  if (story.fremhevetPaaForside === false) {
    reasons.push('Skjult fra forsiden');
  }
  return reasons;
}

export type TestimonialFrontPageCheckItem = {
  id: string;
  label: string;
  ok: boolean;
};

/** Status for alle krav til forsiden (samme regler som blockers). */
export function getTestimonialFrontPageChecklist(story: AdultGraduateStory): TestimonialFrontPageCheckItem[] {
  return [
    {
      id: 'photo',
      label: 'Minst ett bilde',
      ok: storyHasPublicPhoto(story),
    },
    {
      id: 'consent',
      label: 'Dokumentert samtykke',
      ok: Boolean(story.samtykkeDokumentert),
    },
    {
      id: 'approved',
      label: 'Godkjent av admin',
      ok: Boolean(story.godkjentAvAdmin),
    },
    {
      id: 'featured',
      label: 'Valgt for forsiden (ikke skjult)',
      ok: story.fremhevetPaaForside !== false,
    },
  ];
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
