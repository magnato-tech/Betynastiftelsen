import type { CmsContent, CmsHomeLayoutItem, CmsHomeModuleId } from '../types';
import { cmsSectionEnabled } from './cmsSections';
import { aboutUsHasText, withAboutUsDefaults } from './aboutUs';

export const CMS_HOME_MODULE_LABELS: Record<CmsHomeModuleId, string> = {
  hero: 'Hovedbanner',
  stories: 'Vitnesbyrd',
  waiting: 'Disse venter på fadder',
  steps: 'Fadderordningen',
  stotte: 'Hva støtten gjør',
  kpis: 'Nøkkeltall',
  about: 'Kjernerammer',
  cta: 'Fadderoppfordring',
  behov: 'Aksjoner',
  apenhet: 'Økonomi og åpenhet',
  omOss: 'Om oss',
};

/** Standard rekkefølge på forsiden (kan endres i CMS). */
export const DEFAULT_CMS_HOME_LAYOUT: CmsHomeLayoutItem[] = [
  { moduleId: 'hero', visible: true },
  { moduleId: 'omOss', visible: false },
  { moduleId: 'stories', visible: true },
  { moduleId: 'waiting', visible: true },
  { moduleId: 'steps', visible: true },
  { moduleId: 'stotte', visible: true },
  { moduleId: 'behov', visible: true },
  { moduleId: 'kpis', visible: true },
  { moduleId: 'about', visible: true },
  { moduleId: 'apenhet', visible: true },
  { moduleId: 'cta', visible: true },
];

const MODULE_IDS: CmsHomeModuleId[] = [
  'hero',
  'stories',
  'waiting',
  'steps',
  'stotte',
  'kpis',
  'about',
  'cta',
  'behov',
  'apenhet',
  'omOss',
];

function legacyVisible(cms: CmsContent, moduleId: CmsHomeModuleId): boolean {
  switch (moduleId) {
    case 'hero':
      return cmsSectionEnabled(cms.heroSection);
    case 'steps':
      return cmsSectionEnabled(cms.stepsSection);
    case 'stotte':
      return true;
    case 'about':
      return cmsSectionEnabled(cms.aboutSection);
    case 'kpis':
      return cmsSectionEnabled(cms.kpiSection) && cms.kpiStats.length > 0;
    case 'cta':
      return cmsSectionEnabled(cms.ctaSection) && Boolean(cms.ctaBanner?.title?.trim());
    case 'stories':
      return cms.testimonialsSection?.enabled !== false;
    case 'waiting':
      return cms.waitingSponsorsSection?.enabled !== false;
    case 'behov':
      return true;
    case 'apenhet':
      return true;
    case 'omOss':
      // Skjult som standard, så eksisterende sider ikke får en tom seksjon.
      return false;
    default:
      return true;
  }
}

/** Slår sammen lagret layout med standard og eldre av/på-felt. */
export function normalizeCmsHomeLayout(cms: CmsContent): CmsHomeLayoutItem[] {
  const stored = cms.homeLayout;
  if (!stored?.length) {
    return DEFAULT_CMS_HOME_LAYOUT.map((item) => ({
      ...item,
      visible: legacyVisible(cms, item.moduleId),
    }));
  }

  const byId = new Map(stored.map((row) => [row.moduleId, row]));
  const ordered: CmsHomeLayoutItem[] = [];
  for (const row of stored) {
    if (!MODULE_IDS.includes(row.moduleId)) continue;
    if (!ordered.some((o) => o.moduleId === row.moduleId)) {
      ordered.push({ moduleId: row.moduleId, visible: row.visible !== false });
    }
  }
  for (const id of MODULE_IDS) {
    if (ordered.some((o) => o.moduleId === id)) continue;
    const item: CmsHomeLayoutItem = { moduleId: id, visible: legacyVisible(cms, id) };
    if (id === 'stotte') {
      // Eldre layout: «Hva støtten gjør» skal ligge rett etter Fadderordningen, ikke sist.
      const stepsIdx = ordered.findIndex((o) => o.moduleId === 'steps');
      if (stepsIdx >= 0) {
        ordered.splice(stepsIdx + 1, 0, item);
        continue;
      }
    }
    ordered.push(item);
  }
  return ordered;
}

export function visibleHomeModules(cms: CmsContent): CmsHomeModuleId[] {
  return normalizeCmsHomeLayout(cms)
    .filter((row) => row.visible)
    .map((row) => row.moduleId);
}

export function isHomeModuleVisible(cms: CmsContent, moduleId: CmsHomeModuleId): boolean {
  return normalizeCmsHomeLayout(cms).some((row) => row.moduleId === moduleId && row.visible);
}

export interface PublicNavVisibilityContext {
  hasFrontPageStories: boolean;
  hasActiveCampaigns: boolean;
}

/** Synlighet for offentlig toppmeny — samme regler som forsiden (`PublicWebsite`). */
export function publicNavVisibility(
  cms: CmsContent,
  ctx: PublicNavVisibilityContext
): {
  fadderordningen: boolean;
  historier: boolean;
  aksjoner: boolean;
  /** «Profil & verdier» → Kjernerammer (DOM-id om-oss). */
  omOss: boolean;
  /** «Om oss» → historien om Betyna (DOM-id om-betyna), når modulen er på og har tekst. */
  historie: boolean;
  apenhet: boolean;
  bliFadderCta: boolean;
} {
  const showHeroCta = cms.hero.showCtaCard ?? true;
  return {
    fadderordningen: isHomeModuleVisible(cms, 'steps'),
    historier: isHomeModuleVisible(cms, 'stories') && ctx.hasFrontPageStories,
    aksjoner: isHomeModuleVisible(cms, 'behov') && ctx.hasActiveCampaigns,
    omOss: isHomeModuleVisible(cms, 'about'),
    historie: isHomeModuleVisible(cms, 'omOss') && aboutUsHasText(withAboutUsDefaults(cms.aboutUs)),
    apenhet: isHomeModuleVisible(cms, 'apenhet'),
    bliFadderCta: showHeroCta,
  };
}

export function moveHomeModule(
  layout: CmsHomeLayoutItem[],
  moduleId: CmsHomeModuleId,
  direction: 'up' | 'down'
): CmsHomeLayoutItem[] {
  const idx = layout.findIndex((r) => r.moduleId === moduleId);
  if (idx < 0) return layout;
  const swap = direction === 'up' ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= layout.length) return layout;
  const next = [...layout];
  [next[idx], next[swap]] = [next[swap], next[idx]];
  return next;
}

export function setHomeModuleVisible(
  layout: CmsHomeLayoutItem[],
  moduleId: CmsHomeModuleId,
  visible: boolean
): CmsHomeLayoutItem[] {
  return layout.map((row) => (row.moduleId === moduleId ? { ...row, visible } : row));
}

/** Dra-og-slipp: flytt fromId til posisjonen der toId står. */
export function reorderHomeModule(
  layout: CmsHomeLayoutItem[],
  fromId: CmsHomeModuleId,
  toId: CmsHomeModuleId
): CmsHomeLayoutItem[] {
  if (fromId === toId) return layout;
  const fromIdx = layout.findIndex((r) => r.moduleId === fromId);
  const toIdx = layout.findIndex((r) => r.moduleId === toId);
  if (fromIdx < 0 || toIdx < 0) return layout;
  const next = [...layout];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}
