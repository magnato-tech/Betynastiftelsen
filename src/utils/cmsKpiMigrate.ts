import type { CmsContent, CmsKpiStat } from '../types';

const OLD_KPI_HINT = /oppmøte|lederlønn|kinshasa|goma|bukavu|assiduité|salaire|leder|96\.|0 kr/i;

export function shouldReplaceKpiStats(stats: CmsKpiStat[]): boolean {
  if (!stats?.length) return false;
  const blob = stats.map((k) => `${k.value} ${k.label} ${k.sublabel}`).join(' ');
  return OLD_KPI_HINT.test(blob);
}

export function migrateCmsKpiStats(cms: CmsContent, next: CmsKpiStat[]): CmsContent {
  if (!shouldReplaceKpiStats(cms.kpiStats)) return cms;
  return { ...cms, kpiStats: next };
}
