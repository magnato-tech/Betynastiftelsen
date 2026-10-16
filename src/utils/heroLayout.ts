import type { CmsHero, CmsHeroHeight } from '../types';

const HERO_HEIGHT_VH: Record<Exclude<CmsHeroHeight, 'custom'>, number> = {
  compact: 42,
  medium: 58,
  tall: 72,
};

export const DEFAULT_HERO_LAYOUT = {
  heroHeight: 'medium' as CmsHeroHeight,
  heroHeightCustomVh: 58,
  focalPointX: 50,
  focalPointY: 40,
  showCtaCard: true,
  ctaOverlapPx: 176,
};

export function withHeroLayoutDefaults(hero: CmsHero): CmsHero {
  return {
    ...hero,
    heroHeight: hero.heroHeight ?? DEFAULT_HERO_LAYOUT.heroHeight,
    heroHeightCustomVh: hero.heroHeightCustomVh ?? DEFAULT_HERO_LAYOUT.heroHeightCustomVh,
    focalPointX: hero.focalPointX ?? DEFAULT_HERO_LAYOUT.focalPointX,
    focalPointY: hero.focalPointY ?? DEFAULT_HERO_LAYOUT.focalPointY,
    showCtaCard: hero.showCtaCard ?? DEFAULT_HERO_LAYOUT.showCtaCard,
    ctaOverlapPx: hero.ctaOverlapPx ?? DEFAULT_HERO_LAYOUT.ctaOverlapPx,
  };
}

export function getHeroHeightVh(hero: CmsHero): number {
  const resolved = withHeroLayoutDefaults(hero);
  if (resolved.heroHeight === 'custom') {
    const v = resolved.heroHeightCustomVh ?? DEFAULT_HERO_LAYOUT.heroHeightCustomVh;
    return Math.min(92, Math.max(28, v));
  }
  return HERO_HEIGHT_VH[resolved.heroHeight ?? 'medium'];
}

export function getHeroObjectPosition(hero: CmsHero): string {
  const resolved = withHeroLayoutDefaults(hero);
  return `${resolved.focalPointX}% ${resolved.focalPointY}%`;
}
