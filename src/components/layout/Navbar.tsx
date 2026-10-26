import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Globe, Heart, MapPin, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationCenter } from '../common/NotificationCenter';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { PortalLoginModal } from '../auth/PortalLoginModal';
import { defaultPortalSection, defaultPortalSectionForProfile } from '../../utils/portalSession';
import { isAdminOppfolgingSection } from '../../utils/adminOppfolging';
import { publicNavVisibility } from '../../utils/cmsHomeLayout';
import { isFrontPageTestimonial } from '../../utils/testimonials';
import type { CmsContent, UserRole } from '../../types';

const ROLE_LABEL: Record<'admin' | 'coordinator' | 'sponsor', string> = {
  admin: 'Admin',
  coordinator: 'Koordinator',
  sponsor: 'Fadder',
};

/** Valg i «Vis som»-menyen for admin (admin kan åpne alle portaler). */
const VIS_SOM_ITEMS: { id: UserRole; label: string; icon: React.ReactNode }[] = [
  { id: 'admin', label: 'Administrasjon', icon: <Shield className="w-4 h-4" /> },
  { id: 'public', label: 'Offentlig nettside', icon: <Globe className="w-4 h-4" /> },
  { id: 'sponsor', label: 'Fadderportal', icon: <Heart className="w-4 h-4" /> },
  { id: 'coordinator', label: 'Koordinator', icon: <MapPin className="w-4 h-4" /> },
];

/** Visningsnavn: displayName hvis utfylt, ellers e-post. */
const displayNameOrEmail = (profile: { displayName: string; email: string }): string =>
  profile.displayName.trim() || profile.email;

