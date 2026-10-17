import React from 'react';
import { ADMIN_OPPFOLGING_TABS, normalizeOppfolgingTab } from '../../utils/adminOppfolging';

interface AdminOppfolgingSubNavProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
}

export const AdminOppfolgingSubNav: React.FC<AdminOppfolgingSubNavProps> = ({
  activeSection,
  setActiveSection,
}) => {
  const active = normalizeOppfolgingTab(activeSection);

  return (
    <div className="space-y-2 pb-2 border-b border-stone-200">
      <div>
        <h2 className="text-xl font-serif font-bold text-stone-900">Oppfølging</h2>
        <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
          Godkjenn innhold fra Kongo, svar faddere og se revisjonslogg.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1.5 pt-1" aria-label="Oppfølging">
        {ADMIN_OPPFOLGING_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              active === tab.id
                ? 'bg-[#4D6B3E] text-white shadow-xs'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
