import { describe, expect, it } from 'vitest';
import { DEFAULT_ABOUT_US_SECTION, aboutUsHasText, withAboutUsDefaults } from './aboutUs';

describe('Om oss: standardtekster', () => {
  it('standard er tom historie med dagens overskrift', () => {
    expect(DEFAULT_ABOUT_US_SECTION.kicker).toBe('Om Betyna');
    expect(DEFAULT_ABOUT_US_SECTION.title).toBe('Historien om Betyna');
    expect(DEFAULT_ABOUT_US_SECTION.bodyHtml).toBe('');
    expect(DEFAULT_ABOUT_US_SECTION.imageUrl).toBeUndefined();
  });

  it('dokument uten felt får standardtekstene', () => {
    expect(withAboutUsDefaults(undefined)).toEqual(DEFAULT_ABOUT_US_SECTION);
  });

  it('lagrede verdier vinner over standard', () => {
    const result = withAboutUsDefaults({ kicker: 'K', title: 'T', bodyHtml: '<p>Hei</p>', imageUrl: '/bilder/a.jpg' });
    expect(result.kicker).toBe('K');
    expect(result.title).toBe('T');
    expect(result.bodyHtml).toBe('<p>Hei</p>');
    expect(result.imageUrl).toBe('/bilder/a.jpg');
  });

  it('tom eller bare tom markup regnes som ingen tekst', () => {
    expect(aboutUsHasText(DEFAULT_ABOUT_US_SECTION)).toBe(false);
    expect(aboutUsHasText({ ...DEFAULT_ABOUT_US_SECTION, bodyHtml: '<p></p>' })).toBe(false);
    expect(aboutUsHasText({ ...DEFAULT_ABOUT_US_SECTION, bodyHtml: '<p>&nbsp;</p>  ' })).toBe(false);
    expect(aboutUsHasText({ ...DEFAULT_ABOUT_US_SECTION, bodyHtml: '<p>Betyna startet i 2011.</p>' })).toBe(true);
  });
});
