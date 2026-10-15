import type { Child, Sponsor } from '../types';

type SponsorChildFields = {
  tildeltBarnIds?: string[];
  tildeltBarnId?: string;
};

export function childIdsOfSponsor(sponsor: SponsorChildFields | undefined | null): string[] {
  if (!sponsor) return [];
  const fromArray = Array.isArray(sponsor.tildeltBarnIds) ? sponsor.tildeltBarnIds.filter(Boolean) : [];
  if (fromArray.length) return fromArray;
  if (sponsor.tildeltBarnId) return [sponsor.tildeltBarnId];
  return fromArray;
}

export function migrateSponsorsChildIds(sponsors: Sponsor[]): Sponsor[] {
  return sponsors.map((s) => {
    const ids = childIdsOfSponsor(s);
    return { ...s, tildeltBarnIds: ids };
  });
}

export function childrenOfSponsor(children: Child[], sponsor: SponsorChildFields | undefined | null): Child[] {
  const ids = new Set(childIdsOfSponsor(sponsor));
  return children.filter((c) => ids.has(c.id));
}

export function addChildId(ids: string[], childId: string): string[] {
  return ids.includes(childId) ? ids : [...ids, childId];
}

export function removeChildId(ids: string[], childId: string): string[] {
  return ids.filter((id) => id !== childId);
}

export function childNamesOfSponsor(
  children: Child[],
  sponsor: SponsorChildFields | undefined | null
): string {
  const names = childrenOfSponsor(children, sponsor).map((c) => c.fornavn);
  return names.length ? names.join(', ') : '—';
}
