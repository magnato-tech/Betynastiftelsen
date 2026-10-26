import type { CmsContent, CmsPrincipleCard } from '../types';

export type AboutCardsColumns = 2 | 3 | 4;

/** Kjernerammer som skal vises på nettsiden (mangler `published` = publisert). */
export function publishedAboutCards(cards: CmsPrincipleCard[]): CmsPrincipleCard[] {
  return cards.filter((card) => card.published !== false);
}

export function aboutCardsColumns(cms: Pick<CmsContent, 'aboutCardsColumns'>): AboutCardsColumns {
  const cols = cms.aboutCardsColumns;
  return cols === 2 || cols === 4 ? cols : 3;
}

/** Tailwind-klasser for rutenettet; mobil er alltid én kolonne. */
export function aboutCardsGridClass(columns: AboutCardsColumns): string {
  switch (columns) {
    case 2:
      return 'grid-cols-1 sm:grid-cols-2';
    case 4:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    default:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }
}
