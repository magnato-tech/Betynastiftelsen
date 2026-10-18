import type {
  CmsHero,
  CmsHeroHeight,
  CmsHeroHeadlinePlacement,
  CmsHeroHeadlineTone,
} from '../types';

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
  headlineOnImage: true,
  headlinePlacement: 'onImage' as CmsHeroHeadlinePlacement,
  headlinePosXPercent: 42,
  headlinePosYPercent: 55,
  headlineBelowGapPx: 24,
  headlineBelowYOffsetPercent: 0,
  headlineMaxWidthPercent: 52,
  headlineTone: 'auto' as CmsHeroHeadlineTone,
  imageMotion: 'none' as const,
  ctaPosXPercent: 0,
  ctaPosYPercent: 10,
  ctaHangBelowPx: 176,
  ctaEnter: 'none' as const,
  ctaEnterDelaySec: 0,
  ctaCardTitle: 'Støtt et barn',
  ctaCardLead: '250 eller 350 kroner i måneden, hele veien til jobb.',
};

export const DEFAULT_HERO_CTA_BUTTONS = {
  primaryButtonText: 'Gi hver måned med Vipps',
  secondaryButtonText: 'AvtaleGiro eller bank',
  primaryButtonTemplate: 'Gi {beløp} kr hver måned med Vipps',
  customOptionLabel: 'Valgfritt',
  customAmountMin: 100,
};

export const DEFAULT_HERO_CTA_IMPACT = {
  amount1:
    '250 kroner i måneden holder skoleplass, uniform og det familien trenger for ett barn — hele veien mot fagbrev og jobb.',
  amount2:
    '350 kroner gir mer rom for medisin, sykehus og det ekstra som kommer — uten at du mister den personlige følgingen.',
  custom: '{beløp} kroner i måneden følger ett barn mot utdanning og en reell jobb.',
  empty: 'Velg beløp for å se hva månedlig støtte betyr for ett barn.',
};

export interface HeroCtaCardConfig {
  title: string;
  lead: string;
  primaryButton: string;
  secondaryLink: string;
  presetAmount1: number;
  presetAmount2: number;
  customOptionLabel: string;
  customAmountMin: number;
  showCustomOption: boolean;
  reflectAmountInPrimaryButton: boolean;
  primaryButtonTemplate: string;
  impactLineAmount1: string;
  impactLineAmount2: string;
  impactLineCustom: string;
  impactLineEmpty: string;
}

/** @deprecated Bruk HeroCtaCardConfig */
export type HeroCtaCardCopy = Pick<
  HeroCtaCardConfig,
  'title' | 'lead' | 'primaryButton' | 'secondaryLink'
>;

function clampCtaAmount(kr: number | undefined, fallback: number): number {
  const n = kr ?? fallback;
  return Math.min(20_000, Math.max(50, Math.round(n)));
}

export function getHeroCtaCardConfig(hero: CmsHero): HeroCtaCardConfig {
  const preset1 = clampCtaAmount(hero.ctaPresetAmount1, 250);
  const preset2 = clampCtaAmount(hero.ctaPresetAmount2, 350);
  return {
    title: hero.ctaCardTitle?.trim() || DEFAULT_HERO_LAYOUT.ctaCardTitle,
    lead: hero.ctaCardLead?.trim() || DEFAULT_HERO_LAYOUT.ctaCardLead,
    primaryButton:
      hero.primaryButtonText?.trim() || DEFAULT_HERO_CTA_BUTTONS.primaryButtonText,
    secondaryLink:
      hero.secondaryButtonText?.trim() || DEFAULT_HERO_CTA_BUTTONS.secondaryButtonText,
    presetAmount1: preset1,
    presetAmount2: preset2,
    customOptionLabel:
      hero.ctaCustomOptionLabel?.trim() || DEFAULT_HERO_CTA_BUTTONS.customOptionLabel,
    customAmountMin: Math.max(50, hero.ctaCustomAmountMin ?? DEFAULT_HERO_CTA_BUTTONS.customAmountMin),
    showCustomOption: hero.ctaShowCustomOption !== false,
    reflectAmountInPrimaryButton: hero.ctaPrimaryButtonReflectAmount !== false,
    primaryButtonTemplate:
      hero.ctaPrimaryButtonTemplate?.trim() || DEFAULT_HERO_CTA_BUTTONS.primaryButtonTemplate,
    impactLineAmount1: hero.ctaImpactLineAmount1?.trim() || DEFAULT_HERO_CTA_IMPACT.amount1,
    impactLineAmount2: hero.ctaImpactLineAmount2?.trim() || DEFAULT_HERO_CTA_IMPACT.amount2,
    impactLineCustom: hero.ctaImpactLineCustom?.trim() || DEFAULT_HERO_CTA_IMPACT.custom,
    impactLineEmpty: DEFAULT_HERO_CTA_IMPACT.empty,
  };
}

