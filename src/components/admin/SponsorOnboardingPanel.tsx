import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Sponsor, SponsorOnboardingStep } from '../../types';
import { buildWelcomeEmailDraft } from '../../utils/sponsorOnboarding';
import { canAssignSponsor } from '../../utils/coordinatorAssignment';

const INPUT_KLASSE = 'px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white w-full';

const BETALINGSMETODE_LABEL: Record<Sponsor['betalingsmetode'], string> = {
  vipps: 'Vipps',
  avtalegiro: 'AvtaleGiro',
  bank: 'Bank',
};

/** Rangering av steget: høyere tall = lenger kommet. Brukes til å finne ferdige og aktive steg. */
const RANG: Record<SponsorOnboardingStep, number> = {
  avvist: 0,
  ny: 1,
  godkjent: 2,
  barn_tildelt: 3,
  invitert: 4,
  ferdig: 5,
};

const STEG_TITLER = ['Godkjenn fadder', 'Tildel barn', 'Velkomst-e-post', 'Venter på første innlogging'];

const formatDato = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
};

const fornavnAv = (navn: string): string => navn.trim().split(/\s+/)[0] || 'fadderen';

export interface SponsorOnboardingPanelProps {
  sponsor: Sponsor;
  step: SponsorOnboardingStep;
}

