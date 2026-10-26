import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Child, Coordinator, InquiryStatus, Report, ReportStatus, SkoleType } from '../../types';
import { skoleTypeLabel, sponsorSchoolText } from '../../utils/childPrivacy';

const SKOLE_TYPER: SkoleType[] = [
  'offentlig_barneskole',
  'privat_barneskole',
  'offentlig_ungdomsskole',
  'privat_ungdomsskole',
  'videregaende',
  'yrkesskole',
];
import { InquiryWorkPanel } from './InquiryWorkPanel';
import { AdminContentWorkbench } from './AdminContentWorkbench';
import { ChildHistoryTimeline } from '../common/ChildHistoryTimeline';
import { canAssignSponsor, childCoordinatorState, type ChildCoordinatorInfo } from '../../utils/coordinatorAssignment';
import { childSubject, logForPerson } from '../../utils/personLog';
import { sponsorHistoryForChild } from '../../utils/childSponsorHistory';
import { formatDuration, formatNorwegianDate } from '../../utils/memberSince';

export const navnPaa = (c: Coordinator): string => `${c.fornavn} ${c.etternavn}`;

/** Koordinatorcellen: navn, eller rød/gul melding ved manglende eller arkivert koordinator. */
export const koordinatorCelle = (info: ChildCoordinatorInfo) => {
  if (info.state === 'ok' && info.coordinator) {
    return <span className="text-stone-900 font-medium">{navnPaa(info.coordinator)}</span>;
  }
  if (info.state === 'arkivert' && info.coordinator) {
    return <span className="text-amber-700 font-medium">{`Arkivert: ${navnPaa(info.coordinator)}`}</span>;
  }
  return <span className="text-red-700 font-medium">Mangler koordinator</span>;
};

const STATUS_TEKST: Record<Child['status'], string> = {
  aktiv: 'Aktiv',
  avsluttet: 'Avsluttet',
  arkivert: 'Arkivert',
  utkast: 'Utkast',
};

const STATUS_KLASSE: Record<Child['status'], string> = {
  aktiv: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  avsluttet: 'bg-stone-100 text-stone-700 border-stone-300',
  arkivert: 'bg-stone-100 text-stone-700 border-stone-300',
  utkast: 'bg-amber-50 text-amber-800 border-amber-200',
};

const FOTO_TEMA_TEKST: Record<Child['fotoTema'], string> = {
  skole: 'Skole',
  tegning: 'Tegning',
  klasse: 'Klasse',
  portrett: 'Portrett',
};

/** Spørsmål som ennå venter på svar. Besvart og lukket teller ikke. */
const AAPNE_SPOERSMAAL: InquiryStatus[] = ['mottatt', 'under_behandling', 'venter_koordinator'];

type Fane = 'oversikt' | 'rapporter' | 'tidslinje' | 'opplysninger' | 'logg';

/** Visning av rapportstatus. */
const RAPPORT_STATUS: Record<ReportStatus, { tekst: string; klasse: string }> = {
  kladd: { tekst: 'Kladd', klasse: 'bg-stone-100 text-stone-700 border-stone-300' },
  innsendt: { tekst: 'Innsendt', klasse: 'bg-amber-50 text-amber-800 border-amber-300' },
  godkjent: { tekst: 'Godkjent', klasse: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  avvist: { tekst: 'Avvist', klasse: 'bg-red-50 text-red-800 border-red-200' },
};

/** Tidspunkt som tall, til sortering. Ukjent dato gir 0. */
const tidsverdi = (dato: string): number => new Date(dato).getTime() || 0;

/** Feltfakta: status fra koordinator til publisert historie. */
const FAKTA_STATUS: Record<'ikke_sendt' | 'sendt' | 'publisert', string> = {
  ikke_sendt: 'Ikke sendt',
  sendt: 'Sendt fra feltet',
  publisert: 'Publisert som historie',
};

/** Ett innslag i «Siste fra feltet» på oversikten. */
interface FeltPost {
  id: string;
  dato: string;
  typ: 'Rapport' | 'Milepæl';
  tittel: string;
  fane: Fane;
}

/** Redigerbare opplysninger. Interesser er tekst med komma i skjemaet. */
interface Opplysninger {
  fornavn: string;
  fodselsaar: number;
  kjonn: 'gutt' | 'jente';
  skoleNavn: string;
  /** Tom streng = ikke valgt (fadderen ser da «Skole i …»). */
  skoleType: SkoleType | '';
  skoleBy: string;
  klassetrinn: string;
  interesser: string;
  behovSammendrag: string;
  bakgrunnskontekst: string;
  fotoTema: Child['fotoTema'];
  samtykkeFoto: boolean;
  samtykkeHistorie: boolean;
}

const tilOpplysninger = (c: Child): Opplysninger => ({
  fornavn: c.fornavn,
  fodselsaar: c.fodselsaar,
  kjonn: c.kjonn,
  skoleNavn: c.skoleNavn,
  skoleType: c.skoleType ?? '',
  skoleBy: c.skoleBy ?? '',
  klassetrinn: c.klassetrinn,
  interesser: c.interesser.join(', '),
  behovSammendrag: c.behovSammendrag,
  bakgrunnskontekst: c.bakgrunnskontekst,
  fotoTema: c.fotoTema,
  samtykkeFoto: c.samtykkeFoto,
  samtykkeHistorie: c.samtykkeHistorie,
});

const parseInteresser = (tekst: string): string[] =>
  tekst
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** Bare feltene som faktisk er endret i forhold til utgangspunktet. */
const byggPatch = (base: Opplysninger, draft: Opplysninger): Partial<Child> => {
  const patch: Partial<Child> = {};
  if (draft.fornavn.trim() !== base.fornavn) patch.fornavn = draft.fornavn.trim();
  if (draft.fodselsaar !== base.fodselsaar) patch.fodselsaar = draft.fodselsaar;
  if (draft.kjonn !== base.kjonn) patch.kjonn = draft.kjonn;
  if (draft.skoleNavn.trim() !== base.skoleNavn) patch.skoleNavn = draft.skoleNavn.trim();
  if (draft.skoleType && draft.skoleType !== base.skoleType) patch.skoleType = draft.skoleType;
  if (draft.skoleBy.trim() !== base.skoleBy) patch.skoleBy = draft.skoleBy.trim();
  if (draft.klassetrinn.trim() !== base.klassetrinn) patch.klassetrinn = draft.klassetrinn.trim();
  if (parseInteresser(draft.interesser).join('\n') !== parseInteresser(base.interesser).join('\n')) {
    patch.interesser = parseInteresser(draft.interesser);
  }
  if (draft.behovSammendrag !== base.behovSammendrag) patch.behovSammendrag = draft.behovSammendrag;
  if (draft.bakgrunnskontekst !== base.bakgrunnskontekst) patch.bakgrunnskontekst = draft.bakgrunnskontekst;
  if (draft.fotoTema !== base.fotoTema) patch.fotoTema = draft.fotoTema;
  if (draft.samtykkeFoto !== base.samtykkeFoto) patch.samtykkeFoto = draft.samtykkeFoto;
  if (draft.samtykkeHistorie !== base.samtykkeHistorie) patch.samtykkeHistorie = draft.samtykkeHistorie;
  return patch;
};

/** Dato og klokkeslett fra loggen, f.eks. «16.10.2026 14:05». Ukjent format vises slik det er. */
const formatLoggTid = (tidspunkt: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(tidspunkt);
  if (!m) return tidspunkt;
  return `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}`;
};

const Kort: React.FC<{ tittel: string; children: React.ReactNode }> = ({ tittel, children }) => (
  <section className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-3">
    <h3 className="text-sm font-serif font-bold text-stone-900">{tittel}</h3>
    {children}
  </section>
);

const Melding: React.FC<{ tone: 'feil' | 'ok' | 'info'; children: React.ReactNode }> = ({ tone, children }) => {
  const klasse =
    tone === 'feil'
      ? 'text-red-900 bg-red-50 border-red-200'
      : tone === 'ok'
        ? 'text-green-900 bg-green-50 border-green-200'
        : 'text-stone-700 bg-stone-50 border-stone-200';
  return (
    <p role={tone === 'feil' ? 'alert' : 'status'} className={`text-xs border rounded-lg px-3 py-2 ${klasse}`}>
      {children}
    </p>
  );
};

/** Dialogen over barnesiden, åpnet fra «Trenger oppmerksomhet». */
type Dialog = { kind: 'sporsmaal' | 'rapport'; valgtId: string | null } | { kind: 'foto' } | null;

const TRENGER_CHIP =
  'px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer transition-colors';

/** Modal over barnesiden. Lukkes med Escape eller «Lukk», og siden under er uendret. */
const TrengerDialog: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) =>
  createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trenger-dialog-tittel"
        className="bg-white rounded-xl border border-stone-200 shadow-xl max-w-3xl w-full h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between gap-3 p-4 border-b border-stone-200 shrink-0">
          <h3 id="trenger-dialog-tittel" className="text-base font-serif font-bold text-stone-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Lukk"
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 text-sm text-stone-800">{children}</div>
      </div>
    </div>,
    document.body
  );

