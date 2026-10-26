import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ImagePickerField } from './ImagePickerField';
import { TestimonialEditor } from './TestimonialEditor';
import { WaitingSponsorsEditor } from './WaitingSponsorsEditor';
import { getPublishedWaitingSponsorCards } from '../../utils/waitingSponsors';
import { CmsLivePreview } from './CmsLivePreview';
import { CmsMediaLibraryPanel } from './CmsMediaLibraryPanel';
import { CmsSectionNav } from './CmsSectionNav';
import { RichTextEditor } from './RichTextEditor';
import { CmsPreviewSection } from '../../utils/cmsPreview';
import { AdultGraduateStory, Campaign, CmsContent, CmsHeroHeight, CmsStep, CmsPrincipleCard, CmsKpiStat, CmsCtaBanner, CmsHomeModuleId } from '../../types';
import { BETYNA_DEFAULT_HERO_IMAGE, heroImageSrcFromUrl } from '../../utils/cmsHeroImage';
import {
  clampHeroHeadlineMaxWidthPercent,
  DEFAULT_HERO_CTA_BUTTONS,
  DEFAULT_HERO_CTA_IMPACT,
  DEFAULT_HERO_LAYOUT,
  getHeroCtaBottomCss,
  getHeroHeadlinePlacement,
  getHeroHeightVh,
  getHeroObjectPosition,
  withHeroLayoutDefaults,
} from '../../utils/heroLayout';
import { HeroAnniversaryBadge } from '../public/HeroAnniversaryBadge';
import {
  Layers,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
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

type CmsSubTab = CmsHomeModuleId | 'media';

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
    firestoreSave,
    firestoreBackendActive,
    firestoreSaveNow,
  } = useApp();

  const formatSavedTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });

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

  const formContainerRef = useRef<HTMLDivElement>(null);

  const handleSelectSectionFromPreview = (section: CmsPreviewSection) => {
    setActiveSubTab(section as CmsSubTab);
    // Smooth scroll to top of editing form panel
    formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Focus first editable input in the form
    setTimeout(() => {
      const firstInput = formContainerRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input:not([type="hidden"]), textarea, select'
      );
      firstInput?.focus();
    }, 150);
  };

  // 1. HERO UPDATE HANDLERS
  const handleHeroTextChange = (field: keyof CmsContent['hero'], value: any) => {
    updateCmsSection('hero', {
      ...cmsContent.hero,
      [field]: value,
    });
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
  };

  // 2. STEPS 1-2-3 UPDATE HANDLERS
  const handleStepTextChange = (index: number, field: 'title' | 'description', value: string) => {
    const newSteps = [...cmsContent.steps];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value,
    };
    updateCmsSection('steps', newSteps);
  };

  const handleStepImageChange = (index: number, updates: { backgroundImageUrl?: string; backgroundPreset?: any }) => {
    const newSteps = [...cmsContent.steps];
    newSteps[index] = {
      ...newSteps[index],
      imageUrl: updates.backgroundImageUrl,
      imagePreset: updates.backgroundPreset,
    };
    updateCmsSection('steps', newSteps);
  };

  // 3. ABOUT / PRINCIPLES UPDATE HANDLERS
  const handlePrincipleTextChange = (index: number, field: 'title' | 'description', value: string) => {
    const newCards = [...cmsContent.aboutCards];
    newCards[index] = {
      ...newCards[index],
      [field]: value,
    };
    updateCmsSection('aboutCards', newCards);
  };

  const handlePrincipleImageChange = (index: number, updates: { backgroundImageUrl?: string }) => {
    const newCards = [...cmsContent.aboutCards];
    newCards[index] = {
      ...newCards[index],
      imageUrl: updates.backgroundImageUrl,
    };
    updateCmsSection('aboutCards', newCards);
  };

  const handlePrincipleIconChange = (index: number, iconName: CmsPrincipleCard['iconName']) => {
    const newCards = [...cmsContent.aboutCards];
    newCards[index] = {
      ...newCards[index],
      iconName,
    };
    updateCmsSection('aboutCards', newCards);
  };

  // 4. KPIS UPDATE HANDLERS
  const handleKpiChange = (index: number, field: 'value' | 'label' | 'sublabel', value: string) => {
    const newKpis = [...cmsContent.kpiStats];
    newKpis[index] = {
      ...newKpis[index],
      [field]: value,
    };
    updateCmsSection('kpiStats', newKpis);
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
  };

  const handleCtaImageChange = (updates: { backgroundImageUrl?: string; backgroundPreset?: any; scrimOpacity?: number }) => {
    const updated: CmsCtaBanner = {
      ...currentCtaBanner,
      ...updates,
    };
    updateCmsSection('ctaBanner', updated);
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
    <div className="space-y-3 font-sans">
      {/* Fast lagrelinje nederst til høyre: synlig uansett hvor langt ned man har rullet */}
      <div
        role="region"
        aria-label="Lagring"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-3 max-w-[calc(100vw-2rem)] pl-3 pr-1.5 py-1.5 rounded-xl border border-stone-200 bg-white/95 backdrop-blur-sm shadow-md"
      >
        <span className="text-[11px] min-w-0 truncate" role="status" aria-live="polite">
          {!firestoreBackendActive ? (
            <span className="text-stone-500">Lagring er ikke aktiv</span>
          ) : firestoreSave.state === 'error' ? (
            <span className="text-red-700">{firestoreSave.error || 'Kunne ikke lagre'}</span>
          ) : firestoreSave.state === 'saving' ? (
            <span className="text-amber-800">Lagrer …</span>
          ) : firestoreSave.state === 'saved' && firestoreSave.lastSavedAt ? (
            <span className="text-emerald-700">Lagret kl. {formatSavedTime(firestoreSave.lastSavedAt)}</span>
          ) : (
            <span className="text-stone-600">Alt er lagret</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => void firestoreSaveNow()}
          disabled={!firestoreBackendActive || firestoreSave.state === 'saving'}
          title={
            firestoreBackendActive
              ? 'Lagre endringer til databasen nå'
              : 'Lagring er ikke slått på. Logg inn som administrator, eller se meldingen øverst.'
          }
          className="shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Lagre</span>
        </button>
      </div>

      {/* Kortvarig melding nederst til venstre. Skyver ikke layouten. */}
      {saveToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 z-40 max-w-[min(20rem,calc(100vw-2rem))] px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 shadow-md"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="font-medium">{saveToast}</span>
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
          waitingCardsCount={getPublishedWaitingSponsorCards(cmsContent).length}
          campaignsCount={campaigns.length}
          previewOpen={previewOpen}
          onTogglePreview={() => setPreviewOpen((open) => !open)}
          pageWidth={cmsContent.pageWidth ?? 1120}
          onChangePageWidth={(width) => updateCmsSection('pageWidth', width)}
        />

        <div ref={formContainerRef} className="min-w-0 flex-1 w-full space-y-6">
      {/* =========================================================================
          TAB 1: HOVEDBANNER (HERO BANNER)
         ========================================================================= */}
      {activeSubTab === 'hero' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-stone-200 shadow-xs space-y-5">
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

              <RichTextEditor
                label="Ingress / Forklarende tekst *"
                sublabel="Formatér med fet, kursiv, lenker eller punktlister."
                content={cmsContent.hero.subtitle}
                onChange={(html) => handleHeroTextChange('subtitle', html)}
                minHeight="90px"
              />

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
                    Tre lag: bilde, løftetekst og fadder-CTA styres uavhengig (stor skjerm). Mobil: bilde, tekst, CTA.
                  </p>
                </div>

                {(() => {
                  const layout = withHeroLayoutDefaults(cmsContent.hero);
                  const headlinePlacement = getHeroHeadlinePlacement(cmsContent.hero);
                  const hangPx = layout.ctaHangBelowPx ?? layout.ctaOverlapPx ?? 176;
                  const setLayout = (patch: Partial<CmsContent['hero']>) => {
                    updateCmsSection('hero', { ...cmsContent.hero, ...patch });
                  };
                  const heightOptions: { value: CmsHeroHeight; label: string }[] = [
                    { value: 'compact', label: 'Lav (ca. 42 vh)' },
                    { value: 'medium', label: 'Middels (ca. 58 vh)' },
                    { value: 'tall', label: 'Høy (ca. 72 vh)' },
                    { value: 'custom', label: 'Egendefinert (vh)' },
                  ];
                  return (
                    <>
                      <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-3">
                        <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wide">Bilde</h5>
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

                        <label className="flex items-start gap-2 text-xs text-stone-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={layout.showAnniversaryBadge}
                            onChange={(e) => setLayout({ showAnniversaryBadge: e.target.checked })}
                            className="mt-0.5 rounded border-stone-300 text-[#4D6B3E] focus:ring-[#4D6B3E]"
                          />
                          <span>
                            <span className="font-semibold">Vis jubileumsbadge på hero-bildet</span>
                            <span className="block text-[10px] text-stone-500 mt-0.5">
                              Viser automatisk antall år siden 24. juni 2011 (f.eks. «15 år» i 2026). Ingen ekstra
                              tekst på forsiden.
                            </span>
                          </span>
                        </label>

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
                            checked={layout.imageMotion === 'slowZoom'}
                            onChange={(e) =>
                              setLayout({ imageMotion: e.target.checked ? 'slowZoom' : 'none' })
                            }
                            className="rounded border-stone-300 text-[#4D6B3E] focus:ring-[#4D6B3E]"
                          />
                          Sakte zoom på bildet (subtil bevegelse)
                        </label>
                        <p className="text-[10px] text-stone-500 -mt-1">Kun stor skjerm. Respekterer «redusert bevegelse» i systemet.</p>
                      </div>

                      <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-3">
                        <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wide">Løftetekst</h5>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Plassering (stor skjerm)</label>
                          <select
                            value={headlinePlacement}
                            onChange={(e) => {
                              const placement = e.target.value as 'onImage' | 'belowImage';
                              setLayout({
                                headlinePlacement: placement,
                                headlineOnImage: placement === 'onImage',
                              });
                            }}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900"
                          >
                            <option value="onImage">På bildet (lys tekst)</option>
                            <option value="belowImage">Under bildet (mørk tekst)</option>
                          </select>
                          <p className="text-[10px] text-stone-500 mt-1">
                            Velg <strong>Under bildet</strong> for tekst under hero (ikke bare Y nedover på bildet — da klippes teksten). Mobil viser alltid tekst under.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Tekstfarge</label>
                          <select
                            value={layout.headlineTone ?? 'auto'}
                            onChange={(e) =>
                              setLayout({
                                headlineTone: e.target.value as 'auto' | 'light' | 'dark',
                              })
                            }
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900"
                          >
                            <option value="auto">Automatisk (lys på bilde, mørk under)</option>
                            <option value="light">Lys tekst</option>
                            <option value="dark">Mørk tekst</option>
                          </select>
                        </div>

                        <div className="space-y-3 rounded-lg border border-stone-100 bg-stone-50/80 p-3">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Tekst horisontalt (X): {layout.headlinePosXPercent ?? 42} %
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={85}
                              value={layout.headlinePosXPercent ?? 42}
                              onChange={(e) => setLayout({ headlinePosXPercent: Number(e.target.value) })}
                              className="w-full accent-[#4D6B3E]"
                            />
                          </div>
                          {headlinePlacement === 'onImage' && (
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Tekst vertikalt (Y fra topp): {layout.headlinePosYPercent ?? 55} %
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={150}
                                value={layout.headlinePosYPercent ?? 55}
                                onChange={(e) => setLayout({ headlinePosYPercent: Number(e.target.value) })}
                                className="w-full accent-[#4D6B3E]"
                              />
                              <p className="text-[10px] text-stone-500 mt-1">
                                Y er relativt hele hero-scenen (bilde + heng), inntil 150 %. Teksten ligger utenfor
                                bildeklipp.
                              </p>
                            </div>
                          )}
                          {headlinePlacement === 'belowImage' && (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                  Luft under hero (px): {layout.headlineBelowGapPx ?? 24}
                                </label>
                                <input
                                  type="range"
                                  min={0}
                                  max={1200}
                                  value={layout.headlineBelowGapPx ?? 24}
                                  onChange={(e) => setLayout({ headlineBelowGapPx: Number(e.target.value) })}
                                  className="w-full accent-[#4D6B3E]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                  Tekst ned (ekstra): {layout.headlineBelowYOffsetPercent ?? 0} %
                                </label>
                                <input
                                  type="range"
                                  min={0}
                                  max={150}
                                  value={layout.headlineBelowYOffsetPercent ?? 0}
                                  onChange={(e) =>
                                    setLayout({ headlineBelowYOffsetPercent: Number(e.target.value) })
                                  }
                                  className="w-full accent-[#4D6B3E]"
                                />
                                <p className="text-[10px] text-stone-500 mt-1">
                                  Luft i px + Y nedover. Med fadder-CTA legges automatisk ekstra avstand til så teksten
                                  kommer under kortet.
                                </p>
                              </div>
                            </>
                          )}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Bredde: {layout.headlineMaxWidthPercent ?? 52} %
                            </label>
                            <input
                              type="range"
                              min={32}
                              max={100}
                              value={layout.headlineMaxWidthPercent ?? 52}
                              onChange={(e) =>
                                setLayout({
                                  headlineMaxWidthPercent: clampHeroHeadlineMaxWidthPercent(Number(e.target.value)),
                                })
                              }
                              className="w-full accent-[#4D6B3E]"
                            />
                            <p className="text-[10px] text-stone-500 mt-1">
                              Bredde gjelder tekstboksen (ikke bare maks). Full kolonne: X 0 % og bredde 100 %.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-3">
                        <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wide">Fadder-CTA</h5>
                        <div className="space-y-2 rounded-lg border border-stone-100 bg-stone-50/80 p-3">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Korttittel</label>
                            <input
                              type="text"
                              value={cmsContent.hero.ctaCardTitle ?? ''}
                              placeholder={DEFAULT_HERO_LAYOUT.ctaCardTitle}
                              onChange={(e) => setLayout({ ctaCardTitle: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Korttekst (ingress)</label>
                            <textarea
                              rows={2}
                              value={cmsContent.hero.ctaCardLead ?? ''}
                              placeholder={DEFAULT_HERO_LAYOUT.ctaCardLead}
                              onChange={(e) => setLayout({ ctaCardLead: e.target.value })}
                              className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 resize-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">Beløp knapp 1 (kr)</label>
                              <input
                                type="number"
                                min={50}
                                max={20000}
                                value={layout.ctaPresetAmount1 ?? 250}
                                onChange={(e) =>
                                  setLayout({ ctaPresetAmount1: Number(e.target.value) })
                                }
                                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">Beløp knapp 2 (kr)</label>
                              <input
                                type="number"
                                min={50}
                                max={20000}
                                value={layout.ctaPresetAmount2 ?? 350}
                                onChange={(e) =>
                                  setLayout({ ctaPresetAmount2: Number(e.target.value) })
                                }
                                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900"
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={layout.ctaShowCustomOption !== false}
                              onChange={(e) => setLayout({ ctaShowCustomOption: e.target.checked })}
                              className="rounded border-stone-300 text-[#4D6B3E] focus:ring-[#4D6B3E]"
                            />
                            Vis valgfritt beløp (tredje knapp)
                          </label>
                          {layout.ctaShowCustomOption !== false && (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Tekst tredje knapp</label>
                                <input
                                  type="text"
                                  value={cmsContent.hero.ctaCustomOptionLabel ?? ''}
                                  placeholder={DEFAULT_HERO_CTA_BUTTONS.customOptionLabel}
                                  onChange={(e) => setLayout({ ctaCustomOptionLabel: e.target.value })}
                                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">Min. valgfritt (kr)</label>
                                <input
                                  type="number"
                                  min={50}
                                  value={layout.ctaCustomAmountMin ?? 100}
                                  onChange={(e) =>
                                    setLayout({ ctaCustomAmountMin: Number(e.target.value) })
                                  }
                                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900"
                                />
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Forklaring ved beløp 1 (tom = standard)
                            </label>
                            <textarea
                              rows={2}
                              value={cmsContent.hero.ctaImpactLineAmount1 ?? ''}
                              placeholder={DEFAULT_HERO_CTA_IMPACT.amount1}
                              onChange={(e) => setLayout({ ctaImpactLineAmount1: e.target.value })}
                              className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Forklaring ved beløp 2 (tom = standard)
                            </label>
                            <textarea
                              rows={2}
                              value={cmsContent.hero.ctaImpactLineAmount2 ?? ''}
                              placeholder={DEFAULT_HERO_CTA_IMPACT.amount2}
                              onChange={(e) => setLayout({ ctaImpactLineAmount2: e.target.value })}
                              className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                              Forklaring valgfritt beløp ({'{beløp}'})
                            </label>
                            <textarea
                              rows={2}
                              value={cmsContent.hero.ctaImpactLineCustom ?? ''}
                              placeholder={DEFAULT_HERO_CTA_IMPACT.custom}
                              onChange={(e) => setLayout({ ctaImpactLineCustom: e.target.value })}
                              className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 resize-none"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={layout.ctaPrimaryButtonReflectAmount !== false}
                              onChange={(e) =>
                                setLayout({ ctaPrimaryButtonReflectAmount: e.target.checked })
                              }
                              className="rounded border-stone-300 text-[#4D6B3E] focus:ring-[#4D6B3E]"
                            />
                            Vipps-knapp viser valgt beløp
                          </label>
                          {layout.ctaPrimaryButtonReflectAmount !== false ? (
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Vipps-knapp (bruk {'{beløp}'})
                              </label>
                              <input
                                type="text"
                                value={cmsContent.hero.ctaPrimaryButtonTemplate ?? ''}
                                placeholder={DEFAULT_HERO_CTA_BUTTONS.primaryButtonTemplate}
                                onChange={(e) => setLayout({ ctaPrimaryButtonTemplate: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">Primærknapp (fast tekst)</label>
                              <input
                                type="text"
                                value={cmsContent.hero.primaryButtonText}
                                placeholder={DEFAULT_HERO_CTA_BUTTONS.primaryButtonText}
                                onChange={(e) => setLayout({ primaryButtonText: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Sekundær lenke</label>
                            <input
                              type="text"
                              value={cmsContent.hero.secondaryButtonText}
                              placeholder={DEFAULT_HERO_CTA_BUTTONS.secondaryButtonText}
                              onChange={(e) => setLayout({ secondaryButtonText: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900"
                            />
                          </div>
                          <p className="text-[10px] text-stone-500">
                            Ekte Vipps-trekk krever Recurring API fra Vipps MobilePay (bestilles på salgsenheten).
                            Inntil backend er klar lagres ønsket beløp ved innsending.
                          </p>
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
                          <div className="space-y-3 rounded-lg border border-stone-100 bg-stone-50/80 p-3">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                CTA horisontalt (X): {layout.ctaPosXPercent ?? 0} %
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={75}
                                step={1}
                                value={layout.ctaPosXPercent ?? 0}
                                onChange={(e) => setLayout({ ctaPosXPercent: Number(e.target.value) })}
                                className="w-full accent-[#4D6B3E]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                CTA vertikalt (Y fra bunn): {layout.ctaPosYPercent ?? 10} %
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={layout.ctaPosYPercent ?? 10}
                                onChange={(e) => setLayout({ ctaPosYPercent: Number(e.target.value) })}
                                className="w-full accent-[#4D6B3E]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Heng under hero-bunn: {hangPx} px
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={480}
                                step={4}
                                value={hangPx}
                                onChange={(e) => {
                                  const px = Number(e.target.value);
                                  setLayout({ ctaHangBelowPx: px, ctaOverlapPx: px });
                                }}
                                className="w-full accent-[#4D6B3E]"
                              />
                              <p className="text-[10px] text-stone-500 mt-1">
                                Trekkes fra bunn-posisjonen — ikke i tillegg til Y-verdien.
                              </p>
                            </div>

                            <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={layout.ctaEnter === 'fromLeft'}
                                onChange={(e) =>
                                  setLayout({ ctaEnter: e.target.checked ? 'fromLeft' : 'none' })
                                }
                                className="rounded border-stone-300 text-[#4D6B3E] focus:ring-[#4D6B3E]"
                              />
                              Gli inn fra venstre etter forsinkelse
                            </label>
                            {layout.ctaEnter === 'fromLeft' && (
                              <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                  Forsinkelse: {layout.ctaEnterDelaySec ?? 0} s
                                </label>
                                <input
                                  type="range"
                                  min={0}
                                  max={6}
                                  step={0.5}
                                  value={layout.ctaEnterDelaySec ?? 0}
                                  onChange={(e) => setLayout({ ctaEnterDelaySec: Number(e.target.value) })}
                                  className="w-full accent-[#4D6B3E]"
                                />
                                <p className="text-[10px] text-stone-500 mt-1">Kun stor skjerm. Endring gjelder neste «Spill av».</p>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => setLayout({ heroMotionReplayAt: Date.now() })}
                              className="text-xs font-semibold text-[#4D6B3E] hover:text-[#3B522F] underline-offset-2 hover:underline"
                            >
                              Spill av animasjon
                            </button>
                          </div>
                        )}

                        {headlinePlacement === 'belowImage' && hangPx > 0 && layout.showCtaCard && (
                          <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                            Kortet kan dekke teksten under. Øk luft eller reduser heng.
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
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

                  <RichTextEditor
                    label="Forklaringstekst *"
                    content={step.description}
                    onChange={(html) => handleStepTextChange(idx, 'description', html)}
                    minHeight="80px"
                  />

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

      {activeSubTab === 'waiting' && (
        <WaitingSponsorsEditor onViewPublicSite={() => setPreviewOpen(true)} />
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

                  <RichTextEditor
                    label="Beskrivelsestekst *"
                    content={card.description}
                    onChange={(html) => handlePrincipleTextChange(idx, 'description', html)}
                    minHeight="80px"
                  />

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
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-stone-200 shadow-xs space-y-5">
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
              onSelectSection={handleSelectSectionFromPreview}
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