interface NavbarProps {
  onOpenSponsorModal: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  /** CMS for offentlig meny (bruk utkast i innebygd preview). */
  cmsContent?: CmsContent;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSponsorModal,
  activeSection,
  setActiveSection,
  cmsContent: cmsContentProp,
}) => {
  const {
    role,
    setRole,
    t,
    campaigns,
    cmsContent: cmsFromApp,
    stories,
    language,
    firestoreUserProfile,
    firestoreProfileLoading,
    firestoreAccessMessage,
    firestoreAuthError,
    enterPortalFromProfile,
    signOutFirestore,
  } = useApp();

  const [loginOpen, setLoginOpen] = useState(false);
  const [visSomOpen, setVisSomOpen] = useState(false);
  const visSomRef = useRef<HTMLDivElement>(null);

  // Lukk «Vis som»-menyen ved klikk utenfor og ved Escape.
  useEffect(() => {
    if (!visSomOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (visSomRef.current && !visSomRef.current.contains(e.target as Node)) setVisSomOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisSomOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [visSomOpen]);

  const cmsForNav = cmsContentProp ?? cmsFromApp;
  const publicNav =
    role === 'public'
      ? publicNavVisibility(cmsForNav, {
          hasFrontPageStories: stories.some(isFrontPageTestimonial),
          hasActiveCampaigns: campaigns.some((c) => c.status === 'aktiv'),
        })
      : null;

  const handleOpenLogin = () => {
    setLoginOpen(true);
  };

  const handleEnterAdmin = () => {
    if (firestoreUserProfile && enterPortalFromProfile()) {
      setActiveSection(defaultPortalSectionForProfile(firestoreUserProfile));
    }
  };

  const handleVisSom = (target: UserRole) => {
    setVisSomOpen(false);
    if (target === 'admin') {
      handleEnterAdmin();
      return;
    }
    setRole(target);
    setActiveSection(defaultPortalSection(target));
  };

  const handleSignOut = () => {
    setLoginOpen(false);
    setRole('public');
    setActiveSection('home');
    void signOutFirestore();
  };

  const loginButtonClass =
    'px-3.5 py-1.5 text-xs font-medium text-[#3C3C3C] bg-white hover:bg-[#EBE7DC] border border-[#DFD9CB] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <>
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
              {publicNav?.fadderordningen && (
                <button
                  onClick={() => setActiveSection('fadderordningen')}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSection === 'fadderordningen' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                  }`}
                >
                  {t('nav.sponsorship', 'Fadderordningen')}
                </button>
              )}
              {publicNav?.historier && (
                <button
                  onClick={() => setActiveSection('historier')}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSection === 'historier' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                  }`}
                >
                  {t('nav.stories', 'Historier')}
                </button>
              )}
              {publicNav?.aksjoner && (
                <button
                  onClick={() => setActiveSection('aksjoner')}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSection === 'aksjoner' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                  }`}
                >
                  {t('nav.campaigns', 'Aksjoner')}
                </button>
              )}
              {publicNav?.omOss && (
                <button
                  onClick={() => setActiveSection('om-oss')}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSection === 'om-oss' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                  }`}
                >
                  {t('nav.about', 'Om Betyna')}
                </button>
              )}
              {publicNav?.apenhet && (
                <button
                  onClick={() => setActiveSection('apenhet')}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSection === 'apenhet' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                  }`}
                >
                  {t('nav.transparency', 'Åpenhet')}
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
                  isAdminOppfolgingSection(activeSection)
                    ? 'text-[#4D6B3E] font-semibold'
                    : 'hover:text-[#3C3C3C]'
                }`}
              >
                Oppfølging
              </button>
              <button
                onClick={() => setActiveSection('barn')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'barn' || activeSection === 'tildeling'
                    ? 'text-[#4D6B3E] font-semibold'
                    : 'hover:text-[#3C3C3C]'
                }`}
              >
                Barn
              </button>
              <button
                onClick={() => setActiveSection('brukere')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'brukere' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                Brukere
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
                onClick={() => setActiveSection('okonomi')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === 'okonomi' ? 'text-[#4D6B3E] font-semibold' : 'hover:text-[#3C3C3C]'
                }`}
              >
                Økonomi
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
            <span className="text-xs text-stone-500 whitespace-nowrap">Logger inn …</span>
          )}

          {!firestoreProfileLoading && firestoreUserProfile && firestoreUserProfile.role === 'admin' && (
            <div ref={visSomRef} className="relative hidden md:block">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={visSomOpen}
                aria-label={`Innlogget som ${displayNameOrEmail(firestoreUserProfile)}, ${ROLE_LABEL.admin}`}
                title={firestoreUserProfile.email}
                onClick={() => setVisSomOpen((open) => !open)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg whitespace-nowrap max-w-[220px] cursor-pointer transition-colors"
              >
                <span className="font-medium text-stone-800 truncate">{displayNameOrEmail(firestoreUserProfile)}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#4D6B3E] shrink-0">
                  {ROLE_LABEL.admin}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-500 shrink-0" aria-hidden />
              </button>
              {visSomOpen && (
                <div
                  role="menu"
                  aria-label="Vis som"
                  className="absolute right-0 top-full mt-1 z-40 w-56 bg-white border border-stone-200 rounded-lg shadow-lg py-1"
                >
                  <div role="presentation" className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                    Vis som
                  </div>
                  {VIS_SOM_ITEMS.map((item) => {
                    const active = role === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        aria-current={active ? 'true' : undefined}
                        onClick={() => handleVisSom(item.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors cursor-pointer hover:bg-stone-100 ${
                          active ? 'font-semibold text-[#4D6B3E]' : 'text-stone-700'
                        }`}
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        {active && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!firestoreProfileLoading && firestoreUserProfile && firestoreUserProfile.role !== 'admin' && (
            <span
              title={firestoreUserProfile.email}
              aria-label={`Innlogget som ${displayNameOrEmail(firestoreUserProfile)}, ${ROLE_LABEL[firestoreUserProfile.role]}`}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-stone-600 bg-stone-100 border border-stone-200 rounded-lg whitespace-nowrap max-w-[220px]"
            >
              <span className="font-medium text-stone-800 truncate">{displayNameOrEmail(firestoreUserProfile)}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#4D6B3E] shrink-0">
                {ROLE_LABEL[firestoreUserProfile.role]}
              </span>
            </span>
          )}

          {!firestoreProfileLoading && (
            <button
              type="button"
              onClick={firestoreUserProfile ? handleSignOut : handleOpenLogin}
              className={loginButtonClass}
            >
              {firestoreUserProfile ? t('nav.logout', 'Logg ut') : t('nav.login', 'Logg inn')}
            </button>
          )}

          {role === 'public' && firestoreUserProfile?.role === 'admin' && (
            <button
              type="button"
              onClick={handleEnterAdmin}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('nav.goAdmin', 'Administrasjon')}
            </button>
          )}

          {role === 'public' &&
            (firestoreUserProfile?.role === 'coordinator' || firestoreUserProfile?.role === 'sponsor') && (
              <button
                type="button"
                onClick={handleEnterAdmin}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Min side
              </button>
            )}

          {role === 'public' && publicNav?.bliFadderCta ? (
            <button
              type="button"
              onClick={() => onOpenSponsorModal()}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#4D6B3E] hover:bg-[#3B522F] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
            >
              {t('nav.becomeSponsor', 'Bli fadder')}
            </button>
          ) : role !== 'public' ? (
            <button
              onClick={() => setRole('public')}
              className="px-3.5 py-1.5 text-xs font-medium text-[#3C3C3C] bg-white hover:bg-[#EBE7DC] border border-[#DFD9CB] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t('nav.viewPublic', 'Se offentlig side')}
            </button>
          ) : null}
        </div>
      </div>
      {role === 'public' && (firestoreAuthError || firestoreAccessMessage) && (
        <p className="max-w-7xl mx-auto px-6 pb-3 text-xs text-red-900">
          {firestoreAuthError || firestoreAccessMessage}
        </p>
      )}
    </header>
    <PortalLoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};
