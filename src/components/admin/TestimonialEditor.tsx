import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AdultGraduateStory, CmsTestimonialsSection, TestimonialCategory } from '../../types';
import {
  FRONT_PAGE_TESTIMONIAL_ADMIN_HELP,
  getTestimonialFrontPageBlockers,
  getTestimonialFrontPageChecklist,
  isFrontPageTestimonial,
  resolvePublicImageUrl,
  withTestimonialsSectionDefaults,
} from '../../utils/testimonials';
import { buildTestimonialPhotoFields } from '../../utils/testimonialPhotoSave';
import { normalizeCmsHomeLayout, setHomeModuleVisible } from '../../utils/cmsHomeLayout';
import {
  TESTIMONIAL_FIELD_PHOTO_PRESETS,
  TESTIMONIAL_ILLUSTRATION_PHOTO_PRESETS,
  isTestimonialIllustrationImageUrl,
  testimonialPresetUrlForSrc,
  type TestimonialPhotoPreset,
} from '../../utils/testimonialPhotoPresets';
import { RichTextEditor } from './RichTextEditor';
import { SafeHtml } from '../common/SafeHtml';
import {
  Quote,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  Image as ImageIcon,
  Upload,
  Link2,
  X,
  Save,
  Check,
  Eye,
  EyeOff,
  User,
  Heart,
  GraduationCap,
  Scissors,
  ShieldCheck,
  AlertCircle,
  Info,
} from 'lucide-react';

interface TestimonialEditorProps {
  onViewPublicSite?: () => void;
}

