import { describe, expect, it } from 'vitest';
import {
  findContactInfo,
  maskContactInfo,
  skoleTypeLabel,
  sponsorSchoolText,
} from './childPrivacy';

describe('skoleTypeLabel', () => {
  it('gir norske etiketter for alle skoletyper', () => {
    expect(skoleTypeLabel('offentlig_barneskole')).toBe('Offentlig barneskole');
    expect(skoleTypeLabel('privat_barneskole')).toBe('Privat barneskole');
    expect(skoleTypeLabel('offentlig_ungdomsskole')).toBe('Offentlig ungdomsskole');
    expect(skoleTypeLabel('privat_ungdomsskole')).toBe('Privat ungdomsskole');
    expect(skoleTypeLabel('videregaende')).toBe('Videregående skole');
    expect(skoleTypeLabel('yrkesskole')).toBe('Yrkesskole');
  });
});

describe('sponsorSchoolText', () => {
  it('viser skoletype og standardby', () => {
    expect(sponsorSchoolText({ skoleType: 'offentlig_barneskole' })).toBe(
      'Offentlig barneskole i Brazzaville',
    );
  });

  it('bruker oppgitt by', () => {
    expect(sponsorSchoolText({ skoleType: 'privat_barneskole', skoleBy: 'Pointe-Noire' })).toBe(
      'Privat barneskole i Pointe-Noire',
    );
  });

  it('faller tilbake til generisk tekst uten skoletype', () => {
    expect(sponsorSchoolText({})).toBe('Skole i Brazzaville');
    expect(sponsorSchoolText({ skoleBy: '  ' })).toBe('Skole i Brazzaville');
  });

  it('inneholder aldri skolens navn, selv om det finnes i objektet', () => {
    const tekst = sponsorSchoolText({
      skoleType: 'offentlig_barneskole',
      skoleBy: 'Brazzaville',
      skoleNavn: 'École Primaire Sainte-Thérèse',
    } as Parameters<typeof sponsorSchoolText>[0]);
    expect(tekst).not.toContain('Sainte');
    expect(tekst).not.toContain('École');
  });
});

describe('maskContactInfo: kontaktopplysninger skjules', () => {
  it('skjuler telefonnumre i vanlige formater', () => {
    expect(maskContactInfo('Ring +242 06 123 45 67 i kveld')).toBe('Ring [skjult] i kveld');
    expect(maskContactInfo('Mor: 06-123-45-67.')).toBe('Mor: [skjult].');
    expect(maskContactInfo('Tlf 915 12 345')).toBe('Tlf [skjult]');
    expect(maskContactInfo('nummer 0612345678')).toBe('nummer [skjult]');
  });

  it('skjuler e-postadresser', () => {
    expect(maskContactInfo('Skriv til ola.nordmann@gmail.com nå')).toBe('Skriv til [skjult] nå');
  });

  it('skjuler lenker og sosiale medier', () => {
    expect(maskContactInfo('Se https://www.facebook.com/ola.nordmann')).toBe('Se [skjult]');
    expect(maskContactInfo('Følg på instagram.com/ola_n')).toBe('Følg på [skjult]');
    expect(maskContactInfo('WhatsApp: wa.me/242061234567')).toBe('WhatsApp: [skjult]');
    expect(maskContactInfo('TikTok-profil tiktok.com/@ola')).toBe('TikTok-profil [skjult]');
    expect(maskContactInfo('Kontakt @ola_nordmann i dag')).toBe('Kontakt [skjult] i dag');
  });
});

describe('maskContactInfo: falske positiver slipper gjennom', () => {
  const uendret = [
    'Møtet var 2026-10-20 kl. 10.00',
    'Dato: 20.10.2026',
    '20. 10. 2026 er neste samling',
    'Kollekt 2025-2026 var god',
    'Bidraget er 350 kr i måneden',
    'Totalt 3 500 kr utbetalt',
    'Gikk i 5. klasse og 7A',
    'Skoleåret 2026 ble bra',
    'Tallet 1000 kr gikk til skolemateriell',
    'Kode BET-CD-01 og rapport nr 12',
  ];
  for (const tekst of uendret) {
    it(`endrer ikke: ${tekst}`, () => {
      expect(maskContactInfo(tekst)).toBe(tekst);
    });
  }

  it('håndterer tom tekst', () => {
    expect(maskContactInfo('')).toBe('');
  });
});

describe('findContactInfo', () => {
  it('finner typer og treff', () => {
    const funn = findContactInfo('Ring +242 06 123 45 67, skriv a@b.no eller se instagram.com/x');
    expect(funn.map((f) => f.type).sort()).toEqual(['e-post', 'lenke', 'telefon']);
    expect(funn.find((f) => f.type === 'telefon')?.match).toBe('+242 06 123 45 67');
    expect(funn.find((f) => f.type === 'e-post')?.match).toBe('a@b.no');
  });

  it('returnerer tom liste når det ikke finnes noe', () => {
    expect(findContactInfo('Ingen kontakt her, 350 kr og 2026-10-20')).toEqual([]);
    expect(findContactInfo('')).toEqual([]);
  });
});
