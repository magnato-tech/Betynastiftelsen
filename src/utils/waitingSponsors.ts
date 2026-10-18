import type { CmsContent, CmsWaitingSponsorCard, CmsWaitingSponsorsSection } from '../types';
import { WAITING_SPONSOR_ILLUSTRATION_PRESETS } from './waitingSponsorIllustrations';
import { resolvePublicImageUrl } from './testimonials';

export const DEFAULT_WAITING_SPONSORS_SECTION: CmsWaitingSponsorsSection = {
  enabled: true,
  kicker: 'Bli fadder',
  title: 'Disse venter på fadder',
  subtitle:
    'Ekte barn i programmet — her vises bare anonymiserte kort med illustrasjonsbilde til du har godkjent foto og samtykke.',
  topLinkText: 'Se alle',
  footerLinkText: 'Se alle barn som søker fadder',
};

export function withWaitingSponsorsSectionDefaults(
  section?: CmsWaitingSponsorsSection
): CmsWaitingSponsorsSection {
  return {
    ...DEFAULT_WAITING_SPONSORS_SECTION,
    ...section,
  };
}

export function isWaitingSponsorCardPublished(card: CmsWaitingSponsorCard): boolean {
  return card.publisertPaaForside !== false && Boolean(card.bildeUrl?.trim()) && Boolean(card.publicCode?.trim());
}

export function getPublishedWaitingSponsorCards(cms: CmsContent): CmsWaitingSponsorCard[] {
  return (cms.waitingSponsorCards ?? []).filter(isWaitingSponsorCardPublished);
}

export function waitingSponsorImageSrc(url?: string): string | undefined {
  return resolvePublicImageUrl(url);
}

export function createDemoWaitingSponsorCards(): CmsWaitingSponsorCard[] {
  const presets = WAITING_SPONSOR_ILLUSTRATION_PRESETS;
  const demos: Omit<CmsWaitingSponsorCard, 'id'>[] = [
    { publicCode: 'COG-2026-014', alder: 9, sted: 'Pointe-Noire', bildeUrl: presets[0].url, publisertPaaForside: true },
    { publicCode: 'COG-2026-021', alder: 11, sted: 'Brazzaville', bildeUrl: presets[1].url, publisertPaaForside: true },
    { publicCode: 'COG-2026-033', alder: 8, sted: 'Dolisie', bildeUrl: presets[2].url, publisertPaaForside: true },
    { publicCode: 'COG-2026-041', alder: 14, sted: 'Pointe-Noire', bildeUrl: presets[3].url, publisertPaaForside: true },
  ];
  const ts = Date.now();
  return demos.map((d, i) => ({ ...d, id: `wait-demo-${ts}-${i}` }));
}
