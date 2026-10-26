import { describe, expect, it } from 'vitest';
import { assertNotAdmin, describeChanges, validateDeletePerson } from './personActions';

describe('validateDeletePerson', () => {
  it('slipper gjennom når navnet stemmer og det ikke finnes koblinger', () => {
    expect(() =>
      validateDeletePerson({ navn: 'Kari Nordmann', confirmName: 'Kari Nordmann', links: [] })
    ).not.toThrow();
  });

  it('trimmer bekreftelsen før sammenligning', () => {
    expect(() =>
      validateDeletePerson({ navn: 'Kari Nordmann', confirmName: '  Kari Nordmann \n', links: [] })
    ).not.toThrow();
  });

  it('er case-sensitiv på navnet', () => {
    expect(() =>
      validateDeletePerson({ navn: 'Fadder Ett', confirmName: 'fadder ett', links: [] })
    ).toThrow('Skriv inn fullt navn («Fadder Ett») for å bekrefte sletting.');
  });

  it('avviser delvis navn', () => {
    expect(() => validateDeletePerson({ navn: 'Kari Nordmann', confirmName: 'Kari', links: [] })).toThrow(
      /fullt navn/
    );
  });

  it('lister koblinger og blokkerer sletting', () => {
    expect(() =>
      validateDeletePerson({
        navn: 'Kari Nordmann',
        confirmName: 'Kari Nordmann',
        links: [
          { collection: 'children', count: 3 },
          { collection: 'reports', count: 2 },
        ],
      })
    ).toThrow('Kan ikke slette: 3 barn, 2 rapporter er koblet til personen. Flytt eller avslutt dem først.');
  });

  it('ignorerer koblinger med null treff', () => {
    expect(() =>
      validateDeletePerson({
        navn: 'Kari Nordmann',
        confirmName: 'Kari Nordmann',
        links: [{ collection: 'payments', count: 0 }],
      })
    ).not.toThrow();
  });

  it('sjekker navnet før koblinger', () => {
    expect(() =>
      validateDeletePerson({ navn: 'Kari', confirmName: 'Feil', links: [{ collection: 'children', count: 1 }] })
    ).toThrow(/fullt navn/);
  });
});

describe('assertNotAdmin', () => {
  it('kaster for administratorer og slipper andre gjennom', () => {
    expect(() => assertNotAdmin({ type: 'admin', id: 'a@x.no', navn: 'A' })).toThrow('Administratorer kan ikke slettes her.');
    expect(() => assertNotAdmin({ type: 'sponsor', id: 's1', navn: 'S' })).not.toThrow();
  });
});

describe('describeChanges', () => {
  it('lister bare endrede felt som gammel → ny', () => {
    const before = { id: 'k1', telefon: '111', epost: 'a@x.no', distrikt: 'Vest' };
    expect(describeChanges(before, { telefon: '456', epost: 'a@x.no' })).toEqual(['telefon: 111 → 456']);
  });

  it('hopper over id og viser (tom) for manglende verdi', () => {
    const before: Record<string, unknown> = { id: 'k1', telefon: '' };
    expect(describeChanges(before, { id: 'annen', telefon: '999' })).toEqual(['telefon: (tom) → 999']);
  });

  it('formaterer lister med komma', () => {
    expect(describeChanges({ tags: ['a'] }, { tags: ['a', 'b'] })).toEqual(['tags: a → a, b']);
  });
});
