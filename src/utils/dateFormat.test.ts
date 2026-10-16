import { describe, expect, it } from 'vitest';
import { isoDaysAgo, isoMonthStart, isoToday, isoYearStart } from './dateFormat';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12, 0, 0);

describe('dateFormat', () => {
  it.each([
    [0, d(2026, 10, 16), '2026-10-16'],
    [1, d(2026, 10, 16), '2026-10-15'],
    [16, d(2026, 10, 16), '2026-09-30'],
    [30, d(2026, 10, 16), '2026-09-16'],
    [365, d(2026, 10, 16), '2025-10-16'],
    [1, d(2026, 1, 1), '2025-12-31'],
    [1, d(2024, 3, 1), '2024-02-29'],
    [1, d(2026, 3, 1), '2026-02-28'],
    [0, d(2026, 2, 28), '2026-02-28'],
    [-1, d(2026, 12, 31), '2027-01-01'],
    [7, d(2026, 3, 29), '2026-03-22'],
    [7, d(2026, 10, 26), '2026-10-19'],
  ])('isoDaysAgo(%i, %s) = %s', (days, from, expected) => {
    expect(isoDaysAgo(days, from)).toBe(expected);
  });

  it('isoDaysAgo endrer ikke datoen som sendes inn', () => {
    const from = d(2026, 10, 16);
    const copy = from.getTime();
    isoDaysAgo(10, from);
    expect(from.getTime()).toBe(copy);
  });
  it('isoToday gir dagens dato i formatet YYYY-MM-DD', () => {
    expect(isoToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isoToday(d(2026, 10, 16))).toBe('2026-10-16');
  });
  it.each([
    [d(2026, 10, 16), '2026-10-01'],
    [d(2026, 1, 31), '2026-01-01'],
    [d(2026, 12, 1), '2026-12-01'],
  ])('isoMonthStart(%s) = %s', (from, expected) => {
    expect(isoMonthStart(from)).toBe(expected);
  });
  it.each([
    [d(2026, 10, 16), '2026-01-01'],
    [d(2024, 2, 29), '2024-01-01'],
  ])('isoYearStart(%s) = %s', (from, expected) => {
    expect(isoYearStart(from)).toBe(expected);
  });
  it('datoene sorterer riktig som tekst (brukes til filtrering)', () => {
    const dates = [isoDaysAgo(40, d(2026, 10, 16)), isoDaysAgo(3, d(2026, 10, 16)), isoToday(d(2026, 10, 16))];
    expect([...dates].sort()).toEqual([dates[0], dates[1], dates[2]]);
  });
});
