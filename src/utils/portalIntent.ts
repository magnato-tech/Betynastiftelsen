/** Settes før innlogging; portalrolle aktiveres når Firebase-profil er lastet. */
export const PORTAL_INTENT_KEY = 'betyna_enter_portal';

export function markPortalIntent(): void {
  try {
    sessionStorage.setItem(PORTAL_INTENT_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function consumePortalIntent(): boolean {
  try {
    if (sessionStorage.getItem(PORTAL_INTENT_KEY) === '1') {
      sessionStorage.removeItem(PORTAL_INTENT_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
