import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Inquiry } from '../../types';

export interface InquiryWorkPanelProps {
  inquiry: Inquiry;
  /** Kalles etter at svar er publisert (svart: true) eller videresendt til koordinator (svart: false). */
  onDone: (utfall: { svart: boolean }) => void;
  /** Valgfri «Lukk»-knapp i toppen. Brukes i Spørsmål-seksjonen, ikke i dialogen på barnesiden. */
  onClose?: () => void;
}

/** Behandling av ett fadderspørsmål: les, svar til fadder, eller send til koordinator i Kongo. */
export const InquiryWorkPanel: React.FC<InquiryWorkPanelProps> = ({ inquiry: inq, onDone, onClose }) => {
  const { answerInquiry, forwardInquiryToCoordinator } = useApp();
  const [answerDraft, setAnswerDraft] = useState(inq.svarTekst || '');
  const [forwardNoteFr, setForwardNoteFr] = useState('');

  const handleAnswerInquiry = () => {
    if (!answerDraft.trim()) return;
    answerInquiry(inq.id, answerDraft.trim());
    setAnswerDraft('');
    onDone({ svart: true });
  };

  const handleForwardInquiry = () => {
    forwardInquiryToCoordinator(inq.id, forwardNoteFr || undefined);
    setForwardNoteFr('');
    onDone({ svart: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#4D6B3E] font-semibold">Behandle fadderspørsmål</span>
          <h3 className="text-lg font-serif font-bold text-stone-900">
            Fra: {inq.fadderNavn} vedr. {inq.barnNavn}
          </h3>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer">
            Lukk
          </button>
        )}
      </div>

      <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs sm:text-sm text-stone-800">
        <strong>Fadders spørsmål: </strong> «{inq.sporsmaal}»
      </div>

      {inq.koordinatorNotatFr && (
        <div className="p-3 bg-[#A3B18A]/10 rounded-lg border border-[#A3B18A]/40 text-xs text-[#4D6B3E]">
          <strong>Feltnotat fra Kongo: </strong> {inq.koordinatorNotatFr}
        </div>
      )}

      <div className="space-y-3 pt-2">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Skriv svar til fadder (blir synlig i fadderportalen):
          </label>
          <textarea
            rows={4}
            value={answerDraft}
            onChange={(e) => setAnswerDraft(e.target.value)}
            placeholder="Skriv svar..."
            className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Valgfri fransk instruks til Kongo..."
              value={forwardNoteFr}
              onChange={(e) => setForwardNoteFr(e.target.value)}
              className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs w-64 bg-stone-50"
            />
            <button
              type="button"
              onClick={handleForwardInquiry}
              className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-medium cursor-pointer"
            >
              Send til koordinator i Kongo
            </button>
          </div>

          <button
            type="button"
            onClick={handleAnswerInquiry}
            className="px-5 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded-lg text-xs font-medium cursor-pointer shadow-xs"
          >
            Publiser svar til fadder
          </button>
        </div>
      </div>
    </div>
  );
};
