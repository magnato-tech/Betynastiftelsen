import { describe, expect, it } from 'vitest';
import { buildSponsorPortalLink, parseSponsorPortalLink } from './sponsorPortalLink';

describe('buildSponsorPortalLink', () => {
  it.each([
    ['https://betyna.no', 's1', undefined, 'https://betyna.no/?portal=sponsor&sponsor=s1&seksjon=sporsmaal'],
    ['https://betyna.no/', 's1', 'rapporter', 'https://betyna.no/?portal=sponsor&sponsor=s1&seksjon=rapporter'],
    ['betyna.no', 's1', 'okonomi', 'https://betyna.no/?portal=sponsor&sponsor=s1&seksjon=okonomi'],
    ['', 's1', 'oversikt', 'https://betyna.no/?portal=sponsor&sponsor=s1&seksjon=oversikt'],
    ['http://localhost:3000', 'sponsor-abc', 'oversikt', 'http://localhost:3000/?portal=sponsor&sponsor=sponsor-abc&seksjon=oversikt'],
  ])('build(%j, %j, %j)', (origin, id, section, expected) => {
    expect(buildSponsorPortalLink(origin, id, section)).toBe(expected);
  });
  it('spesialtegn i id kodes riktig', () => {
    const url = new URL(buildSponsorPortalLink('https://betyna.no', 'a b&c=d'));
    expect(url.searchParams.get('sponsor')).toBe('a b&c=d');
  });
});

describe('parseSponsorPortalLink', () => {
  it.each([
    ['?portal=sponsor&sponsor=s1', { sponsorId: 's1', section: 'sporsmaal' }],
    ['portal=sponsor&sponsor=s1&seksjon=rapporter', { sponsorId: 's1', section: 'rapporter' }],
    ['?portal=sponsor&sponsor=%20s1%20&seksjon=%20okonomi%20', { sponsorId: 's1', section: 'okonomi' }],
    ['?seksjon=x&sponsor=s1&portal=sponsor', { sponsorId: 's1', section: 'x' }],
  ])('parse(%j)', (search, expected) => {
    expect(parseSponsorPortalLink(search)).toEqual(expected);
  });
  it.each([[''], ['?'], ['?portal=admin&sponsor=s1'], ['?portal=sponsor'], ['?portal=sponsor&sponsor='], ['?portal=sponsor&sponsor=%20%20'], ['?sponsor=s1']])('parse(%j) gir null', (search) => {
    expect(parseSponsorPortalLink(search)).toBeNull();
  });
  it('rundtur: bygg og les gir samme id og seksjon', () => {
    const url = new URL(buildSponsorPortalLink('https://betyna.no', 'sponsor-17', 'rapporter'));
    expect(parseSponsorPortalLink(url.search)).toEqual({ sponsorId: 'sponsor-17', section: 'rapporter' });
  });
  it('KJENT AVVIK F-10: lenken har ingen signatur - hvem som helst som kjenner en fadder-id kan bruke den', () => {
    const forged = parseSponsorPortalLink('?portal=sponsor&sponsor=sponsor-1');
    expect(forged).toEqual({ sponsorId: 'sponsor-1', section: 'sporsmaal' });
  });
  it('KJENT AVVIK F-10: fadder-id er forutsigbar (sponsor-<tidsstempel>)', () => {
    // id = 'sponsor-' + Date.now(): tidsstempler kan gjettes ut fra registreringsdato.
    expect('sponsor-1792144800000').toMatch(/^sponsor-\d{13}$/);
  });
});
