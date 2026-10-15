import React from 'react';
import type { Child, Report } from '../../types';

interface SponsorFacingPreviewProps {
  child: Pick<Child, 'fornavn' | 'skoleNavn' | 'klassetrinn' | 'publisertFotoUrl' | 'bakgrunnskontekst'>;
  story: string;
  reportTitle?: string;
  reportBody?: string;
  reportDate?: string;
  latestApproved?: Report;
}

/** Det fadderen skal se — uten intern kode og etternavn. */
export const SponsorFacingPreview: React.FC<SponsorFacingPreviewProps> = ({
  child,
  story,
  reportTitle,
  reportBody,
  reportDate,
  latestApproved,
}) => {
  const title = reportTitle ?? latestApproved?.tittelNorsk;
  const body = reportBody ?? latestApproved?.innholdNorsk;
  const date = reportDate ?? latestApproved?.dato;

  return (
    <div className="rounded-xl border border-[#A3B18A]/50 bg-[#F7F4EE] p-5 space-y-4 text-xs">
      <p className="text-[10px] uppercase tracking-widest text-[#4D6B3E] font-semibold">Forhåndsvisning · fadder</p>
      <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-3">
        <div>
          <h4 className="text-base font-serif font-bold text-stone-900">{child.fornavn}</h4>
          <p className="text-stone-600 mt-0.5">
            {child.klassetrinn}
            {child.skoleNavn ? ` · ${child.skoleNavn}` : ''}
          </p>
        </div>
        {child.publisertFotoUrl && (
          <img
            src={
              child.publisertFotoUrl.startsWith('http') || child.publisertFotoUrl.startsWith('/')
                ? child.publisertFotoUrl
                : `/${child.publisertFotoUrl}`
            }
            alt=""
            className="w-full max-h-36 object-cover rounded-md border border-stone-200"
          />
        )}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Historie</p>
          <p className="text-stone-800 leading-relaxed mt-1 whitespace-pre-line">
            {story.trim() || 'Historien vises her når du skriver.'}
          </p>
        </div>
        {(title || body) && (
          <div className="pt-3 border-t border-stone-100 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
              Siste rapport{date ? ` · ${date}` : ''}
            </p>
            {title && <p className="font-serif font-bold text-stone-900">{title}</p>}
            {body && <p className="text-stone-700 leading-relaxed whitespace-pre-line">{body}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
