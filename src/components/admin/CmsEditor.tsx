import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ImagePickerField } from './ImagePickerField';
import { TestimonialEditor } from './TestimonialEditor';
import { AdultGraduateStory, CmsContent, CmsStep, CmsPrincipleCard, CmsKpiStat, CmsCtaBanner } from '../../types';
import {
  Layout,
  Layers,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  Sparkles,
  Link2,
  Upload,
  Image as ImageIcon,
  ArrowRight,
  BookOpen,
  Scale,
  FileCheck,
  Users,
  Megaphone,
} from 'lucide-react';

interface CmsEditorProps {
  onViewPublicSite: () => void;
}

type CmsSubTab = 'hero' | 'steps' | 'stories' | 'about' | 'kpis' | 'cta' | 'behov';

export const CmsEditor: React.FC<CmsEditorProps> = ({ onViewPublicSite }) => {
  const {
    cmsContent,
    updateCmsSection,
    resetCmsSection,
    resetAllCms,
    stories,
    addStory,
    updateStory,
    deleteStory,
    campaigns,
    updateCampaign,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<CmsSubTab>('hero');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Story modal state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [storyName, setStoryName] = useState('');
  const [storyAge, setStoryAge] = useState<number>(24);
  const [storyJob, setStoryJob] = useState('');
  const [storyEdu, setStoryEdu] = useState('');
  const [storyText, setStoryText] = useState('');
  const [storyYear, setStoryYear] = useState<number>(2024);
  const [storyBildeUrl, setStoryBildeUrl] = useState('');
  const [storyConsent, setStoryConsent] = useState(true);

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // 1. HERO UPDATE HANDLERS
  const handleHeroTextChange = (field: keyof CmsContent['hero'], value: any) => {
    updateCmsSection('hero', {
      ...cmsContent.hero,
      [field]: value,
    });
    showNotification('Hovedbanner oppdatert umiddelbart!');
  };

  const handleHeroBackgroundChange = (updates: {
    backgroundImageUrl?: string;
    backgroundPreset?: any;
    scrimOpacity?: number;
  }) => {
    updateCmsSection('hero', {
      ...cmsContent.hero,
      ...updates,
    });
    showNotification('Bakgrunn oppdatert!');
  };

  // 2. STEPS 1-2-3 UPDATE HANDLERS
  const handleStepTextChange = (index: number, field: 'title' | 'description', value: string) => {
    const newSteps = [...cmsContent.steps];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value,
    };
    updateCmsSection('steps', newSteps);
    showNotification(`Ramme ${index + 1} tekst oppdatert!`);
  };

  const handleStepImageChange = (index: number, updates: { backgroundImageUrl?: string; backgroundPreset?: any }) => {
    const newSteps = [...cmsContent.steps];
    newSteps[index] = {
      ...newSteps[index],
      imageUrl: updates.backgroundImageUrl,
      imagePreset: updates.backgroundPreset,
    };
    updateCmsSection('steps', newSteps);
    showNotification(`Bilde for Ramme ${index + 1} oppdatert!`);
  };

  // 3. ABOUT / PRINCIPLES UPDATE HANDLERS
  const handlePrincipleTextChange = (index: number, field: 'title' | 'description', value: string) => {
    const newCards = [...cmsContent.aboutCards];
    newCards[index] = {
      ...newCards[index],
      [field]: value,
    };
    updateCmsSection('aboutCards', newCards);
    showNotification('Kjerneramme oppdatert!');
  };

  const handlePrincipleImageChange = (index: number, updates: { backgroundImageUrl?: string }) => {
    const newCards = [...cmsContent.aboutCards];
    newCards[index] = {
      ...newCards[index],
      imageUrl: updates.backgroundImageUrl,
    };
    updateCmsSection('aboutCards', newCards);
    showNotification('Rammebilde oppdatert!');
  };

  const handlePrincipleIconChange = (index: number, iconName: CmsPrincipleCard['iconName']) => {
    const newCards = [...cmsContent.aboutCards];
    newCards[index] = {
      ...newCards[index],
      iconName,
    };
    updateCmsSection('aboutCards', newCards);
    showNotification('Ikon oppdatert!');
  };

  // 4. KPIS UPDATE HANDLERS
  const handleKpiChange = (index: number, field: 'value' | 'label' | 'sublabel', value: string) => {
    const newKpis = [...cmsContent.kpiStats];
    newKpis[index] = {
      ...newKpis[index],
      [field]: value,
    };
    updateCmsSection('kpiStats', newKpis);
    showNotification('Nøkkeltall oppdatert!');
  };

  // 5. CTA BANNER UPDATE HANDLERS
  const currentCtaBanner: CmsCtaBanner = cmsContent.ctaBanner || {
    title: 'Ønsker du å vite mer om fadderansvaret?',
    subtitle: 'Fadderbeløpet er 250 eller 350 kr/mnd og går uavkortet til det barnet trenger for å fullføre skolegangen.',
    buttonText: 'Meld interesse som fadder',
    backgroundImageUrl: '',
    backgroundPreset: 'pattern',
    scrimOpacity: 75,
  };

  const handleCtaTextChange = (field: keyof CmsCtaBanner, value: any) => {
    const updated: CmsCtaBanner = {
      ...currentCtaBanner,
      [field]: value,
    };
    updateCmsSection('ctaBanner', updated);
    showNotification('Oppfordringsbanner oppdatert!');
  };

  const handleCtaImageChange = (updates: { backgroundImageUrl?: string; backgroundPreset?: any; scrimOpacity?: number }) => {
    const updated: CmsCtaBanner = {
      ...currentCtaBanner,
      ...updates,
    };
    updateCmsSection('ctaBanner', updated);
    showNotification('Bannerbilde oppdatert!');
  };

  // 6. STORY HANDLERS
  const handleSaveStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyName.trim() || !storyText.trim()) return;

    if (editingStoryId) {
      updateStory(editingStoryId, {
        navn: storyName.trim(),
        alder: storyAge,
        naavaerendeYrke: storyJob.trim(),
        utdanningslop: storyEdu.trim(),
        historie: storyText.trim(),
        aarFullfort: storyYear,
        bildeUrl: storyBildeUrl.trim() || undefined,
        samtykkeDokumentert: storyConsent,
        godkjentAvAdmin: true,
      });
      showNotification(`Vitnesbyrd for "${storyName}" ble oppdatert.`);
    } else {
      addStory({
        navn: storyName.trim(),
        alder: storyAge,
        naavaerendeYrke: storyJob.trim(),
        utdanningslop: storyEdu.trim(),
        historie: storyText.trim(),
        aarFullfort: storyYear,
        bildeUrl: storyBildeUrl.trim() || undefined,
        samtykkeDokumentert: storyConsent,
        godkjentAvAdmin: true,
      });
      showNotification(`Nytt vitnesbyrd for "${storyName}" ble opprettet.`);
    }

    setEditingStoryId(null);
    setShowStoryModal(false);
    resetStoryForm();
  };

  const startEditStory = (story: AdultGraduateStory) => {
    setEditingStoryId(story.id);
    setStoryName(story.navn);
    setStoryAge(story.alder ?? 24);
    setStoryJob(story.naavaerendeYrke ?? '');
    setStoryEdu(story.utdanningslop ?? '');
    setStoryText(story.historie);
    setStoryYear(story.aarFullfort ?? 2024);
    setStoryBildeUrl(story.bildeUrl || '');
    setStoryConsent(story.samtykkeDokumentert);
    setShowStoryModal(true);
  };

  const resetStoryForm = () => {
    setStoryName('');
    setStoryAge(24);
    setStoryJob('');
    setStoryEdu('');
    setStoryText('');
    setStoryYear(2025);
    setStoryBildeUrl('');
    setStoryConsent(true);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Header with Breadcrumb and Global CMS Actions */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#4D6B3E] uppercase tracking-widest">
            <Layout className="w-3.5 h-3.5" />
            <span>Seksjonsbasert CMS · Betyna Stiftelsen</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">
            Rediger tekster, bilde-URLer og filopplastinger
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Full kontroll over innhold, bilder og visuell stil på den offentlige landingssiden. Endringer trer i kraft umiddelbart.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onViewPublicSite}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Forhåndsvis offentlig side</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Er du sikker på at du vil tilbakestille alt CMS-innhold til standardtekst og standardbilder?')) {
                resetAllCms();
                showNotification('Alt innhold ble tilbakestilt til standard.');
              }
            }}
            className="px-3 py-2 text-stone-500 hover:text-stone-800 border border-stone-300 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
            title="Tilbakestill alle seksjoner"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Tilbakestill alt</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">{saveToast}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-mono">Lagret i nettleseren</span>
        </div>
      )}

      {/* Active Brand Palette Bar */}
      <div className="bg-[#F6F4ED] border border-[#DFD9CB] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#4D6B3E] shrink-0" />
          <span className="font-semibold text-[#3C3C3C]">Aktiv fargeprofil:</span>
          <span className="text-stone-600">Integrert på tvers av hele løsningen</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto text-[11px] font-mono">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-stone-200 shadow-2xs">
            <span className="w-3.5 h-3.5 rounded-full bg-[#4D6B3E] border border-stone-300 shrink-0" />
            <span className="font-bold text-[#4D6B3E]">#4D6B3E</span>
            <span className="text-stone-400 font-sans text-[10px]">Primær</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-stone-200 shadow-2xs">
            <span className="w-3.5 h-3.5 rounded-full bg-[#A3B18A] border border-stone-300 shrink-0" />
            <span className="font-bold text-stone-700">#A3B18A</span>
            <span className="text-stone-400 font-sans text-[10px]">Aksent</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-stone-200 shadow-2xs">
            <span className="w-3.5 h-3.5 rounded-full bg-[#F6F4ED] border border-stone-300 shrink-0" />
            <span className="font-bold text-stone-700">#F6F4ED</span>
            <span className="text-stone-400 font-sans text-[10px]">Bakgrunn</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-stone-200 shadow-2xs">
            <span className="w-3.5 h-3.5 rounded-full bg-[#3C3C3C] border border-stone-300 shrink-0" />
            <span className="font-bold text-stone-700">#3C3C3C</span>
            <span className="text-stone-400 font-sans text-[10px]">Koksgrå</span>
          </div>
        </div>
      </div>

      {/* Section Subtabs */}
      <div className="flex items-center gap-2 border-b border-[#DFD9CB] pb-3 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('hero')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'hero'
              ? 'bg-[#4D6B3E] text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Hovedbanner (Hero)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('steps')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'steps'
              ? 'bg-[#4D6B3E] text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Fadderordningen (Ramme 1-2-3)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('stories')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'stories'
              ? 'bg-[#4D6B3E] text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Vitnesbyrd & Historier ({stories.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('about')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'about'
              ? 'bg-[#4D6B3E] text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Kjernerammer & Etikk</span>
        </button>
        <button
          onClick={() => setActiveSubTab('kpis')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'kpis'
              ? 'bg-[#4D6B3E] text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Nøkkeltallsbånd</span>
        </button>
        <button
          onClick={() => setActiveSubTab('cta')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'cta'
              ? 'bg-[#4D6B3E] text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Fadderoppfordring (CTA)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('behov')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'behov'
              ? 'bg-[#4D6B3E] text-white shadow-xs'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Konkrete behov</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: HOVEDBANNER (HERO BANNER)
         ========================================================================= */}
      {activeSubTab === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-xl border border-stone-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900">Tekster og handlinger for hovedbanner</h3>
                <p className="text-xs text-stone-500 mt-0.5">Første inntrykk for besøkende på landingssiden.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetCmsSection('hero');
                  showNotification('Hovedbanner tilbakestilt til standard.');
                }}
                className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Tilbakestill seksjon</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Toppmerking (Kicker)</label>
                <input
                  type="text"
                  value={cmsContent.hero.kicker}
                  onChange={(e) => handleHeroTextChange('kicker', e.target.value)}
                  placeholder="F.eks. Betyna Stiftelsen · Norge & Kongo"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Hovedoverskrift (Tittel) *</label>
                <input
                  type="text"
                  value={cmsContent.hero.title}
                  onChange={(e) => handleHeroTextChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 font-serif font-bold focus:outline-hidden focus:border-[#4D6B3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Ingress / Forklarende tekst *</label>
                <textarea
                  rows={3}
                  value={cmsContent.hero.subtitle}
                  onChange={(e) => handleHeroTextChange('subtitle', e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:border-[#4D6B3E] resize-none font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Primærknapp (Handling)</label>
                  <input
                    type="text"
                    value={cmsContent.hero.primaryButtonText}
                    onChange={(e) => handleHeroTextChange('primaryButtonText', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Sekundærknapp (Lenke)</label>
                  <input
                    type="text"
                    value={cmsContent.hero.secondaryButtonText}
                    onChange={(e) => handleHeroTextChange('secondaryButtonText', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900"
                  />
                </div>
              </div>

              {/* Background image & preset picker with URL and Local Upload */}
              <div className="pt-2">
                <ImagePickerField
                  label="Bakgrunnsbilde for hovedbanner"
                  sublabel="Velg et kuratert motiv, last opp en lokal bildefil, eller lim inn en bilde-URL."
                  currentUrl={cmsContent.hero.backgroundImageUrl}
                  currentPreset={cmsContent.hero.backgroundPreset}
                  currentScrimOpacity={cmsContent.hero.scrimOpacity}
                  onChange={handleHeroBackgroundChange}
                />
              </div>
            </div>
          </div>

          {/* Right: Live Preview of Hero Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Sanntids forhåndsvisning
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Oppdateres direkte</span>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-stone-300 bg-stone-900 text-white aspect-[4/3] shadow-md flex flex-col justify-end p-6">
              {cmsContent.hero.backgroundImageUrl ? (
                <img
                  src={cmsContent.hero.backgroundImageUrl}
                  alt="Bakgrunn forhåndsvisning"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 opacity-25">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="preview-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="#A3B18A" strokeWidth="0.75" />
                        <circle cx="20" cy="20" r="1.5" fill="#E5E7EB" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#preview-pattern)" />
                  </svg>
                </div>
              )}

              {/* Scrim Overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/80 to-stone-900/40"
                style={{ opacity: (cmsContent.hero.scrimOpacity || 75) / 100 }}
              />

              <div className="relative space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#A3B18A]">
                  {cmsContent.hero.kicker}
                </span>
                <h3 className="text-lg font-serif font-bold text-white leading-tight">
                  {cmsContent.hero.title}
                </h3>
                <p className="text-[11px] text-stone-300 line-clamp-3 leading-relaxed">
                  {cmsContent.hero.subtitle}
                </p>
                <div className="flex gap-2 pt-1">
                  <span className="px-3 py-1 bg-[#4D6B3E] text-white text-[10px] font-semibold rounded-md">
                    {cmsContent.hero.primaryButtonText}
                  </span>
                  <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-medium rounded-md border border-white/30">
                    {cmsContent.hero.secondaryButtonText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: FADDERORDNINGENS 3 TRINN (RAMME 1, 2, 3)
         ========================================================================= */}
      {activeSubTab === 'steps' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900">
                Fadderordningens 3 trinn (Ramme 1, 2, 3)
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Rediger tittel, forklaring og valgfritt illustrasjonsbilde for hver av de 3 rammene på nettsiden.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetCmsSection('steps');
                showNotification('Trinn 1-2-3 tilbakestilt til standard.');
              }}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tilbakestill trinn</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cmsContent.steps.map((step, idx) => (
              <div
                key={step.number}
                className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-lg bg-[#A3B18A]/25 text-[#4D6B3E] font-serif font-bold flex items-center justify-center text-base">
                      {step.number}
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono">Ramme #{step.number}</span>
                  </div>

                  {/* Card visual preview */}
                  <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-100 h-28 flex items-center justify-center">
                    {step.imageUrl ? (
                      <img
                        src={step.imageUrl}
                        alt={`Ramme ${step.number}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-3 text-stone-400 space-y-1">
                        <ImageIcon className="w-6 h-6 mx-auto stroke-1" />
                        <span className="text-[10px] block">Standard ikonvisning (ingen bilde satt)</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Tittel for trinn {step.number} *
                    </label>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => handleStepTextChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 font-medium focus:outline-hidden focus:border-[#4D6B3E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Forklaringstekst *</label>
                    <textarea
                      rows={3}
                      value={step.description}
                      onChange={(e) => handleStepTextChange(idx, 'description', e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-[#4D6B3E] resize-none font-sans leading-relaxed"
                    />
                  </div>

                  {/* Image Picker for Step */}
                  <div className="pt-2 border-t border-stone-100">
                    <ImagePickerField
                      label={`Bilde / illustrasjon for trinn ${step.number}`}
                      sublabel="Last opp fil eller angi URL for illustrasjon på kortet."
                      currentUrl={step.imageUrl}
                      currentPreset={step.imagePreset}
                      showScrimSlider={false}
                      onChange={(updates) => handleStepImageChange(idx, updates)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: VITNESBYRD & HISTORIER (STORIES) -> TESTIMONIAL EDITOR
         ========================================================================= */}
      {activeSubTab === 'stories' && (
        <TestimonialEditor onViewPublicSite={onViewPublicSite} />
      )}

      {/* =========================================================================
          TAB 4: KJERNERAMMER & ETIKK (ABOUT CARDS)
         ========================================================================= */}
      {activeSubTab === 'about' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900">
                Stiftelsens kjernerammer og etiske prinsipper
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Rediger de fire grunnleggende rammene under «Om stiftelsen», inkludert tittel, forklaring, ikon og valgfritt bilde.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetCmsSection('aboutCards');
                showNotification('Kjernerammer tilbakestilt til standard.');
              }}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tilbakestill rammer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {cmsContent.aboutCards.map((card, idx) => (
              <div
                key={card.id}
                className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#4D6B3E] uppercase tracking-wider">
                      Ramme #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-stone-500 font-mono">Ikon :</span>
                      <select
                        value={card.iconName}
                        onChange={(e) => handlePrincipleIconChange(idx, e.target.value as any)}
                        className="px-2 py-1 bg-stone-50 border border-stone-300 rounded text-xs text-stone-800 font-sans"
                      >
                        <option value="Scale">Vektskål (Scale)</option>
                        <option value="FileCheck">Sjekkliste (FileCheck)</option>
                        <option value="ShieldCheck">Skjold (ShieldCheck)</option>
                        <option value="Users">Fellesskap (Users)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Tittel for ramme *</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => handlePrincipleTextChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 font-medium focus:outline-hidden focus:border-[#4D6B3E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Beskrivelsestekst *</label>
                    <textarea
                      rows={3}
                      value={card.description}
                      onChange={(e) => handlePrincipleTextChange(idx, 'description', e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-[#4D6B3E] resize-none font-sans leading-relaxed"
                    />
                  </div>

                  {/* Optional Image for Principle Card */}
                  <div className="pt-2 border-t border-stone-100">
                    <ImagePickerField
                      label={`Illustrasjonsbilde for Ramme #${idx + 1}`}
                      sublabel="Lokal fil eller bilde-URL (valgfritt)."
                      currentUrl={card.imageUrl}
                      showScrimSlider={false}
                      onChange={(updates) => handlePrincipleImageChange(idx, updates)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: NØKKELTALLS-BÅND (KPI STATS)
         ========================================================================= */}
      {activeSubTab === 'kpis' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900">
                Nøkkeltall og faktabånd
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Fire tall: skolegang, videregående, fagbrev (métier) og bachelor. Ikke oppmøte og ikke lederlønn. Foreløpig mock i prototypen (15 / 8 / 4 / 2). Bytt til bekreftede tall her før lansering.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetCmsSection('kpiStats');
                showNotification('Nøkkeltall tilbakestilt til standard.');
              }}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tilbakestill nøkkeltall</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cmsContent.kpiStats.map((kpi, idx) => (
              <div
                key={kpi.id}
                className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-mono">
                    Stat #{idx + 1}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Tall / Verdi *</label>
                  <input
                    type="text"
                    value={kpi.value}
                    onChange={(e) => handleKpiChange(idx, 'value', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-base text-stone-900 font-mono font-bold focus:outline-hidden focus:border-[#4D6B3E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Hovedetikett (Label) *</label>
                  <input
                    type="text"
                    value={kpi.label}
                    onChange={(e) => handleKpiChange(idx, 'label', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Undertekst / Kontekst</label>
                  <input
                    type="text"
                    value={kpi.sublabel}
                    onChange={(e) => handleKpiChange(idx, 'sublabel', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: FADDEROPPFORDRING / CTA-BANNER
         ========================================================================= */}
      {activeSubTab === 'cta' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-xl border border-stone-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900">Fadderoppfordring (CTA-banner)</h3>
                <p className="text-xs text-stone-500 mt-0.5">Båndet som oppfordrer besøkende til å melde interesse som fadder.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetCmsSection('ctaBanner');
                  showNotification('Oppfordringsbanner tilbakestilt til standard.');
                }}
                className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Tilbakestill seksjon</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Overskrift *</label>
                <input
                  type="text"
                  value={currentCtaBanner.title}
                  onChange={(e) => handleCtaTextChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 font-serif font-bold focus:outline-hidden focus:border-[#4D6B3E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Beskrivelsestekst *</label>
                <textarea
                  rows={3}
                  value={currentCtaBanner.subtitle}
                  onChange={(e) => handleCtaTextChange('subtitle', e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:border-[#4D6B3E] resize-none font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Handlingsknapp-tekst *</label>
                <input
                  type="text"
                  value={currentCtaBanner.buttonText}
                  onChange={(e) => handleCtaTextChange('buttonText', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-medium"
                />
              </div>

              {/* Background image & preset picker for CTA */}
              <div className="pt-2">
                <ImagePickerField
                  label="Bakgrunnsbilde for oppfordringsbåndet"
                  sublabel="Velg et motiv, last opp en lokal fil, eller lim inn en bilde-URL."
                  currentUrl={currentCtaBanner.backgroundImageUrl}
                  currentPreset={currentCtaBanner.backgroundPreset}
                  currentScrimOpacity={currentCtaBanner.scrimOpacity || 75}
                  onChange={handleCtaImageChange}
                />
              </div>
            </div>
          </div>

          {/* Right: Live Preview of CTA Banner */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Sanntids forhåndsvisning av CTA
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Oppdateres i sanntid</span>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-stone-300 bg-stone-900 text-white p-6 shadow-md flex flex-col justify-between min-h-[200px]">
              {currentCtaBanner.backgroundImageUrl ? (
                <img
                  src={currentCtaBanner.backgroundImageUrl}
                  alt="CTA bakgrunn"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 opacity-15">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="cta-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                        <circle cx="15" cy="15" r="1.5" fill="#A3B18A" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#cta-pattern)" />
                  </svg>
                </div>
              )}

              {/* Scrim */}
              <div
                className="absolute inset-0 bg-stone-950/70"
                style={{ opacity: (currentCtaBanner.scrimOpacity || 75) / 100 }}
              />

              <div className="relative space-y-2">
                <h4 className="text-base font-serif font-bold text-white">
                  {currentCtaBanner.title}
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {currentCtaBanner.subtitle}
                </p>
              </div>

              <div className="relative pt-4">
                <span className="inline-block px-4 py-2 bg-[#4D6B3E] text-white font-medium text-xs rounded-lg shadow-xs">
                  {currentCtaBanner.buttonText}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'behov' && (
        <div className="space-y-6">
          <p className="text-sm text-stone-600 leading-relaxed max-w-2xl">
            Hvert kort under Konkrete behov på forsiden kan ha sitt eget bilde. Last opp fra maskinen, eller lim inn en bildeadresse. Bildet vises med én gang.
          </p>
          {campaigns.map((camp) => (
            <div key={camp.id} className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900">{camp.tittel}</h3>
                <p className="text-xs text-stone-500 mt-1">{camp.enhetBeskrivelse}</p>
              </div>
              <ImagePickerField
                label="Bilde på behovskortet"
                sublabel="Last opp et bilde fra maskinen, velg et ferdig motiv, eller lim inn en adresse."
                currentUrl={camp.bildeUrl}
                currentPreset={camp.bildeUrl ? 'custom' : 'pattern'}
                showScrimSlider={false}
                onChange={(updates) => {
                  updateCampaign(camp.id, { bildeUrl: updates.backgroundImageUrl || '' });
                  showNotification(`Bildet for «${camp.tittel}» er oppdatert.`);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
