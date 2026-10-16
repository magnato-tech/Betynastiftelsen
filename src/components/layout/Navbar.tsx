import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NotificationCenter } from '../common/NotificationCenter';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { PortalLoginModal } from '../auth/PortalLoginModal';

interface NavbarProps {
  onOpenSponsorModal: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSponsorModal,
  activeSection,
  setActiveSection,
}) => {
  const {
    role,
    setRole,
    t,
    campaigns,
    language,
    firestoreEnabled,
    firestoreUserEmail,
    firestoreUserProfile,
    firestoreProfileLoading,
    firestoreAccessMessage,
    firestoreAuthError,
    enterPortalFromProfile,
  } = useApp();

  const [loginOpen, setLoginOpen] = useState(false);

  const handleOpenLogin = () => {
    if (!firestoreEnabled) return;
    enterPortalFromProfile();
    setLoginOpen(true);
  };

  const handleEnterPortal = () => {
    enterPortalFromProfile();
    setLoginOpen(false);
  };

  const loginNavClass =
    'transition-colors whitespace-nowrap shrink-0 cursor-pointer text-[#4D6B3E] font-semibold hover:text-[#3B522F]';
  const loginButtonClass =
    'px-3.5 py-1.5 text-xs font-medium text-[#3C3C3C] bg-white hover:bg-[#EBE7DC] border border-[#DFD9CB] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <header className="bg-[#F6F4ED]/95 backdrop-blur-md sticky top-0 z-30 border-b border-[#DFD9CB]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => {
            setRole('public');
            setActiveSection('home');
          }}
          className="text-xl font-bold tracking-tight text-[#3C3C3C] whitespace-nowrap shrink-0 font-serif text-left hover:text-[#4D6B3E] transition-colors cursor-pointer"
        >
          Betyna
        </button>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#666666]">
          {role === 'public' && (
            <>
              <button
                onClick={() => setActiveSection('fadderordningen')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'fadderordningen' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                {t('nav.sponsorship', 'Fadderordningen')}
              </button>
              <button
                onClick={() => setActiveSection('historier')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'historier' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                {t('nav.stories', 'Historier')}
              </button>
              {campaigns.length > 0 && (
              <button
                onClick={() => setActiveSection('aksjoner')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'aksjoner' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                {t('nav.campaigns', 'Aksjoner')}
              </button>
              )}
              <button
                onClick={() => setActiveSection('om-oss')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'om-oss' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                {t('nav.about', 'Om Betyna')}
              </button>
              <button
                onClick={() => setActiveSection('apenhet')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'apenhet' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                {t('nav.transparency', 'Åpenhet')}
              </button>
              <span className="text-[#DFD9CB] select-none" aria-hidden>|</span>
              {firestoreProfileLoading && (
                <span className="text-xs text-stone-500 whitespace-nowrap">Logger inn …</span>
              )}
              {!firestoreProfileLoading && !firestoreUserProfile && (
                <button
                  type="button"
                  onClick={handleOpenLogin}
                  disabled={!firestoreEnabled}
                  title={firestoreEnabled ? undefined : 'Firestore er ikke aktivert i dette miljøet'}
                  className={loginNavClass}
                >
                  {t('nav.login', 'Logg inn')}
                </button>
              )}
              {!firestoreProfileLoading && firestoreUserProfile && (
                <button type="button" onClick={handleEnterPortal} className={loginNavClass}>
                  {t('nav.enterPortal', 'Gå til administrasjon')}
                </button>
              )}
            </>
          )}

          {role === 'sponsor' && (
            <>
              <button
                onClick={() => setActiveSection('barn')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'barn' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                Dine fadderbarn
              </button>
              <button
                onClick={() => setActiveSection('tidslinje')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'tidslinje' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                Tidslinje & milepæler
              </button>
              <button
                onClick={() => setActiveSection('rapporter')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'rapporter' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                Godkjente rapporter
              </button>
              <button
                onClick={() => setActiveSection('betalinger')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'betalinger' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                Betalingsoversikt
              </button>
              <button
                onClick={() => setActiveSection('sporsmaal')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'sporsmaal' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                Spørsmål & svar
              </button>
            </>
          )}

          {role === 'coordinator' && (
            <React.Fragment key={language}>
              <button
                onClick={() => setActiveSection('eleves')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'eleves' || activeSection.startsWith('profil:')
                    ? 'text-[#4D6B3E] font-semibold'
                    : 'hover:text-[#3C3C3C]'
                }`}
              >
                {t('nav.coordStudents', 'Elevliste')}
              </button>
              <button
                onClick={() => setActiveSection('jalons')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'jalons' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                {t('nav.coordMilestones', 'Milepæler og tidslinje')}
              </button>
              <button
                onClick={() => setActiveSection('rapports')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'rapports' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                {t('nav.coordReports', 'Rapporter')}
              </button>
              <button
                onClick={() => setActiveSection('photos')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'photos' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                {t('nav.coordPhotos', 'Bilder')}
              </button>
              <button
                onClick={() => setActiveSection('questions')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'questions' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                {t('nav.coordQuestions', 'Spørsmål fra Kristiansand')}
              </button>
            </React.Fragment>
          )}

          {role === 'admin' && (
            <>
              <button
                onClick={() => setActiveSection('godkjenning')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'godkjenning' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                Godkjenningskø
              </button>
              <button
                onClick={() => setActiveSection('tildeling')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'tildeling' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                Barn & Faddere
              </button>
              <button
                onClick={() => setActiveSection('sporsmaal')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'sporsmaal' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                Spørsmålsflyt
              </button>
              <button
                onClick={() => setActiveSection('okonomi')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'okonomi' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                Økonomi & avstemming
              </button>
              <button
                onClick={() => setActiveSection('cms')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'cms' ||
                  activeSection === 'historier' ||
                  activeSection === 'testimonials'
                    ? 'text-[#4D6B3E] font-semibold'
                    : 'hover:text-[#3C3C3C]'
                }`}
              >
                CMS
              </button>
              <button
                onClick={() => setActiveSection('logg')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'logg' || activeSection === 'aksjoner'
                    ? 'text-[#4D6B3E] font-semibold'
                    : 'hover:text-[#3C3C3C]'
                }`}
              >
                Revisjonslogg
              </button>
              <button
                onClick={() => setActiveSection('nyhetsbrev')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'nyhetsbrev' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                E-post
              </button>
              <button
                onClick={() => setActiveSection('innstillinger')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'innstillinger' || activeSection === 'hjelp'
                    ? 'text-[#4D6B3E] font-semibold'
                    : 'hover:text-[#3C3C3C]'
                }`}
              >
                Innstillinger
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Language switcher + primary action + notification hub */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguageSwitcher />

          {role !== 'public' && <NotificationCenter onNavigateSection={setActiveSection} />}

          {role === 'public' && firestoreProfileLoading && (
            <span className="text-xs text-stone-500 whitespace-nowrap md:hidden">Logger inn …</span>
          )}

          {role === 'public' && !firestoreProfileLoading && !firestoreUserProfile && (
            <button
              type="button"
              onClick={handleOpenLogin}
              disabled={!firestoreEnabled}
              title={firestoreEnabled ? undefined : 'Firestore er ikke aktivert i dette miljøet'}
              className={`${loginButtonClass} md:hidden`}
            >
              {t('nav.login', 'Logg inn')}
            </button>
          )}

          {role === 'public' && !firestoreProfileLoading && firestoreUserProfile && (
            <button
              type="button"
              onClick={handleEnterPortal}
              className={`${loginButtonClass} md:hidden`}
            >
              {t('nav.enterPortal', 'Administrasjon')}
            </button>
          )}

          {role === 'public' ? (
            <button
              type="button"
              onClick={() => onOpenSponsorModal()}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#4D6B3E] hover:bg-[#3B522F] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
            >
              {t('nav.becomeSponsor', 'Bli fadder')}
            </button>
          ) : (
            <button
              onClick={() => setRole('public')}
              className="px-3.5 py-1.5 text-xs font-medium text-[#3C3C3C] bg-white hover:bg-[#EBE7DC] border border-[#DFD9CB] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('nav.viewPublic', 'Se offentlig side')}
            </button>
          )}
        </div>
      </div>
      {role === 'public' && (firestoreAuthError || firestoreAccessMessage) && (
        <p className="max-w-7xl mx-auto px-6 pb-3 text-xs text-red-900">
          {firestoreAuthError || firestoreAccessMessage}
        </p>
      )}
      <PortalLoginModal
        isOpen={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          enterPortalFromProfile();
        }}
      />
    </header>
  );
};
