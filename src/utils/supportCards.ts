import type { CmsContent, CmsSupportCard, CmsSupportCardsSection } from '../types';

/** Dagens tekster for «Hva støtten gjør». Brukes når CMS-dokumentet ikke har feltet ennå. */
export const DEFAULT_SUPPORT_CARDS: CmsSupportCard[] = [
  {
    id: 'card1',
    title: 'Ett barn — din fadder',
    description:
      'Du støtter ett navn og ett liv. Ikke en anonym giverpool. Skoleplassen henger på at du er med over tid.',
  },
  {
    id: 'card2',
    title: 'Pengene til familien',
    description:
      'Bidraget går til omsorgspersoner som betaler skole, uniform, mat og medisin — slik det fungerer lokalt i Kongo.',
  },
  {
    id: 'card3',
    title: 'Hele veien til jobb',
    description:
      'Vi følger barnet til fagbrev, utdanning og en reell jobb — slik at det kan forsørge sin familie.',
  },
];

export const DEFAULT_SUPPORT_CARDS_SECTION: CmsSupportCardsSection = {
  kicker: 'Hva støtten gjør',
  title: 'Slik gjør bidraget ditt en forskjell',
  intro: '',
  cards: DEFAULT_SUPPORT_CARDS,
};

export const SUPPORT_CARDS_MIN_CARDS = 1;
export const SUPPORT_CARDS_MAX_CARDS = 3;

/**
 * Fyller inn dagens tekster for felt som mangler i lagret CMS-dokument.
 * Eksisterende lagrede verdier vinner alltid.
 */
export function withSupportCardsDefaults(
  section?: CmsSupportCardsSection | CmsContent['supportCards']
): CmsSupportCardsSection {
  const cards =
    section?.cards && section.cards.length > 0 ? section.cards : DEFAULT_SUPPORT_CARDS_SECTION.cards;
  return {
    ...DEFAULT_SUPPORT_CARDS_SECTION,
    ...section,
    cards,
  };
}