/** Samme skriveflate som i godkjenningskøen. Admin retter selv, og ingenting sendes tilbake til koordinator. */
const RapportRedigering: React.FC<{
  report: Report;
  child: Child;
  onClose: () => void;
  onPublisert: () => void;
}> = ({ report, child, onClose, onPublisert }) => {
  const { approveReport } = useApp();
  const [titleNo, setTitleNo] = useState(report.tittelNorsk);
  const [bodyNo, setBodyNo] = useState(report.innholdNorsk);
  return (
    <AdminContentWorkbench
      mode="rapport"
      report={report}
      child={child}
      titleNo={titleNo}
      bodyNo={bodyNo}
      onTitle={setTitleNo}
      onBody={setBodyNo}
      onClose={onClose}
      onPublish={() => {
        approveReport(report.id, titleNo, bodyNo);
        onPublisert();
      }}
    />
  );
};

export interface ChildPageProps {
  child: Child;
  onOpenSponsorByEmail?: (email: string) => void;
}

export const ChildPage: React.FC<ChildPageProps> = ({ child, onOpenSponsorByEmail }) => {
  const {
    coordinators,
    sponsors,
    reports,
    inquiries,
    sponsorAssignments,
    auditLogs,
    milestones,
    fieldFacts,
    updateChild,
    reassignChildCoordinator,
    assignSponsorToChild,
    reassignChildSponsor,
    removeChildSponsor,
    endSponsorship,
    reopenChild,
    addPersonComment,
    approveChildPhoto,
    rejectChildPhoto,
  } = useApp();

  const [fane, setFane] = useState<Fane>('oversikt');
  const [aapenRapportId, setAapenRapportId] = useState<string | null>(null);

  // Dialog for «Trenger oppmerksomhet»
  const [dialog, setDialog] = useState<Dialog>(null);
  const [oppmerksomhetOk, setOppmerksomhetOk] = useState<string | null>(null);

  // Koordinator
  const [bytteValg, setBytteValg] = useState<string | null>(null);
  const [bytteFeil, setBytteFeil] = useState<string | null>(null);
  const [bytteOk, setBytteOk] = useState<string | null>(null);

  // Fadder
  const [fadderValg, setFadderValg] = useState('');
  const [fadderFeil, setFadderFeil] = useState<string | null>(null);
  const [fadderOk, setFadderOk] = useState<string | null>(null);

  // Opplysninger: utgangspunkt (baseline) og skjemaverdier (draft)
  const [baseline, setBaseline] = useState<Opplysninger>(() => tilOpplysninger(child));
  const [draft, setDraft] = useState<Opplysninger>(() => tilOpplysninger(child));
  const [lagreFeil, setLagreFeil] = useState<string | null>(null);
  const [lagreOk, setLagreOk] = useState<string | null>(null);

  // Logg
  const [kommentar, setKommentar] = useState('');
  const [kommentarFeil, setKommentarFeil] = useState<string | null>(null);

  // Avslutt/gjenåpne oppfølging
  const [oppfolgingOk, setOppfolgingOk] = useState<string | null>(null);

  // Ny tilstand når barnet endres i appen (f.eks. etter lagring). Nøkkelen gjør at uendrede felt ikke nullstilles.
  const opplysningerNokkel = JSON.stringify(tilOpplysninger(child));
  useEffect(() => {
    const o = tilOpplysninger(child);
    setBaseline(o);
    setDraft(o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opplysningerNokkel]);

  // Escape lukker dialogen
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDialog(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);

  // Avledede data
  const alder = new Date().getFullYear() - child.fodselsaar;
  const aktiveKoordinatorer = coordinators.filter((c) => c.aktiv !== false);
  const koordinatorInfo = childCoordinatorState(child, coordinators);
  const harGyldigKoordinator = koordinatorInfo.state === 'ok';
  const gjeldendeKoordinatorId = harGyldigKoordinator ? child.koordinatorId : '';
  const valgtKoordinatorId = bytteValg ?? gjeldendeKoordinatorId;

  const fadder = child.tildeltFadderId ? sponsors.find((s) => s.id === child.tildeltFadderId) : undefined;
  const aapenTildeling = fadder
    ? sponsorAssignments.find((a) => a.childId === child.id && a.sponsorId === fadder.id && !a.sluttDato)
    : undefined;
  const fadderSiden = aapenTildeling?.startDato ?? fadder?.startDato;
  const kanEndreFadder = canAssignSponsor(child, coordinators);
  const kandidatFadder = sponsors.filter((s) => !s.avsluttet && s.id !== child.tildeltFadderId);

  const historikk = sponsorHistoryForChild(sponsorAssignments, sponsors, child.id, child.tildeltFadderId);
  const logg = logForPerson(auditLogs, childSubject(child));

  const innsendteRapporterListe = reports.filter((r) => r.barnId === child.id && r.status === 'innsendt');
  const aapneSpoersmaalListe = inquiries.filter((i) => i.barnId === child.id && AAPNE_SPOERSMAAL.includes(i.status));
  const innsendteRapporter = innsendteRapporterListe.length;
  const aapneSpoersmaal = aapneSpoersmaalListe.length;
  const fotoVenter = child.ventendeFotoStatus === 'innsendt';

  // Feltet: rapporter, milepæler og fakta for dette barnet, nyeste først
  const rapporterForBarn = reports
    .filter((r) => r.barnId === child.id)
    .sort((a, b) => tidsverdi(b.dato) - tidsverdi(a.dato));
  const milepaelerForBarn = milestones.filter((m) => m.barnId === child.id);
  const faktaForBarn = fieldFacts
    .filter((f) => f.barnId === child.id)
    .sort((a, b) => tidsverdi(b.dato) - tidsverdi(a.dato));

  const FANER: { id: Fane; label: string }[] = [
    { id: 'oversikt', label: 'Oversikt' },
    { id: 'rapporter', label: `Rapporter (${rapporterForBarn.length})` },
    { id: 'tidslinje', label: `Tidslinje (${milepaelerForBarn.length + faktaForBarn.length})` },
    { id: 'opplysninger', label: 'Opplysninger' },
    { id: 'logg', label: 'Logg' },
  ];

  // Tre nyeste fra feltet: innsendte og godkjente rapporter, og milepæler
  const sisteFraFeltet: FeltPost[] = [
    ...rapporterForBarn
      .filter((r) => r.status === 'innsendt' || r.status === 'godkjent')
      .map((r) => ({
        id: `rapport-${r.id}`,
        dato: r.dato,
        typ: 'Rapport' as const,
        tittel: r.tittelNorsk || r.tittelFransk || 'Uten tittel',
        fane: 'rapporter' as const,
      })),
    ...milepaelerForBarn.map((m) => ({
      id: `milepael-${m.id}`,
      dato: m.dato,
      typ: 'Milepæl' as const,
      tittel: m.tittelNorsk || m.tittelFransk,
      fane: 'tidslinje' as const,
    })),
  ]
    .sort((a, b) => tidsverdi(b.dato) - tidsverdi(a.dato))
    .slice(0, 3);

  // Med ett element vises det direkte. Med flere velger brukeren i listen.
  const valgtId = dialog && dialog.kind !== 'foto' ? dialog.valgtId : null;
  const valgtSporsmaal =
    dialog?.kind === 'sporsmaal'
      ? aapneSpoersmaalListe.length === 1
        ? aapneSpoersmaalListe[0]
        : aapneSpoersmaalListe.find((i) => i.id === valgtId)
      : undefined;
  const valgtRapport =
    dialog?.kind === 'rapport'
      ? innsendteRapporterListe.length === 1
        ? innsendteRapporterListe[0]
        : innsendteRapporterListe.find((r) => r.id === valgtId)
      : undefined;
  const fotoSrc =
    child.ventendeFotoUrl?.startsWith('http') ||
    child.ventendeFotoUrl?.startsWith('data:') ||
    child.ventendeFotoUrl?.startsWith('/')
      ? child.ventendeFotoUrl
      : `/${child.ventendeFotoUrl}`;

  // Handlinger

  const aapneDialog = (kind: 'sporsmaal' | 'rapport' | 'foto') => {
    setOppmerksomhetOk(null);
    setDialog(kind === 'foto' ? { kind } : { kind, valgtId: null });
  };

  // Etter behandling: tilbake til listen, eller lukk når ingen flere venter.
  const etterBehandling = (gjenstaar: number, kind: 'sporsmaal' | 'rapport') =>
    setDialog(gjenstaar === 0 ? null : { kind, valgtId: null });

  const godkjennFoto = () => {
    approveChildPhoto(child.id);
    setDialog(null);
    setOppmerksomhetOk(`Bildet av ${child.fornavn} er publisert i fadderportalen.`);
  };

  const avvisFoto = () => {
    const reason = window.prompt('Begrunnelse til koordinator (fransk/norsk):');
    if (!reason?.trim()) return;
    rejectChildPhoto(child.id, reason.trim());
    setDialog(null);
    setOppmerksomhetOk(`Bildet av ${child.fornavn} er avvist. Koordinator er varslet.`);
  };

  const bytteKoordinator = () => {
    const ny = aktiveKoordinatorer.find((c) => c.id === valgtKoordinatorId);
    if (!ny) return;
    const gammel = koordinatorInfo.coordinator;
    const gammelNavn = gammel ? navnPaa(gammel) : '';
    const spoersmaal = gammelNavn
      ? `Flytte ${child.fornavn} til ${navnPaa(ny)}? Rapporter, fakta, bilder og spørsmål om barnet følger med, og ${gammelNavn} mister tilgangen.`
      : `Gi ${child.fornavn} koordinator ${navnPaa(ny)}? Rapporter, fakta, bilder og spørsmål om barnet blir synlige for ${navnPaa(ny)}.`;
    if (!window.confirm(spoersmaal)) return;
    setBytteFeil(null);
    setBytteOk(null);
    try {
      reassignChildCoordinator(child.id, ny.id);
      setBytteValg(null);
      setBytteOk(`${child.fornavn} er flyttet til ${navnPaa(ny)}.`);
    } catch (err) {
      setBytteFeil(err instanceof Error ? err.message : 'Kunne ikke bytte koordinator.');
    }
  };

  const koble = () => {
    const ny = sponsors.find((s) => s.id === fadderValg);
    if (!ny) return;
    setFadderFeil(null);
    setFadderOk(null);
    try {
      assignSponsorToChild(child.id, ny.id);
      setFadderValg('');
      setFadderOk(`${child.fornavn} er koblet til ${ny.navn}.`);
    } catch (err) {
      setFadderFeil(err instanceof Error ? err.message : 'Kunne ikke koble barnet til fadderen.');
    }
  };

  const byttFadder = () => {
    const ny = sponsors.find((s) => s.id === fadderValg);
    if (!fadder || !ny) return;
    if (!window.confirm(
      `Bytte fadder for ${child.fornavn} fra ${fadder.navn} til ${ny.navn}? ${fadder.navn} mister tilgangen til ${child.fornavn} i fadderportalen.`
    )) return;
    setFadderFeil(null);
    setFadderOk(null);
    try {
      reassignChildSponsor(child.id, ny.id);
      setFadderValg('');
      setFadderOk(`${child.fornavn} har fått ny fadder: ${ny.navn}.`);
    } catch (err) {
      setFadderFeil(err instanceof Error ? err.message : 'Kunne ikke bytte fadder.');
    }
  };

  const fjernFadder = () => {
    if (!fadder) return;
    if (!window.confirm(
      `${fadder.navn} er ikke lenger fadder for ${child.fornavn}. ${child.fornavn} blir stående og venter på ny fadder.`
    )) return;
    setFadderFeil(null);
    setFadderOk(null);
    try {
      removeChildSponsor(child.id);
      setFadderOk(`${fadder.navn} er fjernet som fadder for ${child.fornavn}.`);
    } catch (err) {
      setFadderFeil(err instanceof Error ? err.message : 'Kunne ikke fjerne fadderen.');
    }
  };

  // Avslutter oppfølgingen etter bekreftelse. Barnet tas ut av programmet.
  const avsluttOppfolging = () => {
    const spoersmaal = `Avslutte oppfølgingen av ${child.fornavn}? ${child.fornavn} tas ut av programmet${fadder ? ` og kobles fra fadderen ${fadder.navn}` : ''}. Det kan angres med «Gjenåpne».`;
    if (!window.confirm(spoersmaal)) return;
    try {
      endSponsorship(child.id);
      setOppfolgingOk(`Oppfølgingen av ${child.fornavn} er avsluttet.`);
    } catch (err) {
      setOppfolgingOk(null);
      setFadderFeil(err instanceof Error ? err.message : 'Kunne ikke avslutte oppfølgingen.');
    }
  };

  const gjenapnOppfolging = () => {
    try {
      reopenChild(child.id);
      setOppfolgingOk(`Oppfølgingen av ${child.fornavn} er gjenåpnet.`);
    } catch (err) {
      setFadderFeil(err instanceof Error ? err.message : 'Kunne ikke gjenåpne oppfølgingen.');
    }
  };

  const endret = Object.keys(byggPatch(baseline, draft)).length > 0;

  const lagre = () => {
    setLagreFeil(null);
    setLagreOk(null);
    if (!draft.fornavn.trim()) {
      setLagreFeil('Fornavn må fylles ut.');
      return;
    }
    if (!Number.isInteger(draft.fodselsaar) || draft.fodselsaar < 1900) {
      setLagreFeil('Fødselsår må være et gyldig årstall.');
      return;
    }
    const patch = byggPatch(baseline, draft);
    if (Object.keys(patch).length === 0) return;
    try {
      updateChild(child.id, patch);
      setBaseline(draft);
      setLagreOk('Lagret. Koordinatoren er varslet.');
    } catch (err) {
      setLagreFeil(err instanceof Error ? err.message : 'Kunne ikke lagre endringene.');
    }
  };

  const lagreKommentar = () => {
    const tekst = kommentar.trim();
    if (!tekst) return;
    setKommentarFeil(null);
    try {
      addPersonComment(childSubject(child), tekst);
      setKommentar('');
    } catch (err) {
      setKommentarFeil(err instanceof Error ? err.message : 'Kunne ikke lagre kommentaren.');
    }
  };

  const oppdater = <K extends keyof Opplysninger>(felt: K, verdi: Opplysninger[K]) => {
    setDraft((d) => ({ ...d, [felt]: verdi }));
    setLagreOk(null);
    setLagreFeil(null);
  };

  const inputKlasse = 'px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 w-full';
  const knappKlasse =
    'px-3 py-1.5 rounded-lg bg-[#4D6B3E] text-white hover:bg-[#3B522F] font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  const tabell = (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
      <div>
        <dt className="text-stone-500">Behov</dt>
        <dd className="text-stone-900 whitespace-pre-line">{child.behovSammendrag || '—'}</dd>
      </div>
      <div>
        <dt className="text-stone-500">Bakgrunn</dt>
        <dd className="text-stone-900 whitespace-pre-line">{child.bakgrunnskontekst || '—'}</dd>
      </div>
      <div>
        <dt className="text-stone-500">Interesser</dt>
        <dd className="flex flex-wrap gap-1.5 mt-1">
          {child.interesser.length === 0 && <span className="text-stone-400">—</span>}
          {child.interesser.map((i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {i}
            </span>
          ))}
        </dd>
      </div>
      <div>
        <dt className="text-stone-500">Samtykke</dt>
        <dd className="text-stone-900">{`Foto: ${child.samtykkeFoto ? 'Ja' : 'Nei'} · Historie: ${child.samtykkeHistorie ? 'Ja' : 'Nei'}`}</dd>
      </div>
      <div>
        <dt className="text-stone-500">Opprettet</dt>
        <dd className="text-stone-900">{formatNorwegianDate(child.opprettetDato) || '—'}</dd>
      </div>
      <div>
        <dt className="text-stone-500">Sist oppdatert</dt>
        <dd className="text-stone-900">{formatNorwegianDate(child.sistOppdatert) || '—'}</dd>
      </div>
    </dl>
  );

  return (
    <div className="space-y-6">
      {/* Topp: barnets identitet og ansvar */}
      <section className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 md:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex items-start gap-4 min-w-0 lg:flex-1">
            {child.publisertFotoUrl ? (
              <img
                src={child.publisertFotoUrl}
                alt={`Bilde av ${child.fornavn}`}
                className="w-20 h-20 rounded-xl object-cover border border-stone-200 shrink-0"
              />
            ) : (
              <div
                aria-hidden="true"
                className="w-20 h-20 rounded-xl bg-[#4D6B3E]/10 text-[#4D6B3E] flex items-center justify-center text-3xl font-serif font-bold shrink-0"
              >
                {child.fornavn.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 space-y-1.5">
              <h2 className="text-2xl font-serif font-bold text-stone-900 break-words">{`${child.internKode} — ${child.fornavn}`}</h2>
              <p className="text-sm text-stone-700">{`${alder} år`}</p>
              <p className="text-xs text-stone-600">{`${child.skoleNavn} · ${child.klassetrinn}`}</p>
              <span
                className={`inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_KLASSE[child.status]}`}
              >
                {STATUS_TEKST[child.status]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:w-[34rem] shrink-0">
            {/* Koordinator */}
            <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-4 space-y-2 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Koordinator</p>
              <p className="text-sm">{koordinatorCelle(koordinatorInfo)}</p>
              <select
                value={valgtKoordinatorId}
                onChange={(e) => {
                  setBytteValg(e.target.value);
                  setBytteFeil(null);
                  setBytteOk(null);
                }}
                aria-label="Ny koordinator"
                className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs w-full"
              >
                <option value="">Velg koordinator…</option>
                {aktiveKoordinatorer.map((c) => (
                  <option key={c.id} value={c.id}>
                    {navnPaa(c)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!valgtKoordinatorId || valgtKoordinatorId === gjeldendeKoordinatorId}
                onClick={bytteKoordinator}
                className={knappKlasse}
              >
                {harGyldigKoordinator ? 'Bytt koordinator' : 'Velg koordinator'}
              </button>
              {bytteFeil && <Melding tone="feil">{bytteFeil}</Melding>}
              {bytteOk && <Melding tone="ok">{bytteOk}</Melding>}
            </div>

            {/* Fadder */}
            <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-4 space-y-2 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Fadder</p>
              {fadder ? (
                <>
                  <p className="text-sm">
                    {onOpenSponsorByEmail ? (
                      <button
                        type="button"
                        onClick={() => onOpenSponsorByEmail(fadder.epost)}
                        className="text-[#4D6B3E] hover:underline font-semibold cursor-pointer text-left"
                      >
                        {fadder.navn}
                      </button>
                    ) : (
                      <span className="text-stone-900 font-medium">{fadder.navn}</span>
                    )}
                  </p>
                  {fadderSiden && formatNorwegianDate(fadderSiden) && (
                    <p className="text-stone-600">
                      {`Fadder siden ${formatNorwegianDate(fadderSiden)} (${formatDuration(fadderSiden)})`}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-amber-800 font-medium">Venter på fadder</p>
              )}

              {!kanEndreFadder && (
                <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Barnet må ha aktiv koordinator før det kan få fadder.
                </p>
              )}

              <select
                value={fadderValg}
                onChange={(e) => {
                  setFadderValg(e.target.value);
                  setFadderFeil(null);
                  setFadderOk(null);
                }}
                disabled={!kanEndreFadder}
                aria-label={fadder ? 'Ny fadder' : 'Velg fadder'}
                className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs w-full disabled:opacity-50"
              >
                <option value="">{fadder ? 'Velg ny fadder…' : 'Velg fadder…'}</option>
                {kandidatFadder.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.navn}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap items-center gap-3">
                {fadder ? (
                  <button
                    type="button"
                    disabled={!kanEndreFadder || !fadderValg}
                    onClick={byttFadder}
                    className={knappKlasse}
                  >
                    Bytt
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!kanEndreFadder || !fadderValg}
                    onClick={koble}
                    className={knappKlasse}
                  >
                    Koble
                  </button>
                )}
                {fadder && (
                  <button
                    type="button"
                    disabled={!kanEndreFadder}
                    onClick={fjernFadder}
                    className="text-red-700 hover:underline font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Fjern fadder
                  </button>
                )}
              </div>
              {fadderFeil && <Melding tone="feil">{fadderFeil}</Melding>}
              {fadderOk && <Melding tone="ok">{fadderOk}</Melding>}
            </div>
          </div>
        </div>

        {(innsendteRapporter > 0 || aapneSpoersmaal > 0 || fotoVenter) && (
          <div className="mt-5 pt-4 border-t border-stone-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-2">Trenger oppmerksomhet</p>
            <div className="flex flex-wrap gap-2">
              {innsendteRapporter > 0 && (
                <button type="button" aria-haspopup="dialog" onClick={() => aapneDialog('rapport')} className={TRENGER_CHIP}>
                  {`${innsendteRapporter} rapport${innsendteRapporter === 1 ? '' : 'er'} venter på godkjenning`}
                </button>
              )}
              {aapneSpoersmaal > 0 && (
                <button type="button" aria-haspopup="dialog" onClick={() => aapneDialog('sporsmaal')} className={TRENGER_CHIP}>
                  {`${aapneSpoersmaal} ubesvart${aapneSpoersmaal === 1 ? '' : 'e'} spørsmål`}
                </button>
              )}
              {fotoVenter && (
                <button type="button" aria-haspopup="dialog" onClick={() => aapneDialog('foto')} className={TRENGER_CHIP}>
                  Bilde venter på godkjenning
                </button>
              )}
            </div>
          </div>
        )}
        {oppmerksomhetOk && (
          <div className="mt-3">
            <Melding tone="info">{oppmerksomhetOk}</Melding>
          </div>
        )}
      </section>

      {/* Faner */}
      <div>
        <div role="tablist" aria-label="Barnets sider" className="flex gap-1 border-b border-stone-200 overflow-x-auto">
          {FANER.map((f) => {
            const aktiv = fane === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                id={`barn-tab-${f.id}`}
                aria-selected={aktiv}
                aria-controls={`barn-panel-${f.id}`}
                onClick={() => setFane(f.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
                  aktiv
                    ? 'border-[#4D6B3E] text-[#4D6B3E]'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`barn-panel-${fane}`} aria-labelledby={`barn-tab-${fane}`} className="pt-6 space-y-6">
          {fane === 'oversikt' && (
            <>
              <Kort tittel="Om barnet">{tabell}</Kort>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Kort tittel="Fadderhistorikk">
                  {historikk.length === 0 ? (
                    <p className="text-xs text-stone-500">Ingen fadderhistorikk ennå.</p>
                  ) : (
                    <ul className="divide-y divide-stone-100 text-xs">
                      {historikk.map((h, i) => {
                        const aapen = !h.sluttDato;
                        if (h.kilde === 'registrering') {
                          return (
                            <li key={`${h.sponsorId}-registrering`} className="py-2 text-stone-900">
                              {`${h.navn} · fra ${formatNorwegianDate(h.startDato)} (fadderens registreringsdato) – nå`}
                            </li>
                          );
                        }
                        return (
                          <li key={`${h.sponsorId}-${h.startDato}-${i}`} className="py-2 flex flex-wrap justify-between gap-2">
                            <span className="font-medium text-stone-900">{h.navn}</span>
                            <span className="text-stone-600">
                              {`${formatNorwegianDate(h.startDato)} – ${aapen ? 'nå' : formatNorwegianDate(h.sluttDato)}`}
                              {` (${aapen ? formatDuration(h.startDato) : formatDuration(h.startDato, h.sluttDato)})`}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Kort>

                <Kort tittel="Siste hendelser">
                  {logg.length === 0 ? (
                    <p className="text-xs text-stone-500">Ingen hendelser ennå.</p>
                  ) : (
                    <ul className="divide-y divide-stone-100 text-xs">
                      {logg.slice(0, 5).map((l) => (
                        <li key={l.id} className="py-2">
                          <p className="text-stone-900">
                            <span className="font-medium">{l.handling}</span>
                            <span className="text-stone-500">{` · ${formatLoggTid(l.tidspunkt)}`}</span>
                          </p>
                          <p className="text-stone-600">{l.detaljer}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Kort>
              </div>

              <Kort tittel="Siste fra feltet">
                {sisteFraFeltet.length === 0 ? (
                  <p className="text-xs text-stone-500">Ingen rapporter eller milepæler ennå.</p>
                ) : (
                  <ul className="divide-y divide-stone-100 text-xs">
                    {sisteFraFeltet.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setFane(p.fane)}
                          className="w-full py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-left hover:bg-stone-50 cursor-pointer"
                        >
                          <span className="text-stone-600">{formatNorwegianDate(p.dato)}</span>
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-medium">
                            {p.typ}
                          </span>
                          <span className="text-stone-900 font-medium">{p.tittel}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Kort>

              {/* Avslutning er svært sjelden, derfor diskret og nederst. */}
              <section className="mt-2 pt-4 border-t border-dashed border-stone-200 text-xs space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Avslutt oppfølging</p>
                {child.status === 'aktiv' && (
                  <>
                    <p className="text-[11px] text-stone-500">
                      Brukes når barnet er ferdig i programmet, for eksempel etter fullført skolegang. Svært sjelden.
                    </p>
                    <button
                      type="button"
                      onClick={avsluttOppfolging}
                      className="px-2.5 py-1 rounded-md border border-red-300 bg-white text-red-700 hover:bg-red-50 font-medium cursor-pointer"
                    >
                      {`Avslutt oppfølging for ${child.fornavn}`}
                    </button>
                  </>
                )}
                {child.status === 'avsluttet' && (
                  <>
                    <p className="text-stone-600">Oppfølgingen er avsluttet.</p>
                    <button
                      type="button"
                      onClick={gjenapnOppfolging}
                      className="px-2.5 py-1 rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 font-medium cursor-pointer"
                    >
                      Gjenåpne oppfølging
                    </button>
                    <p className="text-[11px] text-stone-500">Barnet blir aktivt igjen og venter på fadder.</p>
                  </>
                )}
                {oppfolgingOk && <Melding tone="info">{oppfolgingOk}</Melding>}
              </section>
            </>
          )}

          {fane === 'rapporter' && (
            <section className="bg-white rounded-xl border border-stone-200 shadow-xs p-5">
              {rapporterForBarn.length === 0 ? (
                <p className="text-xs text-stone-500">{`Ingen rapporter om ${child.fornavn} ennå.`}</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {rapporterForBarn.map((r) => {
                    const aapen = aapenRapportId === r.id;
                    const status = RAPPORT_STATUS[r.status];
                    const godkjentTekst = r.godkjentDato ? formatNorwegianDate(r.godkjentDato) : '';
                    return (
                      <li key={r.id} className="py-3 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            aria-expanded={aapen}
                            onClick={() => setAapenRapportId(aapen ? null : r.id)}
                            className="flex-1 min-w-0 text-left space-y-1 cursor-pointer"
                          >
                            <span className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                              <span>{formatNorwegianDate(r.dato)}</span>
                              <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${status.klasse}`}>
                                {status.tekst}
                              </span>
                            </span>
                            <span className="block text-sm font-medium text-stone-900 break-words">
                              {r.tittelNorsk || r.tittelFransk || 'Uten tittel'}
                            </span>
                            <span className="block text-xs text-stone-500">
                              {`Koordinator: ${r.koordinatorNavn}${godkjentTekst ? ` · Godkjent ${godkjentTekst}` : ''}`}
                            </span>
                          </button>
                          {r.status === 'innsendt' && (
                            <button
                              type="button"
                              aria-haspopup="dialog"
                              onClick={() => {
                                setOppmerksomhetOk(null);
                                setDialog({ kind: 'rapport', valgtId: r.id });
                              }}
                              className={knappKlasse}
                            >
                              Skriv og publiser
                            </button>
                          )}
                        </div>

                        {aapen && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-4 rounded-lg bg-[#A3B18A]/10 border border-[#A3B18A]/40 space-y-2">
                              <p className="text-[10px] uppercase tracking-wider text-[#4D6B3E] font-semibold">Norsk</p>
                              <p className="text-stone-800 leading-relaxed whitespace-pre-line">{r.innholdNorsk || '—'}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Fransk (original)</p>
                              <p className="text-stone-800 leading-relaxed whitespace-pre-line">{r.innholdFransk || '—'}</p>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {fane === 'tidslinje' && (
            <section className="space-y-6">
              <ChildHistoryTimeline
                milestones={milepaelerForBarn}
                childName={child.fornavn}
                childCode={child.internKode}
                emptyMessage={`Ingen milepæler registrert for ${child.fornavn} ennå.`}
              />

              <Kort tittel="Fakta og historier fra feltet">
                {faktaForBarn.length === 0 ? (
                  <p className="text-xs text-stone-500">Ingen fakta fra feltet ennå.</p>
                ) : (
                  <ul className="divide-y divide-stone-100 text-xs">
                    {faktaForBarn.map((f) => (
                      <li key={f.id} className="py-3 space-y-1">
                        <p className="flex flex-wrap items-center gap-2 text-stone-600">
                          <span>{formatNorwegianDate(f.dato)}</span>
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-medium">
                            {FAKTA_STATUS[f.status]}
                          </span>
                        </p>
                        <p className="text-stone-900 whitespace-pre-line">{f.trivsel || '—'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Kort>
            </section>
          )}

          {fane === 'opplysninger' && (
            <section className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-5">
              <div className="space-y-1">
                <p className="text-xs text-stone-600">
                  Admin og koordinator kan endre opplysningene. Fadderen ser dem, men kan ikke endre.
                </p>
                <p className="text-[11px] text-stone-500">{`Intern kode: ${child.internKode} · Opprettet: ${formatNorwegianDate(child.opprettetDato) || '—'}`}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <label className="space-y-1 text-stone-700">
                  <span className="font-medium">Fornavn</span>
                  <input value={draft.fornavn} onChange={(e) => oppdater('fornavn', e.target.value)} className={inputKlasse} />
                </label>
                <label className="space-y-1 text-stone-700">
                  <span className="font-medium">Fødselsår</span>
                  <input
                    type="number"
                    value={draft.fodselsaar}
                    onChange={(e) => oppdater('fodselsaar', parseInt(e.target.value, 10) || 0)}
                    className={inputKlasse}
                  />
                </label>
                <label className="space-y-1 text-stone-700">
                  <span className="font-medium">Kjønn</span>
                  <select
                    value={draft.kjonn}
                    onChange={(e) => oppdater('kjonn', e.target.value as 'gutt' | 'jente')}
                    className={inputKlasse}
                  >
                    <option value="gutt">Gutt</option>
                    <option value="jente">Jente</option>
                  </select>
                </label>
                <label className="space-y-1 text-stone-700">
                  <span className="font-medium">Skolens navn (internt)</span>
                  <input value={draft.skoleNavn} onChange={(e) => oppdater('skoleNavn', e.target.value)} className={inputKlasse} />
                  <span className="block text-[11px] text-stone-500">Vises aldri for fadderen.</span>
                </label>
                <label className="space-y-1 text-stone-700">
                  <span className="font-medium">Skoletype (vises for fadder)</span>
                  <select
                    value={draft.skoleType}
                    onChange={(e) => oppdater('skoleType', e.target.value as SkoleType | '')}
                    className={inputKlasse}
                  >
                    <option value="" disabled>
                      Velg skoletype …
                    </option>
                    {SKOLE_TYPER.map((t) => (
                      <option key={t} value={t}>
                        {skoleTypeLabel(t)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-stone-700">
                  <span className="font-medium">By (vises for fadder)</span>
                  <input
                    value={draft.skoleBy}
                    placeholder="Brazzaville"
                    onChange={(e) => oppdater('skoleBy', e.target.value)}
                    className={inputKlasse}
                  />
                  <span className="block text-[11px] text-stone-500">
                    Fadderen ser: {sponsorSchoolText({ skoleType: draft.skoleType || undefined, skoleBy: draft.skoleBy || undefined } as Child)}
                  </span>
                </label>
                <label className="space-y-1 text-stone-700">
                  <span className="font-medium">Klassetrinn</span>
                  <input value={draft.klassetrinn} onChange={(e) => oppdater('klassetrinn', e.target.value)} className={inputKlasse} />
                </label>
                <label className="space-y-1 text-stone-700">
                  <span className="font-medium">Fototema</span>
                  <select
                    value={draft.fotoTema}
                    onChange={(e) => oppdater('fotoTema', e.target.value as Child['fotoTema'])}
                    className={inputKlasse}
                  >
                    {(Object.keys(FOTO_TEMA_TEKST) as Child['fotoTema'][]).map((t) => (
                      <option key={t} value={t}>
                        {FOTO_TEMA_TEKST[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-stone-700 md:col-span-2">
                  <span className="font-medium">Interesser (skriv med komma mellom)</span>
                  <input
                    value={draft.interesser}
                    onChange={(e) => oppdater('interesser', e.target.value)}
                    placeholder="Fotball, tegning, musikk"
                    className={inputKlasse}
                  />
                </label>
                <label className="space-y-1 text-stone-700 md:col-span-2">
                  <span className="font-medium">Behov</span>
                  <textarea
                    rows={3}
                    value={draft.behovSammendrag}
                    onChange={(e) => oppdater('behovSammendrag', e.target.value)}
                    className={inputKlasse}
                  />
                </label>
                <label className="space-y-1 text-stone-700 md:col-span-2">
                  <span className="font-medium">Bakgrunn</span>
                  <textarea
                    rows={4}
                    value={draft.bakgrunnskontekst}
                    onChange={(e) => oppdater('bakgrunnskontekst', e.target.value)}
                    className={inputKlasse}
                  />
                </label>
                <div className="md:col-span-2 flex flex-wrap gap-5 text-stone-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft.samtykkeFoto}
                      onChange={(e) => oppdater('samtykkeFoto', e.target.checked)}
                    />
                    <span>Samtykke til foto</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft.samtykkeHistorie}
                      onChange={(e) => oppdater('samtykkeHistorie', e.target.checked)}
                    />
                    <span>Samtykke til historie</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" disabled={!endret} onClick={lagre} className={knappKlasse}>
                  Lagre endringer
                </button>
              </div>
              {lagreFeil && <Melding tone="feil">{lagreFeil}</Melding>}
              {lagreOk && <Melding tone="ok">{lagreOk}</Melding>}
            </section>
          )}

          {fane === 'logg' && (
            <section className="space-y-6">
              <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-3">
                <h3 className="text-sm font-serif font-bold text-stone-900">Legg til kommentar</h3>
                <p className="text-[11px] text-stone-500">Skriv saklige notater.</p>
                <textarea
                  rows={3}
                  value={kommentar}
                  onChange={(e) => {
                    setKommentar(e.target.value);
                    setKommentarFeil(null);
                  }}
                  aria-label="Ny kommentar"
                  className={inputKlasse}
                />
                <button
                  type="button"
                  disabled={!kommentar.trim()}
                  onClick={lagreKommentar}
                  className={knappKlasse}
                >
                  Lagre kommentar
                </button>
                {kommentarFeil && <Melding tone="feil">{kommentarFeil}</Melding>}
              </div>

              <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5">
                {logg.length === 0 ? (
                  <p className="text-xs text-stone-500">Ingen hendelser registrert ennå.</p>
                ) : (
                  <ul className="space-y-3 text-xs">
                    {logg.map((l) => {
                      const erKommentar = l.type === 'kommentar';
                      return (
                        <li
                          key={l.id}
                          className={`pl-3 py-1 ${erKommentar ? 'border-l-4 border-amber-400 bg-amber-50/50' : 'border-l-2 border-stone-200'}`}
                        >
                          <p className="text-stone-900">
                            <span className="font-medium">{l.handling}</span>
                            <span className="text-stone-500">{` · ${formatLoggTid(l.tidspunkt)} · ${l.brukerNavn}`}</span>
                          </p>
                          <p className="text-stone-700 whitespace-pre-line">{l.detaljer}</p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {dialog?.kind === 'sporsmaal' && (
        <TrengerDialog title={`Spørsmål om ${child.fornavn}`} onClose={() => setDialog(null)}>
          {valgtSporsmaal ? (
            <>
              {aapneSpoersmaalListe.length > 1 && (
                <button
                  type="button"
                  onClick={() => setDialog({ kind: 'sporsmaal', valgtId: null })}
                  className="text-xs text-[#4D6B3E] hover:underline font-medium cursor-pointer"
                >
                  ← Alle spørsmål
                </button>
              )}
              <InquiryWorkPanel
                key={valgtSporsmaal.id}
                inquiry={valgtSporsmaal}
                onDone={(utfall) => {
                  if (utfall.svart) {
                    setOppmerksomhetOk(
                      'Svaret er publisert i fadderportalen. En systemmelding med innloggingslenke ligger i e-postkøen (Admin → E-post).'
                    );
                  }
                  etterBehandling(aapneSpoersmaalListe.filter((i) => i.id !== valgtSporsmaal.id).length, 'sporsmaal');
                }}
              />
            </>
          ) : (
            <ul className="divide-y divide-stone-100">
              {aapneSpoersmaalListe.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: 'sporsmaal', valgtId: i.id })}
                    className="w-full py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-stone-50 cursor-pointer"
                  >
                    <span className="text-xs text-stone-600">
                      {`${formatNorwegianDate(i.datoSendt)} · Fadder: ${i.fadderNavn}`}
                    </span>
                    <span className="text-sm text-stone-900">{`«${i.sporsmaal.slice(0, 80)}${i.sporsmaal.length > 80 ? '…' : ''}»`}</span>
                    <span className="text-xs text-stone-500">
                      {i.status === 'venter_koordinator' ? 'Hos koordinator' : 'Under behandling'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TrengerDialog>
      )}

      {dialog?.kind === 'rapport' && (
        <TrengerDialog title={`Rapporter om ${child.fornavn} til godkjenning`} onClose={() => setDialog(null)}>
          {valgtRapport ? (
            <>
              {innsendteRapporterListe.length > 1 && (
                <button
                  type="button"
                  onClick={() => setDialog({ kind: 'rapport', valgtId: null })}
                  className="text-xs text-[#4D6B3E] hover:underline font-medium cursor-pointer"
                >
                  ← Alle rapporter
                </button>
              )}
              <RapportRedigering
                key={valgtRapport.id}
                report={valgtRapport}
                child={child}
                onClose={() => setDialog(null)}
                onPublisert={() =>
                  etterBehandling(innsendteRapporterListe.filter((r) => r.id !== valgtRapport.id).length, 'rapport')
                }
              />
            </>
          ) : (
            <ul className="divide-y divide-stone-100">
              {innsendteRapporterListe.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: 'rapport', valgtId: r.id })}
                    className="w-full py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-stone-50 cursor-pointer"
                  >
                    <span className="text-xs text-stone-600">{formatNorwegianDate(r.dato)}</span>
                    <span className="text-sm text-stone-900">{r.tittelFransk}</span>
                    <span className="text-xs text-stone-500">Venter</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TrengerDialog>
      )}

      {dialog?.kind === 'foto' && (
        <TrengerDialog title={`Bilde av ${child.fornavn} til godkjenning`} onClose={() => setDialog(null)}>
          {child.ventendeFotoBeskrivelseFr && (
            <p className="text-stone-600 italic text-xs">{child.ventendeFotoBeskrivelseFr}</p>
          )}
          {child.ventendeFotoUrl ? (
            <img
              src={fotoSrc}
              alt={`Bilde av ${child.fornavn} som venter på godkjenning`}
              className="w-full max-h-[60vh] object-contain rounded-lg border border-stone-200 bg-stone-50"
            />
          ) : (
            <p className="text-xs text-stone-500">Fant ingen bilde å vise.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!child.ventendeFotoUrl}
              onClick={godkjennFoto}
              className="px-3 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Godkjenn og publiser
            </button>
            <button
              type="button"
              disabled={!child.ventendeFotoUrl}
              onClick={avvisFoto}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Avvis
            </button>
          </div>
        </TrengerDialog>
      )}
    </div>
  );
};
