import type { AdultGraduateStory, Campaign, CmsContent } from '../types';
import type { CmsPreviewSection } from './cmsPreview';

export const CMS_PREVIEW_MESSAGE = 'betyna-cms-draft';

export interface CmsPreviewDraftPayload {
  cmsContent: CmsContent;
  stories: AdultGraduateStory[];
  campaigns: Campaign[];
  highlightSection: CmsPreviewSection;
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

/** data-cms-section på forsiden ↔ CMS-fane */
export const CMS_SECTION_DOM_ID: Record<CmsPreviewSection, string> = {
  hero: 'home',
  steps: 'fadderordningen',
  stories: 'historier',
  about: 'om-oss',
  kpis: 'cms-kpi',
  cta: 'cta',
  behov: 'aksjoner',
};

export function applyCmsSectionHighlight(section: CmsPreviewSection | null): void {
  document.querySelectorAll('[data-cms-section]').forEach((el) => {
    el.classList.remove('ring-4', 'ring-[#4D6B3E]/50', 'ring-offset-2', 'ring-offset-[#F6F4ED]');
  });
  if (!section) return;
  const el = document.querySelector(`[data-cms-section="${section}"]`);
  if (!el) return;
  el.classList.add('ring-4', 'ring-[#4D6B3E]/50', 'ring-offset-2', 'ring-offset-[#F6F4ED]');
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
