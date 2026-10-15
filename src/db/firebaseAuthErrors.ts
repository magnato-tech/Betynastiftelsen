import type { FirebaseError } from 'firebase/app';

export function formatFirebaseAuthError(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as FirebaseError).code)
      : '';
  switch (code) {
    case 'auth/popup-blocked':
      return 'Nettleseren blokkerte popup. Tillat popup for localhost, eller bruk «Logg inn på denne siden» under.';
    case 'auth/popup-closed-by-user':
      return 'Google-vinduet ble lukket før innloggingen var ferdig. Prøv igjen.';
    case 'auth/cancelled-popup-request':
      return 'Innlogging avbrutt (ofte fordi et nytt vindu åpnet). Vent et øyeblikk og prøv igjen.';
    case 'auth/unauthorized-domain':
      return 'Dette domenet er ikke godkjent i Firebase. Legg til localhost under Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Popup-innlogging støttes ikke her. Bruk «Logg inn på denne siden».';
    case 'auth/internal-error':
    case 'auth/web-storage-unsupported':
      return 'Nettleseren tillater ikke lagring av innlogging. Prøv Chrome/Edge uten sporingsblokkering, eller tillat cookies for localhost.';
    default:
      if (err instanceof Error && err.message) return err.message;
      return 'Innlogging feilet. Prøv «Logg inn på denne siden» eller en annen nettleser.';
  }
}
