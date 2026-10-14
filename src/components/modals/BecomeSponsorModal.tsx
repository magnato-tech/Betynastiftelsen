import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';

interface BecomeSponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BecomeSponsorModal: React.FC<BecomeSponsorModalProps> = ({ isOpen, onClose }) => {
  const { registerNewSponsorInterest, setRole, setCurrentSponsorId } = useApp();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [navn, setNavn] = useState('');
  const [epost, setEpost] = useState('');
  const [telefon, setTelefon] = useState('');
  const [poststed, setPoststed] = useState('');
  const [belop, setBelop] = useState<number>(350);
  const [customBelop, setCustomBelop] = useState<string>('');
  const [metode, setMetode] = useState<'vipps' | 'avtalegiro' | 'bank'>('vipps');
  const [newSponsorId, setNewSponsorId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBelop = belop === 0 ? parseInt(customBelop) || 250 : belop;
    const createdId = registerNewSponsorInterest({
      navn,
      epost,
      telefon,
      poststed,
      maanedsbelop: finalBelop,
      betalingsmetode: metode,
    });
    setNewSponsorId(createdId);
    setStep('success');
  };

  const handleOpenSponsorPortal = () => {
    if (newSponsorId) {
      setCurrentSponsorId(newSponsorId);
    }
    setRole('sponsor');
    onClose();
    setStep('form');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-[#F6F4ED] border border-[#DFD9CB] rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-[#3C3C3C] transition-colors rounded-lg hover:bg-stone-200/60 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' ? (
          <div>
            <div className="mb-6">
              <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Bli fast fadder</span>
              <h3 className="text-2xl font-serif font-bold text-[#3C3C3C] mt-1">Støtt et barn gjennom utdanningsløpet</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed font-sans">
                Ditt bidrag sikrer skolepenger, lærebøker, uniform og personlig oppfølging av koordinator i Kongo. Administrator tildeler et barn som trenger støtte mest, og du får en personlig fadderportal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Beløpsvalg */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3C3C3C] mb-2">
                  Velg månedlig fadderbidrag
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBelop(250);
                      setCustomBelop('');
                    }}
                    className={`py-2 px-3 text-sm rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      belop === 250
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-[#4D6B3E]'
                    }`}
                  >
                    250 kr/mnd
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBelop(350);
                      setCustomBelop('');
                    }}
                    className={`py-2 px-3 text-sm rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      belop === 350
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-[#4D6B3E]'
                    }`}
                  >
                    350 kr/mnd
                  </button>
                  <button
                    type="button"
                    onClick={() => setBelop(0)}
                    className={`py-2 px-3 text-sm rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      belop === 0
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-[#4D6B3E]'
                    }`}
                  >
                    Valgfritt
                  </button>
                </div>
                {belop === 0 && (
                  <input
                    type="number"
                    min="100"
                    placeholder="F.eks. 500 kr"
                    value={customBelop}
                    onChange={(e) => setCustomBelop(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                    required
                  />
                )}
              </div>

              {/* Betalingsmåte */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3C3C3C] mb-2">
                  Foretrukket betalingsmetode
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setMetode('vipps')}
                    className={`p-2.5 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      metode === 'vipps'
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                    }`}
                  >
                    Vipps Fast
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetode('avtalegiro')}
                    className={`p-2.5 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      metode === 'avtalegiro'
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                    }`}
                  >
                    AvtaleGiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetode('bank')}
                    className={`p-2.5 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      metode === 'bank'
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                    }`}
                  >
                    Bankkonto
                  </button>
                </div>
              </div>

              {/* Personopplysninger */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Fullt navn *</label>
                  <input
                    type="text"
                    required
                    value={navn}
                    onChange={(e) => setNavn(e.target.value)}
                    placeholder="Ola Nordmann"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">E-post *</label>
                  <input
                    type="email"
                    required
                    value={epost}
                    onChange={(e) => setEpost(e.target.value)}
                    placeholder="ola@eksempel.no"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    placeholder="+47 900 00 000"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Poststed</label>
                  <input
                    type="text"
                    value={poststed}
                    onChange={(e) => setPoststed(e.target.value)}
                    placeholder="Oslo"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                  />
                </div>
              </div>

              {/* Sikkerhetsgaranti */}
              <div className="p-3 bg-stone-100 rounded-lg border border-stone-200 text-xs text-stone-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Trygg registrering. Ingen kredittkort lagres lokalt. Du kan når som helst endre eller avslutte avtalen uten bindingstid.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-lg text-sm transition-colors shadow-xs cursor-pointer"
              >
                Fullfør fadderavtale
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#3C3C3C]">Hjertelig takk, {navn}!</h3>
            <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed font-sans">
              Din fadderavtale er nå registrert i systemet. Administrator i Norge har automatisk tildelt et barn som ventet på fadder. Du kan nå åpne fadderportalen for å se barnets profil og skolegang.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleOpenSponsorPortal}
                className="px-6 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
              >
                Gå til min fadderportal
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-[#3C3C3C] font-medium rounded-lg text-sm transition-colors cursor-pointer"
              >
                Lukk
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
