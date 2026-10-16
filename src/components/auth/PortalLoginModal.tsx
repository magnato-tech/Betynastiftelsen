import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PortalLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortalLoginModal: React.FC<PortalLoginModalProps> = ({ isOpen, onClose }) => {
  const {
    firestoreEnabled,
    firestoreAuthError,
    firestoreAccessMessage,
    signInFirestoreGoogle,
    sendFirestoreEmailSignInLink,
    enterPortalFromProfile,
  } = useApp();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogle = async () => {
    setLocalError(null);
    setBusy(true);
    try {
      await signInFirestoreGoogle();
      enterPortalFromProfile();
      onClose();
    } catch {
      /* authError i context */
    } finally {
      setBusy(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setLocalError('Skriv inn en gyldig e-postadresse.');
      return;
    }
    setBusy(true);
    try {
      await sendFirestoreEmailSignInLink(trimmed);
      setEmailSent(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Kunne ikke sende innloggingslenke.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-[#F6F4ED] border border-[#DFD9CB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-800 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-serif font-bold text-stone-900 pr-8">Logg inn</h2>
        <p className="text-xs text-stone-600 mt-2 leading-relaxed">
          Administrator, koordinator og fadder logger inn med Google eller e-postlenke (samme e-post som står i{' '}
          <code className="text-[10px]">userDirectory</code>).
        </p>

        {!firestoreEnabled && (
          <p className="mt-4 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Firestore er ikke aktivert i dette miljøet.
          </p>
        )}

        <div className="mt-5 space-y-3">
          <button
            type="button"
            disabled={!firestoreEnabled || busy}
            onClick={handleGoogle}
            className="w-full py-2.5 bg-white border border-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 disabled:opacity-50 cursor-pointer"
          >
            Fortsett med Google
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <p className="relative text-center text-[10px] uppercase tracking-wider text-stone-400 bg-[#F6F4ED] px-2 mx-auto w-fit">
              eller e-post
            </p>
          </div>

          {emailSent ? (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3 leading-relaxed">
              Vi har sendt en innloggingslenke til <strong>{email.trim()}</strong>. Åpne lenken i samme nettleser (Chrome
              eller Edge). Lenken er engangs.
            </p>
          ) : (
            <form onSubmit={handleEmail} className="space-y-2">
              <input
                type="email"
                autoComplete="email"
                placeholder="din@epost.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm"
              />
              <button
                type="submit"
                disabled={!firestoreEnabled || busy}
                className="w-full py-2.5 bg-[#4D6B3E] text-white rounded-lg text-sm font-medium hover:bg-[#3B522F] disabled:opacity-50 cursor-pointer"
              >
                Send innloggingslenke
              </button>
            </form>
          )}
        </div>

        {(localError || firestoreAuthError || firestoreAccessMessage) && (
          <p className="mt-3 text-xs text-red-900 bg-red-50 border border-red-200 rounded-lg p-2">
            {localError || firestoreAuthError || firestoreAccessMessage}
          </p>
        )}
      </div>
    </div>
  );
};
