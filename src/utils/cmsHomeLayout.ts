import type { CmsContent, CmsHomeLayoutItem, CmsHomeModuleId } from '../types';
import { cmsSectionEnabled } from './cmsSections';

export const CMS_HOME_MODULE_LABELS: Record<CmsHomeModuleId, string> = {
  hero: 'Hovedbanner',
  stories: 'Vitnesbyrd',
  steps: 'Fadderordningen',
  kpis: 'Nøkkeltall',
  about: 'Kjernerammer',
  cta: 'Fadderoppfordring',
  behov: 'Aksjoner',
};

/** Standard rekkefølge på forsiden (kan endres i CMS). */
export const DEFAULT_CMS_HOME_LAYOUT: CmsHomeLayoutItem[] = [
  { moduleId: 'hero', visible: true },
  { moduleId: 'stories', visible: true },
  { moduleId: 'steps', visible: true },
  { moduleId: 'behov', visible: true },
  { moduleId: 'kpis', visible: true },
  { moduleId: 'about', visible: true },
  { moduleId: 'cta', visible: true },
];

const MODULE_IDS: CmsHomeModuleId[] = [
  'hero',
  'stories',
  'steps',
  'kpis',
  'about',
  'cta',
  'behov',
];

function legacyVisible(cms: CmsContent, moduleId: CmsHomeModuleId): boolean {
  switch (moduleId) {
    case 'hero':
      return cmsSectionEnabled(cms.heroSection);
    case 'steps':
      return cmsSectionEnabled(cms.stepsSection);
    case 'about':
      return cmsSectionEnabled(cms.aboutSection);
    case 'kpis':
      return cmsSectionEnabled(cms.kpiSection) && cms.kpiStats.length > 0;
    case 'cta':
      return cmsSectionEnabled(cms.ctaSection) && Boolean(cms.ctaBanner?.title?.trim());
    case 'stories':
      return cms.testimonialsSection?.enabled !== false;
    case 'behov':
      return true;
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
    if (!ordered.some((o) => o.moduleId === id)) {
      ordered.push({ moduleId: id, visible: legacyVisible(cms, id) });
    }
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
