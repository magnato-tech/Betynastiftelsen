/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleSwitcherBanner } from './components/common/RoleSwitcherBanner';
import { ViewAsBanner } from './components/common/ViewAsBanner';
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
import {
  applyCmsSectionHighlight,
  CMS_PREVIEW_READY,
  isCmsPreviewMessage,
  type CmsPreviewDraftPayload,
} from './utils/cmsPreviewBridge';
import { consumePortalIntent, markPortalIntent } from './utils/portalIntent';
import { defaultPortalSectionForProfile } from './utils/portalSession';
import { getHeroCtaCardConfig } from './utils/heroLayout';

const MainLayout: React.FC = () => {
  const {
    role,
    setRole,
    setLanguage,
    firestoreLoading,
    firestoreUserProfile,
    enterPortalFromProfile,
    cmsContent,
  } = useApp();
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [donateCampaign, setDonateCampaign] = useState<Campaign | null>(null);
  const previewFlags = readCmsPreviewFlags();
  const [cmsPreviewDraft, setCmsPreviewDraft] = useState<CmsPreviewDraftPayload | null>(null);
  const homepageChosenFor = useRef<string | null>(null);
  const cmsContentForNav =
    previewFlags.embedded && cmsPreviewDraft ? cmsPreviewDraft.cmsContent : cmsContent;

  useEffect(() => {
    if (!previewFlags.embedded) return;
    setLanguage('no');
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (isCmsPreviewMessage(event.data)) {
        setCmsPreviewDraft(event.data.draft);
      }
    };
    window.addEventListener('message', onMessage);
    if (window.parent !== window) {
      window.parent.postMessage({ type: CMS_PREVIEW_READY }, window.location.origin);
    }
    return () => window.removeEventListener('message', onMessage);
  }, [previewFlags.embedded, setLanguage]);

  useEffect(() => {
    if (!previewFlags.embedded || !cmsPreviewDraft) return;
    const id = requestAnimationFrame(() => {
      applyCmsSectionHighlight(cmsPreviewDraft.highlightSection);
    });
    return () => cancelAnimationFrame(id);
  }, [previewFlags.embedded, cmsPreviewDraft]);

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
      {/* Prototypelinjen (svart) er av i produksjon. Lokalt er den på; i produksjon slås den på med VITE_PROTOTYPE_ROLE_SWITCHER=true. */}
      {prototypeRoleSwitcherEnabled && !previewFlags.preview && <RoleSwitcherBanner />}
      {/* Admin som ser siden som en annen rolle: gul linje med «Tilbake til admin». */}
      {!prototypeRoleSwitcherEnabled && firestoreUserProfile?.role === 'admin' && role !== 'admin' && (
        <ViewAsBanner setActiveSection={setActiveSection} />
      )}

      {/* 2. Top Bar complying with strict 1-row 3-zone contract */}
      <Navbar
        onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        cmsContent={cmsContentForNav}
      />

      {/* 3. Main Content Router based on Active Role */}
      <main className="flex-1">
        {role === 'public' && (
          <PublicWebsite
            onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
            onOpenDonateModal={(camp) => setDonateCampaign(camp)}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            cmsPreviewDraft={previewFlags.embedded ? cmsPreviewDraft : null}
            cmsPreviewEmbedded={previewFlags.embedded}
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
        heroCtaConfig={getHeroCtaCardConfig(cmsContent.hero)}
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
