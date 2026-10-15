export type CmsPreviewSection = 'hero' | 'steps' | 'stories' | 'about' | 'kpis' | 'cta' | 'behov';

const SECTION_HASH: Record<CmsPreviewSection, string> = {
  hero: 'home',
  steps: 'fadderordningen',
  stories: 'historier',
  about: 'om-oss',
  kpis: 'home',
  cta: 'cta',
  behov: 'aksjoner',
};

export function readCmsPreviewFlags(search = window.location.search, isIframe = window.self !== window.top) {
  const params = new URLSearchParams(search);
  const preview = params.get('preview') === 'true';
  const embedded = preview && isIframe && params.get('embedded') === '1';
  return { preview, embedded };
}

export function cmsPreviewHash(section: CmsPreviewSection): string {
  return SECTION_HASH[section] ?? 'home';
}

export function buildEmbeddedPreviewUrl(section: CmsPreviewSection = 'hero'): string {
  return `/?preview=true&embedded=1#${cmsPreviewHash(section)}`;
}

export function buildNewTabPreviewUrl(section: CmsPreviewSection = 'hero'): string {
  return `/?preview=true#${cmsPreviewHash(section)}`;
}
