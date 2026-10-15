import type { Coordinator, Sponsor } from '../types';

export type NewsletterAudience = 'sponsors' | 'coordinators' | 'all';

export interface NewsletterRecipient {
  email: string;
  name: string;
  role: 'sponsor' | 'coordinator';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function buildNewsletterRecipients(
  sponsors: Sponsor[],
  coordinators: Coordinator[],
  audience: NewsletterAudience
): NewsletterRecipient[] {
  const fromSponsors: NewsletterRecipient[] =
    audience === 'coordinators'
      ? []
      : sponsors
          .filter((s) => isValidEmail(s.epost))
          .map((s) => ({ email: s.epost.trim(), name: s.navn, role: 'sponsor' as const }));

  const fromCoords: NewsletterRecipient[] =
    audience === 'sponsors'
      ? []
      : coordinators
          .filter((c) => c.aktiv && isValidEmail(c.epost))
          .map((c) => ({
            email: c.epost.trim(),
            name: `${c.fornavn} ${c.etternavn}`,
            role: 'coordinator' as const,
          }));

  const seen = new Set<string>();
  return [...fromSponsors, ...fromCoords].filter((r) => {
    const key = r.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
