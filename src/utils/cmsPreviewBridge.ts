import type { AdultGraduateStory, Campaign, CmsContent } from '../types';
import type { CmsPreviewSection } from './cmsPreview';

export const CMS_PREVIEW_MESSAGE = 'betyna-cms-draft';
export const CMS_PREVIEW_READY = 'betyna-cms-ready';
export const CMS_PREVIEW_SELECT_SECTION = 'betyna-cms-select-section';

export interface CmsPreviewDraftPayload {
  cmsContent: CmsContent;
  stories: AdultGraduateStory[];
  campaigns: Campaign[];
  highlightSection: CmsPreviewSection | null;
}

export function isCmsPreviewMessage(data: unknown): data is { type: string; draft: CmsPreviewDraftPayload } {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { type?: string }).type === CMS_PREVIEW_MESSAGE &&
    typeof (data as { draft?: unknown }).draft === 'object' &&
    (data as { draft?: unknown }).draft !== null
  );
}

export function postCmsPreviewDraft(target: Window, draft: CmsPreviewDraftPayload): void {
  target.postMessage({ type: CMS_PREVIEW_MESSAGE, draft }, window.location.origin);
}

export function postCmsPreviewSelectSection(target: Window, section: CmsPreviewSection): void {
  target.postMessage({ type: CMS_PREVIEW_SELECT_SECTION, section }, window.location.origin);
}

/** data-cms-section på forsiden ↔ CMS-fane */
export const CMS_SECTION_DOM_ID: Record<CmsPreviewSection, string> = {
  hero: 'home',
  steps: 'fadderordningen',
  stories: 'historier',
  waiting: 'venter-fadder',
  about: 'om-oss',
  kpis: 'cms-kpi',
  cta: 'cta',
  behov: 'aksjoner',
  apenhet: 'apenhet',
};

export const CMS_PREVIEW_ACTIVE_CLASS = 'cms-preview-active';

/** Hero i iframe-preview: fyll synlig høyde under navbar slik neste modul ligger under fold. */
export const CMS_PREVIEW_HERO_MIN_HEIGHT_CSS = 'calc(100vh - 4.5rem)';

let lastScrolledSection: CmsPreviewSection | null = null;

export function applyCmsSectionHighlight(section: CmsPreviewSection | null): void {
  document.querySelectorAll('[data-cms-section]').forEach((el) => {
    el.classList.remove(CMS_PREVIEW_ACTIVE_CLASS);
  });
  if (!section) {
    lastScrolledSection = null;
    return;
  }
  const el = document.querySelector(`[data-cms-section="${section}"]`);
  if (!(el instanceof HTMLElement)) return;
  el.classList.add(CMS_PREVIEW_ACTIVE_CLASS);
  if (lastScrolledSection !== section) {
    lastScrolledSection = section;
    if (section === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