export function getHeroCtaCardCopy(hero: CmsHero): HeroCtaCardCopy {
  const c = getHeroCtaCardConfig(hero);
  return {
    title: c.title,
    lead: c.lead,
    primaryButton: c.primaryButton,
    secondaryLink: c.secondaryLink,
  };
}

export function formatHeroCtaImpactLine(
  config: HeroCtaCardConfig,
  selectedAmount: number,
  customAmountRaw: string
): string {
  const customParsed = parseInt(customAmountRaw, 10) || 0;
  const amount = selectedAmount === 0 ? customParsed : selectedAmount;
  if (amount <= 0) return config.impactLineEmpty;
  if (selectedAmount === config.presetAmount1) return config.impactLineAmount1;
  if (selectedAmount === config.presetAmount2) return config.impactLineAmount2;
  const formatted = amount.toLocaleString('no-NO');
  return config.impactLineCustom.replace(/\{beløp\}/gi, formatted).replace(/\{amount\}/gi, String(amount));
}

export function formatHeroCtaPrimaryButton(
  config: HeroCtaCardConfig,
  selectedAmount: number,
  customAmountRaw: string
): string {
  if (!config.reflectAmountInPrimaryButton) return config.primaryButton;
  const customParsed = parseInt(customAmountRaw, 10) || 0;
  const amount = selectedAmount === 0 ? customParsed : selectedAmount;
  if (amount <= 0) return config.primaryButton;
  const formatted = amount.toLocaleString('no-NO');
  return config.primaryButtonTemplate
    .replace(/\{beløp\}/gi, formatted)
    .replace(/\{amount\}/gi, String(amount));
}

export function getHeroHeadlinePlacement(hero: CmsHero): CmsHeroHeadlinePlacement {
  if (hero.headlinePlacement === 'onImage' || hero.headlinePlacement === 'belowImage') {
    return hero.headlinePlacement;
  }
  if (hero.headlineOnImage === false) return 'belowImage';
  return 'onImage';
}

export function withHeroLayoutDefaults(hero: CmsHero): CmsHero {
  const hang =
    hero.ctaHangBelowPx ??
    hero.ctaOverlapPx ??
    DEFAULT_HERO_LAYOUT.ctaHangBelowPx;
  const headlinePlacement = getHeroHeadlinePlacement(hero);
  return {
    ...hero,
    heroHeight: hero.heroHeight ?? DEFAULT_HERO_LAYOUT.heroHeight,
    heroHeightCustomVh: hero.heroHeightCustomVh ?? DEFAULT_HERO_LAYOUT.heroHeightCustomVh,
    focalPointX: hero.focalPointX ?? DEFAULT_HERO_LAYOUT.focalPointX,
    focalPointY: hero.focalPointY ?? DEFAULT_HERO_LAYOUT.focalPointY,
    showCtaCard: hero.showCtaCard ?? DEFAULT_HERO_LAYOUT.showCtaCard,
    ctaOverlapPx: hang,
    headlineOnImage: headlinePlacement === 'onImage',
    headlinePlacement,
    headlinePosXPercent: hero.headlinePosXPercent ?? DEFAULT_HERO_LAYOUT.headlinePosXPercent,
    headlinePosYPercent: hero.headlinePosYPercent ?? DEFAULT_HERO_LAYOUT.headlinePosYPercent,
    headlineBelowGapPx: hero.headlineBelowGapPx ?? DEFAULT_HERO_LAYOUT.headlineBelowGapPx,
    headlineBelowYOffsetPercent:
      hero.headlineBelowYOffsetPercent ?? DEFAULT_HERO_LAYOUT.headlineBelowYOffsetPercent,
    headlineMaxWidthPercent: hero.headlineMaxWidthPercent ?? DEFAULT_HERO_LAYOUT.headlineMaxWidthPercent,
    headlineTone: hero.headlineTone ?? DEFAULT_HERO_LAYOUT.headlineTone,
    imageMotion: hero.imageMotion ?? DEFAULT_HERO_LAYOUT.imageMotion,
    ctaPosXPercent: hero.ctaPosXPercent ?? DEFAULT_HERO_LAYOUT.ctaPosXPercent,
    ctaPosYPercent: hero.ctaPosYPercent ?? DEFAULT_HERO_LAYOUT.ctaPosYPercent,
    ctaHangBelowPx: hang,
    ctaEnter: hero.ctaEnter ?? DEFAULT_HERO_LAYOUT.ctaEnter,
    ctaEnterDelaySec: hero.ctaEnterDelaySec ?? DEFAULT_HERO_LAYOUT.ctaEnterDelaySec,
  };
}

export function heroHasHeadlineCopy(hero: CmsHero): boolean {
  return Boolean(hero.kicker?.trim() || hero.title?.trim() || hero.subtitle?.trim());
}

