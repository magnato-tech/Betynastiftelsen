export const CMS_PREVIEW_DESKTOP_WIDTH = 1280;

export function computeCmsPreviewScale(
  availableWidth: number,
  designWidth = CMS_PREVIEW_DESKTOP_WIDTH
): number {
  if (availableWidth <= 0 || designWidth <= 0) return 1;
  return Math.min(1, availableWidth / designWidth);
}
