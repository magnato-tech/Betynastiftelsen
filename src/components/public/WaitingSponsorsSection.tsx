import React from 'react';
import type { CmsWaitingSponsorCard, CmsWaitingSponsorsSection } from '../../types';
import { ArrowRight } from 'lucide-react';
import { WaitingSponsorPublicCard } from './WaitingSponsorPublicCard';

interface WaitingSponsorsSectionProps {
  section: CmsWaitingSponsorsSection;
  cards: CmsWaitingSponsorCard[];
  onBliFadder: () => void;
  onSeeAll?: () => void;
}

export const WaitingSponsorsSection: React.FC<WaitingSponsorsSectionProps> = ({
  section,
  cards,
  onBliFadder,
  onSeeAll,
}) => {
  if (cards.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[#2F4A35] text-white py-10 sm:py-12 px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#E8B86D] font-semibold">{section.kicker}</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-white">{section.title}</h2>
          {section.subtitle?.trim() && (
            <p className="mt-3 text-sm text-white/85 max-w-2xl leading-relaxed">{section.subtitle}</p>
          )}
        </div>
        {section.topLinkText?.trim() && onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-sm font-semibold text-[#E8B86D] hover:text-[#f5d49a] shrink-0 inline-flex items-center gap-1 cursor-pointer"
          >
            {section.topLinkText}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((card) => (
          <WaitingSponsorPublicCard key={card.id} card={card} onBliFadder={onBliFadder} />
        ))}
      </div>

      {section.footerLinkText?.trim() && onSeeAll && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onSeeAll}
            className="px-6 py-2.5 rounded-full border border-white/50 text-sm font-medium text-white hover:bg-white/10 inline-flex items-center gap-2 cursor-pointer"
          >
            {section.footerLinkText}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