export function isHeroHeadlineOnImageDesktop(hero: CmsHero): boolean {
  return getHeroHeadlinePlacement(hero) === 'onImage' && heroHasHeadlineCopy(hero);
}

export function getHeroHeadlineTone(hero: CmsHero): 'light' | 'dark' {
  const tone = hero.headlineTone ?? DEFAULT_HERO_LAYOUT.headlineTone;
  if (tone === 'light') return 'light';
  if (tone === 'dark') return 'dark';
  return getHeroHeadlinePlacement(hero) === 'onImage' ? 'light' : 'dark';
}

export const HERO_HEADLINE_SCENE_Y_MAX_PERCENT = 150;
export const HERO_HEADLINE_BELOW_GAP_MAX_PX = 1200;

export function clampHeroHeadlinePosYPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** Y i hero-scenen (på bildet, eller ekstra ned når tekst ligger under bildet). */
export function clampHeroHeadlineSceneYPercent(value: number): number {
  return Math.min(HERO_HEADLINE_SCENE_Y_MAX_PERCENT, Math.max(0, value));
}

/** Én plassering: prosent fra bunn minus heng i px (ingen translateY oppå). */
export function getHeroCtaBottomCss(hero: CmsHero): string {
  const resolved = withHeroLayoutDefaults(hero);
  const y = resolved.ctaPosYPercent ?? DEFAULT_HERO_LAYOUT.ctaPosYPercent;
  const hang = resolved.ctaHangBelowPx ?? 0;
  return `calc(${y}% - ${hang}px)`;
}

/** Ca. høyde på embedded fadder-kort — brukes til layout-reserve under bildet. */
export const HERO_EMBEDDED_CTA_APPROX_HEIGHT_PX = 360;

const HERO_HEADLINE_BELOW_CTA_CLEARANCE_PX = 16;

/** Margin over løftetekst under hero (stor skjerm). Tar hensyn til hengende CTA. */
export function getHeroHeadlineBelowMarginTopPx(hero: CmsHero): number {
  const resolved = withHeroLayoutDefaults(hero);
  const gap = Math.min(
    HERO_HEADLINE_BELOW_GAP_MAX_PX,
    Math.max(0, resolved.headlineBelowGapPx ?? DEFAULT_HERO_LAYOUT.headlineBelowGapPx)
  );
  const placement = getHeroHeadlinePlacement(hero);
  const yExtraPx =
    placement === 'belowImage'
      ? Math.round(
          (clampHeroHeadlineSceneYPercent(resolved.headlineBelowYOffsetPercent ?? 0) / 100) *
            getHeroHeightVh(resolved) *
            12
        )
      : 0;
  if (placement !== 'belowImage' || !resolved.showCtaCard) {
    return gap + yExtraPx;
  }
  const scenePad = getHeroSceneBottomPaddingPx(resolved);
  const hang = getHeroReservedHangPaddingPx(resolved);
  const cardReserve = Math.max(0, scenePad - hang);
  const shortfall = Math.max(0, HERO_EMBEDDED_CTA_APPROX_HEIGHT_PX + HERO_HEADLINE_BELOW_CTA_CLEARANCE_PX - cardReserve);
  return gap + yExtraPx + shortfall;
}

export function getHeroReservedHangPaddingPx(hero: CmsHero): number {
  const resolved = withHeroLayoutDefaults(hero);
  if (!resolved.showCtaCard) return 0;
  return Math.round(resolved.ctaHangBelowPx ?? 0);
}

/**
 * Nederste padding i hero-scenen slik at absolutt CTA og CMS-ramme omfatter hele kortet.
 * (Kortet henger under bildelinjen; heng alene er ikke nok for boksens faktiske høyde.)
 */
export function getHeroSceneBottomPaddingPx(hero: CmsHero): number {
  const resolved = withHeroLayoutDefaults(hero);
  if (!resolved.showCtaCard) return 0;
  const hang = getHeroReservedHangPaddingPx(resolved);
  const y = resolved.ctaPosYPercent ?? DEFAULT_HERO_LAYOUT.ctaPosYPercent;
  const yFactor = Math.max(0.35, (100 - y) / 100);
  return Math.round(hang + HERO_EMBEDDED_CTA_APPROX_HEIGHT_PX * yFactor);
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

export function clampHeroHeadlineMaxWidthPercent(value: number): number {
  return Math.min(100, Math.max(32, value));
}

/** Bredde i % av hero-kolonnen, begrenset slik at boksen ikke stikker utenfor ved gitt X. */
export function getHeroHeadlineWidthPercent(xPercent: number, widthPercent: number): number {
  const x = Math.min(100, Math.max(0, xPercent));
  const w = clampHeroHeadlineMaxWidthPercent(widthPercent);
  return Math.min(w, 100 - x);
}
