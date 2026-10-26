import type { CmsAboutUsSection, CmsContent } from '../types';

/** Standardtekster for «Om oss». Brukes når CMS-dokumentet ikke har feltet ennå. Historien er tom til redaktøren skriver den. */
export const DEFAULT_ABOUT_US_SECTION: CmsAboutUsSection = {
  kicker: 'Om Betyna',
  title: 'Historien om Betyna',
  bodyHtml: '',
};

/**
 * Fyller inn standardtekster for felt som mangler i lagret CMS-dokument.
 * Eksisterende lagrede verdier vinner alltid.
 */
export function withAboutUsDefaults(section?: CmsAboutUsSection | CmsContent['aboutUs']): CmsAboutUsSection {
  return {
    ...DEFAULT_ABOUT_US_SECTION,
    ...section,
  };
}

/** Har seksjonen innhold som kan vises? Tomme avsnitt og mellomrom teller ikke. */
export function aboutUsHasText(section: CmsAboutUsSection): boolean {
  const plain = section.bodyHtml
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return plain.length > 0;
}
