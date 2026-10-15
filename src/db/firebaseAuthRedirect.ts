import { getRedirectResult, type Auth } from 'firebase/auth';
import { formatFirebaseAuthError } from './firebaseAuthErrors';

const AUTH_ERROR_KEY = 'betyna_auth_error';
let redirectHandled = false;

export function readStoredAuthError(): string | null {
  try {
    return sessionStorage.getItem(AUTH_ERROR_KEY);
  } catch {
    return null;
  }
}

export function clearStoredAuthError(): void {
  try {
    sessionStorage.removeItem(AUTH_ERROR_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Les Google-svaret før noe annet rører Auth.
 * setPersistence før getRedirectResult kan slette innloggingen på vei tilbake.
 */
export async function completeFirebaseAuthRedirect(auth: Auth): Promise<void> {
  if (redirectHandled) return;
  redirectHandled = true;
  try {
    await getRedirectResult(auth);
    clearStoredAuthError();
  } catch (err) {
    try {
      sessionStorage.setItem(AUTH_ERROR_KEY, formatFirebaseAuthError(err));
    } catch {
      /* ignore */
    }
    throw err;
  }
}
