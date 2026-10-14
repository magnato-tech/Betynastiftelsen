import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VisualCard } from '../common/VisualCard';
import { Child, Report, ChildMilestone, MilestoneCategory } from '../../types';
import { ChildHistoryTimeline } from '../common/ChildHistoryTimeline';
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
  HelpCircle,
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
} from 'lucide-react';
import { SocialImpactMetrics } from './SocialImpactMetrics';

interface CoordinatorPortalProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
}

export const CoordinatorPortal: React.FC<CoordinatorPortalProps> = ({
  activeSection,
  setActiveSection,
}) => {
  const {
    childrenList,
    reports,
    milestones,
    inquiries,
    addChild,
    submitReport,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    coordinatorReplyToInquiry,
    currentRoleNotifications,
    markNotificationAsRead,
  } = useApp();

  const coordinatorReportAlert = currentRoleNotifications.find(
    (n) => (n.type === 'report_needs_approval' || n.type === 'report_rejected') && !n.read
  );

  // Milestone / History Timeline State
  const [selectedTimelineChildId, setSelectedTimelineChildId] = useState<string>('all');
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ChildMilestone | null>(null);
  const [msBarnId, setMsBarnId] = useState<string>(childrenList[0]?.id || '');
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
  const [selectedChildId, setSelectedChildId] = useState<string>(childrenList[0]?.id || '');
  const [reportTitleFr, setReportTitleFr] = useState('');
  const [reportContentFr, setReportContentFr] = useState('');
  const [schoolPerformance, setSchoolPerformance] = useState('');
  const [attendancePct, setAttendancePct] = useState<number>(95);
  const [reportSuccessToast, setReportSuccessToast] = useState(false);

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
    const targetId = childId || (selectedTimelineChildId !== 'all' ? selectedTimelineChildId : childrenList[0]?.id || '');
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

    const targetChild = childrenList.find((c) => c.id === msBarnId);
    const childName = targetChild?.fornavn || 'Élève';

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
      setMilestoneToast(`Jalon d'étape modifié avec succès pour ${childName}.`);
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
      setMilestoneToast(`Nouveau jalon enregistré pour ${childName} ! Reflété sur le tableau de bord du parrain.`);
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
  };

  // Filter inquiries waiting for coordinator
  const inquiriesWaitingCoordinator = inquiries.filter(
    (inq) => inq.status === 'venter_koordinator' || inq.status === 'under_behandling'
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* 1. Header banner (Français) */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 md:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-stone-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#A3B18A] font-semibold uppercase tracking-wider">
            <span>Espace Terrain — Congo-Brazzaville</span>
            <span aria-hidden="true">·</span>
            <span>Brazzaville</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">
            Portail de Coordination & Suivi des Enfants
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl font-sans leading-relaxed">
            Vous enregistrez les données vérifiées des élèves, documentez l'assiduité scolaire et soumettez les rapports pour validation par le bureau d'Oslo. Aucune publication directe aux parrains sans validation administrative.
          </p>
        </div>

        {/* Action quick links */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setActiveSection('impact')}
            className="px-4 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Impact & Métriques</span>
          </button>
          <button
            onClick={() => {
              openAddMilestoneModal();
              setActiveSection('jalons');
            }}
            className="px-4 py-2.5 bg-[#A3B18A] hover:bg-[#8F9E77] text-stone-900 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Award className="w-4 h-4" />
            <span>+ Jalon d'étape</span>
          </button>
          <button
            onClick={() => setActiveSection('nouveau')}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Nouveau rapport</span>
          </button>
          <button
            onClick={() => setActiveSection('nouvel-eleve')}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Inscrire un élève</span>
          </button>
        </div>
      </div>

      {/* 2. Subnav tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveSection('eleves')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'eleves' || activeSection === 'home'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          Élèves suivis ({childrenList.length})
        </button>
        <button
          onClick={() => setActiveSection('jalons')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'jalons'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-[#4D6B3E]" />
          <span>Jalons & Chronologie ({milestones.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('impact')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'impact'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#4D6B3E]" />
          <span>Indicateurs d'impact</span>
        </button>
        <button
          onClick={() => setActiveSection('rapports')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'rapports'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          Rapports envoyés ({reports.length})
        </button>
        <button
          onClick={() => setActiveSection('questions')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'questions'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#4D6B3E]" />
          <span>Questions d'Oslo ({inquiriesWaitingCoordinator.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('nouveau')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'nouveau'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          + Rédiger un rapport
        </button>
        <button
          onClick={() => setActiveSection('nouvel-eleve')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'nouvel-eleve'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          + Nouvel élève
        </button>
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
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#4D6B3E]">Suivi des rapports</span>
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
              <span>Consulter les rapports</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              onClick={() => markNotificationAsRead(coordinatorReportAlert.id)}
              className="px-2.5 py-2 text-stone-500 hover:text-stone-800 rounded-lg cursor-pointer"
            >
              Fermer
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
              <p className="text-[11px] text-stone-500">Synchronisé avec le profil du fadderbarn et la tidslinje du parrain.</p>
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

      {/* 3. TAB: ÉLÈVES SUIVIS */}
      {(activeSection === 'eleves' || activeSection === 'home') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">Registre des élèves accompagnés</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Données vérifiées et statut du parrainage pour chaque enfant.
              </p>
            </div>
          </div>

          {/* Quick Metrics Strip on Eleves view */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#A3B18A]/20 text-[#4D6B3E] flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-stone-900">Indicateurs d'impact consolidés (Congo-Brazzaville)</span>
                <span className="text-stone-600 ml-2">
                  112 élèves soutenus · 96.1% de complétion primaire · Assiduité moyenne vérifiée
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveSection('impact')}
              className="text-[#4D6B3E] hover:text-[#3B522F] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Consulter le tableau d'impact Recharts</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {childrenList.map((ch) => {
              const childReps = reports.filter((r) => r.barnId === ch.id);
              const isAssigned = !!ch.tildeltFadderId;

              return (
                <div
                  key={ch.id}
                  className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-stone-800">{ch.internKode}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          isAssigned
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-[#A3B18A]/20 text-[#4D6B3E]'
                        }`}
                      >
                        {isAssigned ? 'Parrain assigné' : 'En attente de parrain'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-serif font-bold text-stone-900">
                        {ch.fornavn} ({new Date().getFullYear() - ch.fodselsaar} ans)
                      </h3>
                      <p className="text-xs text-stone-600 font-medium">{ch.klassetrinn}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{ch.skoleNavn}</p>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed font-sans">
                      {ch.bakgrunnskontekst}
                    </p>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span>{childReps.length} rapports rédigés</span>
                      <span className="flex items-center gap-1 text-[#4D6B3E] font-medium">
                        <Award className="w-3.5 h-3.5" />
                        <span>{milestones.filter((m) => m.barnId === ch.id).length} jalons</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => {
                          setSelectedTimelineChildId(ch.id);
                          setActiveSection('jalons');
                        }}
                        className="py-2 px-2 bg-[#F6F4ED] hover:bg-[#A3B18A]/20 text-[#3C3C3C] border border-[#A3B18A]/40 font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                        title="Consulter la chronologie des jalons de cet élève"
                      >
                        <History className="w-3.5 h-3.5 text-[#4D6B3E]" />
                        <span>Jalons ({milestones.filter((m) => m.barnId === ch.id).length})</span>
                      </button>
                      <button
                        onClick={() => openAddMilestoneModal(ch.id)}
                        className="py-2 px-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        title="Enregistrer un nouveau jalon pour cet élève"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Jalon</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedChildId(ch.id);
                        setActiveSection('nouveau');
                      }}
                      className="w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Rédiger un rapport
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: JALONS D'ÉTAPE & CHRONOLOGIE DES ÉLÈVES */}
      {activeSection === 'jalons' && (
        <div className="space-y-8">
          {/* Top banner */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4D6B3E]">
                <span>Suivi Individuel & Chronologie</span>
                <span aria-hidden="true">·</span>
                <span>Terrain Congo-Brazzaville</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                Jalons d'étape & Historique des Enfants
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl font-sans leading-relaxed">
                Documentez les réussites scolaires, examens, remises d'équipement, bilans de santé et événements personnels marquants. Les jalons enregistrés ci-dessous alimentent directement la tidslinje du parrain en Norvège.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => openAddMilestoneModal(selectedTimelineChildId !== 'all' ? selectedTimelineChildId : undefined)}
                className="px-4 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Enregistrer un jalon</span>
              </button>
            </div>
          </div>

          {/* Child Selector Strip */}
          <div className="bg-[#F6F4ED] p-4 sm:p-5 rounded-2xl border border-[#A3B18A]/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4D6B3E] flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Sélectionner un élève pour voir sa chronologie dédiée :</span>
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {selectedTimelineChildId === 'all'
                  ? `Affichage global · ${milestones.length} jalons répertoriés`
                  : `Élève sélectionné : ${childrenList.find(c => c.id === selectedTimelineChildId)?.fornavn || ''}`}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedTimelineChildId('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedTimelineChildId === 'all'
                    ? 'bg-[#4D6B3E] text-white shadow-2xs'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                Tous les élèves ({milestones.length})
              </button>
              {childrenList.map((c) => {
                const count = milestones.filter((m) => m.barnId === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedTimelineChildId(c.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      selectedTimelineChildId === c.id
                        ? 'bg-[#4D6B3E] text-white shadow-2xs'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <span>{c.fornavn}</span>
                    <span className="font-mono text-[11px] opacity-80">({c.internKode})</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        selectedTimelineChildId === c.id
                          ? 'bg-white/25 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Child focus context card (if an individual child is selected) */}
          {selectedTimelineChildId !== 'all' && (() => {
            const currentChild = childrenList.find((c) => c.id === selectedTimelineChildId);
            if (!currentChild) return null;

            return (
              <div className="bg-white p-5 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-[#A3B18A]/20 text-[#4D6B3E] flex items-center justify-center font-serif font-bold text-lg shrink-0">
                    {currentChild.fornavn.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-stone-900 text-base">{currentChild.fornavn}</h3>
                      <span className="font-mono text-xs px-2 py-0.5 bg-stone-100 rounded text-stone-600 font-semibold">{currentChild.internKode}</span>
                      <span className="text-xs text-stone-500">· {currentChild.klassetrinn} ({currentChild.skoleNavn})</span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Statut: {currentChild.tildeltFadderId ? <span className="text-emerald-700 font-semibold">Parrain assigné (visible sur son dashboard)</span> : <span className="text-stone-500">En attente d'assignation</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => openAddMilestoneModal(currentChild.id)}
                    className="px-3 py-1.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nouveau jalon pour {currentChild.fornavn}</span>
                  </button>
                  <button
                    onClick={() => setSelectedTimelineChildId('all')}
                    className="px-2.5 py-1.5 text-stone-500 hover:text-stone-800 text-xs rounded-lg cursor-pointer"
                  >
                    Voir tous les élèves
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Render Timeline with coordinator controls */}
          <ChildHistoryTimeline
            milestones={
              selectedTimelineChildId === 'all'
                ? milestones
                : milestones.filter((m) => m.barnId === selectedTimelineChildId)
            }
            childName={
              selectedTimelineChildId !== 'all'
                ? childrenList.find((c) => c.id === selectedTimelineChildId)?.fornavn
                : undefined
            }
            childCode={
              selectedTimelineChildId !== 'all'
                ? childrenList.find((c) => c.id === selectedTimelineChildId)?.internKode
                : undefined
            }
            isCoordinatorView={true}
            onAddMilestoneClick={() =>
              openAddMilestoneModal(
                selectedTimelineChildId !== 'all' ? selectedTimelineChildId : undefined
              )
            }
            onEditMilestone={openEditMilestoneModal}
            onDeleteMilestone={(id) => {
              deleteMilestone(id);
              setMilestoneToast('Jalon supprimé de la chronologie.');
              setTimeout(() => setMilestoneToast(null), 3000);
            }}
          />
        </div>
      )}

      {/* TAB: SOCIAL IMPACT METRICS */}
      {activeSection === 'impact' && (
        <SocialImpactMetrics onNavigateToTab={(tab) => setActiveSection(tab)} />
      )}

      {/* 4. TAB: RAPPORTS ENVOYÉS & STATUTS */}
      {activeSection === 'rapports' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">Rapports envoyés au bureau d'Oslo</h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Suivi de l'approbation et de la traduction de vos rapports.
            </p>
          </div>

          <div className="space-y-4">
            {reports.map((rep) => {
              const isApproved = rep.status === 'godkjent';
              const isPending = rep.status === 'innsendt';

              return (
                <div
                  key={rep.id}
                  className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-stone-500">
                      <span>Élève : <strong className="text-stone-800">{rep.barnNavn}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>Date : {rep.dato}</span>
                      <span aria-hidden="true">·</span>
                      <span>Assiduité : <strong className="font-mono">{rep.oppmoteProsent}%</strong></span>
                    </div>
                    <div>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approuvé & Publié au parrain</span>
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#A3B18A]/20 text-[#4D6B3E] rounded-md text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>En attente de validation à Oslo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-md text-xs font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Modifications requises</span>
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
                      <strong className="text-stone-800">Note du bureau d'Oslo : </strong>
                      <span>{rep.adminNotat}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB: NOUVEAU RAPPORT */}
      {activeSection === 'nouveau' && (
        <div className="max-w-2xl mx-auto bg-white p-7 md:p-9 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Formulaire de rapport</span>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mt-1">Rédiger un rapport de suivi scolaire</h2>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed font-sans">
              Rédigez votre observation en français. Elle sera transmise au bureau de Betyna en Norvège pour contrôle factuel, traduction et transmission au parrain.
            </p>
          </div>

          {reportSuccessToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Rapport soumis avec succès ! Il est maintenant en file d'attente à Oslo.</span>
            </div>
          )}

          <form onSubmit={handleCreateReport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Sélectionner l'élève *</label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                required
              >
                {childrenList.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.internKode} — {ch.fornavn} ({ch.klassetrinn}, {ch.skoleNavn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Titre du rapport (en français) *</label>
              <input
                type="text"
                required
                value={reportTitleFr}
                onChange={(e) => setReportTitleFr(e.target.value)}
                placeholder="Ex. Rapport trimestriel : Excellente assiduité et progrès en calcul"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Moyenne ou appréciation</label>
                <input
                  type="text"
                  value={schoolPerformance}
                  onChange={(e) => setSchoolPerformance(e.target.value)}
                  placeholder="Ex. 8.4/10 · Admis en classe supérieure"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Assiduité scolaire (%)</label>
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
              <label className="block text-xs font-semibold text-stone-700 mb-1">Contenu détaillé du rapport *</label>
              <textarea
                rows={5}
                required
                value={reportContentFr}
                onChange={(e) => setReportContentFr(e.target.value)}
                placeholder="Décrivez les apprentissages scolaires, le comportement, l'utilisation du matériel scolaire et toute observation utile. Pas de données médicales sensibles."
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
              />
            </div>

            <div className="p-3 bg-stone-100 rounded-lg border border-stone-200 text-xs text-stone-600 flex items-start gap-2">
              <Shield className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <span>
                Engagement éthique : les informations doivent être authentiques et contrôlées auprès de l'école.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Soumettre pour validation administrative</span>
            </button>
          </form>
        </div>
      )}

      {/* 6. TAB: QUESTIONS DU BUREAU D'OSLO */}
      {activeSection === 'questions' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">Demandes de clarification transmises par Oslo</h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Ces questions sont posées par des parrains et nécessitent des précisions du terrain.
            </p>
          </div>

          <div className="space-y-4">
            {inquiriesWaitingCoordinator.map((inq) => (
              <div
                key={inq.id}
                className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Élève concerné : <strong className="text-stone-800">{inq.barnNavn}</strong></span>
                  <span>Date : {inq.datoSendt}</span>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-xs font-semibold text-stone-600 mb-1">Question du parrain (traduite/résumée) :</p>
                  <p className="text-xs sm:text-sm text-stone-800 font-sans">{inq.sporsmaal}</p>
                </div>

                {inq.koordinatorNotatFr && (
                  <div className="p-3 bg-[#F6F4ED] rounded-lg border border-[#A3B18A] text-xs text-[#3C3C3C]">
                    <p className="font-semibold text-[#4D6B3E]">Note actuelle du coordinateur :</p>
                    <p>{inq.koordinatorNotatFr}</p>
                  </div>
                )}

                {replyingInquiryId === inq.id ? (
                  <div className="space-y-3 pt-2">
                    <textarea
                      rows={3}
                      value={coordinatorReplyFr}
                      onChange={(e) => setCoordinatorReplyFr(e.target.value)}
                      placeholder="Rédigez votre réponse ou précision pour Oslo..."
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReplyInquiry(inq.id)}
                        className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Enregistrer la réponse
                      </button>
                      <button
                        onClick={() => setReplyingInquiryId(null)}
                        className="px-3 py-2 bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Annuler
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
                    Répondre à cette question
                  </button>
                )}
              </div>
            ))}

            {inquiriesWaitingCoordinator.length === 0 && (
              <div className="p-8 bg-white rounded-xl border border-stone-200 text-center text-xs text-stone-500">
                Aucune question en attente de réponse actuellement.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. TAB: NOUVEL ÉLÈVE */}
      {activeSection === 'nouvel-eleve' && (
        <div className="max-w-2xl mx-auto bg-white p-7 md:p-9 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Enregistrement initial</span>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mt-1">Inscrire un nouvel élève au programme</h2>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed font-sans">
              Collectez uniquement les informations scolaires nécessaires. Pas de données de santé ou stigmatisantes (principe de minimisation des données).
            </p>
          </div>

          {childSuccessToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Élève inscrit avec succès ! Visible dans la liste et prêt pour attribution par Oslo.</span>
            </div>
          )}

          <form onSubmit={handleCreateChild} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Prénom de l'élève *</label>
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">Année de naissance</label>
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
                <label className="block text-xs font-semibold text-stone-700 mb-1">Genre</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as 'gutt' | 'jente')}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
                >
                  <option value="gutt">Garçon</option>
                  <option value="jente">Fille</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Classe actuelle</label>
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
              <label className="block text-xs font-semibold text-stone-700 mb-1">Établissement scolaire</label>
              <input
                type="text"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="Nom de l'école et ville"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Contexte et motivation de l'élève *</label>
              <textarea
                rows={3}
                required
                value={newContext}
                onChange={(e) => setNewContext(e.target.value)}
                placeholder="Décrivez avec dignité la situation d'apprentissage, l'environnement familial et la motivation de l'enfant."
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-[#4D6B3E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Besoins prioritaires couverts par le parrainage</label>
              <input
                type="text"
                value={newNeeds}
                onChange={(e) => setNewNeeds(e.target.value)}
                placeholder="Frais d'inscription, fournitures scolaires, uniforme et cantine."
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
                <span>Consentement écrit du tuteur légal pour la prise de photo scolaire</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentStory}
                  onChange={(e) => setConsentStory(e.target.checked)}
                  className="rounded border-stone-300 text-[#4D6B3E] focus:ring-0"
                />
                <span>Consentement pour le partage de l'histoire scolaire au parrain exclusif</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition-colors cursor-pointer"
            >
              Enregistrer l'élève dans la base sécurisée
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
