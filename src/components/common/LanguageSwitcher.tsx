import React from 'react';
import { useApp } from '../../context/AppContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'navbar' | 'compact' | 'footer';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'navbar',
}) => {
  const { language, setLanguage, t } = useApp();

  if (variant === 'footer') {
    return (
      <div className={`flex items-center gap-2 text-xs text-stone-400 ${className}`}>
        <Globe className="w-3.5 h-3.5 text-[#A3B18A]" />
        <span>Språk / Langue :</span>
        <button
          onClick={() => setLanguage('no')}
          className={`cursor-pointer transition-colors ${
            language === 'no' ? 'text-white font-semibold underline' : 'hover:text-stone-200'
          }`}
        >
          Norsk (Bokmål)
        </button>
        <span className="text-stone-600">·</span>
        <button
          onClick={() => setLanguage('fr')}
          className={`cursor-pointer transition-colors ${
            language === 'fr' ? 'text-white font-semibold underline' : 'hover:text-stone-200'
          }`}
        >
          Français
        </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center bg-[#EBE7DC]/80 hover:bg-[#EBE7DC] p-0.5 rounded-lg border border-[#DFD9CB] transition-colors shadow-2xs ${className}`}
      role="group"
      aria-label={t('languageSwitcher.ariaLabel', 'Velg språk / Choisir la langue')}
    >
      <button
        type="button"
        onClick={() => setLanguage('no')}
        className={`px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
          language === 'no'
            ? 'bg-white text-stone-900 shadow-2xs font-semibold'
            : 'text-stone-600 hover:text-stone-900'
        }`}
        title="Norsk Bokmål"
        aria-pressed={language === 'no'}
      >
        <span className="text-xs">🇳🇴</span>
        <span className="tracking-wide">Bokmål</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
          language === 'fr'
            ? 'bg-white text-stone-900 shadow-2xs font-semibold'
            : 'text-stone-600 hover:text-stone-900'
        }`}
        title="Français"
        aria-pressed={language === 'fr'}
      >
        <span className="text-xs">🇫🇷</span>
        <span className="tracking-wide">Français</span>
      </button>
    </div>
  );
};
