import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOOTSTRAP_ADMIN_EMAILS, isBootstrapAdminEmail } from './bootstrapAdmins';

describe('bootstrapAdmins', () => {
  it.each([
    ['magnar.totland@gmail.com', true],
    ['totland.s@gmail.com', true],
    ['MAGNAR.TOTLAND@GMAIL.COM', true],
    ['  magnar.totland@gmail.com  ', true],
    ['Totland.S@Gmail.com', true],
    ['', false],
    [null, false],
    [undefined, false],
    ['   ', false],
    ['magnar.totland@gmail.com.evil.com', false],
    ['xmagnar.totland@gmail.com', false],
    ['magnar.totland@gmail.co', false],
    ['magnar.totland@gmail.com\n', true],
    ['magnar+test@gmail.com', false],
    ['fadder@example.com', false],
  ])('isBootstrapAdminEmail(%j) = %s', (email, expected) => {
    expect(isBootstrapAdminEmail(email as string | null | undefined)).toBe(expected);
  });

  it('listen har noyaktig de to forventede adressene', () => {
    expect([...BOOTSTRAP_ADMIN_EMAILS]).toEqual(['magnar.totland@gmail.com', 'totland.s@gmail.com']);
  });

  it('adressene i appen er identiske med dem i firestore.rules (ingen avvik mellom UI og regler)', () => {
    const rules = readFileSync('firestore.rules', 'utf8');
    const inRules = [...rules.matchAll(/request\.auth\.token\.email == '([^']+)'/g)].map((m) => m[1]).sort();
    expect(inRules).toEqual([...BOOTSTRAP_ADMIN_EMAILS].sort());
  });
});
