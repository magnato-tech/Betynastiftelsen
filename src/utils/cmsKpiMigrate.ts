import type { CmsContent, CmsKpiStat } from '../types';

const NEW_KPI_HINT = /fagbrev|bachelor|videregående|métier|licence|secondaire/i;
const OLD_KPI_HINT = /oppmøte|lederlønn|kinshasa|goma|bukavu|assiduité|salaire|leder|96\.|0 kr/i;

export function shouldReplaceKpiStats(stats: CmsKpiStat[]): boolean {
  if (!stats?.length) return true;
  const blob = stats.map((k) => `${k.value} ${k.label} ${k.sublabel}`).join(' ');
  if (OLD_KPI_HINT.test(blob)) return true;
  if (stats.some((k) => !k.value || /^[—–-]$/.test(k.value.trim()))) return true;
  return !NEW_KPI_HINT.test(blob);
}

export function migrateCmsKpiStats(cms: CmsContent, next: CmsKpiStat[]): CmsContent {
  if (!shouldReplaceKpiStats(cms.kpiStats)) return cms;
  return { ...cms, kpiStats: next };
}
