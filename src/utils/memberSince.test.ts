import { describe, expect, it } from 'vitest';
import { formatDuration, formatNorwegianDate } from './memberSince';

describe('formatDuration', () => {
  it('teller fulle måneder og viser år og måneder', () => {
    expect(formatDuration('2023-01-15', '2025-08-15')).toBe('2 år 7 mnd');
    expect(formatDuration('2026-01-01', '2026-06-01')).toBe('5 mnd');
  });

  it('viser bare år når det ikke er rest-måneder', () => {
    expect(formatDuration('2022-03-10', '2024-03-10')).toBe('2 år');
    expect(formatDuration('2022-03-10', '2023-03-10')).toBe('1 år');
  });

  it('under én full måned gir «Under 1 mnd»', () => {
    expect(formatDuration('2026-05-10', '2026-05-10')).toBe('Under 1 mnd');
    expect(formatDuration('2026-05-10', '2026-06-09')).toBe('Under 1 mnd');
    expect(formatDuration('2026-05-10', '2026-06-10')).toBe('1 mnd');
  });

  it('måneds-grenser: dag 31 i startmåneden klemmes til sluttmånedens lengde', () => {
    // 31. jan → 28. feb er én full måned (februar har 28 dager i 2026).
    expect(formatDuration('2026-01-31', '2026-02-28')).toBe('1 mnd');
    expect(formatDuration('2026-01-31', '2026-02-27')).toBe('Under 1 mnd');
    // 31. jan → 30. mars er bare én full måned; 31. mars gir to.
    expect(formatDuration('2026-01-31', '2026-03-30')).toBe('1 mnd');
    expect(formatDuration('2026-01-31', '2026-03-31')).toBe('2 mnd');
  });

  it('skuddår: 29. februar regnes som 12 måneder ved 28. februar påfølgende år', () => {
    expect(formatDuration('2024-02-29', '2025-02-28')).toBe('1 år');
    expect(formatDuration('2024-02-29', '2025-02-27')).toBe('11 mnd');
    expect(formatDuration('2024-02-29', '2025-03-01')).toBe('1 år');
  });

  it('ugyldig eller omvendt periode gir tom streng', () => {
    expect(formatDuration('', '2026-01-01')).toBe('');
    expect(formatDuration('ikke-dato', '2026-01-01')).toBe('');
    expect(formatDuration('2026-01-01', 'ugyldig')).toBe('');
    expect(formatDuration('2026-02-01', '2026-01-01')).toBe('');
    expect(formatDuration('2025-02-30', '2026-01-01')).toBe('');
  });

  it('uten sluttdato brukes dagens dato', () => {
    const iDag = new Date();
    const fem = new Date(iDag.getFullYear(), iDag.getMonth() - 5, 1);
    const iso = `${fem.getFullYear()}-${String(fem.getMonth() + 1).padStart(2, '0')}-01`;
    expect(formatDuration(iso)).toMatch(/mnd|år/);
  });
});

describe('formatNorwegianDate', () => {
  it('formaterer dato på norsk', () => {
    expect(formatNorwegianDate('2024-03-01')).toBe('1. mars 2024');
    expect(formatNorwegianDate('2026-10-03')).toBe('3. oktober 2026');
  });

  it('tåler klokkeslett etter datoen', () => {
    expect(formatNorwegianDate('2024-03-01T12:00:00Z')).toBe('1. mars 2024');
  });

  it('ugyldig eller tom verdi gir tom streng uten å kaste', () => {
    expect(formatNorwegianDate('')).toBe('');
    expect(formatNorwegianDate(undefined)).toBe('');
    expect(formatNorwegianDate('2024-13-01')).toBe('');
    expect(formatNorwegianDate('søndag')).toBe('');
  });
});
