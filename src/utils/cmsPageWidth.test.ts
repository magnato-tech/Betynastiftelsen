import { describe, expect, it } from 'vitest';
import { cmsGridColumnCount, resolveCmsPageWidthPx } from './cmsPageWidth';

describe('cmsPageWidth', () => {
  it('standard bredde er 1120', () => {
    expect(resolveCmsPageWidthPx()).toBe(1120);
    expect(resolveCmsPageWidthPx(undefined)).toBe(1120);
  });

  it('støtter 1040 og 1280', () => {
    expect(resolveCmsPageWidthPx(1040)).toBe(1040);
    expect(resolveCmsPageWidthPx(1280)).toBe(1280);
  });

  it('kolonneantall fyller rad opp til fire', () => {
    expect(cmsGridColumnCount(0)).toBe(1);
    expect(cmsGridColumnCount(1)).toBe(1);
    expect(cmsGridColumnCount(2)).toBe(2);
    expect(cmsGridColumnCount(4)).toBe(4);
    expect(cmsGridColumnCount(6)).toBe(4);
  });
});
