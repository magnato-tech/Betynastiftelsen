import { describe, expect, it } from 'vitest';
import {
  BETYNA_DEFAULT_HERO_IMAGE,
  migrateCmsHeroStock,
  resolveHeroBackgroundImageUrl,
  shouldReplaceHeroStock,
} from './cmsHeroImage';
import { EMPTY_CMS_CONTENT } from '../db/seedPolicy';

describe('cmsHeroImage', () => {
  it('erstatter unsplash og stock-presets med gruppebilde', () => {
    const url = 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200';
    expect(shouldReplaceHeroStock(url, 'custom')).toBe(true);
    expect(resolveHeroBackgroundImageUrl(url)).toBe(BETYNA_DEFAULT_HERO_IMAGE);
    expect(resolveHeroBackgroundImageUrl('', 'classroom')).toBe(BETYNA_DEFAULT_HERO_IMAGE);
  });

  it('beholder egne bilder', () => {
    expect(resolveHeroBackgroundImageUrl('IMG_1194.jpg', 'custom')).toBe('IMG_1194.jpg');
    expect(resolveHeroBackgroundImageUrl('https://betyna.no/photo.jpg', 'custom')).toBe(
      'https://betyna.no/photo.jpg'
    );
  });

  it('migrerer CMS-hero', () => {
    const cms = {
      ...EMPTY_CMS_CONTENT,
      hero: {
        ...EMPTY_CMS_CONTENT.hero,
        backgroundPreset: 'students' as const,
        backgroundImageUrl:
          'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80',
      },
    };
    const next = migrateCmsHeroStock(cms as any);
    expect(next.hero.backgroundImageUrl).toBe(BETYNA_DEFAULT_HERO_IMAGE);
    expect(next.hero.backgroundPreset).toBe('custom');
  });
});
