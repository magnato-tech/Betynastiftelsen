import { useCallback, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailLink,
  signOut,
  signInWithRedirect,
  type User,
} from 'firebase/auth';
import {
  clearStoredAuthError,
  completeFirebaseAuthRedirect,
  readStoredAuthError,
} from './firebaseAuthRedirect';
import { formatFirebaseAuthError } from './firebaseAuthErrors';
import { signInWithGoogleOnThisSite } from './googleSignIn';
import { auth, db } from '../config/firebase';
import { ensureFirestoreUserOnLogin } from './firestoreUser';
import { markPortalIntent } from '../utils/portalIntent';
import type { FirestoreUser } from './firestoreProfile';
import { EMAIL_FOR_SIGN_IN_KEY } from './firestoreSyncConstants';

export function useFirestoreSyncAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(() => readStoredAuthError());
  const [firestoreUserProfile, setFirestoreUserProfile] = useState<FirestoreUser | null>(null);
  const [firestoreProfileLoading, setFirestoreProfileLoading] = useState(false);
  const [firestoreAccessMessage, setFirestoreAccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return () => {};
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (user) setAuthError(null);
    });
    void completeFirebaseAuthRedirect(auth).catch((err) =>
      setAuthError(formatFirebaseAuthError(err))
    );
    void (async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) return;
      try {
        const email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
        if (!email) {
          setAuthError('Åpne innloggingslenken i samme nettleser, eller be om ny lenke.');
          return;
        }
        markPortalIntent();
        await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
        clearStoredAuthError();
        setAuthError(null);
      } catch (err) {
        setAuthError(formatFirebaseAuthError(err));
      }
    })();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const email = firebaseUser?.email;
    if (!db || !firebaseUser?.uid || !email) {
      setFirestoreUserProfile(null);
      setFirestoreProfileLoading(false);
      setFirestoreAccessMessage(null);
      return;
    }
    let cancelled = false;
    setFirestoreProfileLoading(true);
    setFirestoreAccessMessage(null);
    (async () => {
      try {
        const result = await ensureFirestoreUserOnLogin(
          db,
          firebaseUser.uid,
          email,
          firebaseUser.displayName
        );
        if (cancelled) return;
        if (!result.ok) {
          setFirestoreUserProfile(null);
          setFirestoreAccessMessage(
            result.reason === 'sperret'
              ? 'Kontoen er sperret. Kontakt administrator i Betyna hvis du mener dette er en feil.'
              : 'Denne Google-kontoen finnes ikke i userDirectory og er ikke satt opp som administrator. Be en eksisterende admin legge inn e-posten din i Firestore, eller logg inn med en admin-konto.'
          );
          return;
        }
        setFirestoreUserProfile(result.profile);
      } catch (err) {
        if (!cancelled) {
          setFirestoreUserProfile(null);
          setFirestoreAccessMessage(formatFirebaseAuthError(err));
        }
      } finally {
        if (!cancelled) setFirestoreProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid, firebaseUser?.email, firebaseUser?.displayName]);

  const prepareGoogleSignIn = useCallback(async () => {
    if (!auth) throw new Error('Firestore er ikke konfigurert');
    await setPersistence(auth, browserLocalPersistence);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('Firestore er ikke konfigurert');
    setAuthError(null);
    try {
      await prepareGoogleSignIn();
      await signInWithGoogleOnThisSite(auth);
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      throw new Error(message);
    }
  }, [prepareGoogleSignIn]);

  const sendEmailSignInLink = useCallback(async (email: string) => {
    if (!auth) throw new Error('Firestore er ikke konfigurert');
    setAuthError(null);
    await prepareGoogleSignIn();
    const trimmed = email.trim().toLowerCase();
    const actionCodeSettings = {
      url: window.location.href.split('?')[0].split('#')[0],
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, trimmed, actionCodeSettings);
    window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, trimmed);
  }, [prepareGoogleSignIn]);

  const signInWithGoogleRedirect = useCallback(async () => {
    if (!auth) throw new Error('Firestore er ikke konfigurert');
    setAuthError(null);
    clearStoredAuthError();
    markPortalIntent();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const signOutFirebase = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setFirestoreUserProfile(null);
    setFirestoreAccessMessage(null);
    setAuthError(null);
  }, []);

  return {
    firebaseUser,
    authReady,
    authError,
    firestoreUserProfile,
    firestoreProfileLoading,
    firestoreAccessMessage,
    setFirestoreAccessMessage,
    signInWithGoogle,
    sendEmailSignInLink,
    signInWithGoogleRedirect,
    signOutFirebase,
  };
}
