import React from 'react';
import { Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EMAIL_AUTO_SEND_EVENTS } from '../../email/autoSendPrefs';
import { AdminHelpGuide } from './AdminHelpGuide';
import { UserDirectoryInviteForm } from './UserDirectoryInviteForm';

interface AdminSettingsPanelProps {
  setActiveSection: (sec: string) => void;
}

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({ setActiveSection }) => {
  const {
    emailAutoSend,
    setEmailAutoSendEvent,
    firestoreEnabled,
    firestoreBackendActive,
    firestoreUserEmail,
    firestoreImportMessage,
    firestoreAuthError,
    signInFirestoreGoogle,
    importBrowserToFirestore,
  } = useApp();

  return (
    <div className="max-w-5xl space-y-10">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">
          Betyna — administrasjon · Kristiansand
        </span>
        <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900">
          Kontrollpanel og godkjenningssenter
        </h2>
        <p className="text-sm text-stone-600 max-w-2xl leading-relaxed">
          Styrende prinsipp: Koordinator registrerer opplysninger i Kongo. Administrator i Kristiansand kontrollerer,
          oversetter og godkjenner før innhold når fadderne.
        </p>
      </div>

      {firestoreEnabled && (
        <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-stone-900">Database (Firestore)</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-2xl">
              Logg inn fra forsiden (hvit knapp Logg inn ved siden av Bli fadder). Etter innlogging
              åpnes din portal. Her kan du lagre det som ligger i <strong>denne nettleseren</strong> nå
              (tekster, barn, CMS — alt du har jobbet med). Etterpå leser og lagrer appen i skyen. Ingenting overskrives
              automatisk på nytt. Hvem som er admin, koordinator eller fadder styres av Firestore-samlingen{' '}
              <code className="text-[10px]">userDirectory</code> (e-post + rolle); begge nåværende admin-e-poster er
              tillatt inntil listen er fylt ut.
            </p>
            <p className="text-xs text-stone-500 mt-2">
              Status:{' '}
              {firestoreBackendActive
                ? 'Koblet til database — endringer lagres i Firestore.'
                : 'Fortsatt bare i nettleseren til du har importert.'}
              {firestoreUserEmail ? ` Innlogget: ${firestoreUserEmail}` : ''}
            </p>
            {firestoreImportMessage && (
              <p className="text-xs text-emerald-800 mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {firestoreImportMessage}
              </p>
            )}
            {firestoreAuthError && (
              <p className="text-xs text-red-900 mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {firestoreAuthError}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!firestoreUserEmail && (
              <button
                type="button"
                onClick={() => signInFirestoreGoogle().catch(() => undefined)}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Logg inn med Google
              </button>
            )}
            {!firestoreBackendActive && (
              <button
                type="button"
                disabled={!firestoreUserEmail}
                onClick={() => importBrowserToFirestore().catch(() => undefined)}
                className="px-4 py-2 bg-[#4D6B3E] text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40"
              >
                Lagre nettleserinnhold i Firestore
              </button>
            )}
          </div>
          {!firestoreUserEmail && (
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Et lite Google-vindu åpnes. Velg konto og godta. Bruk Chrome eller Edge, ikke en innebygd nettleser. Hvis
              nettleseren blokkerer vinduet, tillat popup for denne siden og prøv igjen.
            </p>
          )}
        </div>
      )}

      <UserDirectoryInviteForm />

      <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-start gap-2">
          <Settings className="w-4 h-4 text-[#4D6B3E] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-serif font-bold text-stone-900">Automatisk e-post</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Daglig leder bestemmer hvilke hendelser som sender e-post. Av betyr varsel i portalen, men ingen e-post.
              Manuell sending under E-post påvirkes ikke.
            </p>
          </div>
        </div>
        <ul className="space-y-3">
          {EMAIL_AUTO_SEND_EVENTS.map((ev) => (
            <li key={ev.id} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-800">{ev.title}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">{ev.when}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailAutoSend[ev.id]}
                aria-label={ev.title}
                onClick={() => setEmailAutoSendEvent(ev.id, !emailAutoSend[ev.id])}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors ${
                  emailAutoSend[ev.id] ? 'bg-[#4D6B3E] border-[#4D6B3E]' : 'bg-stone-200 border-stone-300'
                }`}
              >
                <span
                  className={`mt-0.5 inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                    emailAutoSend[ev.id] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <AdminHelpGuide setActiveSection={setActiveSection} />
    </div>
  );
};
