import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Monitor, Smartphone, Tablet, X } from 'lucide-react';
import type { AdultGraduateStory, Campaign, CmsContent } from '../../types';
import {
  buildEmbeddedPreviewUrl,
  buildNewTabPreviewUrl,
  cmsPreviewHash,
  type CmsPreviewSection,
} from '../../utils/cmsPreview';
import { CMS_PREVIEW_READY, CMS_PREVIEW_SELECT_SECTION, postCmsPreviewDraft, type CmsPreviewDraftPayload } from '../../utils/cmsPreviewBridge';
import {
  CMS_PREVIEW_DESKTOP_WIDTH,
  computeCmsPreviewScale,
} from '../../utils/cmsLivePreviewScale';

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

/** Minimum design-høyde i iframe før måling (unngår hopp ved første paint). */
const PREVIEW_MIN_DESIGN_HEIGHT_PX = 900;
const VIEWPORT_CHROME_PADDING_PX = 24;

interface CmsLivePreviewProps {
  section: CmsPreviewSection | null;
  onClose: () => void;
  cmsContent: CmsContent;
  stories: AdultGraduateStory[];
  campaigns: Campaign[];
  onSelectSection?: (section: CmsPreviewSection) => void;
}

export const CmsLivePreview: React.FC<CmsLivePreviewProps> = ({
  section,
  onClose,
  cmsContent,
  stories,
  campaigns,
  onSelectSection,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [desktopScale, setDesktopScale] = useState(1);
  const [previewViewportPx, setPreviewViewportPx] = useState({
    width: 0,
    height: PREVIEW_MIN_DESIGN_HEIGHT_PX,
  });
  const [src] = useState(() => buildEmbeddedPreviewUrl(section ?? 'hero'));

  const pushDraft = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const draft: CmsPreviewDraftPayload = {
      cmsContent,
      stories,
      campaigns,
      highlightSection: section,
    };
    postCmsPreviewDraft(win, draft);
  }, [campaigns, cmsContent, section, stories]);

  useEffect(() => {
    pushDraft();
  }, [pushDraft]);

  useEffect(() => {
    const onReady = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== CMS_PREVIEW_READY) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      pushDraft();
    };
    window.addEventListener('message', onReady);
    return () => window.removeEventListener('message', onReady);
  }, [pushDraft]);

  useEffect(() => {
    const onSelect = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === CMS_PREVIEW_SELECT_SECTION && event.data?.section) {
        onSelectSection?.(event.data.section);
      }
    };
    window.addEventListener('message', onSelect);
    return () => window.removeEventListener('message', onSelect);
  }, [onSelectSection]);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    if (!section) return;
    try {
      const hash = cmsPreviewHash(section);
      if (win.location.hash.replace('#', '') !== hash) {
        win.location.hash = hash;
      }
    } catch {
      /* samme vert */
    }
  }, [section]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      const availableW = Math.max(0, el.clientWidth - VIEWPORT_CHROME_PADDING_PX);
      const availableH = Math.max(
        PREVIEW_MIN_DESIGN_HEIGHT_PX,
        el.clientHeight - VIEWPORT_CHROME_PADDING_PX
      );
      setPreviewViewportPx({ width: availableW, height: availableH });
      if (device === 'desktop') {
        setDesktopScale(computeCmsPreviewScale(availableW, CMS_PREVIEW_DESKTOP_WIDTH));
      } else {
        setDesktopScale(1);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device]);

  const designWidth =
    device === 'desktop' ? CMS_PREVIEW_DESKTOP_WIDTH : device === 'tablet' ? 768 : 390;
  const scale = device === 'desktop' ? desktopScale : 1;
  const outerWidth = Math.round(designWidth * scale);
  const designHeightPx = Math.round(previewViewportPx.height / scale);
  const outerHeight = previewViewportPx.height;

  const frameClass =
    device === 'desktop'
      ? 'rounded-xl border border-stone-200 shadow-lg overflow-hidden bg-white'
      : device === 'tablet'
        ? 'rounded-2xl border-4 border-stone-300 shadow-2xl overflow-hidden bg-white'
        : 'rounded-3xl border-8 border-stone-300 shadow-2xl overflow-hidden bg-white';

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#F6F4ED] xl:static xl:inset-auto xl:z-auto xl:h-[calc(100vh-5.5rem)] xl:sticky xl:top-[4.5rem]">
      <div className="px-3 py-1 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-stone-800">Live forhåndsvisning</span>
        </div>

        <div className="flex items-center gap-1 bg-stone-50 p-0.5 rounded-lg border border-stone-200">
          {(
            [
              { id: 'desktop' as const, label: 'Desktop', Icon: Monitor },
              { id: 'tablet' as const, label: 'Nettbrett', Icon: Tablet },
              { id: 'mobile' as const, label: 'Mobil', Icon: Smartphone },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setDevice(id)}
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                device === id ? 'bg-[#4D6B3E] text-white' : 'text-stone-600 hover:bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={buildNewTabPreviewUrl(section ?? undefined)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ny fane
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
            aria-label="Lukk forhåndsvisning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="flex-1 min-h-0 overflow-auto p-3 flex justify-center items-start bg-stone-200/40"
      >
        <div className={frameClass} style={{ width: outerWidth, height: outerHeight }}>
          <div
            style={{
              width: designWidth,
              height: designHeightPx,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <iframe
              ref={iframeRef}
              title="Forhåndsvisning av nettsiden"
              src={src}
              onLoad={pushDraft}
              className="border-0 bg-white block"
              style={{ width: designWidth, height: designHeightPx }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