export const TestimonialEditor: React.FC<TestimonialEditorProps> = ({ onViewPublicSite }) => {
  const { stories, addStory, updateStory, deleteStory, cmsContent, updateCmsSection, uploadMediaLibraryItem } =
    useApp();
  const testimonialsSection = withTestimonialsSectionDefaults(cmsContent.testimonialsSection);

  const [activeCategory, setActiveCategory] = useState<TestimonialCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [frontPageExplain, setFrontPageExplain] = useState<{
    story?: AdultGraduateStory;
    blockers: string[];
    justMarkedForFront: boolean;
    helpOnly?: boolean;
  } | null>(null);

  // Form fields
  const [formCategory, setFormCategory] = useState<TestimonialCategory>('donor');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formAge, setFormAge] = useState<number | ''>('');
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formText, setFormText] = useState('');
  const [formEdu, setFormEdu] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formBarneBildeUrl, setFormBarneBildeUrl] = useState('');
  const [formVoksenBildeUrl, setFormVoksenBildeUrl] = useState('');
  const [formConsent, setFormConsent] = useState(true);
  const [formApproved, setFormApproved] = useState(true);
  const [formFeatured, setFormFeatured] = useState(true);
  const [formIllustration, setFormIllustration] = useState(false);

  // Photo tab inside modal
  const [photoTab, setPhotoTab] = useState<'upload' | 'presets' | 'illustrations' | 'url'>('presets');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const testimonialPreviewSrc = (url: string) => {
    const trimmed = url.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return resolvePublicImageUrl(trimmed) ?? testimonialPresetUrlForSrc(trimmed);
  };

  const selectPhotoPreset = (preset: TestimonialPhotoPreset) => {
    setFormImageUrl(preset.url);
    setFormIllustration(Boolean(preset.illustration));
    if (formCategory === 'graduate') {
      setFormVoksenBildeUrl(preset.url);
    } else {
      setFormVoksenBildeUrl('');
    }
  };

  const renderPhotoPresetGrid = (presets: TestimonialPhotoPreset[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
      {presets.map((p) => (
        <div
          key={p.id}
          onClick={() => selectPhotoPreset(p)}
          className={`p-2 rounded-lg border text-left cursor-pointer transition-colors flex items-center gap-2.5 ${
            formImageUrl === p.url
              ? 'bg-[#4D6B3E]/10 border-[#4D6B3E]'
              : 'bg-white border-stone-200 hover:bg-stone-50'
          }`}
        >
          <div className="w-10 h-10 rounded-md overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
            <img
              src={testimonialPresetUrlForSrc(p.url)}
              alt={p.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-stone-800 text-[11px] truncate">{p.name}</p>
            <p className="text-[10px] text-stone-500 line-clamp-2">{p.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const filteredStories = useMemo(() => {
    return stories.filter((st) => {
      // Category filter
      const category = st.category || 'graduate';
      if (activeCategory !== 'all' && category !== activeCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = st.navn.toLowerCase().includes(q);
        const matchRole = (st.rolle || st.naavaerendeYrke || '').toLowerCase().includes(q);
        const matchLoc = (st.sted || '').toLowerCase().includes(q);
        const matchText = st.historie.toLowerCase().includes(q);
        return matchName || matchRole || matchLoc || matchText;
      }
      return true;
    });
  }, [stories, activeCategory, searchQuery]);

  const donorCount = stories.filter((s) => s.category === 'donor').length;
  const childCount = stories.filter((s) => s.category === 'child').length;
  const graduateCount = stories.filter((s) => (s.category || 'graduate') === 'graduate').length;

  const resetForm = () => {
    setEditingId(null);
    setFormCategory('donor');
    setFormName('');
    setFormRole('');
    setFormLocation('Oslo, Norge');
    setFormAge('');
    setFormYear(new Date().getFullYear());
    setFormText('');
    setFormEdu('');
    setFormImageUrl('');
    setFormBarneBildeUrl('');
    setFormVoksenBildeUrl('');
    setFormConsent(true);
    setFormApproved(true);
    setFormFeatured(true);
    setFormIllustration(false);
    setUploadError(null);
  };

  const openNewModal = (type: TestimonialCategory = 'donor') => {
    resetForm();
    setFormCategory(type);
    if (type === 'child') {
      setFormLocation('Brazzaville, Kongo-Brazzaville');
    }
    setIsModalOpen(true);
  };

  const openEditModal = (st: AdultGraduateStory) => {
    setEditingId(st.id);
    setFormCategory(st.category || 'graduate');
    setFormName(st.navn);
    setFormRole(st.rolle || st.naavaerendeYrke || '');
    setFormLocation(st.sted || '');
    setFormAge(st.alder ?? '');
    setFormYear(st.aarFullfort || new Date().getFullYear());
    setFormText(st.historie);
    setFormEdu(st.utdanningslop || '');
    const category = st.category || 'graduate';
    setFormImageUrl(st.bildeUrl || st.voksenBildeUrl || '');
    setFormBarneBildeUrl(st.barneBildeUrl || '');
    setFormVoksenBildeUrl(category === 'graduate' ? st.voksenBildeUrl || st.bildeUrl || '' : '');
    setFormConsent(st.samtykkeDokumentert);
    setFormApproved(st.godkjentAvAdmin);
    setFormFeatured(st.fremhevetPaaForside ?? true);
    setFormIllustration(
      st.illustrasjonsbilde ?? isTestimonialIllustrationImageUrl(st.bildeUrl ?? st.voksenBildeUrl)
    );
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Vennligst velg en gyldig bildefil (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Bildet er større enn 5 MB. Vennligst velg en mindre fil.');
      return;
    }

    setPhotoUploading(true);
    try {
      const label = formName.trim() ? `Vitnesbyrd: ${formName.trim()}` : 'Vitnesbyrd';
      const { url } = await uploadMediaLibraryItem(file, label);
      setFormImageUrl(url);
      setFormIllustration(false);
      if (formCategory === 'graduate') {
        setFormVoksenBildeUrl(url);
      } else {
        setFormVoksenBildeUrl('');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Kunne ikke laste opp bildefilen. Prøv igjen.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const patchTestimonialsSection = (patch: Partial<CmsTestimonialsSection>) => {
    updateCmsSection('testimonialsSection', {
      ...testimonialsSection,
      ...patch,
    });
    if (typeof patch.enabled === 'boolean') {
      updateCmsSection(
        'homeLayout',
        setHomeModuleVisible(normalizeCmsHomeLayout(cmsContent), 'stories', patch.enabled)
      );
    }
    setToastMessage('Seksjonstekst for vitnesbyrd oppdatert.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const readImageFile = (file: File, onDone: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Vennligst velg en gyldig bildefil (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Bildet er større enn 5 MB. Vennligst velg en mindre fil.');
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      onDone(dataUrl);
    };
    reader.onerror = () => setUploadError('Kunne ikke lese bildefilen.');
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) return;

    const photoFields = buildTestimonialPhotoFields({
      category: formCategory,
      formImageUrl,
      formBarneBildeUrl,
      formVoksenBildeUrl,
    });
    const primaryUrl = photoFields.bildeUrl;

    if (formCategory !== 'child' && formApproved && formFeatured && !primaryUrl) {
      setUploadError('Legg inn minst ett bilde for å vise kortet på forsiden.');
      return;
    }

    const payload: Partial<AdultGraduateStory> = {
      category: formCategory,
      navn: formName.trim(),
      rolle: formRole.trim() || undefined,
      sted: formLocation.trim() || undefined,
      alder: typeof formAge === 'number' ? formAge : undefined,
      naavaerendeYrke: formRole.trim() || formCategory,
      utdanningslop: formEdu.trim() || undefined,
      historie: formText.trim(),
      aarFullfort: typeof formYear === 'number' ? formYear : new Date().getFullYear(),
      bildeUrl: photoFields.bildeUrl,
      barneBildeUrl: photoFields.barneBildeUrl,
      voksenBildeUrl: photoFields.voksenBildeUrl,
      samtykkeDokumentert: formConsent,
      godkjentAvAdmin: formApproved,
      fremhevetPaaForside: formFeatured,
      illustrasjonsbilde: formIllustration,
      opprettetDato: new Date().toISOString().slice(0, 10),
    };

    if (editingId) {
      updateStory(editingId, payload);
      setToastMessage(`Vitnesbyrd for "${formName}" ble oppdatert.`);
    } else {
      addStory(payload as Omit<AdultGraduateStory, 'id'>);
      setToastMessage(`Nytt vitnesbyrd for "${formName}" er lagt til og publisert!`);
    }

    setIsModalOpen(false);
    resetForm();
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleDelete = (id: string) => {
    const target = stories.find((s) => s.id === id);
    deleteStory(id);
    setConfirmDeleteId(null);
    setToastMessage(`Vitnesbyrd for "${target?.navn || id}" ble slettet.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const showFrontPageBlockerExplain = (
    st: AdultGraduateStory,
    justMarkedForFront: boolean
  ) => {
    const blockers = getTestimonialFrontPageBlockers(st);
    if (blockers.length === 0) return false;
    setFrontPageExplain({ story: st, blockers, justMarkedForFront });
    return true;
  };

  const handleToggleFeatured = (st: AdultGraduateStory) => {
    const nextState = !(st.fremhevetPaaForside ?? true);
    updateStory(st.id, { fremhevetPaaForside: nextState });
    if (!nextState) {
      setToastMessage(`"${st.navn}" er skjult fra forsiden.`);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const updated: AdultGraduateStory = { ...st, fremhevetPaaForside: true };
    if (showFrontPageBlockerExplain(updated, true)) return;
    setToastMessage(`"${st.navn}" vises nå på forsiden.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExplainBlockersClick = (st: AdultGraduateStory) => {
    showFrontPageBlockerExplain(st, false);
  };

  const getCategoryMeta = (cat: TestimonialCategory = 'graduate') => {
    switch (cat) {
      case 'donor':
        return {
          label: 'Fadder / Giver',
          badgeBg: 'bg-[#4D6B3E]/10',
          badgeText: 'text-[#4D6B3E]',
          icon: Heart,
        };
      case 'child':
        return {
          label: 'Barn / Ungdom',
          badgeBg: 'bg-sky-50',
          badgeText: 'text-sky-700',
          icon: Scissors,
        };
      case 'graduate':
      default:
        return {
          label: 'Fullført utdanning',
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-700',
          icon: GraduationCap,
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* CMS: seksjon på forsiden */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-5">
        <div>
          <div className="flex items-start gap-2">
            <h3 className="text-base font-serif font-bold text-stone-900">Ekte vitnesbyrd på forsiden</h3>
            <button
              type="button"
              className="mt-0.5 p-1 rounded-md text-stone-500 hover:text-[#4D6B3E] hover:bg-stone-100 cursor-pointer shrink-0"
              title={FRONT_PAGE_TESTIMONIAL_ADMIN_HELP}
              aria-label="Forklaring om forsidesynlighet"
              onClick={() =>
                setFrontPageExplain({ blockers: [], justMarkedForFront: false, helpOnly: true })
              }
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            Rediger overskrift og rutenett. Kortene under bygges fra godkjente vitnesbyrd med bilde nedenfor — voksne
            mottakere og faddere. Hva som vises på forsiden styres med bilde, samtykke, godkjenning og På forsiden/Skjult.
          </p>
          <p className="text-[11px] text-stone-500 mt-2 max-w-2xl leading-relaxed">
            {FRONT_PAGE_TESTIMONIAL_ADMIN_HELP}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
          <input
            type="checkbox"
            checked={testimonialsSection.enabled !== false}
            onChange={(e) => patchTestimonialsSection({ enabled: e.target.checked })}
            className="rounded border-stone-300 text-[#4D6B3E]"
          />
          Vis seksjonen på forsiden
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Toppmerking</label>
            <input
              type="text"
              value={testimonialsSection.kicker}
              onChange={(e) => patchTestimonialsSection({ kicker: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Kolonner i rutenett</label>
            <select
              value={testimonialsSection.gridColumns ?? 3}
              onChange={(e) =>
                patchTestimonialsSection({ gridColumns: Number(e.target.value) as 2 | 3 })
              }
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
            >
              <option value={2}>2 kolonner (bredere kort)</option>
              <option value={3}>3 kolonner (standard)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">Overskrift</label>
            <input
              type="text"
              value={testimonialsSection.title}
              onChange={(e) => patchTestimonialsSection({ title: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-serif font-bold"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">Ingress</label>
            <textarea
              rows={2}
              value={testimonialsSection.subtitle}
              onChange={(e) => patchTestimonialsSection({ subtitle: e.target.value })}
              className="w-full p-3 bg-stone-50 border border-stone-300 rounded-lg text-xs resize-none"
            />
          </div>
        </div>
      </div>

      {/* 1. Header & Quick Controls */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4D6B3E]">
            <Quote className="w-4 h-4" />
            <span>Innholdsadministrasjon · Forsidevitnesbyrd</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            Testimonial Editor — Faddere, Elever & Resultater
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl font-sans leading-relaxed">
            Styr autentiske historier fra både norske faddere og barna/ungdommene i Kongo. Publiserte vitnesbyrd vises på den offentlige forsiden med bildestøtte og dokumentert etisk samtykke.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onViewPublicSite && (
            <button
              onClick={onViewPublicSite}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Se på forsiden
            </button>
          )}
          <button
            onClick={() => openNewModal('donor')}
            className="px-4 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Legg til vitnesbyrd</span>
          </button>
        </div>
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="p-4 bg-[#F6F4ED] border border-[#A3B18A] rounded-xl text-xs text-[#3C3C3C] flex items-center justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-[#4D6B3E]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-stone-900">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-stone-400 hover:text-stone-700 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Filter & Search Strip */}
      <div className="bg-[#F6F4ED] p-4 sm:p-5 rounded-2xl border border-[#A3B18A]/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs">
        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-stone-500 font-medium px-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#4D6B3E]" />
            <span>Kategori:</span>
          </span>
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-[#4D6B3E] text-white shadow-2xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Alle ({stories.length})
          </button>
          <button
            onClick={() => setActiveCategory('donor')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'donor'
                ? 'bg-[#4D6B3E] text-white shadow-2xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Faddere & Givere ({donorCount})</span>
          </button>
          <button
            onClick={() => setActiveCategory('child')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'child'
                ? 'bg-[#4D6B3E] text-white shadow-2xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Barn & Yrkesopplæring ({childCount})</span>
          </button>
          <button
            onClick={() => setActiveCategory('graduate')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'graduate'
                ? 'bg-[#4D6B3E] text-white shadow-2xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Fullført utdanning ({graduateCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk i navn, rolle, sitat..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-[#4D6B3E]"
          />
        </div>
      </div>

      <p className="text-[11px] text-stone-600 flex items-start gap-1.5 -mt-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#4D6B3E]" aria-hidden />
        <span>
          <strong className="font-semibold text-stone-700">På forsiden</strong> /{' '}
          <strong className="font-semibold text-stone-700">Skjult</strong> velger om kortet skal med.{' '}
          <strong className="font-semibold text-amber-800">Oransje merke</strong> betyr at krav mangler — klikk for
          forklaring.
        </span>
      </p>

      {/* 3. Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStories.map((st) => {
          const meta = getCategoryMeta(st.category);
          const Icon = meta.icon;
          const onFrontPage = isFrontPageTestimonial(st);
          const blockers = getTestimonialFrontPageBlockers(st);
          const wantsFront = st.fremhevetPaaForside !== false;

          return (
            <div
              key={st.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 flex flex-col justify-between space-y-4 hover:border-[#A3B18A] transition-colors"
            >
              <div className="space-y-4">
                {/* Header row: Category Badge & Badges */}
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${meta.badgeBg} ${meta.badgeText}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{meta.label}</span>
                  </span>

                  {onFrontPage ? (
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(st)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded cursor-pointer bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      title="Kortet vises på forsiden. Klikk for å skjule (det blir i biblioteket)."
                    >
                      <Eye className="w-3 h-3" />
                      <span>På forsiden</span>
                    </button>
                  ) : wantsFront && blockers.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleExplainBlockersClick(st)}
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 max-w-[9rem] text-left cursor-pointer hover:bg-amber-100"
                      title={`Kan ikke vises på forsiden ennå: ${blockers.join(' · ')}`}
                    >
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {blockers[0]}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(st)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded cursor-pointer bg-stone-100 text-stone-500 hover:bg-stone-200"
                      title="Skjult fra forsiden. Klikk for å merke for forsiden — du får forklaring hvis bilde, samtykke eller godkjenning mangler."
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>Skjult</span>
                    </button>
                  )}
                </div>

                {/* Author profile row: Photo + Name + Role */}
                <div className="flex items-start gap-3.5">
                  {st.bildeUrl ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                      <img
                        src={testimonialPreviewSrc(st.bildeUrl)}
                        alt={st.navn}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#A3B18A]/20 text-[#4D6B3E] flex items-center justify-center font-serif font-bold text-lg shrink-0">
                      {st.navn.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-serif font-bold text-stone-900 text-base truncate">
                      {st.navn}
                    </h3>
                    <p className="text-xs text-[#4D6B3E] font-medium truncate">
                      {st.rolle || st.naavaerendeYrke || meta.label}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {st.sted || (st.aarFullfort ? `Fullført ${st.aarFullfort}` : 'Norge')}
                    </p>
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="p-3.5 bg-[#F6F4ED] rounded-xl border border-[#A3B18A]/40 text-xs sm:text-sm text-[#3C3C3C] italic font-serif leading-relaxed">
                  {st.historie.trim().startsWith('<') ? (
                    <SafeHtml
                      html={st.historie}
                      className="not-italic font-sans rich-html"
                    />
                  ) : (
                    `«${st.historie}»`
                  )}
                </blockquote>

                {/* Context Details */}
                {st.utdanningslop && (
                  <div className="text-xs text-stone-600 space-y-0.5 pt-2 border-t border-stone-100">
                    <span className="font-semibold text-stone-800">Kontekst / Bakgrunn:</span>
                    <p className="line-clamp-2 text-stone-600">{st.utdanningslop}</p>
                  </div>
                )}
              </div>

              {/* Card Footer: Verified Consent + Action Buttons */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verifisert samtykke</span>
                  </span>
                  {st.bildeUrl && (
                    <span className="text-[#4D6B3E] font-medium flex items-center gap-0.5">
                      <ImageIcon className="w-3 h-3" />
                      <span>Med foto</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => openEditModal(st)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-stone-600" />
                    <span>Rediger</span>
                  </button>

                  {confirmDeleteId === st.id ? (
                    <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 text-xs">
                      <span className="text-rose-700 font-medium">Slette?</span>
                      <button
                        onClick={() => handleDelete(st.id)}
                        className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 cursor-pointer text-xs"
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 text-stone-600 hover:text-stone-900 cursor-pointer text-xs"
                      >
                        Nei
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(st.id)}
                      className="px-3 py-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Slett vitnesbyrd"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredStories.length === 0 && (
          <div className="col-span-full p-12 bg-white rounded-2xl border border-stone-200 text-center space-y-3">
            <Quote className="w-10 h-10 text-stone-300 mx-auto" />
            <h4 className="text-base font-serif font-bold text-stone-800">
              Ingen vitnesbyrd funnet
            </h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Ingen historier matcher det valgte filteret eller søket. Klikk på knappen under for å opprette et nytt vitnesbyrd for forsiden.
            </p>
            <button
              onClick={() => openNewModal('donor')}
              className="px-4 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Opprett vitnesbyrd</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. MODAL: ADD / EDIT TESTIMONIAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-xl border border-stone-200 space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4D6B3E] mb-1">
                  <Quote className="w-4 h-4" />
                  <span>{editingId ? 'Rediger forsidevitnesbyrd' : 'Nytt forsidevitnesbyrd'}</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  {editingId ? `Rediger vitnesbyrd for ${formName}` : 'Opprett historie med foto for forsiden'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Historien vises i den offentlige sitatseksjonen for å gi besøkende troverdig innsikt.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
              {/* Category Segment Selector */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1.5">
                  Type vitnesbyrd *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormCategory('donor')}
                    className={`py-2 px-3 rounded-lg font-medium border text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      formCategory === 'donor'
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Fadder / Giver</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory('child')}
                    className={`py-2 px-3 rounded-lg font-medium border text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      formCategory === 'child'
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Barn / Yrkesopplæring</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory('graduate')}
                    className={`py-2 px-3 rounded-lg font-medium border text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      formCategory === 'graduate'
                        ? 'bg-[#4D6B3E] text-white border-[#4D6B3E] shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Fullført elev</span>
                  </button>
                </div>
              </div>

              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Navn på person eller fadderpar *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Navn"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Rolle eller tittel *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="f.eks. Fadder siden 2024 / Jente i yrkesopplæring"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
                  />
                </div>
              </div>

              {/* Location & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Sted / By
                  </label>
                  <input
                    type="text"
                    placeholder="f.eks. Oslo, Norge eller Masina, Brazzaville"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Alder (valgfritt)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    placeholder="f.eks. 16"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
                  />
                </div>
              </div>

              {/* Sitat / Historie */}
              <RichTextEditor
                label="Sitat / Vitnesbyrd (vises som hovedtekst) *"
                sublabel="Formatér med fet, kursiv, understreking, sitat eller punktliste."
                placeholder="Skriv det personlige sitatet eller vitnesbyrdet..."
                content={formText}
                onChange={setFormText}
                minHeight="120px"
              />

              {/* Utdypende kontekst */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Utdypende kontekst / Skolegang / Formål
                </label>
                <input
                  type="text"
                  placeholder="f.eks. Månedlig fadderbidrag til skolegang og materiell / Fullført yrkesutdanning"
                  value={formEdu}
                  onChange={(e) => setFormEdu(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
                />
              </div>

              {/* PHOTO SUPPORT SECTION */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#4D6B3E]" />
                    <span>Bildestøtte & Portrettfoto</span>
                  </label>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormImageUrl('');
                        setFormIllustration(false);
                        if (formCategory !== 'graduate') setFormVoksenBildeUrl('');
                      }}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Fjern bilde
                    </button>
                  )}
                </div>

                {/* Photo Preview if set */}
                {formImageUrl && (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-stone-200">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                      <img
                        src={testimonialPreviewSrc(formImageUrl)}
                        alt="Forhåndsvisning"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0 text-xs">
                      <p className="font-semibold text-stone-800 truncate">Aktivt bilde valgt</p>
                      <p className="text-stone-500 text-[11px] truncate font-mono">{formImageUrl.slice(0, 45)}...</p>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        {formIllustration ? 'Illustrasjonsbilde (demo)' : 'Klar til publisering'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Subtabs for photo sources */}
                <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-stone-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPhotoTab('presets')}
                    className={`flex-1 min-w-[7rem] py-1 rounded text-center font-medium transition-colors cursor-pointer ${
                      photoTab === 'presets' ? 'bg-[#4D6B3E] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Feltbilder
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoTab('illustrations')}
                    className={`flex-1 min-w-[7rem] py-1 rounded text-center font-medium transition-colors cursor-pointer ${
                      photoTab === 'illustrations'
                        ? 'bg-[#4D6B3E] text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Illustrasjonsbilder
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoTab('upload')}
                    className={`flex-1 min-w-[7rem] py-1 rounded text-center font-medium transition-colors cursor-pointer ${
                      photoTab === 'upload' ? 'bg-[#4D6B3E] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Last opp fil
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoTab('url')}
                    className={`flex-1 min-w-[7rem] py-1 rounded text-center font-medium transition-colors cursor-pointer ${
                      photoTab === 'url' ? 'bg-[#4D6B3E] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Bilde-URL
                  </button>
                </div>

                {photoTab === 'presets' && renderPhotoPresetGrid(TESTIMONIAL_FIELD_PHOTO_PRESETS)}

                {photoTab === 'illustrations' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-stone-600">
                      Midlertidige demo-bilder til layout er på plass. Erstatt med ekte foto når det foreligger — forsiden
                      viser «Illustrasjonsbilde» under bildet.
                    </p>
                    {renderPhotoPresetGrid(TESTIMONIAL_ILLUSTRATION_PHOTO_PRESETS)}
                  </div>
                )}

                {/* Tab 2: Upload from Computer */}
                {photoTab === 'upload' && (
                  <div className="p-4 bg-white rounded-lg border-2 border-dashed border-stone-300 text-center space-y-2">
                    <Upload className="w-6 h-6 text-stone-400 mx-auto" />
                    <p className="text-stone-700 font-medium">Velg bildefil fra din enhet</p>
                    <p className="text-stone-500 text-[11px]">Støtter JPG, PNG, WebP opptil 5 MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={photoUploading}
                      onChange={handleFileUpload}
                      className="block mx-auto text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#4D6B3E] file:text-white file:cursor-pointer disabled:opacity-50"
                    />
                    {photoUploading && <p className="text-[11px] text-stone-500">Laster opp bilde…</p>}
                    {uploadError && <p className="text-rose-600 text-[11px]">{uploadError}</p>}
                  </div>
                )}

                {/* Tab 3: Direct URL */}
                {photoTab === 'url' && (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Link2 className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://... eller filnavn (FullSizeR.jpg, IMG_1194.jpg)"
                        value={formImageUrl}
                        onChange={(e) => {
                          setFormImageUrl(e.target.value);
                          setFormIllustration(false);
                        }}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formIllustration}
                    onChange={(e) => setFormIllustration(e.target.checked)}
                    className="mt-0.5 rounded border-stone-300 text-[#4D6B3E] focus:ring-[#4D6B3E]"
                  />
                  <span>
                    Merk som illustrasjonsbilde (vises som «Illustrasjonsbilde» under bildet på forsiden — ikke ekte
                    portrett)
                  </span>
                </label>
              </div>

              {formCategory === 'graduate' && (
                <div className="p-4 bg-[#F6F4ED] rounded-xl border border-[#DFD9CB] space-y-4">
                  <p className="text-xs font-semibold text-stone-800">Da og nå — to bilder på kortet (anbefalt)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-stone-700">Barndomsbilde</label>
                      {formBarneBildeUrl && (
                        <img
                          src={formBarneBildeUrl}
                          alt="Barndom"
                          className="w-full h-24 object-cover rounded-lg border border-stone-200"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) readImageFile(file, setFormBarneBildeUrl);
                        }}
                        className="text-[11px] w-full"
                      />
                      <input
                        type="text"
                        placeholder="URL eller filnavn"
                        value={formBarneBildeUrl}
                        onChange={(e) => setFormBarneBildeUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-stone-700">Voksenbilde</label>
                      {(formVoksenBildeUrl || formImageUrl) && (
                        <img
                          src={formVoksenBildeUrl || formImageUrl}
                          alt="Voksen"
                          className="w-full h-24 object-cover rounded-lg border border-stone-200"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file)
                            readImageFile(file, (url) => {
                              setFormVoksenBildeUrl(url);
                              setFormImageUrl(url);
                            });
                        }}
                        className="text-[11px] w-full"
                      />
                      <input
                        type="text"
                        placeholder="URL eller filnavn"
                        value={formVoksenBildeUrl || formImageUrl}
                        onChange={(e) => {
                          setFormVoksenBildeUrl(e.target.value);
                          setFormImageUrl(e.target.value);
                        }}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Consent & Visibility Toggles */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConsent}
                    onChange={(e) => setFormConsent(e.target.checked)}
                    className="rounded border-stone-300 text-[#4D6B3E] focus:ring-0"
                  />
                  <span className="font-medium text-stone-800">
                    Dokumentert og arkivert samtykke foreligger i henhold til etiske retningslinjer
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formApproved}
                    onChange={(e) => setFormApproved(e.target.checked)}
                    className="rounded border-stone-300 text-[#4D6B3E] focus:ring-0"
                  />
                  <span className="font-medium text-stone-800">
                    Kvalitetssikret og godkjent av administrator
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="rounded border-stone-300 text-[#4D6B3E] focus:ring-0"
                  />
                  <span className="font-medium text-stone-800">
                    Fremhev på forsiden (vises i offentlig vitnesbyrd-karusell/seksjon)
                  </span>
                </label>
              </div>

              {/* Form buttons */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-lg font-medium cursor-pointer"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'Lagre endringer' : 'Opprett og publiser'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {frontPageExplain && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="front-page-explain-title"
        >
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h4
                id="front-page-explain-title"
                className="text-base font-serif font-bold text-stone-900 leading-snug"
              >
                {frontPageExplain.helpOnly
                  ? 'Slik fungerer forsidesynlighet'
                  : frontPageExplain.justMarkedForFront
                    ? 'Merket for forsiden — men vises ikke ennå'
                    : `Hvorfor «${frontPageExplain.story?.navn ?? 'kortet'}» ikke er på forsiden`}
              </h4>
              <button
                type="button"
                onClick={() => setFrontPageExplain(null)}
                className="p-1 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
                aria-label="Lukk"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {frontPageExplain.justMarkedForFront && (
              <p className="text-sm text-stone-700 leading-relaxed">
                Du trykket <strong>Skjult</strong> for å ta kortet med. Valget er lagret, men rutenettet over
                oppdateres bare når alle krav under er oppfylt.
              </p>
            )}

            {!frontPageExplain.helpOnly && (
              <p className="text-xs text-stone-600 leading-relaxed">
                Alle punktene må være avkrysset før kortet telles i rutenettet over. Endre via{' '}
                <strong>Rediger kort</strong>.
              </p>
            )}
            {frontPageExplain.helpOnly && (
              <p className="text-xs text-stone-600 leading-relaxed">{FRONT_PAGE_TESTIMONIAL_ADMIN_HELP}</p>
            )}

            <ul className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 space-y-2 text-sm">
              {(frontPageExplain.story
                ? getTestimonialFrontPageChecklist(frontPageExplain.story)
                : getTestimonialFrontPageChecklist({
                    id: '',
                    navn: '',
                    historie: '',
                    category: 'graduate',
                    samtykkeDokumentert: false,
                    godkjentAvAdmin: false,
                    fremhevetPaaForside: true,
                  })
              ).map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    readOnly
                    checked={frontPageExplain.helpOnly ? false : item.ok}
                    className="mt-0.5 rounded border-stone-300 text-[#4D6B3E] pointer-events-none"
                    aria-label={item.label}
                  />
                  <span className={item.ok && !frontPageExplain.helpOnly ? 'text-stone-800' : 'text-stone-600'}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFrontPageExplain(null)}
                className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                Lukk
              </button>
              {frontPageExplain.story && !frontPageExplain.helpOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const s = frontPageExplain.story!;
                    setFrontPageExplain(null);
                    openEditModal(s);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#4D6B3E] hover:bg-[#3B522F] rounded-lg cursor-pointer"
                >
                  Rediger kort
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
