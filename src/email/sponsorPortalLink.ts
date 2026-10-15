/** Prototype-lenke til faddersiden. Byttes mot engangslenke (magic link) i sprint 5. */
export function buildSponsorPortalLink(
  origin: string,
  sponsorId: string,
  section = 'sporsmaal'
): string {
  const base = (origin || 'https://betyna.no').replace(/\/$/, '');
  const url = new URL(base.includes('://') ? base : `https://${base}`);
  url.searchParams.set('portal', 'sponsor');
  url.searchParams.set('sponsor', sponsorId);
  url.searchParams.set('seksjon', section);
  return url.toString();
}

export function parseSponsorPortalLink(search: string): {
  sponsorId: string;
  section: string;
} | null {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (q.get('portal') !== 'sponsor') return null;
  const sponsorId = q.get('sponsor')?.trim();
  if (!sponsorId) return null;
  return { sponsorId, section: q.get('seksjon')?.trim() || 'sporsmaal' };
}
