import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AppNotification } from '../../types';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  FileText,
  UserCheck,
  Award,
  X,
  ArrowRight,
} from 'lucide-react';

interface NotificationCenterProps {
  onNavigateSection?: (section: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigateSection }) => {
  const {
    role,
    language,
    currentRoleNotifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = currentRoleNotifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'milestone_logged':
        return <Award className="w-4 h-4 text-[#4D6B3E] shrink-0 mt-0.5" />;
      case 'report_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />;
      case 'report_needs_approval':
        return <Clock className="w-4 h-4 text-[#4D6B3E] shrink-0 mt-0.5" />;
      case 'report_rejected':
        return <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />;
      case 'inquiry_answered':
      case 'inquiry_forwarded':
      case 'inquiry_new':
        return <MessageSquare className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />;
      case 'sponsor_assigned':
        return <UserCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />;
      default:
        return <FileText className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />;
    }
  };

  const isFr = language === 'fr' || role === 'coordinator';

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.actionSection && onNavigateSection) {
      onNavigateSection(notif.actionSection);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isFr ? 'Centre de notifications' : 'Varslingssenter'}
        aria-expanded={isOpen}
        className="relative p-2 text-[#3C3C3C] hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#4D6B3E]"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#4D6B3E] text-white rounded-full text-[10px] font-mono font-bold leading-tight tabular-nums shadow-xs">
            {unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#F6F4ED] border border-stone-300 rounded-xl shadow-xl z-50 overflow-hidden text-xs font-sans animate-in fade-in duration-150">
          {/* Header */}
          <div className="p-3.5 bg-stone-100/90 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-[#3C3C3C] text-sm">
                {isFr ? 'Notifications' : 'Varslinger'}
              </span>
              {unreadNotificationCount > 0 && (
                <span className="text-[11px] text-stone-500 font-mono">
                  ({unreadNotificationCount} {isFr ? 'non lues' : 'uleste'})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadNotificationCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-[11px] text-[#4D6B3E] hover:text-[#3B522F] font-medium cursor-pointer"
                >
                  {isFr ? 'Tout marquer comme lu' : 'Merk alle som lest'}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-3.5 py-2 bg-white/70 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-[#3C3C3C] text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {isFr ? 'Toutes' : 'Alle'} ({currentRoleNotifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-[#4D6B3E] text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {isFr ? 'Non lues' : 'Uleste'} ({unreadNotificationCount})
              </button>
            </div>

            <span className="text-[10px] text-stone-400 font-medium">
              {role === 'sponsor' && (isFr ? 'Espace Parrain' : 'Fadder')}
              {role === 'coordinator' && (isFr ? 'Espace Terrain' : 'Koordinator')}
              {role === 'admin' && 'Oslo Admin'}
              {role === 'public' && (isFr ? 'Public' : 'Offentlig')}
            </span>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 bg-white">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 transition-colors relative flex items-start gap-3 hover:bg-stone-50 ${
                  !n.read ? 'bg-[#A3B18A]/15' : 'opacity-85'
                }`}
              >
                {getNotificationIcon(n.type)}

                <div className="flex-1 space-y-1 pr-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                    <span>{n.timestamp}</span>
                    {!n.read && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#4D6B3E] font-semibold font-mono">
                          {isFr ? 'NOUVEAU' : 'NY'}
                        </span>
                      </>
                    )}
                  </div>

                  <h4 className="font-semibold text-[#3C3C3C] text-xs leading-snug">
                    {n.title}
                  </h4>

                  <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                    {n.message}
                  </p>

                  {n.actionSection && (
                    <button
                      onClick={() => handleNotificationClick(n)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#4D6B3E] hover:text-[#3B522F] font-semibold pt-1 cursor-pointer"
                    >
                      <span>
                        {n.actionSection === 'tidslinje' && (isFr ? 'Voir la chronologie' : 'Åpne tidslinje')}
                        {n.actionSection === 'jalons' && (isFr ? 'Voir les jalons' : 'Se milepæler')}
                        {n.actionSection === 'rapporter' && (isFr ? 'Voir les rapports' : 'Åpne rapport')}
                        {n.actionSection === 'godkjenning' && (isFr ? 'Accéder à la validation' : 'Gå til godkjenningskø')}
                        {n.actionSection === 'sporsmaal' && (isFr ? 'Voir les questions' : 'Se spørsmål & svar')}
                        {n.actionSection === 'questions' && (isFr ? 'Répondre à la question' : 'Se henvendelse')}
                        {n.actionSection === 'barn' && (isFr ? 'Voir l’élève' : 'Se fadderbarnet')}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => deleteNotification(n.id)}
                  title={isFr ? 'Supprimer la notification' : 'Fjern varsel'}
                  className="absolute top-3 right-2.5 p-1 text-stone-300 hover:text-stone-600 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {filteredNotifications.length === 0 && (
              <div className="py-8 px-4 text-center text-stone-400 space-y-1">
                <CheckCircle2 className="w-5 h-5 mx-auto text-stone-300 mb-1" />
                <p className="text-xs font-medium text-stone-600">
                  {isFr ? 'Aucune notification' : 'Ingen varsler å vise'}
                </p>
                <p className="text-[11px] text-stone-400">
                  {isFr
                    ? 'Vous serez alerté lors de nouvelles validations ou rapports.'
                    : 'Du blir varslet her når nye rapporter godkjennes eller krever oppfølging.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
