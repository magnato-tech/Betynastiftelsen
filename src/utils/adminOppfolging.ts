/** Underfaner samlet i admin-fanen Oppfølging. */
export type AdminOppfolgingTab = 'godkjenning' | 'sporsmaal' | 'logg';

export const ADMIN_OPPFOLGING_TABS: { id: AdminOppfolgingTab; label: string }[] = [
  { id: 'godkjenning', label: 'Godkjenning' },
  { id: 'sporsmaal', label: 'Spørsmål' },
  { id: 'logg', label: 'Logg' },
];

export function isAdminOppfolgingSection(section: string): boolean {
  return section === 'godkjenning' || section === 'home' || section === 'sporsmaal' || section === 'logg';
}

export function normalizeOppfolgingTab(section: string): AdminOppfolgingTab {
  if (section === 'sporsmaal' || section === 'logg') return section;
  return 'godkjenning';
}
