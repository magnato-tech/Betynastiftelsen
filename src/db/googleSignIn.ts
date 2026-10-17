import { GoogleAuthProvider, signInWithCredential, type Auth } from 'firebase/auth';

/** Offentlig webklient fra Firebase. Ingen hemmelighet. */
const GOOGLE_CLIENT_ID =
  '269697764148-qppk93mbe51anh2vfkj319mkqu12rugs.apps.googleusercontent.com';

type TokenResponse = { access_token?: string; error?: string };

type TokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

type GoogleAccounts = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type?: string }) => void;
      }) => TokenClient;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-betyna-gis="1"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Kunne ikke laste Google-innlogging.')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.dataset.betynaGis = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Kunne ikke laste Google-innlogging.'));
    document.head.appendChild(script);
  });
}

function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const google = window.google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google-innlogging er ikke klar. Last siden på nytt.'));
      return;
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error('Google-innlogging ble avbrutt.'));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: () => {
        reject(new Error('Nettleseren blokkerte Google-vinduet. Tillat vinduer for denne siden og prøv igjen.'));
      },
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });
}

/**
 * Logger inn uten å åpne firebaseapp.com/__/auth/handler.
 * Den siden blir hvit i Chrome fordi lagring der er delt fra Betyna.
 */
export async function signInWithGoogleOnThisSite(auth: Auth): Promise<void> {
  await loadGoogleScript();
  const accessToken = await requestGoogleAccessToken();
  const credential = GoogleAuthProvider.credential(null, accessToken);
  await signInWithCredential(auth, credential);
}
