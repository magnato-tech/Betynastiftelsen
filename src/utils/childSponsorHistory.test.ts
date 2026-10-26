import { describe, expect, it } from 'vitest';
import type { SponsorAssignment } from '../types';
import { makeSponsor } from '../test/testData';
import { sponsorHistoryForChild } from './childSponsorHistory';

const tildeling = (o: Partial<SponsorAssignment>): SponsorAssignment => ({
  id: 'asg',
  sponsorId: 's1',
  childId: 'c1',
  koordinatorId: 'coord-a',
  startDato: '2026-01-01',
  andelOre: 25000,
  ...o,
});

const sponsorer = [makeSponsor({ id: 's1', navn: 'Ola' }), makeSponsor({ id: 's2', navn: 'Kari' })];

describe('sponsorHistoryForChild', () => {
  it('sorterer nyest først og tar bare med barnets tildelinger', () => {
    const historikk = sponsorHistoryForChild(
      [
        tildeling({ id: 'a', sponsorId: 's1', startDato: '2026-01-01', sluttDato: '2026-03-01' }),
        tildeling({ id: 'b', sponsorId: 's2', startDato: '2026-03-01' }),
        tildeling({ id: 'c', childId: 'c2', sponsorId: 's1', startDato: '2026-05-01' }),
      ],
      sponsorer,
      'c1'
    );
    expect(historikk).toEqual([
      { sponsorId: 's2', navn: 'Kari', startDato: '2026-03-01', sluttDato: undefined },
      { sponsorId: 's1', navn: 'Ola', startDato: '2026-01-01', sluttDato: '2026-03-01' },
    ]);
  });

  it('ved samme startdato kommer åpen tildeling først', () => {
    const historikk = sponsorHistoryForChild(
      [
        tildeling({ id: 'ny', sponsorId: 's2', startDato: '2026-03-01' }),
        tildeling({ id: 'gammel', sponsorId: 's1', startDato: '2026-03-01', sluttDato: '2026-03-01' }),
      ],
      sponsorer,
      'c1'
    );
    expect(historikk.map((h) => h.sponsorId)).toEqual(['s2', 's1']);
  });

  it('ukjent fadder vises med id som navn, og tom liste gir tom historikk', () => {
    const historikk = sponsorHistoryForChild([tildeling({ sponsorId: 'ukjent' })], sponsorer, 'c1');
    expect(historikk[0].navn).toBe('ukjent');
    expect(sponsorHistoryForChild([], sponsorer, 'c1')).toEqual([]);
  });

  it('legger nåværende fadder først når det mangler åpen tildeling (eldre kobling)', () => {
    const sponsorerMedPia = [...sponsorer, makeSponsor({ id: 's3', navn: 'Pia', startDato: '2026-02-10' })];
    const historikk = sponsorHistoryForChild(
      [tildeling({ id: 'a', sponsorId: 's1', startDato: '2026-01-01', sluttDato: '2026-02-01' })],
      sponsorerMedPia,
      'c1',
      's3'
    );
    expect(historikk).toEqual([
      { sponsorId: 's3', navn: 'Pia', startDato: '2026-02-10', sluttDato: undefined, kilde: 'registrering' },
      { sponsorId: 's1', navn: 'Ola', startDato: '2026-01-01', sluttDato: '2026-02-01' },
    ]);
  });

  it('bruker ikke reserven når det finnes en åpen tildeling, eller når fadderen er ukjent', () => {
    const medAapen = sponsorHistoryForChild(
      [tildeling({ id: 'b', sponsorId: 's2', startDato: '2026-03-01' })],
      sponsorer,
      'c1',
      's1'
    );
    expect(medAapen.map((h) => h.sponsorId)).toEqual(['s2']);
    expect(medAapen[0].kilde).toBeUndefined();
    expect(sponsorHistoryForChild([], sponsorer, 'c1', 'finnes-ikke')).toEqual([]);
  });
});
