import { describe, expect, it } from 'vitest';
import { makeCoordinator, makeSponsor } from '../test/testData';
import { buildNewsletterRecipients } from './recipients';

const sponsors = [
  makeSponsor({ id: 's1', navn: 'Fadder 1', epost: 'f1@example.com' }),
  makeSponsor({ id: 's2', navn: 'Fadder 2', epost: 'f2@example.com' }),
  makeSponsor({ id: 's3', navn: 'Uten epost', epost: '' }),
];
const coordinators = [
  makeCoordinator({ id: 'c1', epost: 'c1@example.com' }),
  makeCoordinator({ id: 'c2', epost: 'c2@example.com' }),
  makeCoordinator({ id: 'c3', epost: 'c3@example.com', aktiv: false }),
];

describe('ADM-10 mottakerliste', () => {
  it('admin kan samle faddere med gyldig e-post', () => {
    const list = buildNewsletterRecipients(sponsors, coordinators, 'sponsors');
    expect(list).toHaveLength(2);
    expect(list.every((r) => r.role === 'sponsor')).toBe(true);
  });

  it('admin kan samle aktive koordinatorer', () => {
    const list = buildNewsletterRecipients(sponsors, coordinators, 'coordinators');
    expect(list.map((r) => r.email)).toEqual(['c1@example.com', 'c2@example.com']);
  });

  it('samme adresse får bare én utsending', () => {
    const list = buildNewsletterRecipients(
      [makeSponsor({ epost: 'felles@example.com' })],
      [makeCoordinator({ epost: 'Felles@example.com' })],
      'all'
    );
    expect(list).toHaveLength(1);
  });
});
