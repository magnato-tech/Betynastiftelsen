import React from 'react';
import { BookOpen, GraduationCap, Scissors, Heart, User, School, FileText, CheckCircle2 } from 'lucide-react';

interface VisualCardProps {
  type: 'hero' | 'sewing' | 'books' | 'graduate' | 'child' | 'coordinator';
  title?: string;
  subtitle?: string;
  className?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1';
  customImageUrl?: string;
  scrimOpacity?: number;
}

const resolveImgUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }
  return `/${url}`;
};

export const VisualCard: React.FC<VisualCardProps> = ({
  type,
  title,
  subtitle,
  className = '',
  aspectRatio = '16/9',
  customImageUrl,
  scrimOpacity,
}) => {
  const aspectClass =
    aspectRatio === '16/9' ? 'aspect-video' : aspectRatio === '4/3' ? 'aspect-[4/3]' : 'aspect-square';

  const resolvedUrl = resolveImgUrl(customImageUrl);

  if (type === 'hero') {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 text-white ${aspectClass} ${className}`}
      >
        {/* Custom background image or patterned SVG fallback */}
        {resolvedUrl ? (
          <img
            src={resolvedUrl}
            alt={title || 'Utdanning og oppfølging i Kongo'}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="#A3B18A" strokeWidth="0.75" />
                  <circle cx="20" cy="20" r="1.5" fill="#E5E7EB" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-pattern)" />
            </svg>
          </div>
        )}

        {/* Ambient warm gradient scrim with adjustable opacity */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/80 to-stone-900/40"
          style={{ opacity: (scrimOpacity !== undefined ? scrimOpacity : 75) / 100 }}
        />

        <div className="relative h-full flex flex-col justify-end p-6 md:p-10">
          <div className="inline-flex items-center gap-2 text-xs tracking-wider uppercase text-[#A3B18A] font-medium mb-2">
            <School className="w-4 h-4 text-[#A3B18A]" />
            <span>Brazzaville — Kongo-Brazzaville</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-stone-100 max-w-2xl leading-tight">
            Fra skole til fagbrev, utdanning og jobb som forsørger
          </h2>
          <p className="mt-2 text-sm md:text-base text-stone-300 max-w-xl font-sans">
            Tette fadderbånd i Norge, tilstedeværende koordinatorer i Kongo og 100% etterrettelig rapportering.
          </p>
        </div>
      </div>
    );
  }

  if (type === 'sewing') {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-stone-200 bg-gradient-to-br from-[#F6F4ED] via-stone-100 to-[#A3B18A]/20 text-stone-800 ${aspectClass} ${className}`}
      >
        {resolvedUrl ? (
          <>
            <img
              src={resolvedUrl}
              alt={title || 'Jente som trenger symaskin'}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/50 to-stone-900/20"
              style={{ opacity: (scrimOpacity !== undefined ? scrimOpacity : 70) / 100 }}
            />
          </>
        ) : (
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#A3B18A]/30 blur-2xl" />
        )}
        <div className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-xs border border-stone-200/60 z-10">
          <Scissors className="w-6 h-6 text-[#4D6B3E]" />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-between p-6">
          <span className={`text-xs uppercase tracking-widest font-medium ${customImageUrl ? 'text-stone-300' : 'text-stone-500'}`}>
            Aksjon · Yrkesopplæring
          </span>
          <div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${customImageUrl ? 'bg-white/20 text-white' : 'bg-[#A3B18A]/20 text-[#4D6B3E]'}`}>
              <Scissors className="w-5 h-5" />
            </div>
            <h4 className={`text-lg font-serif font-semibold ${customImageUrl ? 'text-white' : 'text-stone-900'}`}>
              {title || 'Symaskin og yrkesopplæring'}
            </h4>
            <p className={`text-xs mt-1 line-clamp-2 ${customImageUrl ? 'text-stone-200' : 'text-stone-600'}`}>
              {subtitle || 'Gir unge kvinner verktøy til å starte eget tekstilverksted.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'books') {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-stone-200 bg-gradient-to-br from-sky-50 via-stone-50 to-blue-50 text-stone-800 ${aspectClass} ${className}`}
      >
        <div className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-xs border border-stone-200/60">
          <BookOpen className="w-6 h-6 text-sky-700" />
        </div>
        <div className="relative h-full flex flex-col justify-between p-6">
          <span className="text-xs uppercase tracking-widest text-stone-500 font-medium">Aksjon · Barn, ikke klasse</span>
          <div>
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-800 mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-serif font-semibold text-stone-900">{title || 'Symaskin til ett barn'}</h4>
            <p className="text-xs text-stone-600 mt-1 line-clamp-2">{subtitle || 'Hver innsamling er knyttet til barn i fadderordningen.'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'graduate') {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-stone-200 bg-gradient-to-br from-[#F6F4ED] via-stone-50 to-[#A3B18A]/20 text-stone-900 ${aspectClass} ${className}`}
      >
        <div className="absolute top-4 right-4 p-2 bg-[#A3B18A]/20 rounded-md text-[#4D6B3E] flex items-center gap-1 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Fullført utdanningsløp</span>
        </div>
        <div className="relative h-full flex flex-col justify-end p-6">
          <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-stone-200 flex items-center justify-center text-[#4D6B3E] mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-serif font-bold text-stone-900">{title || 'Jean-Luc (24 år)'}</h4>
          <p className="text-xs text-stone-600 mt-0.5 font-medium">{subtitle || 'Lærer i barneskolen, Brazzaville'}</p>
        </div>
      </div>
    );
  }

  if (type === 'coordinator') {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-stone-200 bg-gradient-to-br from-stone-100 to-[#F6F4ED] text-stone-800 ${aspectClass} ${className}`}
      >
        <div className="relative h-full flex flex-col justify-between p-6">
          <span className="text-xs uppercase tracking-widest text-stone-500 font-medium">Lokal oppfølging · Kongo</span>
          <div>
            <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center text-stone-700 mb-3">
              <User className="w-5 h-5" />
            </div>
            <h4 className="text-base font-serif font-semibold text-stone-900">{title || 'Koordinator på bakken'}</h4>
            <p className="text-xs text-stone-600 mt-1">{subtitle || 'Personlig oppfølging av hvert enkelt barn i skole og hjem.'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: child representation
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-stone-200 bg-gradient-to-br from-[#F6F4ED] to-stone-100 text-stone-800 flex flex-col items-center justify-center p-6 text-center ${aspectClass} ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-stone-200/70 border border-stone-300 flex items-center justify-center text-stone-600 mb-3">
        <School className="w-7 h-7" />
      </div>
      <h4 className="text-base font-serif font-semibold text-stone-900">{title || 'Elevprofil'}</h4>
      <p className="text-xs text-stone-500 mt-1">{subtitle || 'Beskyttet fadderoppfølging'}</p>
    </div>
  );
};
