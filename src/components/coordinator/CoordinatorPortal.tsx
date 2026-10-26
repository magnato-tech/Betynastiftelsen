import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VisualCard } from '../common/VisualCard';
import { Child, Report, ChildMilestone, MilestoneCategory } from '../../types';
import {
  FileText,
  UserPlus,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  School,
  Save,
  MessageCircle,
  Shield,
  TrendingUp,
  BarChart3,
  Award,
  History,
  Plus,
  Tag,
  Sparkles,
  Calendar,
  X,
  Edit2,
  Filter,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { CoordinatorPhotoPanel } from './CoordinatorPhotoPanel';
import { CoordinatorChildProfile } from './CoordinatorChildProfile';
import {
  inquiriesForCoordinator,
  reportsForCoordinator,
  sortChildrenForCoordinatorRegister,
  type CoordinatorRegisterSortKey,
  type CoordinatorRegisterSortDir,
} from '../../utils/coordinatorScope';
import { coordinatorDisplayName } from '../../utils/coordinatorDisplay';
import { getCoordinatorUi } from '../../locales/coordinatorUi';
import {
  coordinatorChildProfileSection,
  parseCoordinatorChildProfileId,
  isCoordinatorChildProfileSection,
} from '../../utils/photoCatalog';

interface CoordinatorPortalProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  /** Spørsmål som skal vises fremhevet (fra varslingssenteret). */
  focusEntityId?: string | null;
  onClearFocus?: () => void;
}

