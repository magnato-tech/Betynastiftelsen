import type { FirebaseError } from 'firebase/app';

export function firebaseAuthErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as FirebaseError).code);
  }
  return '';
}

/** Popup kan ikke brukes — innlogging må skje i samme fane. */
export function isPopupAuthFailure(err: unknown): boolean {
  const code = firebaseAuthErrorCode(err);
  return code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment';
}

export function formatFirebaseAuthError(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as FirebaseError).code)
      : '';
  switch (code) {
    case 'auth/popup-blocked':
      return 'Nettleseren blokkerte vinduet. Klikk popup-ikonet i adressefeltet, tillat vinduer for denne siden, og trykk Fortsett med Google igjen.';
    case 'auth/popup-closed-by-user':
      return 'Google-vinduet ble lukket før innloggingen var ferdig. Prøv igjen.';
    case 'auth/cancelled-popup-request':
      return 'Innlogging avbrutt (ofte fordi et nytt vindu åpnet). Vent et øyeblikk og prøv igjen.';
    case 'auth/unauthorized-domain':
      return 'Dette domenet er ikke godkjent i Firebase. Legg til localhost under Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Denne nettleseren kan ikke åpne Google-vinduet. Bruk Chrome eller Edge.';
    case 'auth/internal-error':
    case 'auth/web-storage-unsupported':
      return 'Nettleseren tillater ikke lagring av innlogging. Prøv Chrome/Edge uten sporingsblokkering, eller tillat cookies for localhost.';
    default:
      if (err instanceof Error && err.message) return err.message;
      return 'Innlogging feilet. Lukk den hvite Firebase-siden, gå tilbake til Betyna og prøv Fortsett med Google i Chrome eller Edge.';
  }
}
