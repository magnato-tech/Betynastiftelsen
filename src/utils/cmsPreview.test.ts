import { describe, expect, it } from 'vitest';
import { buildEmbeddedPreviewUrl, buildNewTabPreviewUrl, cmsPreviewHash, readCmsPreviewFlags } from './cmsPreview';

describe('CMS live preview', () => {
  it('bygger iframe-URL som i menighetsplan (preview + embedded)', () => {
    expect(buildEmbeddedPreviewUrl('behov')).toBe('/?preview=true&embedded=1#aksjoner');
    expect(buildNewTabPreviewUrl('stories')).toBe('/?preview=true#historier');
  });

  it('mapper CMS-seksjon til anker på den åpne siden', () => {
    expect(cmsPreviewHash('hero')).toBe('home');
    expect(cmsPreviewHash('steps')).toBe('fadderordningen');
    expect(cmsPreviewHash('cta')).toBe('cta');
    expect(cmsPreviewHash('stotte')).toBe('hva-stotten-gjor');
  });

  it('gjenkjenner innebygd forhåndsvisning', () => {
    expect(readCmsPreviewFlags('?preview=true&embedded=1', true)).toEqual({ preview: true, embedded: true });
    expect(readCmsPreviewFlags('?preview=true', false)).toEqual({ preview: true, embedded: false });
    expect(readCmsPreviewFlags('', true)).toEqual({ preview: false, embedded: false });
  });
});
