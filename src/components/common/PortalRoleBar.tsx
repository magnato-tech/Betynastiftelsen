import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { canOpenPortalRole, isAdminProfile } from '../../utils/portalRoles';
import { Globe, Heart, Shield, MapPin } from 'lucide-react';

const ROLE_META: { id: UserRole; label: string; icon: React.ReactNode }[] = [
  { id: 'public', label: 'Offentlig nettside', icon: <Globe className="w-4 h-4" /> },
  { id: 'sponsor', label: 'Fadderportal', icon: <Heart className="w-4 h-4" /> },
  { id: 'coordinator', label: 'Koordinator (Kongo)', icon: <MapPin className="w-4 h-4" /> },
  { id: 'admin', label: 'Administrasjon', icon: <Shield className="w-4 h-4" /> },
];

/** Admin (og utviklingsmodus): bytt portal og velg koordinator/fadder for «se som». */
export const PortalRoleBar: React.FC = () => {
  const {
    role,
    setRole,
    firestoreUserProfile,
    sponsors,
    currentSponsor,
    setCurrentSponsorId,
    coordinators,
    currentCoordinator,
    setCurrentCoordinatorId,
  } = useApp();

  const profile = firestoreUserProfile;
  const adminUser = isAdminProfile(profile);
  const visibleRoles = ROLE_META.filter((r) => canOpenPortalRole(profile, r.id));

  if (!profile || visibleRoles.length <= 1) return null;

  return (
    <aside
      aria-label="Portalvelger"
      className="bg-stone-900 text-stone-200 border-b border-stone-800 text-xs px-4 py-2"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-stone-400 font-medium">
            {adminUser ? 'Admin — vis som:' : 'Innlogget — portal:'}
          </span>
          <div className="flex bg-stone-800/90 p-0.5 rounded-lg border border-stone-700/80 flex-wrap">
            {visibleRoles.map((r) => {
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    active ? 'bg-[#4D6B3E] text-white' : 'text-stone-300 hover:text-white hover:bg-stone-700/60'
                  }`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {role === 'coordinator' && coordinators.length > 0 && (
          <div className="flex items-center gap-2 bg-stone-800/80 px-2 py-1 rounded-md border border-stone-700">
            <span className="text-stone-400">Koordinator:</span>
            {adminUser ? (
              <select
                value={currentCoordinator?.id || ''}
                onChange={(e) => setCurrentCoordinatorId(e.target.value)}
                className="bg-stone-900 text-[#A3B18A] font-medium rounded px-2 py-0.5 border border-stone-700 text-xs focus:outline-hidden max-w-[240px] cursor-pointer"
              >
                {coordinators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fornavn} {c.etternavn} — {c.distrikt}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[#A3B18A] font-medium">
                {currentCoordinator?.fornavn} {currentCoordinator?.etternavn}
              </span>
            )}
          </div>
        )}

        {role === 'sponsor' && sponsors.length > 0 && (
          <div className="flex items-center gap-2 bg-stone-800/80 px-2 py-1 rounded-md border border-stone-700">
            <span className="text-stone-400">Fadder:</span>
            {adminUser ? (
              <select
                value={currentSponsor?.id || ''}
                onChange={(e) => setCurrentSponsorId(e.target.value)}
                className="bg-stone-900 text-[#A3B18A] font-medium rounded px-2 py-0.5 border border-stone-700 text-xs focus:outline-hidden max-w-[240px] cursor-pointer"
              >
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.navn} ({s.maanedsbelop} kr/mnd)
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[#A3B18A] font-medium">{currentSponsor?.navn}</span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
