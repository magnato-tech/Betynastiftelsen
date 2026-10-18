import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../config/firebase';
import { saveWebsiteSponsor } from '../../db/firestoreData';
import { X, CheckCircle } from 'lucide-react';
import {
  formatHeroCtaImpactLine,
  formatHeroCtaPrimaryButton,
  getHeroCtaCardConfig,
  type HeroCtaCardConfig,
} from '../../utils/heroLayout';
import { isVippsRecurringEnabledInFrontend, startVippsRecurringAgreement } from '../../utils/vippsRecurring';

interface BecomeSponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Står synlig på forsiden. Ingen ekstra klikk for å åpne skjemaet. */
  embedded?: boolean;
  /** CMS-innstillinger for kortet (tekst, beløp, knapper). */
  heroCtaConfig?: HeroCtaCardConfig;
  /** Anker for menyen «Bli fadder». Standard er toppen av forsiden. */
  containerId?: string;
}

export const BecomeSponsorModal: React.FC<BecomeSponsorModalProps> = ({
  isOpen,
  onClose,
  embedded = false,
  heroCtaConfig: heroCtaConfigProp,
  containerId = 'bli-fadder',
}) => {
  const ctaConfig = heroCtaConfigProp ?? getHeroCtaCardConfig({
    kicker: '',
    title: '',
    subtitle: '',
    primaryButtonText: '',
    secondaryButtonText: '',
    backgroundPreset: 'custom',
    scrimOpacity: 70,
  });
  const { registerNewSponsorInterest, setRole, setCurrentSponsorId, firestoreEnabled } = useApp();

  const [step, setStep] = useState<'choose' | 'form' | 'success'>('choose');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [navn, setNavn] = useState('');
  const [epost, setEpost] = useState('');
  const [telefon, setTelefon] = useState('');
  const [poststed, setPoststed] = useState('');
  const [belop, setBelop] = useState<number>(ctaConfig.presetAmount2);
  const [customBelop, setCustomBelop] = useState<string>('');

  useEffect(() => {
    setBelop(heroCtaConfigProp?.presetAmount2 ?? ctaConfig.presetAmount2);
  }, [heroCtaConfigProp?.presetAmount1, heroCtaConfigProp?.presetAmount2]);

  const resolvedAmountKr = (): number => {
    if (belop === 0) return parseInt(customBelop, 10) || 0;
    return belop;
  };

  const amountButtonClass = (active: boolean) =>
    `py-2 text-sm rounded-lg border font-medium cursor-pointer ${
      active ? 'bg-[#4D6B3E] text-white border-[#4D6B3E]' : 'bg-white text-stone-800 border-stone-300'
    }`;

  const amountButtonClassForm = (active: boolean) =>
    `py-2 px-3 text-sm rounded-lg border font-medium text-center transition-all cursor-pointer ${
      active
        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-xs'
        : 'bg-white text-stone-700 border-stone-300 hover:border-[#4D6B3E]'
    }`;

  const handleVippsFromChoose = async () => {
    const amount = resolvedAmountKr();
    if (amount < ctaConfig.customAmountMin && belop === 0) {
      setSaveError(`Velg minst ${ctaConfig.customAmountMin} kr.`);
      return;
    }
    if (isVippsRecurringEnabledInFrontend() && amount > 0) {
      try {
        setSaving(true);
        const { redirectUrl } = await startVippsRecurringAgreement({
          amountKr: amount,
          orderId: `betyna-hero-${Date.now()}`,
        });
        window.location.href = redirectUrl;
        return;
      } catch {
        setSaveError('Vipps er ikke tilgjengelig akkurat nå. Fyll ut skjemaet under.');
      } finally {
        setSaving(false);
      }
    }
    setMetode('vipps');
    setStep('form');
  };
  const [metode, setMetode] = useState<'vipps' | 'avtalegiro' | 'bank'>('vipps');
  const [samtykke, setSamtykke] = useState(false);
  const [newSponsorId, setNewSponsorId] = useState<string>('');

  useEffect(() => {
    if (embedded || !isOpen) return;
    setStep('choose');
    setSaveError(null);
    setSaving(false);
  }, [isOpen, embedded]);

  if (!embedded && !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (!samtykke) {
      setSaveError('Kryss av for at Betyna kan lagre opplysningene dine.');
      return;
    }
    const finalBelop =
      belop === 0
        ? parseInt(customBelop, 10) || ctaConfig.presetAmount1
        : belop;
    const payload = {
      navn,
      epost,
      telefon,
      poststed,
      maanedsbelop: finalBelop,
      betalingsmetode: metode,
    };
    setSaving(true);
    try {
      const createdId = registerNewSponsorInterest(payload);
      if (db && firestoreEnabled) {
        await saveWebsiteSponsor(db, createdId, payload);
      }
      setNewSponsorId(createdId);
      setStep('success');
    } catch {
      setSaveError('Kunne ikke lagre påmeldingen. Prøv igjen.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSponsorPortal = () => {
    if (newSponsorId) {
      setCurrentSponsorId(newSponsorId);
    }
    setRole('sponsor');
    onClose();
    setStep('form');
  };

  const body = (
      <>
        {step === 'choose' ? (
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-[#3C3C3C] leading-snug">{ctaConfig.title}</h2>
            <p className="text-xs text-stone-600 leading-relaxed">{ctaConfig.lead}</p>
            <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
              {formatHeroCtaImpactLine(ctaConfig, belop, customBelop)}
            </p>
            <div
              className={`grid gap-2 ${ctaConfig.showCustomOption ? 'grid-cols-3' : 'grid-cols-2'}`}
            >
              {[ctaConfig.presetAmount1, ctaConfig.presetAmount2].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setBelop(amount);
                    setCustomBelop('');
                  }}
                  className={amountButtonClass(belop === amount)}
                >
                  {amount} kr
                </button>
              ))}
              {ctaConfig.showCustomOption && (
                <button
                  type="button"
                  onClick={() => setBelop(0)}
                  className={amountButtonClass(belop === 0)}
                >
                  {ctaConfig.customOptionLabel}
                </button>
              )}
            </div>
            {belop === 0 && ctaConfig.showCustomOption && (
              <input
                type="number"
                min={ctaConfig.customAmountMin}
                placeholder="Valgfritt beløp"
                value={customBelop}
                onChange={(e) => setCustomBelop(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm"
              />
            )}
            {saveError && <p className="text-xs text-red-700">{saveError}</p>}
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleVippsFromChoose()}
              className="w-full py-3 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-semibold rounded-full text-sm cursor-pointer disabled:opacity-60"
            >
              {formatHeroCtaPrimaryButton(ctaConfig, belop, customBelop)}
            </button>
            <button
              type="button"
              onClick={() => {
                setMetode('avtalegiro');
                setStep('form');
              }}
              className="w-full text-xs text-stone-600 underline cursor-pointer"
            >
              {ctaConfig.secondaryLink}
            </button>
          </div>
        ) : step === 'form' ? (
          <div>
            <div className="mb-4">
              <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Bli fast fadder</span>
              <h2 className="text-xl font-serif font-bold text-[#3C3C3C] mt-1 lg:hidden">Vi følger barnet til fagbrev og jobb</h2>
              <h3 className="text-xl font-serif font-bold text-[#3C3C3C] mt-1 hidden lg:block">Støtt et barn gjennom utdanningsløpet</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed font-sans">
                250 eller 350 kroner i måneden følger ett barn helt til jobb. Du blir registrert nå. Vi kobler deg til ett barn og setter opp det månedlige trekket. Du kan avslutte når som helst.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Beløpsvalg */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3C3C3C] mb-2">
                  Velg månedlig fadderbidrag
                </label>
                <div
                  className={`grid gap-2 ${ctaConfig.showCustomOption ? 'grid-cols-3' : 'grid-cols-2'}`}
                >
                  {[ctaConfig.presetAmount1, ctaConfig.presetAmount2].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setBelop(amount);
                        setCustomBelop('');
                      }}
                      className={amountButtonClassForm(belop === amount)}
                    >
                      {amount} kr/mnd
                    </button>
                  ))}
                  {ctaConfig.showCustomOption && (
                    <button
                      type="button"
                      onClick={() => setBelop(0)}
                      className={amountButtonClassForm(belop === 0)}
                    >
                      {ctaConfig.customOptionLabel}
                    </button>
                  )}
                </div>
                {belop === 0 && ctaConfig.showCustomOption && (
                  <input
                    type="number"
                    min={ctaConfig.customAmountMin}
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
                  Ønsket måte å betale på
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
                    Vipps
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
                <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
                  Vipps-trekket starter når avtalen er godkjent i Vipps. Inntil da lagrer vi ønsket.
                </p>
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
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Mobilnummer {metode === 'vipps' ? '*' : ''}
                  </label>
                  <input
                    type="tel"
                    required={metode === 'vipps'}
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
              <label className="flex items-start gap-2.5 text-xs text-stone-700 leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={samtykke}
                  onChange={(e) => setSamtykke(e.target.checked)}
                  className="mt-0.5"
                  required
                />
                <span>Jeg godtar at Betyna lagrer navn, e-post og telefon for å følge opp fadderavtalen.</span>
              </label>

              {saveError && <p className="text-sm text-red-800">{saveError}</p>}

              <p className="text-[11px] text-stone-500 leading-relaxed text-center">
                Vi er bevisst en liten organisasjon, så mer går til barnet. Avtalen er like ekte.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-lg text-sm transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                {saving ? 'Lagrer …' : 'Meld meg som fadder'}
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
              Du er registrert. Vi kobler deg til ett barn og tar kontakt for å sette opp det månedlige trekket. Ingenting er trukket ennå.
            </p>
            {!embedded && (
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
            )}
          </div>
        )}
      </>
  );

  if (embedded) {
    return (
      <div id={containerId} className="bg-white rounded-2xl p-5 shadow-lg scroll-mt-24">
        {body}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-[#F6F4ED] border border-[#DFD9CB] rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-[#3C3C3C] transition-colors rounded-lg hover:bg-stone-200/60 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        {body}
      </div>
    </div>
  );
};
