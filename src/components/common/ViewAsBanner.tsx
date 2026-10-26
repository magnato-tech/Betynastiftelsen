import React from 'react';
import { useApp } from '../../context/AppContext';
import { defaultPortalSection } from '../../utils/portalSession';

interface ViewAsBannerProps {
  setActiveSection: (section: string) => void;
}

/**
 * Vises kun for admin som ser siden som en annen rolle (App.tsx styrer når).
 * Kun visning: endringer gjort her lagres ikke.
 */
export const ViewAsBanner: React.FC<ViewAsBannerProps> = ({ setActiveSection }) => {
  const {
    role,
    setRole,
    sponsors,
    currentSponsor,
    setCurrentSponsorId,
    coordinators,
    currentCoordinator,
    setCurrentCoordinatorId,
  } = useApp();

  const backToAdmin = () => {
    setRole('admin');
    setActiveSection(defaultPortalSection('admin'));
  };

  const backButton = (
    <button
      type="button"
      onClick={backToAdmin}
      className="px-3 py-1 text-xs font-semibold text-amber-50 bg-amber-900 hover:bg-amber-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
    >
      Tilbake til admin
    </button>
  );

  const selectClass =
    'bg-white text-amber-950 font-medium rounded-md px-2 py-1 border border-amber-400 text-xs max-w-[260px] cursor-pointer';

  if (role === 'sponsor') {
    return (
      <div role="status" aria-label="Visningsmodus" className="bg-amber-100 border-b border-amber-300 text-amber-950 text-xs px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">Du ser siden som fadder</span>
            {sponsors.length > 0 && (
              <select
                aria-label="Velg fadder"
                value={currentSponsor?.id || ''}
                onChange={(e) => setCurrentSponsorId(e.target.value)}
                className={selectClass}
              >
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.navn}
                  </option>
                ))}
              </select>
            )}
            <span className="text-amber-800">Kun visning – endringer lagres ikke</span>
          </div>
          {backButton}
        </div>
      </div>
    );
  }

  if (role === 'coordinator') {
    return (
      <div role="status" aria-label="Visningsmodus" className="bg-amber-100 border-b border-amber-300 text-amber-950 text-xs px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">Du ser siden som koordinator</span>
            {coordinators.length > 0 && (
              <select
                aria-label="Velg koordinator"
                value={currentCoordinator?.id || ''}
                onChange={(e) => setCurrentCoordinatorId(e.target.value)}
                className={selectClass}
              >
                {coordinators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fornavn} {c.etternavn} — {c.distrikt}
                  </option>
                ))}
              </select>
            )}
            <span className="text-amber-800">Kun visning – endringer lagres ikke</span>
          </div>
          {backButton}
        </div>
      </div>
    );
  }

  if (role === 'public') {
    return (
      <div role="status" aria-label="Visningsmodus" className="bg-stone-100 border-b border-stone-300 text-stone-700 text-xs px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-3">
          <span className="font-medium">Du ser den offentlige nettsiden</span>
          {backButton}
        </div>
      </div>
    );
  }

  return null;
};
