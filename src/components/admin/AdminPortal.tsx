import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Report } from '../../types';
import {
  ArrowUpDown,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  LayoutList,
  Rows3,
} from 'lucide-react';
import { CmsEditor } from './CmsEditor';
import { AdminPeoplePanel } from './AdminPeoplePanel';
import { AdminUsersPanel } from './AdminUsersPanel';
import { AdminFinancePanel } from './AdminFinancePanel';
import { AdminSettingsPanel } from './AdminSettingsPanel';
import {
  buildAdminContentQueue,
  buildAdminContentRegister,
  resolveQueueFocus,
  seedStoryFromFacts,
  sortAdminContentItems,
  type AdminContentQueueItem,
  type AdminContentSortDir,
  type AdminContentSortKey,
} from '../../utils/adminContentQueue';
import { AdminContentWorkbench } from './AdminContentWorkbench';
import { AdminOppfolgingSubNav } from './AdminOppfolgingSubNav';
import { isAdminOppfolgingSection } from '../../utils/adminOppfolging';
import type { FieldFact } from '../../types';

interface AdminPortalProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  /** Sak fra et varsel som skal fremheves i godkjenningskøen. */
  focusEntityId?: string | null;
  onClearFocus?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  activeSection,
  setActiveSection,
  focusEntityId = null,
  onClearFocus,
}) => {
  const {
    childrenList,
    reports,
    fieldFacts,
    inquiries,
    auditLogs,
    approveReport,
    publishChildStory,
    approveChildPhoto,
    rejectChildPhoto,
    answerInquiry,
    forwardInquiryToCoordinator,
  } = useApp();

  // Review & Translation State
  const [editTitleNo, setEditTitleNo] = useState('');
  const [editContentNo, setEditContentNo] = useState('');

  // Inquiry Answer State
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [forwardNoteFr, setForwardNoteFr] = useState('');
  const [answerEmailQueued, setAnswerEmailQueued] = useState(false);

  const [desk, setDesk] = useState<{ kind: 'historie' | 'rapport'; id: string } | null>(null);
  const [storyDraft, setStoryDraft] = useState({
    fornavn: '',
    skoleNavn: '',
    klassetrinn: '',
    trivsel: '',
    historie: '',
  });

  const [usersFocusEmail, setUsersFocusEmail] = useState<string | null>(null);
  const [childrenFocusId, setChildrenFocusId] = useState<string | null>(null);

  const [contentView, setContentView] = useState<'kort' | 'tabell' | null>(null);
  const [contentSortKey, setContentSortKey] = useState<AdminContentSortKey>('dato');
  const [contentSortDir, setContentSortDir] = useState<AdminContentSortDir>('desc');

  // Filter for loggen: personnøkkel (type:id) eller 'alle'.
  const [loggPersonFilter, setLoggPersonFilter] = useState<string>('alle');
  const loggPersoner = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of auditLogs) {
      if (l.gjelderId && l.gjelderNavn) map.set(`${l.gjelderType ?? ''}:${l.gjelderId}`, l.gjelderNavn);
    }
    return [...map.entries()]
      .map(([key, navn]) => ({ key, navn }))
      .sort((a, b) => a.navn.localeCompare(b.navn, 'nb'));
  }, [auditLogs]);
  const synligLogg = useMemo(
    () =>
      loggPersonFilter === 'alle'
        ? auditLogs
        : auditLogs.filter((l) => `${l.gjelderType ?? ''}:${l.gjelderId ?? ''}` === loggPersonFilter),
    [auditLogs, loggPersonFilter]
  );

  const deskFact = desk?.kind === 'historie' ? fieldFacts.find((f) => f.id === desk.id) : undefined;
  const deskReport = desk?.kind === 'rapport' ? reports.find((r) => r.id === desk.id) : undefined;
  const deskChild = childrenList.find((c) => c.id === (deskFact?.barnId || deskReport?.barnId));
  const contentQueue = useMemo(() => buildAdminContentQueue(fieldFacts, reports), [fieldFacts, reports]);
  const contentRegister = useMemo(
    () => buildAdminContentRegister(fieldFacts, reports),
    [fieldFacts, reports]
  );
  // Fokus på en sak viser alltid kortvisningen, ellers velger brukeren selv.
  const focusResult = useMemo(
    () => (focusEntityId ? resolveQueueFocus(contentQueue, contentRegister, focusEntityId) : null),
    [focusEntityId, contentQueue, contentRegister]
  );
  const focusPending = focusResult?.kind === 'pending';
  const focusedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusPending) focusedRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }, [focusEntityId, focusPending]);
  const shownContentView = focusEntityId
    ? 'kort'
    : contentView ?? (contentRegister.length > 8 ? 'tabell' : 'kort');
  const visibleQueue =
    focusResult?.kind === 'pending' ? [focusResult.item] : contentQueue;
  const sortedRegister = useMemo(
    () => sortAdminContentItems(contentRegister, contentSortKey, contentSortDir),
    [contentRegister, contentSortKey, contentSortDir]
  );

  const toggleContentSort = (key: AdminContentSortKey) => {
    if (contentSortKey === key) {
      setContentSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setContentSortKey(key);
    setContentSortDir(key === 'dato' ? 'desc' : 'asc');
  };

  const openContentItem = (item: AdminContentQueueItem) => {
    if (item.kind === 'historie') {
      const fact = fieldFacts.find((f) => f.id === item.id);
      if (fact) openStoryDesk(fact);
      return;
    }
    const rep = reports.find((r) => r.id === item.id);
    if (rep) startReviewReport(rep);
  };

  const startReviewReport = (rep: Report) => {
    setEditTitleNo(rep.tittelNorsk);
    setEditContentNo(rep.innholdNorsk);
    setDesk({ kind: 'rapport', id: rep.id });
  };

  const openStoryDesk = (fact: FieldFact) => {
    setDesk({ kind: 'historie', id: fact.id });
    setStoryDraft({
      fornavn: fact.fornavn,
      skoleNavn: fact.skoleNavn,
      klassetrinn: fact.klassetrinn,
      trivsel: fact.trivsel,
      historie: seedStoryFromFacts(fact),
    });
  };

  const closeDesk = () => {
    setDesk(null);
  };

  const handleApproveReport = (id: string) => {
    approveReport(id, editTitleNo, editContentNo);
    closeDesk();
  };

  const handlePublishStory = () => {
    if (!deskFact) return;
    publishChildStory(deskFact.id, storyDraft);
    closeDesk();
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

  // Helper metrics
  const pendingPhotos = childrenList.filter((c) => c.ventendeFotoStatus === 'innsendt' && c.ventendeFotoUrl);

  const cmsDesk =
    activeSection === 'cms' || activeSection === 'historier' || activeSection === 'testimonials';

  return (
    <div
      className={
        cmsDesk
          ? 'w-full max-w-none px-2 lg:px-3 pt-2 pb-3 space-y-3'
          : 'max-w-7xl mx-auto px-6 py-8 space-y-10'
      }
    >
      {isAdminOppfolgingSection(activeSection) && (
        <AdminOppfolgingSubNav activeSection={activeSection} setActiveSection={setActiveSection} />
      )}

      {/* 3. TAB: GODKJENNINGSKØ & TOSPRAKLIG REVISJON */}
      {(activeSection === 'godkjenning' || activeSection === 'home') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-900">Innhold til fadder</h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Kort viser det som venter. Tabellen har også publiserte rapporter, med status og sortering på dato. Du
                retter selv — ingenting sendes tilbake til koordinator.
              </p>
            </div>
          </div>

          {desk?.kind === 'historie' && deskFact && deskChild && (
            <AdminContentWorkbench
              mode="historie"
              fact={deskFact}
              child={deskChild}
              latestApproved={reports.find((r) => r.barnId === deskChild.id && r.status === 'godkjent')}
              draft={storyDraft}
              onChange={setStoryDraft}
              onClose={closeDesk}
              onPublish={handlePublishStory}
            />
          )}

          {desk?.kind === 'rapport' && deskReport && deskChild && (
            <AdminContentWorkbench
              mode="rapport"
              report={deskReport}
              child={deskChild}
              titleNo={editTitleNo}
              bodyNo={editContentNo}
              onTitle={setEditTitleNo}
              onBody={setEditContentNo}
              onClose={closeDesk}
              onPublish={() => handleApproveReport(deskReport.id)}
            />
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

          {focusResult && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-[#A3B18A]/15 border border-[#A3B18A]/60 text-xs text-stone-700">
              <span>
                {focusResult.kind === 'pending' && 'Viser saken fra varselet.'}
                {focusResult.kind === 'approved' && 'Denne rapporten er allerede godkjent.'}
                {focusResult.kind === 'missing' &&
                  'Fant ikke saken fra varselet. Den kan være slettet eller lagt inn som eksempel.'}
              </span>
              <button
                type="button"
                onClick={() => onClearFocus?.()}
                className="px-3 py-1.5 rounded-md bg-white border border-stone-300 hover:bg-stone-50 text-xs font-medium text-[#4D6B3E] cursor-pointer"
              >
                Vis alle
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-stone-500">
              {contentQueue.length} venter · {contentRegister.filter((i) => i.status === 'publisert').length} publisert
            </p>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => setContentView('kort')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
                  shownContentView === 'kort' ? 'bg-[#4D6B3E] text-white' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Rows3 className="w-3.5 h-3.5" />
                Kort
              </button>
              <button
                type="button"
                onClick={() => {
                  // Tabell viser alle saker, så fokus fra et varsel slippes.
                  onClearFocus?.();
                  setContentView('tabell');
                  setContentSortKey('dato');
                  setContentSortDir('desc');
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
                  shownContentView === 'tabell' ? 'bg-[#4D6B3E] text-white' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Tabell
              </button>
            </div>
          </div>

          {shownContentView === 'kort' && (
          <div className="space-y-3">
            {visibleQueue.map((item) => {
              const erFokusert = focusResult?.kind === 'pending' && focusResult.item.id === item.id;
              return (
              <div
                key={`${item.kind}-${item.id}`}
                ref={erFokusert ? focusedRef : undefined}
                className={`bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  erFokusert ? 'ring-2 ring-[#4D6B3E]' : ''
                }`}
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                      {item.kind === 'historie' ? 'Historie' : 'Rapport'}
                    </span>
                    <Clock className="w-3.5 h-3.5 text-[#4D6B3E]" />
                    <span>{item.dato.split('-').reverse().join('.')}</span>
                    <span aria-hidden="true">·</span>
                    <strong className="text-stone-800">{item.barnNavn}</strong>
                    {item.from && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{item.from}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-2">{item.excerpt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openContentItem(item)}
                  className="px-5 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer"
                >
                  Skriv og publiser
                </button>
              </div>
              );
            })}

            {contentQueue.length === 0 && pendingPhotos.length === 0 && (
              <div className="p-8 bg-white rounded-xl border border-stone-200 text-center text-xs text-stone-500 space-y-1">
                <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-stone-800">Køen er tom</p>
                <p>Ingenting venter. Publiserte rapporter ligger i tabellen.</p>
              </div>
            )}
          </div>
          )}

          {shownContentView === 'tabell' && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <p className="px-4 pt-3 pb-1 text-[11px] text-stone-500">
                Klikk på kolonnenavn for å sortere. Nyeste dato øverst finner de siste rapportene, også når det er mange.
              </p>
              <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="sticky top-0 bg-stone-50">
                    <tr className="border-b border-stone-200">
                      {(
                        [
                          ['dato', 'Dato'],
                          ['kind', 'Type'],
                          ['barnNavn', 'Barn'],
                          ['status', 'Status'],
                        ] as [AdminContentSortKey, string][]
                      ).map(([key, label]) => {
                        const active = contentSortKey === key;
                        return (
                          <th
                            key={key}
                            scope="col"
                            aria-sort={active ? (contentSortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                          >
                            <button
                              type="button"
                              onClick={() => toggleContentSort(key)}
                              className="w-full px-3 py-2.5 font-semibold text-stone-700 hover:text-stone-900 cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            >
                              <span>{label}</span>
                              {active ? (
                                contentSortDir === 'asc' ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-[#4D6B3E]" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-[#4D6B3E]" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-stone-400" />
                              )}
                            </button>
                          </th>
                        );
                      })}
                      <th scope="col" className="px-3 py-2.5 font-semibold text-stone-700">
                        Tekst
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-semibold text-stone-700">
                        Handling
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRegister.map((item) => (
                      <tr key={`${item.status}-${item.kind}-${item.id}`} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/80">
                        <td className="px-3 py-2.5 font-mono text-stone-600 whitespace-nowrap">
                          {item.dato.split('-').reverse().join('.')}
                        </td>
                        <td className="px-3 py-2.5 text-stone-800">
                          {item.kind === 'historie' ? 'Historie' : 'Rapport'}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-stone-900">{item.barnNavn}</td>
                        <td className="px-3 py-2.5">
                          {item.status === 'publisert' ? (
                            <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Publisert
                            </span>
                          ) : (
                            <span className="text-amber-800 font-medium">Venter</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-stone-600 max-w-sm">
                          <span className="line-clamp-2">{item.excerpt}</span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {item.status === 'venter' ? (
                            <button
                              type="button"
                              onClick={() => openContentItem(item)}
                              className="text-[#4D6B3E] hover:text-[#3B522F] font-medium cursor-pointer"
                            >
                              Skriv og publiser
                            </button>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {(activeSection === 'barn' || activeSection === 'tildeling') && (
        <AdminPeoplePanel
          focusChildId={childrenFocusId}
          onClearChildFocus={() => setChildrenFocusId(null)}
          onOpenSponsorByEmail={(email) => {
            setUsersFocusEmail(email);
            setActiveSection('brukere');
          }}
        />
      )}

      {activeSection === 'brukere' && (
        <AdminUsersPanel
          focusEmail={usersFocusEmail}
          focusSponsorId={focusEntityId?.startsWith('sponsor:') ? focusEntityId.slice('sponsor:'.length) : null}
          onClearFocus={() => {
            setUsersFocusEmail(null);
            onClearFocus?.();
          }}
          onOpenChild={(childId) => {
            setChildrenFocusId(childId);
            setActiveSection('barn');
          }}
        />
      )}

      {/* 5. TAB: SPØRSMÅLSFLYT */}
      {activeSection === 'sporsmaal' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-900">Spørsmål fra faddere</h3>
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

      {activeSection === 'okonomi' && <AdminFinancePanel setActiveSection={setActiveSection} />}

      {activeSection === 'logg' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-900">Sikkerhets- og revisjonslogg</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl">
              Hva som er gjort i administrasjonen. Ekstraordinære aksjoner og vitnesbyrd redigeres under CMS.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="logg-person-filter" className="text-stone-600 font-medium">
              Person
            </label>
            <select
              id="logg-person-filter"
              value={loggPersonFilter}
              onChange={(e) => setLoggPersonFilter(e.target.value)}
              className="px-2 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-800"
            >
              <option value="alle">Alle</option>
              {loggPersoner.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.navn}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs divide-y divide-stone-100 max-h-[640px] overflow-y-auto">
            {synligLogg.map((log) => (
              <div key={log.id} className="p-4 text-xs space-y-1">
                <div className="flex items-center justify-between text-stone-500 font-mono">
                  <span>{log.tidspunkt}</span>
                  <span className="font-sans font-semibold text-stone-700">{log.brukerRolle}</span>
                </div>
                <div className="font-medium text-stone-900 flex items-center gap-2">
                  {log.type === 'kommentar' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] uppercase tracking-wide font-sans">
                      Kommentar
                    </span>
                  )}
                  {log.handling}
                </div>
                <p className="text-stone-600 font-sans">{log.detaljer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. TAB: SAMLET CMS */}
      {(activeSection === 'cms' || activeSection === 'historier' || activeSection === 'testimonials') && (
        <CmsEditor
          initialSubTab={
            activeSection === 'historier' || activeSection === 'testimonials' ? 'stories' : undefined
          }
        />
      )}

      {(activeSection === 'innstillinger' || activeSection === 'hjelp' || activeSection === 'nyhetsbrev') && (
        <AdminSettingsPanel
          setActiveSection={setActiveSection}
          showEmailPanel={activeSection === 'innstillinger' || activeSection === 'nyhetsbrev'}
        />
      )}
    </div>
  );
};
