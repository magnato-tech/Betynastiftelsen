import { describe, expect, it } from 'vitest';
import type { Sponsor } from '../types';
import { filterSponsorsLastDays, filterSponsorsSince } from './sponsorMetrics';

const base = (id: string, startDato: string): Sponsor => ({
  id,
  navn: id,
  epost: `${id}@test.no`,
  telefon: '',
  poststed: 'Oslo',
  maanedsbelop: 250,
  betalingsmetode: 'vipps',
  betalingsstatus: 'aktiv',
  startDato,
  tildeltBarnId: '',
});

describe('sponsorMetrics', () => {
  it('filterSponsorsSince includes same-day cutoff', () => {
    const sponsors = [base('a', '2026-10-01'), base('b', '2026-09-30')];
    expect(filterSponsorsSince(sponsors, '2026-10-01').map((s) => s.id)).toEqual(['a']);
  });

  it('filterSponsorsLastDays uses rolling window', () => {
    const now = new Date('2026-10-15T12:00:00');
    const sponsors = [
      base('week', '2026-10-12'),
      base('old', '2026-10-01'),
      base('today', '2026-10-15'),
    ];
    const last7 = filterSponsorsLastDays(sponsors, 7, now);
    expect(last7.map((s) => s.id)).toEqual(['today', 'week']);
  });
});
