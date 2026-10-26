import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SUPPORT_CARDS_SECTION,
  SUPPORT_CARDS_MAX_CARDS,
  SUPPORT_CARDS_MIN_CARDS,
  withSupportCardsDefaults,
} from './supportCards';

describe('supportCards', () => {
  it('standardtekstene er dagens tre kort', () => {
    expect(DEFAULT_SUPPORT_CARDS_SECTION.kicker).toBe('Hva støtten gjør');
    expect(DEFAULT_SUPPORT_CARDS_SECTION.title).toBe('Slik gjør bidraget ditt en forskjell');
    expect(DEFAULT_SUPPORT_CARDS_SECTION.cards.map((c) => c.title)).toEqual([
      'Ett barn — din fadder',
      'Pengene til familien',
      'Hele veien til jobb',
    ]);
  });

  it('antall kort: 1 til 3', () => {
    expect(SUPPORT_CARDS_MIN_CARDS).toBe(1);
    expect(SUPPORT_CARDS_MAX_CARDS).toBe(3);
  });

  it('mangler feltet, får man standardtekstene', () => {
    expect(withSupportCardsDefaults(undefined)).toEqual(DEFAULT_SUPPORT_CARDS_SECTION);
  });

  it('lagrede verdier vinner, og tomme kort faller tilbake til standard', () => {
    const result = withSupportCardsDefaults({
      kicker: 'Egen',
      title: 'Egen tittel',
      cards: [],
    });
    expect(result.kicker).toBe('Egen');
    expect(result.title).toBe('Egen tittel');
    expect(result.cards).toEqual(DEFAULT_SUPPORT_CARDS_SECTION.cards);
  });
});
