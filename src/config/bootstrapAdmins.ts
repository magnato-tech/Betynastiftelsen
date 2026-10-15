/** Midlertidig til alle admin-brukere ligger i Firestore `userDirectory`. Fjernes fra regler når det ikke trengs. */
export const BOOTSTRAP_ADMIN_EMAILS: readonly string[] = [
  'magnar.totland@gmail.com',
  'totland.s@gmail.com',
];

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return BOOTSTRAP_ADMIN_EMAILS.some((e) => e.toLowerCase() === normalized);
}
