import type { CmsContent, CmsTransparencyCard, CmsTransparencySection } from '../types';

/** Dagens tekster for «Økonomi og åpenhet». Brukes når CMS-dokumentet ikke har feltet ennå. */
export const DEFAULT_TRANSPARENCY_CARDS: CmsTransparencyCard[] = [
  {
    id: 'col1',
    title: 'Månedlig fadderbidrag',
    description:
      'Skolepenger, uniform, sekk, mat og det familien trenger for at barnet kan gå på skole — ofte er beløpet lite i norske øyne, men avgjørende lokalt.',
  },
  {
    id: 'col2',
    title: 'Liten reserve',
    description:
      'En andel settes av til sykdom og sykehus (malaria er en reell risiko) og til skolestart én gang i året, når sekk og utstyr må kjøpes inn på nytt.',
  },
  {
    id: 'col3',
    title: 'Ingen barnehjem-modell',
    description:
      'Vi støtter storfamilien som faktisk bærer ansvaret — ikke et fremmed barnehjem. Ekstra gaver fra fadder ved bursdag, jul eller akutte behov er populært, men frivillig.',
  },
];

export const DEFAULT_TRANSPARENCY_SECTION: CmsTransparencySection = {
  kicker: 'Økonomi & åpenhet',
  title: 'Slik pengene brukes',
  intro:
    'Fadderbidraget går uavkortet til barnet — via omsorgspersoner i storfamilien, ikke i lommen på barnet. Koordinatoren sørger for at skole, uniform, medisin og det nødvendige blir dekket.',
  secondary:
    'Ti faddere à 3 500 kroner i året gir 35 000 kroner til ett barns løp. Ingen lønn tas ut i Betyna. Vi er foreløpig ikke stiftelse — med vilje — så mer av det som kommer inn kan gå til barna.',
  cards: DEFAULT_TRANSPARENCY_CARDS,
};

export const TRANSPARENCY_MIN_CARDS = 1;
export const TRANSPARENCY_MAX_CARDS = 4;

/**
 * Fyller inn dagens tekster for felt som mangler i lagret CMS-dokument.
 * Eksisterende lagrede verdier vinner alltid.
 */
export function withTransparencyDefaults(
  section?: CmsTransparencySection | CmsContent['transparency']
): CmsTransparencySection {
  const cards =
    section?.cards && section.cards.length > 0 ? section.cards : DEFAULT_TRANSPARENCY_SECTION.cards;
  return {
    ...DEFAULT_TRANSPARENCY_SECTION,
    ...section,
    cards,
  };
}
