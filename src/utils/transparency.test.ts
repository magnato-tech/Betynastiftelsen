import { describe, expect, it } from 'vitest';
import { DEFAULT_TRANSPARENCY_SECTION, withTransparencyDefaults } from './transparency';

describe('Økonomi og åpenhet: standardtekster', () => {
  it('standard reproduserer dagens norske tekster', () => {
    expect(DEFAULT_TRANSPARENCY_SECTION.kicker).toBe('Økonomi & åpenhet');
    expect(DEFAULT_TRANSPARENCY_SECTION.title).toBe('Slik pengene brukes');
    expect(DEFAULT_TRANSPARENCY_SECTION.intro).toBe(
      'Fadderbidraget går uavkortet til barnet — via omsorgspersoner i storfamilien, ikke i lommen på barnet. Koordinatoren sørger for at skole, uniform, medisin og det nødvendige blir dekket.'
    );
    expect(DEFAULT_TRANSPARENCY_SECTION.secondary).toBe(
      'Ti faddere à 3 500 kroner i året gir 35 000 kroner til ett barns løp. Ingen lønn tas ut i Betyna. Vi er foreløpig ikke stiftelse — med vilje — så mer av det som kommer inn kan gå til barna.'
    );
    expect(DEFAULT_TRANSPARENCY_SECTION.cards.map((c) => c.title)).toEqual([
      'Månedlig fadderbidrag',
      'Liten reserve',
      'Ingen barnehjem-modell',
    ]);
    expect(DEFAULT_TRANSPARENCY_SECTION.cards[1].description).toBe(
      'En andel settes av til sykdom og sykehus (malaria er en reell risiko) og til skolestart én gang i året, når sekk og utstyr må kjøpes inn på nytt.'
    );
  });

  it('dokument uten felt får standardtekstene', () => {
    expect(withTransparencyDefaults(undefined)).toEqual(DEFAULT_TRANSPARENCY_SECTION);
  });

  it('lagrede verdier vinner over standard, og tomme kort gir standardkort', () => {
    const result = withTransparencyDefaults({
      kicker: 'Åpenhet',
      title: 'Ny tittel',
      intro: 'Ny ingress',
      secondary: '',
      cards: [],
    });
    expect(result.kicker).toBe('Åpenhet');
    expect(result.title).toBe('Ny tittel');
    expect(result.intro).toBe('Ny ingress');
    expect(result.secondary).toBe('');
    expect(result.cards).toEqual(DEFAULT_TRANSPARENCY_SECTION.cards);
  });
});
