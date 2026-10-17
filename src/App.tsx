/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleSwitcherBanner } from './components/common/RoleSwitcherBanner';
import { PortalRoleBar } from './components/common/PortalRoleBar';
import { SaveStatusPill } from './components/common/SaveStatusPill';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { PublicWebsite } from './components/public/PublicWebsite';
import { DevPortals } from './dev/DevPortals';
import { BecomeSponsorModal } from './components/modals/BecomeSponsorModal';
import { DonateCampaignModal } from './components/modals/DonateCampaignModal';
import { Campaign } from './types';
import { prototypeRoleSwitcherEnabled } from './config/prototypeAccess';
import { readCmsPreviewFlags } from './utils/cmsPreview';
import { consumePortalIntent, markPortalIntent } from './utils/portalIntent';
import { defaultPortalSectionForProfile } from './utils/portalSession';

const MainLayout: React.FC = () => {
  const { role, setRole, firestoreLoading, firestoreUserProfile, enterPortalFromProfile } = useApp();
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [donateCampaign, setDonateCampaign] = useState<Campaign | null>(null);
  const previewFlags = readCmsPreviewFlags();
  const homepageChosenFor = useRef<string | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('betyna_return_to') === 'admin:innstillinger') {
        sessionStorage.removeItem('betyna_return_to');
        markPortalIntent();
        setActiveSection('innstillinger');
        return;
      }
    } catch {
      /* ignore */
    }
    if (previewFlags.preview) {
      setRole('public');
      const hash = window.location.hash.replace('#', '') || 'home';
      setActiveSection(hash);
      const onHash = () => setActiveSection(window.location.hash.replace('#', '') || 'home');
      window.addEventListener('hashchange', onHash);
      return () => window.removeEventListener('hashchange', onHash);
    }
  }, [previewFlags.preview, setRole]);

  /** Rot-URL starter som offentlig forsiden. Valg i den svarte menyen skal bli stående. */
  useEffect(() => {
    if (previewFlags.preview || firestoreLoading) return;
    const key = firestoreUserProfile?.id ?? 'anonymous';
    if (homepageChosenFor.current === key) return;
    homepageChosenFor.current = key;
    if (!firestoreUserProfile) {
      setRole('public');
      setActiveSection('home');
      return;
    }
    if (consumePortalIntent() && enterPortalFromProfile()) {
      setActiveSection(defaultPortalSectionForProfile(firestoreUserProfile));
      return;
    }
    setRole('public');
    setActiveSection('home');
  }, [previewFlags.preview, firestoreLoading, firestoreUserProfile, enterPortalFromProfile, setRole]);

  if (firestoreLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F4ED] text-stone-500 text-sm">
        Laster …
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4ED] text-[#3C3C3C] selection:bg-[#A3B18A]/30 selection:text-[#3C3C3C]">
      <SaveStatusPill />
      {/* Testperiode: visningslinjen blir stående også etter innlogging. Fjernes med VITE_PROTOTYPE_ROLE_SWITCHER=false. */}
      {prototypeRoleSwitcherEnabled && !previewFlags.preview && <RoleSwitcherBanner />}
      {!prototypeRoleSwitcherEnabled && firestoreUserProfile && <PortalRoleBar />}

      {/* 2. Top Bar complying with strict 1-row 3-zone contract */}
      <Navbar
        onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* 3. Main Content Router based on Active Role */}
      <main className="flex-1">
        {role === 'public' && (
          <PublicWebsite
            onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
            onOpenDonateModal={(camp) => setDonateCampaign(camp)}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        )}

        {role !== 'public' && (
          <DevPortals
            role={role}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        )}
      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Modals */}
      <BecomeSponsorModal
        isOpen={isSponsorModalOpen}
        onClose={() => setIsSponsorModalOpen(false)}
      />

      <DonateCampaignModal
        campaign={donateCampaign}
        onClose={() => setDonateCampaign(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
