import React from 'react';
import { SponsorPortal } from '../components/sponsor/SponsorPortal';
import { CoordinatorPortal } from '../components/coordinator/CoordinatorPortal';
import { AdminPortal } from '../components/admin/AdminPortal';

interface DevPortalsProps {
  role: string;
  activeSection: string;
  setActiveSection: (sec: string) => void;
}

export const DevPortals: React.FC<DevPortalsProps> = ({
  role,
  activeSection,
  setActiveSection,
}) => {
  if (role === 'sponsor') {
    return (
      <SponsorPortal activeSection={activeSection} setActiveSection={setActiveSection} />
    );
  }
  if (role === 'coordinator') {
    return (
      <CoordinatorPortal activeSection={activeSection} setActiveSection={setActiveSection} />
    );
  }
  if (role === 'admin') {
    return (
      <AdminPortal activeSection={activeSection} setActiveSection={setActiveSection} />
    );
  }
  return null;
};
