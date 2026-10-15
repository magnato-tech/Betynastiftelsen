import type { Sponsor } from '../types';

/** Sponsors with startDato on or after the cutoff (inclusive), newest first. */
export function filterSponsorsSince(sponsors: Sponsor[], sinceIsoDate: string): Sponsor[] {
  return sponsors
    .filter((s) => s.startDato >= sinceIsoDate)
    .sort((a, b) => b.startDato.localeCompare(a.startDato));
}

export function filterSponsorsLastDays(sponsors: Sponsor[], days: number, from: Date = new Date()): Sponsor[] {
  const cutoff = new Date(from);
  cutoff.setDate(cutoff.getDate() - days);
  const y = cutoff.getFullYear();
  const m = String(cutoff.getMonth() + 1).padStart(2, '0');
  const d = String(cutoff.getDate()).padStart(2, '0');
  return filterSponsorsSince(sponsors, `${y}-${m}-${d}`);
}
