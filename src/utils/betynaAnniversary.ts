/** Arbeidet startet 24. juni 2011 — badge teller fullførte år siden denne datoen. */
export const BETYNA_WORK_START = { year: 2011, month: 5, day: 24 } as const;

export function getBetynaAnniversaryYears(asOf: Date = new Date()): number {
  const anchor = new Date(BETYNA_WORK_START.year, BETYNA_WORK_START.month, BETYNA_WORK_START.day);
  let years = asOf.getFullYear() - anchor.getFullYear();
  const monthDiff = asOf.getMonth() - anchor.getMonth();
  const dayDiff = asOf.getDate() - anchor.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function formatBetynaAnniversaryBadge(asOf: Date = new Date()): string {
  return `${getBetynaAnniversaryYears(asOf)} år`;
}
