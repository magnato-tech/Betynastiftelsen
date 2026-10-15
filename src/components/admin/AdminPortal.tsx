import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Report, Child, Sponsor, Inquiry, PaymentRecord, Campaign } from '../../types';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Languages,
  AlertCircle,
  Clock,
  Sparkles,
  Edit3,
  Layers,
  ArrowRight,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { CmsEditor } from './CmsEditor';
import { TestimonialEditor } from './TestimonialEditor';
import { AdminHelpGuide } from './AdminHelpGuide';
import { AdminNewsletterPanel } from './AdminNewsletterPanel';
import { filterSponsorsLastDays } from '../../utils/sponsorMetrics';
import { isoDaysAgo } from '../../utils/dateFormat';
import { factsWaitingForStory } from '../../utils/fieldFacts';

interface AdminPortalProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  activeSection,
  setActiveSection,
}) => {
  const {
    childrenList,
    sponsors,
    reports,
    fieldFacts,
    inquiries,
    payments,
    campaigns,
    stories,
    auditLogs,
    approveReport,
    rejectReport,
    approveChildPhoto,
    rejectChildPhoto,
    assignSponsorToChild,
    addSponsor,
    endSponsorship,
    answerInquiry,
    forwardInquiryToCoordinator,
    reconcilePayment,
    setRole,
  } = useApp();

  // Review & Translation State
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [editTitleNo, setEditTitleNo] = useState('');
  const [editContentNo, setEditContentNo] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Inquiry Answer State
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [forwardNoteFr, setForwardNoteFr] = useState('');
  const [answerEmailQueued, setAnswerEmailQueued] = useState(false);

  // Child Allocation State
  const [selectedChildForAssign, setSelectedChildForAssign] = useState<string>('');
  const [selectedSponsorForAssign, setSelectedSponsorForAssign] = useState<string>('');
  const [sponsorNavn, setSponsorNavn] = useState('');
  const [sponsorEpost, setSponsorEpost] = useState('');
  const [sponsorTelefon, setSponsorTelefon] = useState('');
  const [sponsorPoststed, setSponsorPoststed] = useState('');
  const [sponsorBelop, setSponsorBelop] = useState<250 | 350>(250);
  const [sponsorMetode, setSponsorMetode] = useState<'vipps' | 'bank'>('vipps');
  const [sponsorSavedName, setSponsorSavedName] = useState<string | null>(null);

  // Active review report
  const selectedReport = reports.find((r) => r.id === selectedReportId);

  const startReviewReport = (rep: Report) => {
    setSelectedReportId(rep.id);
    setEditTitleNo(rep.tittelNorsk);
    setEditContentNo(rep.innholdNorsk);
    setIsRejecting(false);
  };

  const handleApproveReport = (id: string) => {
    approveReport(id, editTitleNo, editContentNo);
    setSelectedReportId(null);
  };

  const handleRejectReport = (id: string) => {
    if (!rejectReason.trim()) return;
    rejectReport(id, rejectReason.trim());
    setSelectedReportId(null);
    setRejectReason('');
    setIsRejecting(false);
  };

  const handleAnswerInquiry = (id: string) => {
    if (!answerDraft.trim()) return;
    answerInquiry(id, answerDraft.trim());
    setSelectedInquiryId(null);
    setAnswerDraft('');
    setAnswerEmailQueued(true);
  };

  const handleForwardInquiry = (id: string) => {
    forwardInquiryToCoordinator(id, forwardNoteFr || undefined);
    setSelectedInquiryId(null);
    setForwardNoteFr('');
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildForAssign || !selectedSponsorForAssign) return;
    assignSponsorToChild(selectedChildForAssign, selectedSponsorForAssign);
    setSelectedChildForAssign('');
    setSelectedSponsorForAssign('');
  };

  const handleAddSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorNavn.trim() || !sponsorEpost.trim()) return;
    const newId = addSponsor({
      navn: sponsorNavn.trim(),
      epost: sponsorEpost.trim(),
      telefon: sponsorTelefon.trim(),
      poststed: sponsorPoststed.trim(),
      maanedsbelop: sponsorBelop,
      betalingsmetode: sponsorMetode,
    });
    setSponsorSavedName(sponsorNavn.trim());
    setSelectedSponsorForAssign(newId);
    setSponsorNavn('');
    setSponsorEpost('');
    setSponsorTelefon('');
    setSponsorPoststed('');
    setSponsorBelop(250);
    setSponsorMetode('vipps');
  };

  // Helper metrics
  const pendingReports = reports.filter((r) => r.status === 'innsendt');
  const pendingPhotos = childrenList.filter((c) => c.ventendeFotoStatus === 'innsendt' && c.ventendeFotoUrl);
  const pendingInquiries = inquiries.filter((inq) => inq.status !== 'besvart' && inq.status !== 'lukket');
  const unassignedChildren = childrenList.filter((c) => !c.tildeltFadderId && c.status === 'aktiv');
  const unassignedSponsors = sponsors.filter((s) => !s.tildeltBarnId);
  const weekCutoffIso = isoDaysAgo(7);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoKey = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, '0')}-${String(monthAgo.getDate()).padStart(2, '0')}`;
  const newSponsorsLastWeek = filterSponsorsLastDays(sponsors, 7);
  const newSponsorsLastMonth = sponsors
    .filter((s) => s.startDato >= monthAgoKey)
    .sort((a, b) => b.startDato.localeCompare(a.startDato));
  const sponsorsSorted = [...sponsors].sort((a, b) => b.startDato.localeCompare(a.startDato));

  const totalMonthlyPledged = sponsors
    .filter((s) => s.betalingsstatus === 'aktiv')
    .reduce((sum, s) => sum + s.maanedsbelop, 0);

  const totalCampaignsRaised = campaigns.reduce((sum, c) => sum + c.innsamletBelop, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* 1. Header ribbon */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 md:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-stone-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#A3B18A] font-semibold uppercase tracking-wider">
            <span>Betyna Stiftelsen — Administrasjon & CMS</span>
            <span aria-hidden="true">·</span>
            <span>Oslo, Norge</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">
            Kontrollpanel & Godkjenningssenter
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl font-sans leading-relaxed">
            Styrende prinsipp: Koordinator registrerer opplysninger i Kongo. Administrator i Norge kontrollerer, oversetter og godkjenner før innhold når fadderne.
          </p>
        </div>

        {/* Quick status indicators */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="p-3 bg-stone-800/90 rounded-lg border border-stone-700 space-y-0.5">
            <span className="text-stone-400">Rapporter til godkjenning:</span>
            <div className="text-xl font-bold font-mono text-[#A3B18A]">{pendingReports.length}</div>
          </div>
          <div className="p-3 bg-stone-800/90 rounded-lg border border-stone-700 space-y-0.5">
            <span className="text-stone-400">Bilder til godkjenning:</span>
            <div className="text-xl font-bold font-mono text-[#A3B18A]">{pendingPhotos.length}</div>
          </div>
          <div className="p-3 bg-stone-800/90 rounded-lg border border-stone-700 space-y-0.5">
            <span className="text-stone-400">Åpne spørsmål:</span>
            <div className="text-xl font-bold font-mono text-[#A3B18A]">{pendingInquiries.length}</div>
          </div>
          <div className="p-3 bg-stone-800/90 rounded-lg border border-stone-700 space-y-0.5">
            <span className="text-stone-400">Månedlige fadderbidrag:</span>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">{totalMonthlyPledged} kr</div>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection('tildeling')}
            className="p-3 bg-stone-800/90 rounded-lg border border-stone-700 space-y-0.5 text-left hover:bg-stone-800 transition-colors cursor-pointer"
            title="Gå til Barn & Faddere"
          >
            <span className="text-stone-400">Nye faddere (7 dager):</span>
            <div className="text-xl font-bold font-mono text-[#A3B18A] tabular-nums">{newSponsorsLastWeek.length}</div>
          </button>
        </div>
      </div>

      {/* 3. TAB: GODKJENNINGSKØ & TOSPRAKLIG REVISJON */}
      {(activeSection === 'godkjenning' || activeSection === 'home') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Innsendte feltrapporter til godkjenning
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Kontroller fransk original mot norsk oversettelse, gjør eventuelle redaksjonelle justeringer og godkjenn.
              </p>
            </div>
          </div>

          {factsWaitingForStory(fieldFacts).length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
              <h3 className="text-lg font-serif font-bold text-stone-900">
                Skriv historien ({factsWaitingForStory(fieldFacts).length})
              </h3>
              <p className="text-xs text-stone-600">
                Koordinator har sendt fakta. Eldst først. Historie-skriving og forhåndsvisning av faddersiden kommer i samme sprint.
              </p>
              <ul className="divide-y divide-stone-100 border border-stone-200 rounded-lg">
                {factsWaitingForStory(fieldFacts).map((f) => (
                  <li key={f.id} className="px-4 py-3 text-xs space-y-1">
                    <p className="font-semibold text-stone-900">
                      {f.fornavn} · {f.klassetrinn} · {f.dato.split('-').reverse().join('.')}
                    </p>
                    <p className="text-stone-500">{f.skoleNavn}</p>
                    <p className="text-stone-700">{f.trivsel}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pendingPhotos.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200/80 p-6 md:p-8 shadow-xs space-y-4">
              <h3 className="text-lg font-serif font-bold text-stone-900">
                Barnebilde til godkjenning ({pendingPhotos.length})
              </h3>
              <p className="text-xs text-stone-600">
                Koordinator har sendt foto som må godkjennes før det vises i fadderportalen.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingPhotos.map((ch) => {
                  const src =
                    ch.ventendeFotoUrl?.startsWith('http') ||
                    ch.ventendeFotoUrl?.startsWith('data:') ||
                    ch.ventendeFotoUrl?.startsWith('/')
                      ? ch.ventendeFotoUrl
                      : `/${ch.ventendeFotoUrl}`;
                  return (
                    <div key={ch.id} className="border border-stone-200 rounded-xl p-4 space-y-3 text-xs">
                      <p className="font-semibold text-stone-900">
                        {ch.fornavn} ({ch.internKode})
                      </p>
                      {ch.ventendeFotoBeskrivelseFr && (
                        <p className="text-stone-600 italic">{ch.ventendeFotoBeskrivelseFr}</p>
                      )}
                      <img src={src} alt={ch.fornavn} className="w-full max-h-56 object-cover rounded-lg border border-stone-200" />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => approveChildPhoto(ch.id)}
                          className="px-3 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded-lg font-medium cursor-pointer"
                        >
                          Godkjenn og publiser
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = window.prompt('Begrunnelse til koordinator (fransk/norsk):');
                            if (reason?.trim()) rejectChildPhoto(ch.id, reason.trim());
                          }}
                          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-medium cursor-pointer"
                        >
                          Avvis
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal / Side-by-side Review Panel when an item is selected */}
          {selectedReport && (
            <div className="bg-white border-2 border-[#4D6B3E]/60 rounded-2xl p-6 md:p-8 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div className="space-y-0.5">
                  <span className="text-xs uppercase tracking-wider text-[#4D6B3E] font-semibold">
                    Tospråklig kvalitetskontroll & revisjon
                  </span>
                  <h3 className="text-xl font-serif font-bold text-stone-900">
                    Rapport for {selectedReport.barnNavn} · Innsendt av {selectedReport.koordinatorNavn}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReportId(null)}
                  className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Lukk revisjon
                </button>
              </div>

              {/* Side by side columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: French Original */}
                <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                    <span className="flex items-center gap-1.5 text-[#4D6B3E]">
                      <Languages className="w-3.5 h-3.5" />
                      <span>Originaltekst fra Kongo (Français)</span>
                    </span>
                    <span>Oppmøte: {selectedReport.oppmoteProsent}%</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Titre original</h4>
                    <p className="text-sm font-semibold text-stone-900 mt-0.5">{selectedReport.tittelFransk}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Contenu du rapport</h4>
                    <p className="text-xs sm:text-sm text-stone-800 mt-1 leading-relaxed font-sans whitespace-pre-line">
                      {selectedReport.innholdFransk}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-200 text-xs text-stone-500">
                    <strong>Prestasjon i felt:</strong> {selectedReport.skoleprestasjon}
                  </div>
                </div>

                {/* Right: Norwegian Translated & Editable */}
                <div className="p-5 bg-[#A3B18A]/10 rounded-xl border border-[#A3B18A]/40 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#4D6B3E] font-medium">
                    <span className="flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Norsk versjon til fadderportalen (Redigerbar)</span>
                    </span>
                    <span className="text-xs text-stone-500">Synlig for fadder etter godkjenning</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Norsk tittel *</label>
                    <input
                      type="text"
                      value={editTitleNo}
                      onChange={(e) => setEditTitleNo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Norsk rapportinnhold *</label>
                    <textarea
                      rows={6}
                      value={editContentNo}
                      onChange={(e) => setEditContentNo(e.target.value)}
                      className="w-full p-3 bg-white border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:border-[#4D6B3E] resize-none font-sans leading-relaxed"
                    />
                  </div>

                  <p className="text-[11px] text-stone-500 italic">
                    Tips: Sikre verdig språk og kontroller at ingen sensitive helseopplysninger tas med.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              {isRejecting ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                  <label className="block text-xs font-semibold text-rose-900">
                    Begrunnelse for retur til koordinator i Kongo:
                  </label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="F.eks. Ber om presisering av dato for eksamen eller mer utfyllende beskrivelse av skolemateriell..."
                    className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs text-stone-800"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectReport(selectedReport.id)}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-medium rounded-lg text-xs cursor-pointer"
                    >
                      Bekreft retur med kommentar
                    </button>
                    <button
                      onClick={() => setIsRejecting(false)}
                      className="px-3 py-2 bg-stone-200 text-stone-700 font-medium rounded-lg text-xs cursor-pointer"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-stone-200">
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="px-4 py-2.5 text-xs text-rose-700 hover:text-rose-800 font-medium border border-rose-300 rounded-lg cursor-pointer hover:bg-rose-50 transition-colors"
                  >
                    Be koordinator om endring / avvis
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedReportId(null)}
                      className="px-4 py-2.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={() => handleApproveReport(selectedReport.id)}
                      className="px-6 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Godkjenn & Publiser til fadderportal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List of pending reports */}
          <div className="space-y-4">
            {pendingReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Clock className="w-3.5 h-3.5 text-[#4D6B3E]" />
                    <span>Innsendt: {rep.dato}</span>
                    <span aria-hidden="true">·</span>
                    <span>Elev: <strong className="text-stone-800">{rep.barnNavn}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Fra: {rep.koordinatorNavn}</span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-stone-900">{rep.tittelFransk}</h3>
                  <p className="text-xs text-stone-600 line-clamp-2">{rep.innholdFransk}</p>
                </div>

                <button
                  onClick={() => startReviewReport(rep)}
                  className="px-5 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>Start revisjon & oversettelse</span>
                </button>
              </div>
            ))}

            {pendingReports.length === 0 && (
              <div className="p-8 bg-white rounded-xl border border-stone-200 text-center text-xs text-stone-500 space-y-1">
                <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-stone-800">Godkjenningskøen er tom!</p>
                <p>Alle feltrapporter fra Kongo er gjennomgått og behandlet.</p>
              </div>
            )}
          </div>

          {/* Already Approved Reports list */}
          <div className="pt-6 border-t border-stone-200 space-y-3">
            <h3 className="text-sm font-serif font-bold text-stone-900">Nylig godkjente rapporter</h3>
            <div className="space-y-2">
              {reports
                .filter((r) => r.status === 'godkjent')
                .slice(0, 4)
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-4 bg-white rounded-lg border border-stone-200 text-xs flex items-center justify-between gap-4"
                  >
                    <div>
                      <strong className="text-stone-800">{r.barnNavn}</strong>: {r.tittelNorsk} ({r.dato})
                    </div>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Publisert</span>
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: BARN & FADDERE (TILDELING) */}
      {activeSection === 'tildeling' && (
        <div className="space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Ny fadder</span>
              <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Legg til fadder</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Registrer personen her. Barnet kobles etterpå, og velges ikke automatisk.
              </p>
            </div>

            {sponsorSavedName && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {sponsorSavedName} er lagt til. Velg et barn under og opprett fadderkoblingen.
              </p>
            )}

            <form onSubmit={handleAddSponsor} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Navn</label>
                <input
                  value={sponsorNavn}
                  onChange={(e) => setSponsorNavn(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">E-post</label>
                <input
                  type="email"
                  value={sponsorEpost}
                  onChange={(e) => setSponsorEpost(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Telefon</label>
                <input
                  value={sponsorTelefon}
                  onChange={(e) => setSponsorTelefon(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Poststed</label>
                <input
                  value={sponsorPoststed}
                  onChange={(e) => setSponsorPoststed(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Månedsbeløp</label>
                <select
                  value={sponsorBelop}
                  onChange={(e) => setSponsorBelop(Number(e.target.value) as 250 | 350)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800"
                >
                  <option value={250}>250 kr</option>
                  <option value={350}>350 kr</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Betaling</label>
                <select
                  value={sponsorMetode}
                  onChange={(e) => setSponsorMetode(e.target.value as 'vipps' | 'bank')}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800"
                >
                  <option value="vipps">Vipps</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded-lg text-xs font-medium cursor-pointer inline-flex items-center gap-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Legg til fadder
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Siste 7 dager</span>
              <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Nye faddere denne uken</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Registrert fra {weekCutoffIso.split('-').reverse().join('.')} og frem til i dag ({newSponsorsLastWeek.length} stk.).
              </p>
            </div>

            {newSponsorsLastWeek.length === 0 ? (
              <p className="text-xs text-stone-500">Ingen nye faddere de siste 7 dagene.</p>
            ) : (
              <ul className="divide-y divide-stone-100 border border-stone-200 rounded-lg">
                {newSponsorsLastWeek.map((sp) => {
                  const child = childrenList.find((c) => c.id === sp.tildeltBarnId);
                  return (
                    <li key={sp.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                      <div>
                        <p className="font-semibold text-stone-900">{sp.navn}</p>
                        <p className="text-stone-500">
                          {sp.poststed || 'Poststed ikke oppgitt'} · {sp.epost}
                          {sp.registrertKilde ? ` · ${sp.registrertKilde}` : ''}
                        </p>
                      </div>
                      <div className="text-stone-700 sm:text-right">
                        <p>{sp.startDato.split('-').reverse().join('.')} · {sp.maanedsbelop} kr/mnd</p>
                        <p className="text-stone-500">{child ? `Koblet til ${child.fornavn}` : 'Venter på barn'}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">Siste 30 dager</span>
              <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Nye faddere siste måned</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Registrert fra {monthAgo.toLocaleDateString('nb-NO')} og frem til i dag.
              </p>
            </div>

            {newSponsorsLastMonth.length === 0 ? (
              <p className="text-xs text-stone-500">Ingen nye faddere de siste 30 dagene.</p>
            ) : (
              <ul className="divide-y divide-stone-100 border border-stone-200 rounded-lg max-h-48 overflow-y-auto">
                {newSponsorsLastMonth.map((sp) => {
                  const child = childrenList.find((c) => c.id === sp.tildeltBarnId);
                  return (
                    <li key={sp.id} className="px-4 py-2 flex justify-between gap-2 text-xs">
                      <span className="font-medium text-stone-800">{sp.navn}</span>
                      <span className="text-stone-500 shrink-0">
                        {sp.startDato.split('-').reverse().join('.')} · {child ? child.fornavn : 'Venter'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4 lg:col-span-2">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Full oversikt</span>
              <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Alle faddere ({sponsors.length})</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                {unassignedSponsors.length} uten tildelt barn · {childrenList.filter((c) => c.tildeltFadderId).length} barn med fadder
              </p>
            </div>
            <div className="overflow-x-auto border border-stone-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Navn</th>
                    <th className="py-2 px-3 font-semibold">Start</th>
                    <th className="py-2 px-3 font-semibold">Beløp</th>
                    <th className="py-2 px-3 font-semibold">Barn</th>
                    <th className="py-2 px-3 font-semibold">Kilde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sponsorsSorted.map((sp) => {
                    const child = childrenList.find((c) => c.id === sp.tildeltBarnId);
                    return (
                      <tr key={sp.id} className="hover:bg-stone-50/80">
                        <td className="py-2 px-3 font-medium text-stone-900">{sp.navn}</td>
                        <td className="py-2 px-3 text-stone-600 tabular-nums">{sp.startDato.split('-').reverse().join('.')}</td>
                        <td className="py-2 px-3 text-stone-700">{sp.maanedsbelop} kr</td>
                        <td className="py-2 px-3 text-stone-600">{child ? child.fornavn : '—'}</td>
                        <td className="py-2 px-3 text-stone-500">{sp.registrertKilde || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allocation Tool */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Tildelingsverktøy</span>
              <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Koble nytt fadderforhold</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Velg et barn som venter på fadder og koble det til en registrert giver.
              </p>
            </div>

            <form onSubmit={handleAssignSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Barn uten fadder</label>
                <select
                  value={selectedChildForAssign}
                  onChange={(e) => setSelectedChildForAssign(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800"
                  required
                >
                  <option value="">Velg barn...</option>
                  {unassignedChildren.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.internKode} — {ch.fornavn} ({ch.klassetrinn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Giver / Fadder</label>
                <select
                  value={selectedSponsorForAssign}
                  onChange={(e) => setSelectedSponsorForAssign(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800"
                  required
                >
                  <option value="">Velg fadder...</option>
                  {sponsors.map((sp) => {
                    const assignedChild = childrenList.find((c) => c.id === sp.tildeltBarnId);
                    return (
                      <option key={sp.id} value={sp.id}>
                        {sp.navn} ({sp.maanedsbelop} kr/mnd) {assignedChild ? `[Har ${assignedChild.fornavn}]` : '[Venter]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!selectedChildForAssign || !selectedSponsorForAssign}
                  className="w-full py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] disabled:opacity-50 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Opprett fadderkobling
                </button>
              </div>
            </form>
          </div>

          {/* Children Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900">Oversikt over alle barn (10 aktive)</h3>
                <p className="text-xs text-stone-500 mt-0.5">Strenge personvern- og samtykkeforhold registrert</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-6">Kode</th>
                    <th className="py-3 px-6">Fornavn</th>
                    <th className="py-3 px-6">Skole & Trinn</th>
                    <th className="py-3 px-6">Tildelt Fadder</th>
                    <th className="py-3 px-6 text-center">Samtykke</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Handling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {childrenList.map((ch) => {
                    const assignedSponsor = sponsors.find((s) => s.id === ch.tildeltFadderId);

                    return (
                      <tr key={ch.id} className="hover:bg-stone-50/60">
                        <td className="py-3 px-6 font-mono font-bold text-stone-800">{ch.internKode}</td>
                        <td className="py-3 px-6 font-semibold text-stone-900">
                          {ch.fornavn} ({new Date().getFullYear() - ch.fodselsaar} år)
                        </td>
                        <td className="py-3 px-6 text-stone-600">
                          <div>{ch.klassetrinn}</div>
                          <div className="text-[11px] text-stone-400">{ch.skoleNavn}</div>
                        </td>
                        <td className="py-3 px-6">
                          {assignedSponsor ? (
                            <span className="text-stone-900 font-medium">
                              {assignedSponsor.navn} ({assignedSponsor.maanedsbelop} kr)
                            </span>
                          ) : (
                            <span className="text-[#4D6B3E] font-medium">Ufordelt</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <span className="text-emerald-700 font-medium">Foto + Historie</span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <span className="capitalize text-stone-700 font-medium">{ch.status}</span>
                        </td>
                        <td className="py-3 px-6 text-right">
                          {ch.status === 'aktiv' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Avslutte fadderskap for ${ch.fornavn} etter fullført skolegang?`)) {
                                  endSponsorship(ch.id);
                                }
                              }}
                              className="text-stone-500 hover:text-stone-800 cursor-pointer"
                              title="Avslutt fadderforhold ved fullført utdanning"
                            >
                              Avslutt ved endt skole
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB: SPØRSMÅLSFLYT */}
      {activeSection === 'sporsmaal' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">Spørsmål fra faddere</h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Håndter spørsmål fra faddere. Du kan svare direkte eller videresende til koordinator i Kongo.
              Når du publiserer svar, går det en systemmelding til fadderens e-post med lenke til faddersiden.
            </p>
          </div>
          {answerEmailQueued && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
              Svaret er publisert i fadderportalen. En systemmelding med innloggingslenke ligger i e-postkøen (Admin →
              E-post). Resend sendes når nøkkelen er satt.
            </div>
          )}

          {/* Inquiry Reply Panel */}
          {selectedInquiryId && (
            <div className="bg-white border-2 border-[#4D6B3E]/60 rounded-xl p-6 shadow-md space-y-4">
              {(() => {
                const inq = inquiries.find((i) => i.id === selectedInquiryId);
                if (!inq) return null;

                return (
                  <>
                    <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-[#4D6B3E] font-semibold">Behandle fadderspørsmål</span>
                        <h3 className="text-lg font-serif font-bold text-stone-900">
                          Fra: {inq.fadderNavn} vedr. {inq.barnNavn}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedInquiryId(null)}
                        className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        Lukk
                      </button>
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
                            onClick={() => handleForwardInquiry(inq.id)}
                            className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-medium cursor-pointer"
                          >
                            Send til koordinator i Kongo
                          </button>
                        </div>

                        <button
                          onClick={() => handleAnswerInquiry(inq.id)}
                          className="px-5 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded-lg text-xs font-medium cursor-pointer shadow-xs"
                        >
                          Publiser svar til fadder
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div className="space-y-4">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span>Sendt: {inq.datoSendt}</span>
                    <span aria-hidden="true">·</span>
                    <span>Fadder: <strong className="text-stone-800">{inq.fadderNavn}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Elev: {inq.barnNavn}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-800 font-sans font-medium">«{inq.sporsmaal}»</p>
                  {inq.svarTekst && (
                    <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-md border border-emerald-100">
                      <strong>Vårt svar: </strong> {inq.svarTekst}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                      inq.status === 'besvart'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inq.status === 'venter_koordinator'
                        ? 'bg-[#A3B18A]/25 text-[#4D6B3E]'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {inq.status === 'besvart'
                      ? 'Besvart'
                      : inq.status === 'venter_koordinator'
                      ? 'Hos koordinator'
                      : 'Under behandling'}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedInquiryId(inq.id);
                      setAnswerDraft(inq.svarTekst || '');
                    }}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg cursor-pointer"
                  >
                    Behandle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB: ØKONOMI & INNBETALINGER */}
      {activeSection === 'okonomi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">Månedlig fadderinntekt</span>
              <div className="text-2xl font-serif font-bold text-stone-900 font-mono tabular-nums">
                {totalMonthlyPledged.toLocaleString('no-NO')} kr
              </div>
              <p className="text-xs text-stone-500">Fast trekk via Vipps & AvtaleGiro</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">Innsamlet til aksjoner</span>
              <div className="text-2xl font-serif font-bold text-stone-900 font-mono tabular-nums">
                {totalCampaignsRaised.toLocaleString('no-NO')} kr
              </div>
              <p className="text-xs text-stone-500">Øremerkede prosjektmidler</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">Avstemmingsgrad</span>
              <div className="text-2xl font-serif font-bold text-emerald-700 font-mono tabular-nums">100%</div>
              <p className="text-xs text-stone-500">Avstemt mot bankbilag</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900">Transaksjonslogg og avstemming</h3>
                <p className="text-xs text-stone-500 mt-0.5">Skille mellom faste fadderbidrag og ekstraordinære aksjoner</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-6">Dato</th>
                    <th className="py-3 px-6">Giver</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Metode</th>
                    <th className="py-3 px-6">Referanse</th>
                    <th className="py-3 px-6 text-right">Beløp</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Handling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-stone-50/60">
                      <td className="py-3 px-6 text-stone-800 font-mono">{pay.dato}</td>
                      <td className="py-3 px-6 font-medium text-stone-900">{pay.fadderNavn}</td>
                      <td className="py-3 px-6 text-stone-600">
                        {pay.type === 'fadderbidrag' ? 'Fadderbidrag' : `Aksjon: ${pay.aksjonTittel || 'Spesifikk'}`}
                      </td>
                      <td className="py-3 px-6 text-stone-600 uppercase font-mono">{pay.metode}</td>
                      <td className="py-3 px-6 text-stone-500 font-mono">{pay.referanse}</td>
                      <td className="py-3 px-6 text-right font-mono font-semibold text-stone-900 tabular-nums">
                        {pay.belop.toLocaleString('no-NO')} kr
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span
                          className={`font-medium ${
                            pay.status === 'avstemt' ? 'text-emerald-700' : 'text-[#4D6B3E]'
                          }`}
                        >
                          {pay.status === 'avstemt' ? 'Avstemt' : 'Mottatt'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        {pay.status !== 'avstemt' && (
                          <button
                            onClick={() => reconcilePayment(pay.id)}
                            className="text-[#4D6B3E] hover:text-[#3B522F] font-medium cursor-pointer"
                          >
                            Marker avstemt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB: AKSJONER & REVISJONSLOGG */}
      {activeSection === 'aksjoner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-6">
            <h3 className="text-base font-serif font-bold text-stone-900">Ekstraordinære aksjoner</h3>

            <div className="space-y-4">
              {campaigns.map((c) => (
                <div key={c.id} className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800">{c.tittel}</span>
                    <span className={c.status === 'fullfort' ? 'text-emerald-700' : 'text-[#4D6B3E]'}>
                      {c.status === 'fullfort' ? 'Fullført' : 'Aktiv'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">{c.beskrivelse}</p>
                  <div className="text-xs font-mono font-semibold text-stone-800">
                    {c.innsamletBelop.toLocaleString('no-NO')} / {c.maalbelop.toLocaleString('no-NO')} kr innsamlet ({c.antallGivere} givere)
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <h3 className="text-base font-serif font-bold text-stone-900">Sikkerhets- og revisjonslogg (Audit Log)</h3>

            <div className="bg-white rounded-xl border border-stone-200 shadow-xs divide-y divide-stone-100 max-h-[500px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 text-xs space-y-1">
                  <div className="flex items-center justify-between text-stone-500 font-mono">
                    <span>{log.tidspunkt}</span>
                    <span className="font-sans font-semibold text-stone-700">{log.brukerRolle}</span>
                  </div>
                  <div className="font-medium text-stone-900">{log.handling}</div>
                  <p className="text-stone-600 font-sans">{log.detaljer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB: CMS & NETTSIDEREDIGERING */}
      {activeSection === 'cms' && (
        <CmsEditor
          onViewPublicSite={() => {
            setRole('public');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* 9. TAB: TESTIMONIAL EDITOR (HISTORIER & VITNESBYRD) */}
      {(activeSection === 'historier' || activeSection === 'testimonials') && (
        <TestimonialEditor
          onViewPublicSite={() => {
            setRole('public');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {activeSection === 'hjelp' && <AdminHelpGuide setActiveSection={setActiveSection} />}

      {activeSection === 'nyhetsbrev' && <AdminNewsletterPanel />}
    </div>
  );
};
