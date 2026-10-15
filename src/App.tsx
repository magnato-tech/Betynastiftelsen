/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleSwitcherBanner } from './components/common/RoleSwitcherBanner';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { PublicWebsite } from './components/public/PublicWebsite';
import { DevPortals } from './dev/DevPortals';
import { BecomeSponsorModal } from './components/modals/BecomeSponsorModal';
import { DonateCampaignModal } from './components/modals/DonateCampaignModal';
import { Campaign } from './types';
import { prototypeRoleSwitcherEnabled } from './config/prototypeAccess';
import { parseSponsorPortalLink } from './email/sponsorPortalLink';

const MainLayout: React.FC = () => {
  const { role, setRole, setCurrentSponsorId } = useApp();
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [donateCampaign, setDonateCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const parsed = parseSponsorPortalLink(window.location.search);
    if (!parsed) return;
    setRole('sponsor');
    setCurrentSponsorId(parsed.sponsorId);
    setActiveSection(parsed.section);
  }, [setRole, setCurrentSponsorId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4ED] text-[#3C3C3C] selection:bg-[#A3B18A]/30 selection:text-[#3C3C3C]">
      {/* 1. Persistent Role Switcher Ribbon for immediate testing */}
      {prototypeRoleSwitcherEnabled && <RoleSwitcherBanner />}

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

        {prototypeRoleSwitcherEnabled && role !== 'public' && (
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
