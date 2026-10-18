import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ImagePickerField } from './ImagePickerField';
import { TestimonialEditor } from './TestimonialEditor';
import { CmsLivePreview } from './CmsLivePreview';
import { CmsMediaLibraryPanel } from './CmsMediaLibraryPanel';
import { CmsSectionNav } from './CmsSectionNav';
import { AdultGraduateStory, Campaign, CmsContent, CmsHeroHeight, CmsStep, CmsPrincipleCard, CmsKpiStat, CmsCtaBanner } from '../../types';
import { BETYNA_DEFAULT_HERO_IMAGE, heroImageSrcFromUrl } from '../../utils/cmsHeroImage';
import { getHeroHeightVh, getHeroObjectPosition, withHeroLayoutDefaults } from '../../utils/heroLayout';
import { CMS_PAGE_WIDTH_OPTIONS, type CmsPageWidth } from '../../utils/cmsPageWidth';
import {
  Layout,
  Layers,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
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

type CmsSubTab = 'hero' | 'steps' | 'stories' | 'about' | 'kpis' | 'cta' | 'behov' | 'media';

interface CmsEditorProps {
  initialSubTab?: CmsSubTab;
}

export const CmsEditor: React.FC<CmsEditorProps> = ({ initialSubTab }) => {
  const {
    cmsContent,
    updateCmsSection,
    stories,
    addStory,
    updateStory,
    deleteStory,
    campaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    childrenList,
    mediaLibrary,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<CmsSubTab>(initialSubTab ?? 'hero');
  const [previewOpen, setPreviewOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1280
  );
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

  const [showNewCampaign, setShowNewCampaign] = useState(false);

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
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#4D6B3E] uppercase tracking-widest">
            <Layout className="w-3.5 h-3.5" />
            <span>Seksjonsbasert CMS · Betyna Stiftelsen</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">
            Offentlig innhold: nettside, aksjoner og vitnesbyrd
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Én arbeidsflate for det besøkende ser. Tekst, bilder, ekstraordinære aksjoner og godkjente vitnesbyrd. Endringer vises med én gang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPreviewOpen((open) => !open)}
            aria-pressed={previewOpen}
            className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs ${
              previewOpen
                ? 'bg-[#4D6B3E] text-white hover:bg-[#3B522F]'
                : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Forhåndsvis</span>
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

      {/* Active Brand Palette Bar — skjules når live-vinduet er åpent, for å gi plass */}
      {!previewOpen && (
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
      )}

      <div
        className={`flex flex-col lg:flex-row gap-3 items-start ${previewOpen ? 'xl:items-stretch xl:min-h-[calc(100vh-8rem)]' : ''}`}
      >
        <CmsSectionNav
          cmsContent={cmsContent}
          activeSubTab={activeSubTab}
          onSelectTab={setActiveSubTab}
          onUpdateLayout={(homeLayout) => updateCmsSection('homeLayout', homeLayout)}
          storiesCount={stories.length}
          campaignsCount={campaigns.length}
          previewOpen={previewOpen}
        />

        <div className="min-w-0 flex-1 w-full space-y-6">
      {/* =========================================================================
          TAB 1: HOVEDBANNER (HERO BANNER)
         ========================================================================= */}
      {activeSubTab === 'hero' && (
        <div className={`grid grid-cols-1 gap-6 ${previewOpen ? '' : 'lg:grid-cols-12 lg:gap-8'}`}>
          <div className={`${previewOpen ? '' : 'lg:col-span-7'} bg-white p-6 sm:p-7 rounded-xl border border-stone-200 shadow-xs space-y-5`}>
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900">Tekster og handlinger for hovedbanner</h3>
                <p className="text-xs text-stone-500 mt-0.5">Første inntrykk for besøkende på landingssiden.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Innholdsbredde på forsiden</label>
                <select
                  value={cmsContent.pageWidth ?? 1120}
                  onChange={(e) =>
                    updateCmsSection('pageWidth', Number(e.target.value) as CmsPageWidth)
                  }
                  className="w-full max-w-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
                >
                  {CMS_PAGE_WIDTH_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w} px
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-500 mt-1">
                  Samme bredde i footer, åpenhet og live forhåndsvisning.
                </p>
              </div>

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
                  sublabel={`Standard er gruppebildet (${BETYNA_DEFAULT_HERO_IMAGE}). Last opp eller lim inn adresse — motiver ligger i biblioteket under.`}
                  currentUrl={cmsContent.hero.backgroundImageUrl}
                  currentPreset={cmsContent.hero.backgroundPreset}
                  currentScrimOpacity={cmsContent.hero.scrimOpacity}
                  defaultRestoreUrl={BETYNA_DEFAULT_HERO_IMAGE}
                  mediaLibrary={mediaLibrary}
                  onChange={handleHeroBackgroundChange}
                />
              </div>

              <div className="pt-4 border-t border-stone-200 space-y-4">
                <div>
                  <h4 className="text-sm font-serif font-bold text-stone-900">Utforming på forsiden</h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Høyde, beskjæring (fokuspunkt) og fadder-CTA som ligger delvis over bildet.
                  </p>
                </div>

                {(() => {
                  const layout = withHeroLayoutDefaults(cmsContent.hero);
                  const setLayout = (patch: Partial<CmsContent['hero']>) => {
                    updateCmsSection('hero', { ...cmsContent.hero, ...patch });
                    showNotification('Hero-utforming oppdatert!');
                  };
                  const heightOptions: { value: CmsHeroHeight; label: string }[] = [
                    { value: 'compact', label: 'Lav (ca. 42 vh)' },
                    { value: 'medium', label: 'Middels (ca. 58 vh)' },
                    { value: 'tall', label: 'Høy (ca. 72 vh)' },
                    { value: 'custom', label: 'Egendefinert (vh)' },
                  ];
                  return (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Hero-høyde</label>
                        <select
                          value={layout.heroHeight}
                          onChange={(e) => setLayout({ heroHeight: e.target.value as CmsHeroHeight })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900"
                        >
                          {heightOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {layout.heroHeight === 'custom' && (
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Egendefinert høyde: {layout.heroHeightCustomVh} vh
                          </label>
                          <input
                            type="range"
                            min={28}
                            max={92}
                            value={layout.heroHeightCustomVh}
                            onChange={(e) => setLayout({ heroHeightCustomVh: Number(e.target.value) })}
                            className="w-full accent-[#4D6B3E]"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Fokus horisontalt: {layout.focalPointX}%
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={layout.focalPointX}
                            onChange={(e) => setLayout({ focalPointX: Number(e.target.value) })}
                            className="w-full accent-[#4D6B3E]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Fokus vertikalt: {layout.focalPointY}%
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={layout.focalPointY}
                            onChange={(e) => setLayout({ focalPointY: Number(e.target.value) })}
                            className="w-full accent-[#4D6B3E]"
                          />
                          <p className="text-[10px] text-stone-500 mt-1">Lavere verdi viser mer av toppen (ansikter).</p>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={layout.showCtaCard}
                          onChange={(e) => setLayout({ showCtaCard: e.target.checked })}
                          className="rounded border-stone-300 text-[#4D6B3E] focus:ring-[#4D6B3E]"
                        />
                        Vis fadder-CTA over hero-bildet
                      </label>

                      {layout.showCtaCard && (
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            CTA overlapp oppover: {layout.ctaOverlapPx} px
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={280}
                            step={4}
                            value={layout.ctaOverlapPx}
                            onChange={(e) => setLayout({ ctaOverlapPx: Number(e.target.value) })}
                            className="w-full accent-[#4D6B3E]"
                          />
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Mini-forhåndsvisning av banneret når live-vinduet er lukket */}
          {!previewOpen && (
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Sanntids forhåndsvisning
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Oppdateres direkte</span>
            </div>

            <div
              className="relative overflow-hidden rounded-2xl border border-stone-300 bg-stone-900 text-white shadow-md"
              style={{ height: `${Math.min(320, (getHeroHeightVh(cmsContent.hero) / 100) * 280)}px` }}
            >
              {cmsContent.hero.backgroundImageUrl || cmsContent.hero.backgroundPreset ? (
                <img
                  src={heroImageSrcFromUrl(
                    cmsContent.hero.backgroundImageUrl,
                    cmsContent.hero.backgroundPreset
                  )}
                  alt="Bakgrunn forhåndsvisning"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: getHeroObjectPosition(cmsContent.hero) }}
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
                className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/50 to-transparent pointer-events-none"
                style={{ opacity: (cmsContent.hero.scrimOpacity || 75) / 100 }}
              />

              {withHeroLayoutDefaults(cmsContent.hero).showCtaCard && (
                <div
                  className="absolute left-4 right-4 z-10 rounded-lg border border-white/20 bg-white/95 text-stone-900 px-3 py-2 text-[10px] font-semibold shadow-lg"
                  style={{ bottom: `${withHeroLayoutDefaults(cmsContent.hero).ctaOverlapPx * 0.35}px` }}
                >
                  Fadder-CTA (forhåndsvisning)
                </div>
              )}
            </div>
            <p className="text-[11px] text-stone-500">
              Tekst og knapper under hero styres separat på forsiden. Juster fokus for ansikter og føtter.
            </p>
          </div>
          )}
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
          </div>

          <div className={`grid grid-cols-1 gap-4 ${previewOpen ? '' : 'md:grid-cols-3'}`}>
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
                      mediaLibrary={mediaLibrary}
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
        <TestimonialEditor onViewPublicSite={() => setPreviewOpen(true)} />
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
                      mediaLibrary={mediaLibrary}
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
                Fire tall: skolegang, videregående, fagbrev (métier) og bachelor. Ikke oppmøte og ikke lederlønn. Bytt tallene her når dere har bekreftede antall.
              </p>
            </div>
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
        <div className={`grid grid-cols-1 gap-6 ${previewOpen ? '' : 'lg:grid-cols-12 lg:gap-8'}`}>
          <div className={`${previewOpen ? '' : 'lg:col-span-7'} bg-white p-6 sm:p-7 rounded-xl border border-stone-200 shadow-xs space-y-5`}>
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900">Fadderoppfordring (CTA-banner)</h3>
                <p className="text-xs text-stone-500 mt-0.5">Båndet som oppfordrer besøkende til å melde interesse som fadder.</p>
              </div>
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
                  mediaLibrary={mediaLibrary}
                  onChange={handleCtaImageChange}
                />
              </div>
            </div>
          </div>

          {!previewOpen && (
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
          )}
        </div>
      )}

      {activeSubTab === 'media' && <CmsMediaLibraryPanel />}

      {activeSubTab === 'behov' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900">Ekstraordinære aksjoner</h3>
              <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
                Dette er det besøkende ser under Konkrete behov. Hver aksjon må knyttes til barn i fadderordningen — ikke til en skoleklasse. Innsamlet beløp kommer fra gaver og redigeres ikke her.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewCampaign(true)}
              className="px-4 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Ny aksjon
            </button>
          </div>

          {showNewCampaign && (
            <CampaignForm
              title="Ny aksjon"
              childrenList={childrenList}
              mediaLibrary={mediaLibrary}
              initial={{
                tittel: '',
                beskrivelse: '',
                enhetBeskrivelse: '',
                maalbelop: 0,
                status: 'aktiv',
                barnIds: [],
                sluttrapport: '',
                bildeUrl: '',
              }}
              onCancel={() => setShowNewCampaign(false)}
              onSave={(draft) => {
                if (!draft.tittel.trim() || draft.barnIds.length === 0) {
                  showNotification('Skriv tittel og knytt minst ett barn før du publiserer.');
                  return;
                }
                addCampaign({
                  tittel: draft.tittel.trim(),
                  beskrivelse: draft.beskrivelse.trim(),
                  enhetBeskrivelse: draft.enhetBeskrivelse.trim(),
                  maalbelop: draft.maalbelop,
                  status: draft.status,
                  barnIds: draft.barnIds,
                  sluttrapport: draft.sluttrapport || undefined,
                  bildeUrl: draft.bildeUrl || undefined,
                });
                setShowNewCampaign(false);
                showNotification('Aksjonen er publisert på den åpne siden.');
              }}
            />
          )}

          {campaigns.length === 0 && !showNewCampaign && (
            <p className="text-sm text-stone-500">Ingen aksjoner ennå. Opprett den første her.</p>
          )}

          {campaigns.map((camp) => (
            <CampaignForm
              key={camp.id}
              title={camp.tittel}
              childrenList={childrenList}
              mediaLibrary={mediaLibrary}
              liveProgress={{ innsamlet: camp.innsamletBelop, givere: camp.antallGivere }}
              initial={{
                tittel: camp.tittel,
                beskrivelse: camp.beskrivelse,
                enhetBeskrivelse: camp.enhetBeskrivelse,
                maalbelop: camp.maalbelop,
                status: camp.status,
                barnIds: camp.barnIds ?? [],
                sluttrapport: camp.sluttrapport || '',
                bildeUrl: camp.bildeUrl || '',
              }}
              onSave={(draft) => {
                if (!draft.tittel.trim() || draft.barnIds.length === 0) {
                  showNotification('Tittel og minst ett barn er påkrevd.');
                  return;
                }
                updateCampaign(camp.id, {
                  tittel: draft.tittel.trim(),
                  beskrivelse: draft.beskrivelse.trim(),
                  enhetBeskrivelse: draft.enhetBeskrivelse.trim(),
                  maalbelop: draft.maalbelop,
                  status: draft.status,
                  barnIds: draft.barnIds,
                  sluttrapport: draft.sluttrapport || undefined,
                  bildeUrl: draft.bildeUrl.trim() || undefined,
                });
                showNotification(`«${draft.tittel.trim()}» er oppdatert.`);
              }}
              onDelete={() => {
                if (window.confirm(`Slette aksjonen «${camp.tittel}» fra den åpne siden?`)) {
                  deleteCampaign(camp.id);
                  showNotification('Aksjonen er fjernet.');
                }
              }}
              onImageChange={(url) => {
                updateCampaign(camp.id, { bildeUrl: url });
                showNotification(`Bildet for «${camp.tittel}» er oppdatert.`);
              }}
            />
          ))}
        </div>
      )}
        </div>
        {previewOpen && (
          <div className="w-full xl:flex-[1.25] xl:min-w-[40%] shrink-0 min-w-0">
            <CmsLivePreview
              section={activeSubTab === 'media' ? null : activeSubTab}
              onClose={() => setPreviewOpen(false)}
              cmsContent={cmsContent}
              stories={stories}
              campaigns={campaigns}
            />
          </div>
        )}
      </div>
    </div>
  );
};

type CampaignDraft = {
  tittel: string;
  beskrivelse: string;
  enhetBeskrivelse: string;
  maalbelop: number;
  status: Campaign['status'];
  barnIds: string[];
  sluttrapport: string;
  bildeUrl: string;
};

function CampaignForm({
  title,
  childrenList,
  mediaLibrary,
  initial,
  liveProgress,
  onSave,
  onCancel,
  onDelete,
  onImageChange,
}: {
  title: string;
  childrenList: { id: string; fornavn: string; internKode: string }[];
  mediaLibrary: import('../../types').MediaLibraryItem[];
  initial: CampaignDraft;
  liveProgress?: { innsamlet: number; givere: number };
  onSave: (draft: CampaignDraft) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onImageChange?: (url: string) => void;
}) {
  const [draft, setDraft] = useState<CampaignDraft>({
    ...initial,
    barnIds: initial.barnIds ?? [],
  });

  const toggleChild = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      barnIds: prev.barnIds.includes(id) ? prev.barnIds.filter((x) => x !== id) : [...prev.barnIds, id],
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-base font-serif font-bold text-stone-900">{title}</h4>
        {liveProgress && (
          <span className="text-xs font-mono font-semibold text-stone-800 shrink-0">
            {liveProgress.innsamlet.toLocaleString('no-NO')} kr · {liveProgress.givere} givere
          </span>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1">Tittel *</label>
        <input
          type="text"
          value={draft.tittel}
          onChange={(e) => setDraft({ ...draft, tittel: e.target.value })}
          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 font-medium focus:outline-hidden focus:border-[#4D6B3E]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1">Beskrivelse</label>
        <textarea
          rows={4}
          value={draft.beskrivelse}
          onChange={(e) => setDraft({ ...draft, beskrivelse: e.target.value })}
          className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-[#4D6B3E] resize-none leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-700 mb-1">Enhet / fordeling</label>
          <input
            type="text"
            value={draft.enhetBeskrivelse}
            onChange={(e) => setDraft({ ...draft, enhetBeskrivelse: e.target.value })}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
            placeholder="f.eks. 3 maskiner à 3 000 kr"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Målbeløp (kr)</label>
          <input
            type="number"
            min={0}
            value={draft.maalbelop}
            onChange={(e) => setDraft({ ...draft, maalbelop: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-mono focus:outline-hidden focus:border-[#4D6B3E]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-stone-700">Status</span>
        <button
          type="button"
          onClick={() => setDraft({ ...draft, status: 'aktiv' })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
            draft.status === 'aktiv' ? 'bg-[#4D6B3E] text-white' : 'bg-stone-100 text-stone-700 border border-stone-200'
          }`}
        >
          Aktiv på nettsiden
        </button>
        <button
          type="button"
          onClick={() => setDraft({ ...draft, status: 'fullfort' })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
            draft.status === 'fullfort' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700 border border-stone-200'
          }`}
        >
          Fullført
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-2">Knyttet til barn *</label>
        <div className="flex flex-wrap gap-2">
          {childrenList.map((child) => {
            const selected = (draft.barnIds ?? []).includes(child.id);
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => toggleChild(child.id)}
                className={`px-2.5 py-1 rounded-md text-xs cursor-pointer border ${
                  selected
                    ? 'bg-[#4D6B3E] text-white border-[#4D6B3E]'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {child.fornavn}
              </button>
            );
          })}
        </div>
      </div>

      {draft.status === 'fullfort' && (
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Sluttrapport (hvordan midlene ble brukt)</label>
          <textarea
            rows={3}
            value={draft.sluttrapport}
            onChange={(e) => setDraft({ ...draft, sluttrapport: e.target.value })}
            className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-[#4D6B3E] resize-none"
          />
        </div>
      )}

      {onImageChange && (
        <ImagePickerField
          label="Bilde på behovskortet"
          sublabel="Last opp fra maskinen, velg et ferdig motiv, eller lim inn en adresse."
          currentUrl={draft.bildeUrl}
          currentPreset={draft.bildeUrl ? 'custom' : 'pattern'}
          showScrimSlider={false}
          mediaLibrary={mediaLibrary}
          onChange={(updates) => {
            const url = updates.backgroundImageUrl || '';
            setDraft((prev) => ({ ...prev, bildeUrl: url }));
            onImageChange(url);
          }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-stone-600 border border-stone-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              Avbryt
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-3 py-2 text-red-700 hover:bg-red-50 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Slett
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="px-4 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded-lg text-xs font-medium cursor-pointer"
        >
          Lagre aksjon
        </button>
      </div>
    </div>
  );
}
