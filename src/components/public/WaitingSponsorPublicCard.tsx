import React from 'react';
import type { CmsWaitingSponsorCard } from '../../types';
import { waitingSponsorImageSrc } from '../../utils/waitingSponsors';
import { Cake, MapPin } from 'lucide-react';

interface WaitingSponsorPublicCardProps {
  card: CmsWaitingSponsorCard;
  onBliFadder?: () => void;
  /** Admin-forhåndsvisning: knapp vises men er inaktiv. */
  previewMode?: boolean;
  className?: string;
}

export const WaitingSponsorPublicCard: React.FC<WaitingSponsorPublicCardProps> = ({
  card,
  onBliFadder,
  previewMode = false,
  className = '',
}) => {
  const src = waitingSponsorImageSrc(card.bildeUrl);

  return (
    <article
      className={`rounded-xl overflow-hidden bg-[#3D5C44] border border-white/10 flex flex-col ${className}`}
    >
      <figure className="relative aspect-[4/5] bg-[#243828]">
        {src ? (
          <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <span className="absolute top-2 left-2 text-[9px] font-bold tracking-wide uppercase bg-black/45 text-white px-2 py-0.5 rounded">
          Anonymisert
        </span>
        <figcaption className="absolute bottom-0 inset-x-0 text-center text-[10px] text-white/90 bg-black/35 py-1">
          Illustrasjonsbilde
        </figcaption>
      </figure>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <p className="text-[11px] font-mono text-white/70">{card.publicCode || 'COG-…'}</p>
        <div className="space-y-1.5 text-sm text-white/90">
          <p className="flex items-center gap-2">
            <Cake className="w-4 h-4 text-[#E8B86D] shrink-0" />
            <span>{card.alder} år</span>
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#E8B86D] shrink-0" />
            <span>{card.sted || '—'}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={previewMode ? undefined : onBliFadder}
          disabled={previewMode}
          tabIndex={previewMode ? -1 : 0}
          className={`mt-auto w-full py-2.5 rounded-lg bg-[#C4694A] text-white text-sm font-semibold transition-colors ${
            previewMode ? 'opacity-90 cursor-default' : 'hover:bg-[#d07a5c] cursor-pointer'
          }`}
        >
          Bli fadder
        </button>
      </div>
    </article>
  );
};
