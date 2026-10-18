import { describe, expect, it } from 'vitest';
import { formatBetynaAnniversaryBadge, getBetynaAnniversaryYears } from './betynaAnniversary';

describe('betynaAnniversary', () => {
  it('24. juni 2026 gir 15 år', () => {
    expect(getBetynaAnniversaryYears(new Date(2026, 5, 24))).toBe(15);
    expect(formatBetynaAnniversaryBadge(new Date(2026, 5, 25))).toBe('15 år');
  });

  it('25. juni 2027 gir 16 år', () => {
    expect(getBetynaAnniversaryYears(new Date(2027, 5, 25))).toBe(16);
  });

  it('23. juni 2027 gir fortsatt 15 år', () => {
    expect(getBetynaAnniversaryYears(new Date(2027, 5, 23))).toBe(15);
  });
});