/** Guidet onboarding av ny fadder: fire steg, bare det aktive steget er åpent. */
export const SponsorOnboardingPanel: React.FC<SponsorOnboardingPanelProps> = ({ sponsor, step }) => {
  const {
    childrenList,
    coordinators,
    approveSponsorOnboarding,
    rejectSponsorOnboarding,
    assignChildInOnboarding,
    sendSponsorWelcome,
  } = useApp();

  const [busy, setBusy] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);
  const [sendResultat, setSendResultat] = useState<{ sent: boolean; message: string } | null>(null);
  // Redigert velkomst-e-post. Før redigering brukes utkastet fra dataene.
  const [redigert, setRedigert] = useState<{ subject: string; body: string } | null>(null);

  const fornavn = fornavnAv(sponsor.navn);
  const rang = RANG[step];

  // Barn som venter på fadder: samme filter som i Barn-fanen.
  // Bare barn med gyldig, aktiv koordinator kan kobles til en fadder.
  const venterPaaFadder = childrenList.filter(
    (c) => !c.tildeltFadderId && c.status === 'aktiv' && canAssignSponsor(c, coordinators)
  );
  const utenKoordinator = childrenList.filter(
    (c) => !c.tildeltFadderId && c.status === 'aktiv' && !canAssignSponsor(c, coordinators)
  ).length;

  // Barna fadderen allerede har fått, enten via fadderen eller via barnet.
  const tildelteBarn = childrenList.filter(
    (c) => c.tildeltFadderId === sponsor.id || sponsor.tildeltBarnIds.includes(c.id)
  );
  const utkastGrunnlag = buildWelcomeEmailDraft({
    sponsorName: sponsor.navn,
    childFirstNames: tildelteBarn.map((c) => c.fornavn),
    loginUrl: `${window.location.origin}/`,
  });
  const utkast = redigert ?? utkastGrunnlag;

  const kjor = async (oppgave: () => Promise<void> | void) => {
    setBusy(true);
    setFeil(null);
    try {
      await oppgave();
    } catch (err) {
      setFeil(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.');
    } finally {
      setBusy(false);
    }
  };

  const avvis = () => {
    if (!window.confirm(`Avvise og arkivere ${sponsor.navn}? Kan angres under Arkivert.`)) return;
    void kjor(() => rejectSponsorOnboarding(sponsor.id));
  };

  const sendVelkomst = () => {
    void kjor(async () => {
      const res = await sendSponsorWelcome(sponsor.id, { subject: utkast.subject, body: utkast.body });
      setSendResultat(res);
    });
  };

  if (step === 'avvist') {
    return (
      <p className="text-xs text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
        Avvist og arkivert.
      </p>
    );
  }

  /** Status for ett steg: ferdig, aktivt eller kommende. */
  const statusFor = (nr: number): 'ferdig' | 'aktiv' | 'kommende' => {
    if (rang > nr) return 'ferdig';
    if (rang === nr) return 'aktiv';
    return 'kommende';
  };

  const sendtDato = formatDato(sponsor.onboarding?.invitasjonSendt);

  const innhold = (nr: number): React.ReactNode => {
    if (nr === 1) {
      return (
        <div className="space-y-3">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-stone-500">Navn</dt>
              <dd className="font-medium">{sponsor.navn}</dd>
            </div>
            <div>
              <dt className="text-stone-500">E-post</dt>
              <dd className="font-medium">{sponsor.epost || '—'}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Telefon</dt>
              <dd className="font-medium">{sponsor.telefon || '—'}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Poststed</dt>
              <dd className="font-medium">{sponsor.poststed || '—'}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Beløp per måned</dt>
              <dd className="font-medium">{sponsor.maanedsbelop} kr</dd>
            </div>
            <div>
              <dt className="text-stone-500">Betalingsmetode</dt>
              <dd className="font-medium">{BETALINGSMETODE_LABEL[sponsor.betalingsmetode]}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Registrert</dt>
              <dd className="font-medium">{formatDato(sponsor.startDato) || '—'}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void kjor(() => approveSponsorOnboarding(sponsor.id))}
              className="px-4 py-2 bg-[#4D6B3E] text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Godkjenn
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={avvis}
              className="px-3 py-2 rounded-lg border border-red-300 bg-white text-red-700 hover:bg-red-50 text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Avvis
            </button>
          </div>
        </div>
      );
    }

    if (nr === 2) {
      const merknad =
        utenKoordinator > 0 ? (
          <p className="text-[11px] text-amber-800">
            {`${utenKoordinator} barn uten fadder mangler koordinator og kan ikke kobles ennå. Gi dem koordinator under Barn.`}
          </p>
        ) : null;
      if (venterPaaFadder.length === 0) {
        return (
          <div className="space-y-2">
            <p className="text-xs text-stone-600">
              Ingen barn venter på fadder akkurat nå. Legg inn eller frigjør barn under Barn, og kom tilbake hit.
            </p>
            {merknad}
          </div>
        );
      }
      return (
        <div className="space-y-2">
        <ul className="space-y-2" aria-label="Barn som venter på fadder">
          {venterPaaFadder.map((c) => {
            const alder = c.fodselsaar ? new Date().getFullYear() - c.fodselsaar : null;
            const detaljer = [alder !== null ? `${alder} år` : null, c.klassetrinn, c.skoleNavn]
              .filter(Boolean)
              .join(' · ');
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-medium text-stone-900">{c.fornavn}</p>
                  {detaljer && <p className="text-stone-600">{detaljer}</p>}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Velg ${c.fornavn} til ${sponsor.navn}`}
                  onClick={() => void kjor(() => assignChildInOnboarding(sponsor.id, c.id))}
                  className="px-3 py-1.5 rounded-md border border-[#4D6B3E] text-[#4D6B3E] hover:bg-[#4D6B3E]/10 font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Velg
                </button>
              </li>
            );
          })}
        </ul>
        {merknad}
        </div>
      );
    }

    if (nr === 3) {
      return (
        <div className="space-y-3">
          <p className="text-xs text-stone-600">Til: {sponsor.epost || '—'}</p>
          <label className="block text-xs text-stone-700 space-y-1">
            <span className="font-medium">Emne</span>
            <input
              type="text"
              value={utkast.subject}
              onChange={(e) => setRedigert({ ...utkast, subject: e.target.value })}
              className={INPUT_KLASSE}
            />
          </label>
          <label className="block text-xs text-stone-700 space-y-1">
            <span className="font-medium">Brødtekst</span>
            <textarea
              rows={10}
              value={utkast.body}
              onChange={(e) => setRedigert({ ...utkast, body: e.target.value })}
              className={INPUT_KLASSE}
            />
          </label>
          <p className="text-xs text-stone-600">
            Når du sender, får {fornavn} også lov til å logge inn med denne e-postadressen.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || !sponsor.epost}
              onClick={sendVelkomst}
              className="px-4 py-2 bg-[#4D6B3E] text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? 'Sender…' : 'Godkjenn og send'}
            </button>
          </div>
          {sendResultat && (
            <p
              role="status"
              className={`text-xs rounded-lg px-3 py-2 border ${
                sendResultat.sent
                  ? 'text-green-900 bg-green-50 border-green-200'
                  : 'text-amber-900 bg-amber-50 border-amber-200'
              }`}
            >
              {sendResultat.message}
            </p>
          )}
        </div>
      );
    }

    // Steg 4: ferdig-tilstand eller venter på innlogging.
    if (step === 'ferdig') {
      return (
        <p className="text-xs text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Ferdig – {fornavn} har logget inn.
        </p>
      );
    }
    return (
      <p className="text-xs text-stone-700">
        {sendtDato ? `Sendt ${sendtDato}. ` : ''}Når {fornavn} logger inn første gang, blir status aktiv og oppgaven er
        ferdig.
      </p>
    );
  };

  return (
    <div className="space-y-4">
      {feil && (
        <p role="alert" className="text-xs text-red-900 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {feil}
        </p>
      )}
      <ol className="space-y-3">
        {STEG_TITLER.map((tittel, i) => {
          const nr = i + 1;
          const status = statusFor(nr);
          const aktiv = status === 'aktiv';
          const visInnhold = aktiv || (nr === 4 && step === 'ferdig');
          return (
            <li
              key={tittel}
              aria-current={aktiv ? 'step' : undefined}
              className="rounded-lg border border-stone-200 bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    status === 'ferdig'
                      ? 'bg-[#4D6B3E] text-white'
                      : aktiv
                        ? 'bg-amber-100 text-amber-900 border border-amber-400'
                        : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {status === 'ferdig' ? <Check className="w-4 h-4" /> : nr}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${status === 'kommende' ? 'text-stone-500' : 'text-stone-900'}`}>
                    {tittel}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {status === 'ferdig' ? 'Utført' : aktiv ? 'Nå' : 'Kommer'}
                  </p>
                </div>
              </div>
              {visInnhold && <div className="mt-3 pl-10">{innhold(nr)}</div>}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
