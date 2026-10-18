import { describe, expect, it } from 'vitest';
import { getPublishedWaitingSponsorCards, isWaitingSponsorCardPublished } from './waitingSponsors';
import type { CmsContent } from '../types';

describe('waitingSponsors', () => {
  it('publiserte kort krever kode og bilde', () => {
    expect(
      isWaitingSponsorCardPublished({
        id: '1',
        publicCode: 'COG-1',
        alder: 9,
        sted: 'X',
        bildeUrl: 'data:image/svg+xml,x',
      })
    ).toBe(true);
    expect(
      isWaitingSponsorCardPublished({
        id: '2',
        publicCode: '',
        alder: 9,
        sted: 'X',
        bildeUrl: 'x',
      })
    ).toBe(false);
  });

  it('filtrerer skjulte kort', () => {
    const cms = {
      waitingSponsorCards: [
        { id: 'a', publicCode: 'A', alder: 8, sted: 'Y', bildeUrl: 'u', publisertPaaForside: false },
        { id: 'b', publicCode: 'B', alder: 9, sted: 'Y', bildeUrl: 'u' },
      ],
    } as CmsContent;
    expect(getPublishedWaitingSponsorCards(cms)).toHaveLength(1);
  });
});
