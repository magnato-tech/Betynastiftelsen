import type { CmsContent } from '../types';

export type CmsPageWidth = 1040 | 1120 | 1280;

export const CMS_PAGE_WIDTH_OPTIONS: CmsPageWidth[] = [1040, 1120, 1280];

export const DEFAULT_CMS_PAGE_WIDTH: CmsPageWidth = 1120;

export function resolveCmsPageWidthPx(pageWidth?: CmsPageWidth): number {
  const w = pageWidth ?? DEFAULT_CMS_PAGE_WIDTH;
  if (w === 1040 || w === 1280) return w;
  return DEFAULT_CMS_PAGE_WIDTH;
}

/** Kolonner for kort-rad (1–4) slik raden fyller bredden. */
export function cmsGridColumnCount(itemCount: number): number {
  if (itemCount <= 1) return 1;
  if (itemCount === 2) return 2;
  if (itemCount === 3) return 3;
  return 4;
}

export function cmsPageWidthFromContent(cms: CmsContent): number {
  return resolveCmsPageWidthPx(cms.pageWidth);
}
