import React from 'react';
import { Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EMAIL_AUTO_SEND_EVENTS } from '../../email/autoSendPrefs';
import { AdminHelpGuide } from './AdminHelpGuide';

interface AdminSettingsPanelProps {
  setActiveSection: (sec: string) => void;
}

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({ setActiveSection }) => {
  const { emailAutoSend, setEmailAutoSendEvent } = useApp();

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

      <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-start gap-2">
          <Settings className="w-4 h-4 text-[#4D6B3E] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-serif font-bold text-stone-900">Automatisk e-post</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Daglig leder bestemmer hvilke hendelser som sender e-post. Av betyr varsel i portalen, men ingen e-post.
              Manuell sending under E-post påvirkes ikke. Engangslenke for innlogging kommer senere.
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
