import React from 'react';
import { SponsorPortal } from '../components/sponsor/SponsorPortal';
import { CoordinatorPortal } from '../components/coordinator/CoordinatorPortal';
import { AdminPortal } from '../components/admin/AdminPortal';
import { useApp } from '../context/AppContext';

interface DevPortalsProps {
  role: string;
  activeSection: string;
  setActiveSection: (sec: string) => void;
  focusEntityId?: string | null;
  onClearFocus?: () => void;
}

export const DevPortals: React.FC<DevPortalsProps> = ({
  role,
  activeSection,
  setActiveSection,
  focusEntityId,
  onClearFocus,
}) => {
  const { language } = useApp();

  if (role === 'sponsor') {
    return (
      <SponsorPortal activeSection={activeSection} setActiveSection={setActiveSection} />
    );
  }
  if (role === 'coordinator') {
    return (
      <CoordinatorPortal
        key={language}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        focusEntityId={focusEntityId}
        onClearFocus={onClearFocus}
      />
    );
  }
  if (role === 'admin') {
    return (
      <AdminPortal
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        focusEntityId={focusEntityId}
        onClearFocus={onClearFocus}
      />
    );
  }
  return null;
};
