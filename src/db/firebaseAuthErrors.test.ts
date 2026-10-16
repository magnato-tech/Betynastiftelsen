import { describe, expect, it } from 'vitest';
import { formatFirebaseAuthError } from './firebaseAuthErrors';

describe('formatFirebaseAuthError', () => {
  it.each([
    ['auth/popup-blocked', 'blokkerte popup'],
    ['auth/popup-closed-by-user', 'lukket'],
    ['auth/cancelled-popup-request', 'avbrutt'],
    ['auth/unauthorized-domain', 'ikke godkjent i Firebase'],
    ['auth/operation-not-supported-in-this-environment', 'Popup-innlogging'],
    ['auth/internal-error', 'lagring av innlogging'],
    ['auth/web-storage-unsupported', 'lagring av innlogging'],
  ])('%s gir forklarende tekst som inneholder "%s"', (code, fragment) => {
    expect(formatFirebaseAuthError({ code })).toContain(fragment);
  });
  it('ukjent kode med Error bruker feilens melding', () => {
    expect(formatFirebaseAuthError(Object.assign(new Error('Egen feil'), { code: 'auth/annet' }))).toBe('Egen feil');
  });
  it('vanlig Error uten kode bruker meldingen', () => {
    expect(formatFirebaseAuthError(new Error('Nettverk nede'))).toBe('Nettverk nede');
  });
  it.each([[undefined], [null], ['tekst'], [42], [{}], [{ code: 'auth/ukjent' }]])('ukjent verdi %j gir generell tekst', (value) => {
    expect(formatFirebaseAuthError(value)).toContain('Innlogging feilet');
  });
  it('gir aldri tom tekst', () => {
    for (const v of [undefined, null, {}, new Error(''), { code: '' }]) {
      expect(formatFirebaseAuthError(v).length).toBeGreaterThan(5);
    }
  });
  it('feilmeldinger lekker ikke tekniske koder til brukeren', () => {
    expect(formatFirebaseAuthError({ code: 'auth/popup-blocked' })).not.toContain('auth/');
  });
});
