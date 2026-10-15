import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { Globe, Heart, Shield, MapPin, RefreshCw, Eye, AlertCircle } from 'lucide-react';

export const RoleSwitcherBanner: React.FC = () => {
  const {
    role,
    setRole,
    sponsors,
    currentSponsor,
    setCurrentSponsorId,
    coordinators,
    currentCoordinator,
    setCurrentCoordinatorId,
    resetAllData,
    notifications,
    language,
  } = useApp();
  const connectedAsLabel = language === 'fr' ? 'Connecté comme :' : 'Innlogget som:';

  const getRoleUnreadCount = (roleId: UserRole) => {
    return notifications.filter((n) => {
      if (n.read) return false;
      if (roleId === 'admin') return n.targetRole === 'admin' || n.targetRole === 'all';
      if (roleId === 'coordinator') {
        return (
          (n.targetRole === 'coordinator' || n.targetRole === 'all') &&
          (!n.recipientId || n.recipientId === (currentCoordinator?.id || 'coord-01'))
        );
      }
      if (roleId === 'sponsor') {
        return (
          (n.targetRole === 'sponsor' || n.targetRole === 'all') &&
          (!n.recipientId || n.recipientId === (currentSponsor?.id || 'sponsor-01'))
        );
      }
      return n.targetRole === 'all';
    }).length;
  };

  const roles: { id: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'public',
      label: 'Offentlig nettside',
      icon: <Globe className="w-4 h-4" />,
      desc: 'Åpen side for besøkende, givere og fadderinteressenter (ingen private barneprofiler).',
    },
    {
      id: 'sponsor',
      label: 'Fadderportal (Norge)',
      icon: <Heart className="w-4 h-4" />,
      desc: 'Innlogget fadder som kun ser sitt tildelte barn, godkjente rapporter og betalinger.',
    },
    {
      id: 'coordinator',
      label: 'Koordinator (Kongo)',
      icon: <MapPin className="w-4 h-4" />,
      desc: 'Arbeidsflate i felten for registrering, rapporter og skoleoppdatering. Bokmål og fransk.',
    },
    {
      id: 'admin',
      label: 'Administrasjon (Oslo)',
      icon: <Shield className="w-4 h-4" />,
      desc: 'Overordnet kontroll: godkjenning av rapporter, tospråklig revisjon, tildeling og økonomi.',
    },
  ];

  return (
    <aside aria-label="Rollevelger og prototypekontroll" className="bg-stone-900 text-stone-200 border-b border-stone-800 text-xs px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Role Segmented Controller */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-stone-400 font-medium mr-1.5 hidden sm:inline flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-[#A3B18A]" />
            <span>Visningsmodus:</span>
          </span>
          <div className="flex bg-stone-800/90 p-0.5 rounded-lg border border-stone-700/80">
            {roles.map((r) => {
              const active = role === r.id;
              const unread = getRoleUnreadCount(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  title={r.desc}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                    active
                      ? 'bg-[#4D6B3E] text-white shadow-xs'
                      : 'text-stone-300 hover:text-white hover:bg-stone-700/60'
                  }`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                  {unread > 0 && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold leading-tight tabular-nums ${
                        active ? 'bg-white text-stone-900' : 'bg-[#A3B18A] text-stone-950'
                      }`}
                      title={`${unread} nye varsler`}
                    >
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sponsor Switcher when in Sponsor mode */}
        {role === 'coordinator' && (
          <div className="flex items-center gap-2 bg-stone-800/80 px-2 py-1 rounded-md border border-stone-700">
            <span className="text-stone-400">{connectedAsLabel}</span>
            <select
              value={currentCoordinator?.id || 'coord-01'}
              onChange={(e) => setCurrentCoordinatorId(e.target.value)}
              className="bg-stone-900 text-[#A3B18A] font-medium rounded px-2 py-0.5 border border-stone-700 text-xs focus:outline-hidden max-w-[220px]"
            >
              {coordinators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fornavn} {c.etternavn} — {c.distrikt.split('—')[1]?.trim() || c.distrikt}
                </option>
              ))}
            </select>
          </div>
        )}

        {role === 'sponsor' && (
          <div className="flex items-center gap-2 bg-stone-800/80 px-2 py-1 rounded-md border border-stone-700">
            <span className="text-stone-400">Innlogget som fadder:</span>
            <select
              value={currentSponsor?.id || 'sponsor-01'}
              onChange={(e) => setCurrentSponsorId(e.target.value)}
              className="bg-stone-900 text-[#A3B18A] font-medium rounded px-2 py-0.5 border border-stone-700 text-xs focus:outline-hidden"
            >
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.navn} ({s.maanedsbelop} kr/mnd)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset helper */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Nullstill alle endringer til opprinnelige eksempeldata?')) {
                resetAllData();
              }
            }}
            className="flex items-center gap-1 text-stone-400 hover:text-stone-200 transition-colors"
            title="Nullstill mockdata til utgangspunktet"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Nullstill data</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
