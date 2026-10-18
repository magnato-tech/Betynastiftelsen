import { describe, expect, it } from 'vitest';
import { CMS_PREVIEW_DESKTOP_WIDTH, computeCmsPreviewScale } from './cmsLivePreviewScale';

describe('cmsLivePreviewScale', () => {
  it('skalerer ned når viewport er smalere enn designbredde', () => {
    expect(computeCmsPreviewScale(640, CMS_PREVIEW_DESKTOP_WIDTH)).toBe(0.5);
  });

  it('bruker ikke scale over 1', () => {
    expect(computeCmsPreviewScale(2000, CMS_PREVIEW_DESKTOP_WIDTH)).toBe(1);
  });
});
