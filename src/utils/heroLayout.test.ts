import { describe, expect, it } from 'vitest';
import {
  getHeroCtaBottomCss,
  formatHeroCtaPrimaryButton,
  getHeroCtaCardConfig,
  getHeroCtaCardCopy,
  getHeroHeadlineBelowMarginTopPx,
  getHeroOnImageHeadlineFlowReservePx,
  getHeroHeadlinePlacement,
  getHeroHeadlineTone,
  getHeroHeadlineWidthPercent,
  getHeroReservedHangPaddingPx,
  getHeroSceneBottomPaddingPx,
  heroHasHeadlineCopy,
  withHeroLayoutDefaults,
} from './heroLayout';
import type { CmsHero } from '../types';

const baseHero = (): CmsHero => ({
  kicker: 'K',
  title: 'T',
  subtitle: 'S',
  primaryButtonText: 'A',
  secondaryButtonText: 'B',
  backgroundPreset: 'custom',
  scrimOpacity: 70,
});

describe('heroLayout', () => {
  it('mapper eldre ctaOverlapPx til ctaHangBelowPx', () => {
    const h = withHeroLayoutDefaults({ ...baseHero(), ctaOverlapPx: 200 });
    expect(h.ctaHangBelowPx).toBe(200);
  });

  it('heroHasHeadlineCopy er false uten tekst', () => {
    expect(heroHasHeadlineCopy({ ...baseHero(), title: '', kicker: '', subtitle: '' })).toBe(false);
  });

  it('headlinePlacement følger headlineOnImage når placement mangler', () => {
    expect(getHeroHeadlinePlacement({ ...baseHero(), headlineOnImage: false })).toBe('belowImage');
    expect(getHeroHeadlinePlacement({ ...baseHero(), headlineOnImage: true })).toBe('onImage');
    expect(
      getHeroHeadlinePlacement({ ...baseHero(), headlinePlacement: 'belowImage', headlineOnImage: true })
    ).toBe('belowImage');
  });

  it('CTA bunn bruker calc(Y% - heng) uten translateY', () => {
    const css = getHeroCtaBottomCss({
      ...baseHero(),
      ctaPosYPercent: 12,
      ctaHangBelowPx: 80,
    });
    expect(css).toBe('calc(12% - 80px)');
  });

  it('reservert heng-plass er 0 uten CTA', () => {
    expect(getHeroReservedHangPaddingPx({ ...baseHero(), showCtaCard: false, ctaHangBelowPx: 200 })).toBe(0);
  });

  it('reservert heng-plass matcher heng når CTA vises', () => {
    expect(
      getHeroReservedHangPaddingPx({ ...baseHero(), showCtaCard: true, ctaHangBelowPx: 176 })
    ).toBe(176);
  });

  it('hero-scene padding er større enn heng alene når CTA vises', () => {
    const scene = getHeroSceneBottomPaddingPx({
      ...baseHero(),
      showCtaCard: true,
      ctaHangBelowPx: 176,
    });
    expect(scene).toBeGreaterThan(176);
  });

  it('standard animasjon er av', () => {
    const h = withHeroLayoutDefaults(baseHero());
    expect(h.imageMotion).toBe('none');
    expect(h.ctaEnter).toBe('none');
    expect(h.ctaEnterDelaySec).toBe(0);
  });

  it('headline-bredde begrenses av X slik at boksen ikke overflower', () => {
    expect(getHeroHeadlineWidthPercent(0, 100)).toBe(100);
    expect(getHeroHeadlineWidthPercent(42, 100)).toBe(58);
    expect(getHeroHeadlineWidthPercent(10, 50)).toBe(50);
  });

  it('formatHeroCtaPrimaryButton erstatter beløp i template', () => {
    const cfg = getHeroCtaCardConfig({
      ...baseHero(),
      primaryButtonText: '',
      secondaryButtonText: '',
      ctaPrimaryButtonTemplate: 'Gi {beløp} kr med Vipps',
    });
    expect(formatHeroCtaPrimaryButton(cfg, 350, '')).toBe('Gi 350 kr med Vipps');
  });

  it('getHeroCtaCardCopy bruker standarder når felt er tomme', () => {
    const copy = getHeroCtaCardCopy({
      ...baseHero(),
      primaryButtonText: '',
      secondaryButtonText: '',
    });
    expect(copy.title).toBe('Støtt et barn');
    expect(copy.primaryButton).toBe('Gi hver måned med Vipps');
  });

  it('flyt-reserve under hero når løftetekst på bildet har høy Y', () => {
    const low = getHeroOnImageHeadlineFlowReservePx({
      ...baseHero(),
      headlinePlacement: 'onImage',
      headlinePosYPercent: 60,
      showCtaCard: true,
      ctaHangBelowPx: 176,
    });
    const high = getHeroOnImageHeadlineFlowReservePx({
      ...baseHero(),
      headlinePlacement: 'onImage',
      headlinePosYPercent: 124,
      showCtaCard: true,
      ctaHangBelowPx: 176,
    });
    expect(high).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(0);
  });

  it('belowImage margin øker med gap og CTA', () => {
    const below = {
      ...baseHero(),
      headlinePlacement: 'belowImage' as const,
      headlineBelowGapPx: 40,
      showCtaCard: true,
      ctaHangBelowPx: 176,
    };
    expect(getHeroHeadlineBelowMarginTopPx(below)).toBeGreaterThan(40);
    expect(
      getHeroHeadlineBelowMarginTopPx({ ...below, showCtaCard: false, headlineBelowGapPx: 80 })
    ).toBe(80);
  });

  it('headlineTone auto følger plassering', () => {
    expect(getHeroHeadlineTone({ ...baseHero(), headlinePlacement: 'onImage' })).toBe('light');
    expect(getHeroHeadlineTone({ ...baseHero(), headlinePlacement: 'belowImage' })).toBe('dark');
    expect(getHeroHeadlineTone({ ...baseHero(), headlineTone: 'dark', headlinePlacement: 'onImage' })).toBe(
      'dark'
    );
  });
});
