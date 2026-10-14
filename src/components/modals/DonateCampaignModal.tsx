import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Campaign } from '../../types';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';

interface DonateCampaignModalProps {
  campaign: Campaign | null;
  onClose: () => void;
}

export const DonateCampaignModal: React.FC<DonateCampaignModalProps> = ({ campaign, onClose }) => {
  const { donateToCampaign } = useApp();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [method, setMethod] = useState<'vipps' | 'bank'>('vipps');

  if (!campaign) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = amount === 0 ? parseInt(customAmount) || 500 : amount;
    donateToCampaign(campaign.id, finalAmount, donorName || 'Anonym giver', method);
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-[#F6F4ED] border border-[#DFD9CB] rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-[#3C3C3C] transition-colors rounded-lg hover:bg-stone-200/60 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' ? (
          <div>
            <div className="mb-6">
              <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Støtt konkret aksjon</span>
              <h3 className="text-xl font-serif font-bold text-[#3C3C3C] mt-1">{campaign.tittel}</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed font-sans">{campaign.beskrivelse}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3C3C3C] mb-2">
                  Velg bidragsbeløp
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(500);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-1 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      amount === 500
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-[#4D6B3E]'
                    }`}
                  >
                    500 kr
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(1000);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-1 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      amount === 1000
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-[#4D6B3E]'
                    }`}
                  >
                    1 000 kr
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(3000);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-1 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      amount === 3000
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-[#4D6B3E]'
                    }`}
                  >
                    3 000 kr (1 maskin)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(0)}
                    className={`py-2 px-1 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      amount === 0
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-[#4D6B3E]'
                    }`}
                  >
                    Valgfritt
                  </button>
                </div>
                {amount === 0 && (
                  <input
                    type="number"
                    min="50"
                    placeholder="F.eks. 1500 kr"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3C3C3C] mb-2">
                  Betalingsmetode
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setMethod('vipps')}
                    className={`p-2.5 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      method === 'vipps'
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                    }`}
                  >
                    Vipps
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('bank')}
                    className={`p-2.5 rounded-lg border font-medium text-center transition-all cursor-pointer ${
                      method === 'bank'
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                    }`}
                  >
                    Nettbank / Innbetaling
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Ditt navn eller hilsen (valgfritt)</label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="F.eks. Anne & Per / Anonym"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                />
              </div>

              <div className="p-3 bg-stone-100 rounded-lg border border-stone-200 text-xs text-stone-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  100% øremerket formålet. Midlene holdes separat fra ordinære fadderbidrag med egen sluttrapport.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-lg text-sm transition-colors shadow-xs cursor-pointer"
              >
                Gi bidrag nå
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#3C3C3C]">Mange takk for din støtte!</h3>
            <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed font-sans">
              Bidraget ditt er nå registrert og lagt til i aksjonen «{campaign.tittel}». Når målet er nådd, vil en verifisert sluttrapport publiseres her på nettsiden.
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
              >
                Tilbake til nettsiden
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
