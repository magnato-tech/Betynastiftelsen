import type { CmsContent, CmsHero } from '../types';

/** Standard gruppebilde på forsiden (Synelle og barna). */
export const BETYNA_DEFAULT_HERO_IMAGE = 'IMG_1194.jpg';

const STOCK_HERO_PRESETS = new Set(['classroom', 'workshop', 'books', 'students']);

/** Fjernet stock-motiver — erstattes med gruppebildet. */
export function shouldReplaceHeroStock(url?: string, preset?: string): boolean {
  const u = (url ?? '').trim();
  if (u.includes('images.unsplash.com')) return true;
  if (STOCK_HERO_PRESETS.has(preset ?? '')) return true;
  return false;
}

export function resolveHeroBackgroundImageUrl(url?: string, preset?: string): string {
  const trimmed = (url ?? '').trim();
  if (!trimmed || shouldReplaceHeroStock(trimmed, preset)) {
    return BETYNA_DEFAULT_HERO_IMAGE;
  }
  return trimmed;
}

export function heroImageSrcFromUrl(url?: string, preset?: string): string {
  const resolved = resolveHeroBackgroundImageUrl(url, preset);
  if (
    resolved.startsWith('http://') ||
    resolved.startsWith('https://') ||
    resolved.startsWith('data:') ||
    resolved.startsWith('/')
  ) {
    return resolved;
  }
  return `/${resolved}`;
}

export function migrateHeroFromStock(hero: CmsHero): CmsHero {
  if (!shouldReplaceHeroStock(hero.backgroundImageUrl, hero.backgroundPreset)) {
    return hero;
  }
  return {
    ...hero,
    backgroundImageUrl: BETYNA_DEFAULT_HERO_IMAGE,
    backgroundPreset: 'custom',
  };
}

export function migrateCmsHeroStock(cms: CmsContent): CmsContent {
  const hero = migrateHeroFromStock(cms.hero);
  if (hero === cms.hero) return cms;
  return { ...cms, hero };
}
