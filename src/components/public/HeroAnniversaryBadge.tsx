import React from 'react';
import { formatBetynaAnniversaryBadge, getBetynaAnniversaryYears } from '../../utils/betynaAnniversary';

/** Diskret jubileumsmerke på hero (år siden 24.06.2011). */
export const HeroAnniversaryBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const years = getBetynaAnniversaryYears();
  const label = formatBetynaAnniversaryBadge();

  return (
    <div
      className={`pointer-events-none select-none rounded-lg bg-white/95 text-stone-900 shadow-lg ring-1 ring-black/10 px-3 py-2 text-center min-w-[4.5rem] ${className}`}
      aria-label={`${label} siden arbeidet startet`}
    >
      <p className="text-2xl sm:text-3xl font-serif font-bold leading-none tabular-nums">{years}</p>
      <p className="text-[10px] sm:text-[11px] font-medium text-stone-600 mt-0.5 tracking-wide">år</p>
    </div>
  );
};
