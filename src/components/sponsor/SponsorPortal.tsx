import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { childIdsOfSponsor, childrenOfSponsor } from '../../utils/sponsorChildren';
import { formatOreAsKr, paymentAmountKr } from '../../utils/paymentLedger';
import { VisualCard } from '../common/VisualCard';
import { maskContactInfo, sponsorSchoolText } from '../../utils/childPrivacy';
import { ChildHistoryTimeline } from '../common/ChildHistoryTimeline';
import {
  Heart,
  BookOpen,
  Calendar,
  CreditCard,
  MessageSquare,
  CheckCircle,
  Clock,
  ShieldCheck,
  Send,
  School,
  Sparkles,
  Info,
  FileText,
  Award,
} from 'lucide-react';

interface SponsorPortalProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
}

export const SponsorPortal: React.FC<SponsorPortalProps> = ({
  activeSection,
  setActiveSection,
}) => {
  const {
    currentSponsor,
    childrenList,
    reports,
    milestones,
    inquiries,
    payments,
    recurringCharges,
    paymentAllocations,
    submitInquiry,
    currentRoleNotifications,
    markNotificationAsRead,
  } = useApp();

  const [newQuestion, setNewQuestion] = useState('');
  const [questionSentToast, setQuestionSentToast] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState('');

  const unreadReportNotif = currentRoleNotifications.find(
    (n) =>
      n.type === 'report_approved' &&
      (!n.recipientId || n.recipientId === currentSponsor?.id) &&
      !n.read &&
      (!n.relatedEntityId || !selectedChildId || n.relatedEntityId === selectedChildId)
  );

  const unreadMilestoneNotif = currentRoleNotifications.find(
    (n) =>
      n.type === 'milestone_logged' &&
      (!n.recipientId || n.recipientId === currentSponsor?.id) &&
      !n.read &&
      (!n.relatedEntityId || !selectedChildId || n.relatedEntityId === selectedChildId)
  );

  const myChildren = childrenOfSponsor(childrenList, currentSponsor);
  const myChildIds = childIdsOfSponsor(currentSponsor).join(',');
  useEffect(() => {
    const ids = myChildIds ? myChildIds.split(',') : [];
    if (!ids.length) {
      setSelectedChildId('');
      return;
    }
    setSelectedChildId((current) => (ids.includes(current) ? current : ids[0]));
  }, [currentSponsor?.id, myChildIds]);

  const child = myChildren.find((c) => c.id === selectedChildId) || myChildren[0];

  // Filter milestones strictly for this child
  const childMilestones = milestones.filter((m) => m.barnId === child?.id);

  // Filter approved reports strictly for this child
  const childReports = reports.filter(
    (r) => r.barnId === child?.id && r.status === 'godkjent'
  );

  // Filter inquiries from this sponsor
  const sponsorInquiries = inquiries.filter((inq) => inq.fadderId === currentSponsor?.id);

  const sponsorPayments = payments.filter((p) => p.fadderId === currentSponsor?.id);
  const sponsorCharges = useMemo(
    () =>
      recurringCharges
        .filter((c) => c.sponsorId === currentSponsor?.id)
        .sort((a, b) => b.periode.localeCompare(a.periode)),
    [recurringCharges, currentSponsor?.id]
  );
  const myAllocations = useMemo(
    () => paymentAllocations.filter((a) => a.sponsorId === currentSponsor?.id),
    [paymentAllocations, currentSponsor?.id]
  );

  const vippsStatusLabel = (() => {
    const st = currentSponsor?.vippsAgreementStatus;
    if (st === 'ACTIVE') return { text: 'Vipps-avtale aktiv', tone: 'emerald' as const };
    if (st === 'PENDING') return { text: 'Venter på godkjenning i Vipps', tone: 'amber' as const };
    if (st === 'STOPPED' || st === 'EXPIRED') return { text: 'Avtale avsluttet', tone: 'stone' as const };
    return { text: 'Avtale aktiv', tone: 'emerald' as const };
  })();

  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !currentSponsor || !child) return;
    submitInquiry(currentSponsor.id, child.id, newQuestion.trim());
    setNewQuestion('');
    setQuestionSentToast(true);
    setTimeout(() => setQuestionSentToast(false), 4000);
  };

  const getInquiryStatusBadge = (status: string) => {
    switch (status) {
      case 'besvart':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Besvart</span>
          </span>
        );
      case 'venter_koordinator':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-[#4D6B3E] font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Venter på svar fra koordinator i Kongo</span>
          </span>
        );
      case 'under_behandling':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Under behandling</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs text-stone-600 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Mottatt av Kristiansand-kontoret</span>
          </span>
        );
    }
  };

  if (!child) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#A3B18A]/20 text-[#4D6B3E] flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900">Venter på tildeling av fadderbarn</h2>
        <p className="text-sm text-stone-600 max-w-md mx-auto">
          Hei {currentSponsor?.navn}! Din fadderavtale er aktiv ({currentSponsor?.maanedsbelop} kr/mnd). Administrator i Kristiansand kobler ett eller flere barn til avtalen. Du ser bare barna du er tildelt.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
      {/* 1. Header ribbon with sponsor info */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>Innlogget fadder: <strong className="text-stone-800">{currentSponsor?.navn}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Fast bidrag: <strong className="text-stone-800 font-mono">{currentSponsor?.maanedsbelop} kr/mnd</strong> ({currentSponsor?.betalingsmetode.toUpperCase()})</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            Fadderoppfølging for {child.fornavn}
          </h1>
          {myChildren.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {myChildren.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChildId(ch.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer border ${
                    ch.id === child.id
                      ? 'bg-[#4D6B3E] text-white border-[#4D6B3E]'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                  }`}
                >
                  {ch.fornavn}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Centralized Notification Banner when new reports are available */}
      {unreadReportNotif && (
        <div className="bg-[#F6F4ED] border border-[#A3B18A] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#A3B18A]/20 flex items-center justify-center text-[#4D6B3E] shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#4D6B3E]">Ny rapport publisert</span>
                <span className="text-stone-400">·</span>
                <span className="text-stone-500 font-mono">{unreadReportNotif.timestamp}</span>
              </div>
              <h3 className="text-sm font-serif font-bold text-[#3C3C3C] mt-0.5">{unreadReportNotif.title}</h3>
              <p className="text-stone-600 mt-1 leading-relaxed font-sans">{unreadReportNotif.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                markNotificationAsRead(unreadReportNotif.id);
                setActiveSection('rapporter');
              }}
              className="px-4 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>Les rapporten nå</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              onClick={() => markNotificationAsRead(unreadReportNotif.id)}
              className="px-2.5 py-2 text-stone-500 hover:text-stone-800 rounded-lg cursor-pointer"
            >
              Lukk
            </button>
          </div>
        </div>
      )}

      {/* Centralized Notification Banner when a new milestone event is logged by coordinator */}
      {unreadMilestoneNotif && (
        <div className="bg-[#F6F4ED] border border-[#A3B18A] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#A3B18A]/20 flex items-center justify-center text-[#4D6B3E] shrink-0 mt-0.5">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#4D6B3E]">Ny milepæl for {child.fornavn}</span>
                <span className="text-stone-400">·</span>
                <span className="text-stone-500 font-mono">{unreadMilestoneNotif.timestamp}</span>
              </div>
              <h3 className="text-sm font-serif font-bold text-[#3C3C3C] mt-0.5">{unreadMilestoneNotif.title}</h3>
              <p className="text-stone-600 mt-1 leading-relaxed font-sans">{unreadMilestoneNotif.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                markNotificationAsRead(unreadMilestoneNotif.id);
                setActiveSection('tidslinje');
              }}
              className="px-4 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>Se i tidslinjen nå</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              onClick={() => markNotificationAsRead(unreadMilestoneNotif.id)}
              className="px-2.5 py-2 text-stone-500 hover:text-stone-800 rounded-lg cursor-pointer"
            >
              Lukk
            </button>
          </div>
        </div>
      )}

      {/* 2. TAB: BARNETS PROFIL */}
      {(activeSection === 'barn' || activeSection === 'home') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <VisualCard
              type="child"
              title={`${child.fornavn} · ${new Date().getFullYear() - child.fodselsaar} år`}
              subtitle={sponsorSchoolText(child)}
              aspectRatio="4/3"
              customImageUrl={child.publisertFotoUrl}
            />

            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="text-base font-serif font-bold text-stone-900">Nøkkelopplysninger</h3>
              <dl className="divide-y divide-stone-100 text-xs">
                <div className="py-2 flex justify-between">
                  <dt className="text-stone-500">Intern referanse</dt>
                  <dd className="font-mono font-semibold text-stone-800">{child.internKode}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-stone-500">Klassetrinn</dt>
                  <dd className="font-semibold text-stone-800">{child.klassetrinn}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-stone-500">Skolested</dt>
                  <dd className="text-right text-stone-800 max-w-[200px]">{sponsorSchoolText(child)}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-stone-500">Fødselsår</dt>
                  <dd className="text-stone-800">{child.fodselsaar} ({new Date().getFullYear() - child.fodselsaar} år)</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-stone-500">Interesser</dt>
                  <dd className="text-stone-800">{child.interesser.join(', ')}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-stone-500">Oppfølgingsstart</dt>
                  <dd className="text-stone-800">{child.opprettetDato}</dd>
                </div>
              </dl>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Personvern og etisk vern</p>
                <p className="mt-0.5 leading-relaxed text-emerald-800">
                  Dette er et lukket område kun tilgjengelig for deg som tildelt fadder. Barnets opplysninger deles aldri med tredjeparter eller på åpne nettsider.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-7 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Bakgrunn & Hverdag</span>
              <h3 className="text-xl font-serif font-bold text-stone-900">Om {child.fornavn}s skolegang</h3>
              <p className="text-sm text-stone-700 leading-relaxed font-sans">
                {child.bakgrunnskontekst}
              </p>
              <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-700 space-y-1">
                <p className="font-semibold text-stone-900">Hva ditt månedlige bidrag dekker:</p>
                <p className="leading-relaxed">{child.behovSammendrag}</p>
              </div>
            </div>

            <div className="bg-white p-7 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-bold text-stone-900">Siste godkjente rapport</h3>
                <button
                  onClick={() => setActiveSection('rapporter')}
                  className="text-xs text-[#4D6B3E] hover:text-[#3B522F] font-medium cursor-pointer"
                >
                  Se alle ({childReports.length}) →
                </button>
              </div>

              {childReports.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Dato: {childReports[0].dato}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium">Godkjent av stiftelsen</span>
                  </div>
                  <h4 className="text-base font-serif font-bold text-stone-900">{maskContactInfo(childReports[0].tittelNorsk)}</h4>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans">{maskContactInfo(childReports[0].innholdNorsk)}</p>
                  <div className="pt-2 flex flex-wrap gap-4 text-xs text-stone-600 border-t border-stone-100">
                    <div>
                      <span className="font-semibold text-stone-800">Skoleprestasjon: </span>
                      <span>{childReports[0].skoleprestasjon}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-800">Oppmøte: </span>
                      <span className="font-mono">{childReports[0].oppmoteProsent}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500">Ingen rapporter publisert ennå.</p>
              )}
            </div>

            {/* Milestone & History Preview Card */}
            <div className="bg-white p-7 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-serif font-bold text-stone-900">Historikk & Milepæler</h3>
                  <span className="px-2 py-0.5 bg-[#4D6B3E]/10 text-[#4D6B3E] rounded-md text-xs font-semibold">
                    {childMilestones.length} hendelser
                  </span>
                </div>
                <button
                  onClick={() => setActiveSection('tidslinje')}
                  className="text-xs text-[#4D6B3E] hover:text-[#3B522F] font-medium cursor-pointer"
                >
                  Åpne full tidslinje →
                </button>
              </div>

              {childMilestones.length > 0 ? (
                <div className="p-4 bg-[#F6F4ED] rounded-xl border border-[#A3B18A]/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-mono text-stone-600">
                      <Calendar className="w-3.5 h-3.5 text-[#4D6B3E]" />
                      <span>{childMilestones[0].dato}</span>
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 bg-white border border-[#A3B18A]/60 rounded-md text-[#4D6B3E]">
                      Siste loggførte hendelse
                    </span>
                  </div>
                  <h4 className="text-sm font-serif font-bold text-stone-900">
                    {maskContactInfo(childMilestones[0].tittelNorsk)}
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {maskContactInfo(childMilestones[0].beskrivelseNorsk)}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-200/60">
                    <span>Loggført av feltkoordinator</span>
                    <button
                      onClick={() => setActiveSection('tidslinje')}
                      className="text-[#4D6B3E] font-semibold hover:underline cursor-pointer"
                    >
                      Les hele hendelsesforløpet ({childMilestones.length})
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500">
                  Feltkoordinator i Kongo logger fortløpende milepæler underveis i skoleåret.
                </p>
              )}
            </div>

            {/* Quick action: still spørsmål */}
            <div className="p-6 bg-stone-100 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-stone-900">Har du spørsmål om {child.fornavn}?</h4>
                <p className="text-xs text-stone-600">Send spørsmålet direkte til stiftelsen via portalen.</p>
              </div>
              <button
                onClick={() => setActiveSection('sporsmaal')}
                className="px-4 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
              >
                Still et spørsmål
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TIDSLINJE & MILEPÆLER */}
      {activeSection === 'tidslinje' && (
        <div className="space-y-6">
          <div className="bg-white p-7 md:p-8 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4D6B3E] mb-1">
                <span>Kronologisk Utviklingsforløp</span>
                <span aria-hidden="true">·</span>
                <span>Feltobservasjoner fra Kongo</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                Milepæler & Historikk for {child.fornavn} ({child.internKode})
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
                Her ser du alle loggførte begivenheter i barnets hverdag og skolegang registrert av stiftelsens lokale koordinator på bakken i Kongo. Hver milepæl dokumenterer konkrete fremskritt som ditt fadderbidrag muliggjør.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 bg-[#F6F4ED] p-4 rounded-xl border border-[#A3B18A]/50 text-xs text-[#3C3C3C]">
              <Award className="w-8 h-8 text-[#4D6B3E] shrink-0" />
              <div>
                <span className="block font-bold text-sm text-[#3C3C3C]">{childMilestones.length} registrerte milepæler</span>
                <span className="text-[11px] text-stone-500">Skole, helse & personlig utvikling</span>
              </div>
            </div>
          </div>

          {/* Render ChildHistoryTimeline component */}
          <ChildHistoryTimeline
            // Kontaktinfo i milepæltekster sladdes før fadderen ser dem.
            milestones={childMilestones.map((m) => ({
              ...m,
              tittelNorsk: maskContactInfo(m.tittelNorsk),
              beskrivelseNorsk: maskContactInfo(m.beskrivelseNorsk),
              tittelFransk: maskContactInfo(m.tittelFransk),
              beskrivelseFransk: maskContactInfo(m.beskrivelseFransk),
              merknad: m.merknad ? maskContactInfo(m.merknad) : m.merknad,
            }))}
            childName={child.fornavn}
            childCode={child.internKode}
            isCoordinatorView={false}
          />
        </div>
      )}

      {/* 3. TAB: RAPPORTER */}
      {activeSection === 'rapporter' && (
        <div className="space-y-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-serif font-bold text-stone-900">Rapporter og skoleoppdateringer</h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              Her finner du alle rapporter innsendt av koordinator i Kongo, kontrollert for etterrettelighet og godkjent av administrator i Norge.
            </p>
          </div>

          <div className="space-y-4">
            {childReports.map((report) => (
              <article
                key={report.id}
                className="bg-white p-7 rounded-xl border border-stone-200 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>Dato: <strong className="text-stone-700">{report.dato}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Koordinator: {report.koordinatorNavn}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Godkjent av stiftelsen {report.godkjentDato}</span>
                  </div>
                </div>

                <h3 className="text-lg font-serif font-bold text-stone-900">{maskContactInfo(report.tittelNorsk)}</h3>
                <p className="text-sm text-stone-700 leading-relaxed font-sans">{maskContactInfo(report.innholdNorsk)}</p>

                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-600">
                  <div className="flex items-center gap-4">
                    <span>
                      <strong className="text-stone-800">Prestasjon:</strong> {report.skoleprestasjon}
                    </span>
                    <span>
                      <strong className="text-stone-800">Oppmøte:</strong>{' '}
                      <span className="font-mono">{report.oppmoteProsent}%</span>
                    </span>
                  </div>
                  <span className="text-stone-400 italic">Oversatt fra fransk original</span>
                </div>
              </article>
            ))}

            {childReports.length === 0 && (
              <div className="p-8 bg-white rounded-xl border border-stone-200 text-center text-xs text-stone-500">
                Det foreligger foreløpig ingen godkjente rapporter for dette barnet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TAB: SPØRSMÅL & SVAR */}
      {activeSection === 'sporsmaal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="text-lg font-serif font-bold text-stone-900">Send et spørsmål til stiftelsen</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                Lurer du på noe rundt skolegang, skolemateriell eller hverdagen til {child.fornavn}? Skriv spørsmålet ditt her. Spørsmålet behandles av administrator i Norge og avklares med koordinator i Kongo ved behov.
              </p>

              {questionSentToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Spørsmålet ditt er sendt og lagt i saksbehandlingskøen hos administrator!</span>
                </div>
              )}

              <form onSubmit={handleSendQuestion} className="space-y-3">
                <textarea
                  rows={4}
                  required
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder={`Skriv ditt spørsmål angående ${child.fornavn}...`}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E] resize-none"
                />

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-stone-500">Fadderen kommuniserer aldri direkte med barnet.</p>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send spørsmål</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="p-4 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
              <p className="font-semibold text-stone-900 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-stone-500" />
                <span>Saksgang for spørsmål:</span>
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-stone-600 pl-1">
                <li>Du sender inn et spørsmål i portalen.</li>
                <li>Administrator vurderer og svarer direkte, eller oversetter og videresender til koordinator i Kongo.</li>
                <li>Koordinator undersøker og svarer på fransk.</li>
                <li>Administrator kvalitetssikrer svaret før det publiseres her.</li>
              </ol>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-lg font-serif font-bold text-stone-900">Dine tidligere spørsmål</h3>

            {sponsorInquiries.map((inq) => (
              <div
                key={inq.id}
                className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">Sendt: {inq.datoSendt}</span>
                  {getInquiryStatusBadge(inq.status)}
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="text-xs font-semibold text-stone-500 mb-1">Ditt spørsmål:</p>
                  <p className="text-xs sm:text-sm text-stone-800 font-sans">{inq.sporsmaal}</p>
                </div>

                {inq.svarTekst ? (
                  <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
                      <span>Svar fra Betyna stiftelsen</span>
                      <span>{inq.svarDato}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-950 font-sans leading-relaxed">{maskContactInfo(inq.svarTekst)}</p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    Spørsmålet er under utredning. Du vil se svaret her så snart administrator har ferdigbehandlet det.
                  </p>
                )}
              </div>
            ))}

            {sponsorInquiries.length === 0 && (
              <div className="p-8 bg-white rounded-xl border border-stone-200 text-center text-xs text-stone-500">
                Du har ingen registrerte henvendelser ennå.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB: BETALINGER */}
      {activeSection === 'betalinger' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-stone-500 font-medium">Fadderavtale</span>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                {currentSponsor?.maanedsbelop ?? 350} kr per måned ({(currentSponsor?.betalingsmetode ?? 'vipps').toUpperCase()})
              </h3>
              <p className="text-xs text-stone-600">
                Aktiv avtale siden {currentSponsor?.startDato ?? '2025-09-01'}. Ingen bindingstid.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  vippsStatusLabel.tone === 'emerald'
                    ? 'bg-emerald-100 text-emerald-800'
                    : vippsStatusLabel.tone === 'amber'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-stone-100 text-stone-700'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{vippsStatusLabel.text}</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-stone-200">
              <h3 className="text-base font-serif font-bold text-stone-900">Månedlige trekk</h3>
              <p className="text-xs text-stone-500 mt-0.5">Belastninger og fordeling på dine barn og felles buffer</p>
            </div>
            <div className="divide-y divide-stone-100">
              {sponsorCharges.length === 0 && sponsorPayments.length === 0 && (
                <p className="p-6 text-xs text-stone-500 text-center">Ingen trekk registrert ennå.</p>
              )}
              {sponsorCharges.map((charge) => {
                const pay = sponsorPayments.find((p) => p.chargeOrderId === charge.id);
                const allocs = pay ? myAllocations.filter((a) => a.paymentId === pay.id) : [];
                const charged = charge.status === 'CHARGED';
                const netOre = pay?.amountOre ?? charge.amountOre;
                const refund = pay?.refundertOre ?? 0;
                const displayOre = charged ? Math.max(0, netOre - refund) : netOre;
                return (
                  <div key={charge.id} className="p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-sm text-stone-900">{charge.periode}</p>
                        <p className="text-[11px] text-stone-500">Forfall {charge.due}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold tabular-nums">{formatOreAsKr(displayOre)} kr</p>
                        <p className="text-[11px] text-stone-500">
                          {charged ? 'Innbetalt' : pay?.status === 'forventet' ? 'Kommende trekk' : charge.status}
                        </p>
                      </div>
                    </div>
                    {allocs.length > 0 && (
                      <ul className="text-xs text-stone-600 space-y-1 pl-3 border-l-2 border-stone-200">
                        {allocs.map((a) => (
                          <li key={a.id} className="flex justify-between gap-4 max-w-sm">
                            <span>
                              {a.maal === 'buffer'
                                ? 'Felles buffer'
                                : myChildren.find((c) => c.id === a.childId)?.fornavn ?? 'Barn'}
                            </span>
                            <span className="font-mono tabular-nums">{formatOreAsKr(a.amountOre)} kr</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              {sponsorCharges.length === 0 &&
                sponsorPayments.map((p) => (
                  <div key={p.id} className="p-6 flex justify-between text-xs">
                    <span className="font-mono">{p.dato}</span>
                    <span className="font-mono font-semibold">{paymentAmountKr(p).toLocaleString('no-NO')} kr</span>
                    <span className="text-stone-500">{p.status}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