export const CoordinatorPortal: React.FC<CoordinatorPortalProps> = ({
  activeSection,
  setActiveSection,
  focusEntityId = null,
  onClearFocus,
}) => {
  const {
    childrenList,
    coordinatorChildren,
    currentCoordinator,
    currentCoordinatorId,
    reports,
    milestones,
    inquiries,
    addChild,
    submitReport,
    submitFieldFact,
    submitChildPhoto,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    coordinatorReplyToInquiry,
    currentRoleNotifications,
    markNotificationAsRead,
    language,
    catalogPhotos,
  } = useApp();
  const ui = getCoordinatorUi(language);

  const myChildIds = new Set(coordinatorChildren.map((c) => c.id));
  const myReports = reportsForCoordinator(reports, currentCoordinatorId);
  const myMilestones = milestones.filter((m) => myChildIds.has(m.barnId));
  const [registerSortKey, setRegisterSortKey] = useState<CoordinatorRegisterSortKey>('internKode');
  const [registerSortDir, setRegisterSortDir] = useState<CoordinatorRegisterSortDir>('asc');

  const registerCounts = useMemo(() => {
    const reportsMap: Record<string, number> = {};
    const milestonesMap: Record<string, number> = {};
    for (const r of myReports) reportsMap[r.barnId] = (reportsMap[r.barnId] || 0) + 1;
    for (const m of myMilestones) milestonesMap[m.barnId] = (milestonesMap[m.barnId] || 0) + 1;
    return { reports: reportsMap, milestones: milestonesMap };
  }, [myReports, myMilestones]);

  const sortedRegisterChildren = useMemo(
    () =>
      sortChildrenForCoordinatorRegister(
        coordinatorChildren,
        registerSortKey,
        registerSortDir,
        registerCounts
      ),
    [coordinatorChildren, registerSortKey, registerSortDir, registerCounts]
  );

  const toggleRegisterSort = (key: CoordinatorRegisterSortKey) => {
    if (registerSortKey === key) {
      setRegisterSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setRegisterSortKey(key);
      setRegisterSortDir('asc');
    }
  };

  const childStatusLabel = (status: Child['status']) => {
    if (status === 'avsluttet') return ui.statusEnded;
    if (status === 'arkivert') return ui.statusArchived;
    return ui.statusActive;
  };

  useEffect(() => {
    const first = coordinatorChildren[0]?.id;
    if (first) {
      setSelectedChildId(first);
      setMsBarnId(first);
    }
  }, [currentCoordinatorId, coordinatorChildren]);

  const coordinatorReportAlert = currentRoleNotifications.find(
    (n) => (n.type === 'report_needs_approval' || n.type === 'report_rejected') && !n.read
  );

  // Milestone / History Timeline State
  const [selectedTimelineChildId, setSelectedTimelineChildId] = useState<string>('all');
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ChildMilestone | null>(null);
  const [msBarnId, setMsBarnId] = useState<string>(coordinatorChildren[0]?.id || '');
  const [msDate, setMsDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [msCategory, setMsCategory] = useState<MilestoneCategory>('skole');
  const [msTitleFr, setMsTitleFr] = useState('');
  const [msDescFr, setMsDescFr] = useState('');
  const [msTitleNo, setMsTitleNo] = useState('');
  const [msDescNo, setMsDescNo] = useState('');
  const [msMerknad, setMsMerknad] = useState('');
  const [msKoordinator, setMsKoordinator] = useState('Koordinator Dieudonné (Brazzaville)');
  const [milestoneToast, setMilestoneToast] = useState<string | null>(null);

  // New Report Form state
  const [selectedChildId, setSelectedChildId] = useState<string>(coordinatorChildren[0]?.id || '');
  const [reportTitleFr, setReportTitleFr] = useState('');
  const [reportContentFr, setReportContentFr] = useState('');
  const [schoolPerformance, setSchoolPerformance] = useState('');
  const [attendancePct, setAttendancePct] = useState<number>(95);
  const [reportSuccessToast, setReportSuccessToast] = useState(false);
  const [factTrivsel, setFactTrivsel] = useState('');
  const [factSuccessToast, setFactSuccessToast] = useState(false);

  // New Child Form state
  const [newFirstName, setNewFirstName] = useState('');
  const [newBirthYear, setNewBirthYear] = useState<number>(2017);
  const [newGender, setNewGender] = useState<'gutt' | 'jente'>('gutt');
  const [newSchoolName, setNewSchoolName] = useState('École Primaire Sainte-Thérèse, Brazzaville');
  const [newGrade, setNewGrade] = useState('3ème primaire');
  const [newContext, setNewContext] = useState('');
  const [newNeeds, setNewNeeds] = useState('');
  const [consentPhoto, setConsentPhoto] = useState(true);
  const [consentStory, setConsentStory] = useState(true);
  const [childSuccessToast, setChildSuccessToast] = useState(false);

  // Inquiry reply modal/state
  const [replyingInquiryId, setReplyingInquiryId] = useState<string | null>(null);
  const [coordinatorReplyFr, setCoordinatorReplyFr] = useState('');

  const openAddMilestoneModal = (childId?: string) => {
    setEditingMilestone(null);
    const targetId = childId || (selectedTimelineChildId !== 'all' ? selectedTimelineChildId : coordinatorChildren[0]?.id || '');
    setMsBarnId(targetId);
    setMsDate(new Date().toISOString().slice(0, 10));
    setMsCategory('skole');
    setMsTitleFr('');
    setMsDescFr('');
    setMsTitleNo('');
    setMsDescNo('');
    setMsMerknad('');
    setMsKoordinator('Koordinator Dieudonné (Brazzaville)');
    setIsMilestoneModalOpen(true);
  };

  const openEditMilestoneModal = (m: ChildMilestone) => {
    setEditingMilestone(m);
    setMsBarnId(m.barnId);
    setMsDate(m.dato);
    setMsCategory(m.kategori);
    setMsTitleFr(m.tittelFransk);
    setMsDescFr(m.beskrivelseFransk);
    setMsTitleNo(m.tittelNorsk);
    setMsDescNo(m.beskrivelseNorsk);
    setMsMerknad(m.merknad || '');
    setMsKoordinator(m.koordinatorNavn || 'Koordinator Dieudonné (Brazzaville)');
    setIsMilestoneModalOpen(true);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msBarnId || !msTitleFr.trim() || !msDescFr.trim()) return;

    const targetChild = coordinatorChildren.find((c) => c.id === msBarnId);
    const childName = targetChild?.fornavn || ui.pupilFallback;

    // Gracefully handle Norwegian title and description for Norwegian sponsor
    const titleNo = msTitleNo.trim() || msTitleFr.trim();
    const descNo = msDescNo.trim() || msDescFr.trim();

    if (editingMilestone) {
      updateMilestone(editingMilestone.id, {
        barnId: msBarnId,
        barnNavn: childName,
        dato: msDate,
        kategori: msCategory,
        tittelFransk: msTitleFr.trim(),
        beskrivelseFransk: msDescFr.trim(),
        tittelNorsk: titleNo,
        beskrivelseNorsk: descNo,
        merknad: msMerknad.trim() || undefined,
        koordinatorNavn: msKoordinator.trim() || 'Koordinator Dieudonné (Brazzaville)',
      });
      setMilestoneToast(ui.toastMilestoneEdit(childName));
    } else {
      addMilestone({
        barnId: msBarnId,
        barnNavn: childName,
        dato: msDate,
        kategori: msCategory,
        tittelFransk: msTitleFr.trim(),
        beskrivelseFransk: msDescFr.trim(),
        tittelNorsk: titleNo,
        beskrivelseNorsk: descNo,
        merknad: msMerknad.trim() || undefined,
        koordinatorNavn: msKoordinator.trim() || 'Koordinator Dieudonné (Brazzaville)',
      });
      setMilestoneToast(ui.toastMilestoneAdd(childName));
    }

    setIsMilestoneModalOpen(false);
    setTimeout(() => setMilestoneToast(null), 5000);
  };

  const MILESTONE_PRESETS = [
    {
      label: 'Rentrée scolaire',
      category: 'skole' as MilestoneCategory,
      titleFr: 'Rentrée des classes et inscription confirmée',
      descFr: "L'élève a débuté sa nouvelle année scolaire avec succès. Tous les frais d'inscription ont été réglés auprès de la direction de l'école.",
      titleNo: 'Skolestart og bekreftet opptak',
      descNo: 'Eleven har startet det nye skoleåret. Skolepenger og registrering er fullt ut dekket.',
      merknad: 'Rentrée scolaire',
    },
    {
      label: 'Uniforme & Cartable',
      category: 'utstyr' as MilestoneCategory,
      titleFr: 'Remise du nouvel uniforme et du matériel complet',
      descFr: "Remise officielle de l'uniforme taillé sur mesure, cartable renforcé, cahiers d'exercices et stylos pour le semestre.",
      titleNo: 'Utdeling av ny skoleuniform og komplett skolesekk',
      descNo: 'Skreddersydd skoleuniform, solid skolesekk, skrivebøker og blyanter er overlevert til eleven.',
      merknad: 'Uniforme & Matériel',
    },
    {
      label: 'Excellence & Progrès',
      category: 'skole' as MilestoneCategory,
      titleFr: 'Excellente progression aux examens périodiques',
      descFr: "L'élève a obtenu de remarquables résultats dans les matières principales. Les enseignants félicitent son assiduité et son sérieux.",
      titleNo: 'Flott fremgang på terminprøvene',
      descNo: 'Eleven har oppnådd svært gode karakterer. Lærerne roser innsatsen, nysgjerrigheten og det jevne arbeidet.',
      merknad: 'Progrès académique',
    },
    {
      label: 'Bilan de santé',
      category: 'helse' as MilestoneCategory,
      titleFr: 'Visite médicale scolaire et contrôle de santé réussi',
      descFr: "Bilan médical et ophtalmologique de routine effectué auprès du dispensaire conventionné. Bon état de santé général constaté.",
      titleNo: 'Årlig helsesjekk og synstest gjennomført',
      descNo: 'Rutinemessig helsekontroll gjennomført ved helsestasjonen uten anmerkninger. God allmenntilstand.',
      merknad: 'Santé & Prévention',
    },
    {
      label: 'Atelier & Loisirs',
      category: 'aktivitet' as MilestoneCategory,
      titleFr: 'Participation enthousiaste aux activités périscolaires',
      descFr: "L'élève s'est particulièrement illustré lors de l'atelier créatif de dessin et des moments de lecture partagée.",
      titleNo: 'Deltakelse i tegne- og lesegruppe',
      descNo: 'Eleven deltok med stor entusiasme i felles tegne- og leseaktiviteter etter skoletid.',
      merknad: 'Atelier créatif',
    },
  ];

  const handleApplyPreset = (preset: typeof MILESTONE_PRESETS[0]) => {
    setMsCategory(preset.category);
    setMsTitleFr(preset.titleFr);
    setMsDescFr(preset.descFr);
    setMsTitleNo(preset.titleNo);
    setMsDescNo(preset.descNo);
    setMsMerknad(preset.merknad);
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitleFr.trim() || !reportContentFr.trim() || !selectedChildId) return;

    submitReport({
      barnId: selectedChildId,
      tittelFransk: reportTitleFr.trim(),
      innholdFransk: reportContentFr.trim(),
      skoleprestasjon: schoolPerformance || 'Bonne assiduité',
      oppmoteProsent: attendancePct,
    });

    setReportTitleFr('');
    setReportContentFr('');
    setSchoolPerformance('');
    setReportSuccessToast(true);
    setTimeout(() => setReportSuccessToast(false), 4000);
    setActiveSection('rapports');
  };

  const handleCreateFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !factTrivsel.trim()) return;
    submitFieldFact(selectedChildId, factTrivsel.trim());
    setFactTrivsel('');
    setFactSuccessToast(true);
    setTimeout(() => setFactSuccessToast(false), 4000);
  };

  const handleCreateChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newContext.trim()) return;

    addChild({
      fornavn: newFirstName.trim(),
      fodselsaar: newBirthYear,
      kjonn: newGender,
      skoleNavn: newSchoolName,
      klassetrinn: newGrade,
      bakgrunnskontekst: newContext.trim(),
      behovSammendrag: newNeeds || 'Frais scolaires, fournitures et repas.',
      samtykkeFoto: consentPhoto,
      samtykkeHistorie: consentStory,
      interesser: ['Lecture', 'Dessin'],
    });

    setNewFirstName('');
    setNewContext('');
    setNewNeeds('');
    setChildSuccessToast(true);
    setTimeout(() => setChildSuccessToast(false), 4000);
    setActiveSection('eleves');
  };

  const handleReplyInquiry = (inquiryId: string) => {
    if (!coordinatorReplyFr.trim()) return;
    coordinatorReplyToInquiry(inquiryId, coordinatorReplyFr.trim());
    setReplyingInquiryId(null);
    setCoordinatorReplyFr('');
    onClearFocus?.();
  };

  // Filter inquiries waiting for coordinator
  const inquiriesWaitingCoordinator = inquiriesForCoordinator(inquiries, childrenList, currentCoordinatorId);

  // Spørsmål fra varslingssenteret: åpne svarskjemaet, og scroll dit. Kjøres bare når fokus endres.
  const fokusertSporsmal =
    activeSection === 'questions' && focusEntityId
      ? inquiriesWaitingCoordinator.find((inq) => inq.id === focusEntityId)
      : undefined;
  const fokusertSporsmalId = fokusertSporsmal?.id;
  useEffect(() => {
    if (!fokusertSporsmal) return;
    setReplyingInquiryId(fokusertSporsmal.id);
    setCoordinatorReplyFr(fokusertSporsmal.koordinatorNotatFr || '');
    document
      .getElementById(`sporsmal-${fokusertSporsmal.id}`)
      ?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    // Bevisst bare på fokus og id: en ny liste-oppdatering skal ikke nullstille det som skrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusEntityId, activeSection, fokusertSporsmalId]);

  const profileChildId = parseCoordinatorChildProfileId(activeSection);
  const profileChild = profileChildId
    ? coordinatorChildren.find((c) => c.id === profileChildId)
    : undefined;

  const openChildProfile = (childId: string) => {
    setSelectedChildId(childId);
    setSelectedTimelineChildId(childId);
    setMsBarnId(childId);
    setActiveSection(coordinatorChildProfileSection(childId));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* 1. Header banner */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 md:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-stone-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#A3B18A] font-semibold uppercase tracking-wider">
            <span>{ui.kicker}</span>
            <span aria-hidden="true">·</span>
            <span>Brazzaville</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">
            {ui.title}
          </h1>
          {currentCoordinator && (
            <p className="text-sm text-[#A3B18A] font-medium">
              {coordinatorDisplayName(currentCoordinator)} · {ui.assigned(coordinatorChildren.length)}
            </p>
          )}
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl font-sans leading-relaxed">
            {ui.intro}
          </p>
        </div>

        {/* Action quick links */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => {
              openAddMilestoneModal();
              setActiveSection('jalons');
            }}
            className="px-4 py-2.5 bg-[#A3B18A] hover:bg-[#8F9E77] text-stone-900 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Award className="w-4 h-4" />
            <span>{ui.addMilestone}</span>
          </button>
          <button
            onClick={() => setActiveSection('nouveau')}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>{ui.newReport}</span>
          </button>
          <button
            onClick={() => setActiveSection('nouvel-eleve')}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>{ui.enroll}</span>
          </button>
          <button
            onClick={() => setActiveSection('faits')}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>{ui.factsKicker}</span>
          </button>
        </div>
      </div>

      {/* Coordinator Alert Banner for Reports Needing Approval / Actions */}
      {coordinatorReportAlert && (
        <div className="bg-stone-100 border border-stone-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#A3B18A]/20 flex items-center justify-center text-[#4D6B3E] shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#4D6B3E]">{ui.alertKicker}</span>
                <span className="text-stone-400">·</span>
                <span className="text-stone-500 font-mono">{coordinatorReportAlert.timestamp}</span>
              </div>
              <h3 className="text-sm font-serif font-bold text-stone-900 mt-0.5">{coordinatorReportAlert.title}</h3>
              <p className="text-stone-600 mt-1 leading-relaxed font-sans">{coordinatorReportAlert.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                markNotificationAsRead(coordinatorReportAlert.id);
                setActiveSection('rapports');
              }}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>{ui.consultReports}</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              onClick={() => markNotificationAsRead(coordinatorReportAlert.id)}
              className="px-2.5 py-2 text-stone-500 hover:text-stone-800 rounded-lg cursor-pointer"
            >
              {ui.close}
            </button>
          </div>
        </div>
      )}

      {/* Milestone Toast Alert */}
      {milestoneToast && (
        <div className="bg-[#F6F4ED] border border-[#A3B18A] rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3 text-[#4D6B3E]">
            <div className="w-7 h-7 rounded-full bg-[#A3B18A]/30 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">{milestoneToast}</p>
              <p className="text-[11px] text-stone-500">{ui.toastSynced}</p>
            </div>
          </div>
          <button
            onClick={() => setMilestoneToast(null)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {profileChild && (
        <CoordinatorChildProfile
          child={profileChild}
          reports={myReports}
          milestones={myMilestones}
          catalogPhotos={catalogPhotos}
          language={language}
          onBack={() => setActiveSection('eleves')}
          onWriteReport={() => {
            setSelectedChildId(profileChild.id);
            setActiveSection('nouveau');
          }}
          onAddMilestone={() => openAddMilestoneModal(profileChild.id)}
          onEditMilestone={openEditMilestoneModal}
          onDeleteMilestone={(id) => {
            deleteMilestone(id);
            setMilestoneToast(ui.toastMilestoneDeleted);
            setTimeout(() => setMilestoneToast(null), 3000);
          }}
        />
      )}

      {isCoordinatorChildProfileSection(activeSection) && !profileChild && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-xs text-stone-600">
          <p>{ui.emptyRegister}</p>
          <button
            type="button"
            onClick={() => setActiveSection('eleves')}
            className="mt-4 text-[#4D6B3E] font-medium cursor-pointer"
          >
            {ui.backToList}
          </button>
        </div>
      )}

      {/* 3. TAB: ÉLÈVES SUIVIS */}
      {(activeSection === 'eleves' || activeSection === 'home') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">{ui.registerTitle}</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                {ui.registerSub}
              </p>
            </div>
          </div>

          {coordinatorChildren.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-sm text-stone-600">
              <p>{ui.emptyRegister}</p>
              <button
                onClick={() => setActiveSection('nouvel-eleve')}
                className="mt-4 px-4 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white text-xs font-medium rounded-lg cursor-pointer"
              >
                {ui.enroll}
              </button>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
              <p className="px-4 pt-3 pb-1 text-[11px] text-stone-500">{ui.registerSortHint}</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      {(
                        [
                          ['internKode', ui.colCode],
                          ['fornavn', ui.colName],
                          ['skoleNavn', ui.colSchool],
                          ['klassetrinn', ui.colGrade],
                          ['fadderstatus', ui.colSponsor],
                          ['fodselsaar', ui.colBirth],
                          ['rapporter', ui.colReports],
                          ['milepaler', ui.colMilestones],
                          ['status', ui.colStatus],
                        ] as [CoordinatorRegisterSortKey, string][]
                      ).map(([key, label]) => {
                        const active = registerSortKey === key;
                        return (
                          <th key={key} scope="col" aria-sort={active ? (registerSortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                            <button
                              type="button"
                              onClick={() => toggleRegisterSort(key)}
                              className="w-full px-3 py-2.5 font-semibold text-stone-700 hover:text-stone-900 cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            >
                              <span>{label}</span>
                              {active ? (
                                registerSortDir === 'asc' ? (
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
                      <th scope="col" className="px-3 py-2.5 font-semibold text-stone-700 whitespace-nowrap">
                        {ui.colActions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRegisterChildren.map((ch) => {
                      const reportCount = registerCounts.reports[ch.id] || 0;
                      const milestoneCount = registerCounts.milestones[ch.id] || 0;
                      const isAssigned = !!ch.tildeltFadderId;
                      const age = new Date().getFullYear() - ch.fodselsaar;
                      return (
                        <tr
                          key={ch.id}
                          className="border-b border-stone-100 last:border-0 hover:bg-stone-50/80 cursor-pointer"
                          onClick={() => openChildProfile(ch.id)}
                        >
                          <td className="px-3 py-3 font-mono font-bold text-stone-800 whitespace-nowrap">{ch.internKode}</td>
                          <td className="px-3 py-3 font-serif font-bold text-stone-900">{ch.fornavn}</td>
                          <td className="px-3 py-3 text-stone-600 max-w-[180px]">{ch.skoleNavn}</td>
                          <td className="px-3 py-3 text-stone-600">{ch.klassetrinn}</td>
                          <td className="px-3 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${
                                isAssigned
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-[#A3B18A]/20 text-[#4D6B3E]'
                              }`}
                            >
                              {isAssigned ? ui.sponsorAssigned : ui.awaitingSponsor}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-stone-700 whitespace-nowrap">
                            {ch.fodselsaar}{' '}
                            <span className="text-stone-500">({ui.years(age)})</span>
                          </td>
                          <td className="px-3 py-3 tabular-nums">{reportCount}</td>
                          <td className="px-3 py-3 tabular-nums">{milestoneCount}</td>
                          <td className="px-3 py-3">{childStatusLabel(ch.status)}</td>
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() => openChildProfile(ch.id)}
                                className="px-2 py-1 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-md cursor-pointer"
                              >
                                {ui.openProfile}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChildId(ch.id);
                                  setActiveSection('nouveau');
                                }}
                                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-md cursor-pointer"
                              >
                                {ui.writeReport}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'jalons' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4D6B3E]">{ui.jalonsKicker}</p>
            <h2 className="text-xl font-serif font-bold text-stone-900">{ui.jalonsPickerTitle}</h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">{ui.jalonsPickerIntro}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {coordinatorChildren.map((c) => {
              const count = myMilestones.filter((m) => m.barnId === c.id).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openChildProfile(c.id)}
                  className="text-left bg-white border border-stone-200 hover:border-[#4D6B3E] rounded-xl p-4 shadow-xs cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif font-bold text-stone-900">{c.fornavn}</span>
                    <span className="font-mono text-xs text-stone-500">{c.internKode}</span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">{c.klassetrinn}</p>
                  <p className="text-xs text-[#4D6B3E] font-medium mt-2">
                    {ui.openProfileMilestones} · {ui.jalonsCount(count)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB: RAPPORTS ENVOYÉS & STATUTS */}
      {activeSection === 'rapports' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">{ui.reportsTitle}</h2>
            <p className="text-xs text-stone-600 mt-0.5">
              {ui.reportsSub}
            </p>
          </div>

          <div className="space-y-4">
            {myReports.map((rep) => {
              const isApproved = rep.status === 'godkjent';
              const isPending = rep.status === 'innsendt';

              return (
                <div
                  key={rep.id}
                  className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-stone-500">
                      <span>{ui.pupilLabel} <strong className="text-stone-800">{rep.barnNavn}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>{ui.dateLabel} {rep.dato}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ui.attendanceLabel} <strong className="font-mono">{rep.oppmoteProsent}%</strong></span>
                    </div>
                    <div>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{ui.approvedPublished}</span>
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#A3B18A]/20 text-[#4D6B3E] rounded-md text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{ui.pendingOslo}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-md text-xs font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{ui.changesRequired}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-serif font-bold text-stone-900">{rep.tittelFransk}</h3>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans mt-1">
                      {rep.innholdFransk}
                    </p>
                  </div>

                  {rep.adminNotat && (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600">
                      <strong className="text-stone-800">{ui.osloNote} </strong>
                      <span>{rep.adminNotat}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'photos' && (
        <CoordinatorPhotoPanel children={coordinatorChildren} onSubmitPhoto={submitChildPhoto} />
      )}

      {activeSection === 'faits' && (
        <div className="max-w-2xl mx-auto bg-white p-7 md:p-9 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">{ui.factsKicker}</span>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mt-1">{ui.factsTitle}</h2>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {ui.factsIntro}
            </p>
          </div>
          {factSuccessToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              {ui.factsSent}
            </div>
          )}
          <form onSubmit={handleCreateFact} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.selectPupil}</label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                required
              >
                {coordinatorChildren.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.fornavn} — {ch.klassetrinn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.wellbeing}</label>
              <textarea
                required
                minLength={10}
                rows={5}
                value={factTrivsel}
                onChange={(e) => setFactTrivsel(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                placeholder={ui.factsPlaceholder}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm cursor-pointer"
            >
              {ui.sendOslo}
            </button>
          </form>
        </div>
      )}

      {/* 5. TAB: NOUVEAU RAPPORT */}
      {activeSection === 'nouveau' && (
        <div className="max-w-2xl mx-auto bg-white p-7 md:p-9 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">{ui.reportFormKicker}</span>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mt-1">{ui.reportFormTitle}</h2>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed font-sans">
              {ui.reportFormIntro}
            </p>
          </div>

          {reportSuccessToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{ui.reportSubmitted}</span>
            </div>
          )}

          <form onSubmit={handleCreateReport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.selectPupil}</label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                required
              >
                {coordinatorChildren.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.internKode} — {ch.fornavn} ({ch.klassetrinn}, {ch.skoleNavn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.reportTitle}</label>
              <input
                type="text"
                required
                value={reportTitleFr}
                onChange={(e) => setReportTitleFr(e.target.value)}
                placeholder={ui.reportTitlePh}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.gradeLabel}</label>
                <input
                  type="text"
                  value={schoolPerformance}
                  onChange={(e) => setSchoolPerformance(e.target.value)}
                  placeholder={ui.gradePh}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.attendancePct}</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={attendancePct}
                  onChange={(e) => setAttendancePct(parseInt(e.target.value) || 95)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.reportBody}</label>
              <textarea
                rows={5}
                required
                value={reportContentFr}
                onChange={(e) => setReportContentFr(e.target.value)}
                placeholder={ui.reportBodyPh}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
              />
            </div>

            <div className="p-3 bg-stone-100 rounded-lg border border-stone-200 text-xs text-stone-600 flex items-start gap-2">
              <Shield className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <span>
                {ui.ethics}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{ui.submitAdmin}</span>
            </button>
          </form>
        </div>
      )}

      {/* 6. TAB: QUESTIONS DU BUREAU D'OSLO */}
      {activeSection === 'questions' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">{ui.questionsTitle}</h2>
            <p className="text-xs text-stone-600 mt-0.5">
              {ui.questionsSub}
            </p>
          </div>

          {focusEntityId && !fokusertSporsmal && (
            <div className="p-3 bg-[#F6F4ED] rounded-lg border border-[#A3B18A] text-xs text-[#3C3C3C]">
              {ui.focusNotWaiting}
            </div>
          )}

          <div className="space-y-4">
            {inquiriesWaitingCoordinator.map((inq) => (
              <div
                key={inq.id}
                id={`sporsmal-${inq.id}`}
                className={`bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4 ${
                  inq.id === focusEntityId ? 'ring-2 ring-[#4D6B3E]' : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>{ui.pupilConcerned} <strong className="text-stone-800">{inq.barnNavn}</strong></span>
                  <span>{ui.dateLabel} {inq.datoSendt}</span>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-xs font-semibold text-stone-600 mb-1">{ui.sponsorQuestion}</p>
                  <p className="text-xs sm:text-sm text-stone-800 font-sans">{inq.sporsmaal}</p>
                </div>

                {inq.koordinatorNotatFr && (
                  <div className="p-3 bg-[#F6F4ED] rounded-lg border border-[#A3B18A] text-xs text-[#3C3C3C]">
                    <p className="font-semibold text-[#4D6B3E]">{ui.coordNote}</p>
                    <p>{inq.koordinatorNotatFr}</p>
                  </div>
                )}

                {replyingInquiryId === inq.id ? (
                  <div className="space-y-3 pt-2">
                    <textarea
                      rows={3}
                      value={coordinatorReplyFr}
                      onChange={(e) => setCoordinatorReplyFr(e.target.value)}
                      placeholder={ui.replyPh}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReplyInquiry(inq.id)}
                        className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium cursor-pointer"
                      >
                        {ui.saveReply}
                      </button>
                      <button
                        onClick={() => {
                          setReplyingInquiryId(null);
                          onClearFocus?.();
                        }}
                        className="px-3 py-2 bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        {ui.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setReplyingInquiryId(inq.id);
                      setCoordinatorReplyFr(inq.koordinatorNotatFr || '');
                    }}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    {ui.replyQuestion}
                  </button>
                )}
              </div>
            ))}

            {inquiriesWaitingCoordinator.length === 0 && (
              <div className="p-8 bg-white rounded-xl border border-stone-200 text-center text-xs text-stone-500">
                {ui.noQuestions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. TAB: NOUVEL ÉLÈVE */}
      {activeSection === 'nouvel-eleve' && (
        <div className="max-w-2xl mx-auto bg-white p-7 md:p-9 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">{ui.enrollKicker}</span>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mt-1">{ui.enrollTitle}</h2>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed font-sans">
              {ui.enrollIntro}
            </p>
          </div>

          {childSuccessToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{ui.enrollOk}</span>
            </div>
          )}

          <form onSubmit={handleCreateChild} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.firstName}</label>
                <input
                  type="text"
                  required
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="Ex. Dieudonné"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.birthYear}</label>
                <input
                  type="number"
                  min="2008"
                  max="2022"
                  value={newBirthYear}
                  onChange={(e) => setNewBirthYear(parseInt(e.target.value) || 2017)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.gender}</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as 'gutt' | 'jente')}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                >
                  <option value="gutt">{ui.boy}</option>
                  <option value="jente">{ui.girl}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.classNow}</label>
                <input
                  type="text"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  placeholder="Ex. 3ème primaire"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.school}</label>
              <input
                type="text"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder={ui.schoolPh}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.context}</label>
              <textarea
                rows={3}
                required
                value={newContext}
                onChange={(e) => setNewContext(e.target.value)}
                placeholder={ui.contextPh}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.needs}</label>
              <input
                type="text"
                value={newNeeds}
                onChange={(e) => setNewNeeds(e.target.value)}
                placeholder={ui.needsPh}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-200">
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentPhoto}
                  onChange={(e) => setConsentPhoto(e.target.checked)}
                  className="rounded border-stone-300 text-[#4D6B3E] focus:ring-0"
                />
                <span>{ui.consentPhoto}</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentStory}
                  onChange={(e) => setConsentStory(e.target.checked)}
                  className="rounded border-stone-300 text-[#4D6B3E] focus:ring-0"
                />
                <span>{ui.consentStory}</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
            >
              {ui.savePupil}
            </button>
          </form>
        </div>
      )}

      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 flex items-end sm:items-center justify-center p-4">
          <form
            onSubmit={handleSaveMilestone}
            className="bg-white w-full max-w-lg rounded-2xl border border-stone-200 shadow-lg p-6 space-y-3 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-stone-900">{ui.saveMilestone}</h3>
              <button type="button" onClick={() => setIsMilestoneModalOpen(false)} className="cursor-pointer text-stone-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-xs font-semibold text-stone-700">
              {ui.selectPupil}
              <select
                value={msBarnId}
                onChange={(e) => setMsBarnId(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
              >
                {coordinatorChildren.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.fornavn} — {ch.internKode}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-stone-700">
              {ui.milestoneDate}
              <input
                type="date"
                value={msDate}
                onChange={(e) => setMsDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-700">
              {ui.milestoneTitleFr}
              <input
                required
                value={msTitleFr}
                onChange={(e) => setMsTitleFr(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-700">
              {ui.milestoneDescFr}
              <textarea
                required
                rows={3}
                value={msDescFr}
                onChange={(e) => setMsDescFr(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
              />
            </label>
            <div className="flex flex-wrap gap-1">
              {MILESTONE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="text-[11px] px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2.5 bg-[#4D6B3E] text-white rounded-lg text-sm font-medium cursor-pointer">
                {ui.saveMilestone}
              </button>
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(false)}
                className="px-4 py-2.5 bg-stone-100 rounded-lg text-sm cursor-pointer"
              >
                {ui.cancel}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
