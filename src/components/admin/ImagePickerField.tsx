import React, { useEffect, useState } from 'react';
import { Upload, Link2, Sparkles, Trash2, Sliders, Check, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { BETYNA_DEFAULT_HERO_IMAGE } from '../../utils/cmsHeroImage';

export interface ImagePresetOption {
  id: string;
  name: string;
  desc: string;
  url?: string;
  preview?: string;
}

export interface ImagePickerFieldProps {
  label?: string;
  sublabel?: string;
  currentUrl?: string;
  currentPreset?: 'pattern' | 'classroom' | 'workshop' | 'books' | 'students' | 'custom' | string;
  currentScrimOpacity?: number;
  showScrimSlider?: boolean;
  aspectRatio?: '16/9' | '4/3' | '1/1' | 'auto';
  customPresets?: ImagePresetOption[];
  /** Ved «Fjern bilde» — bruk dette i stedet for tomt mønster (f.eks. standard gruppebilde). */
  defaultRestoreUrl?: string;
  onChange: (updates: {
    backgroundImageUrl?: string;
    backgroundPreset?: 'pattern' | 'classroom' | 'workshop' | 'books' | 'students' | 'custom' | string;
    scrimOpacity?: number;
  }) => void;
}

const LIBRARY_PRESETS: ImagePresetOption[] = [
  {
    id: 'betyna-group',
    name: 'Synelle og barna (anbefalt)',
    desc: 'Offisielt gruppebilde — IMG_1194.jpg på forsiden',
    url: BETYNA_DEFAULT_HERO_IMAGE,
  },
  {
    id: 'pattern',
    name: 'Geometrisk håpsmønster',
    desc: 'Minimalistisk grafisk mønster i dyp oliven og salvie',
    preview: 'bg-stone-900 border-[#4D6B3E]/40',
  },
  {
    id: 'classroom',
    name: 'Klasserom og tavle',
    desc: 'Skolehverdag med bøker og naturlig morgenlys',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
    preview: 'bg-stone-800',
  },
  {
    id: 'workshop',
    name: 'Yrkesopplæring & verksted',
    desc: 'Systue med stoffer og mekaniske symaskiner',
    url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80',
    preview: 'bg-stone-800',
  },
  {
    id: 'books',
    name: 'Skolebøker & materiell',
    desc: 'Notatbøker, linjaler og lærebøker for grunnskolen',
    url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
    preview: 'bg-stone-800',
  },
  {
    id: 'students',
    name: 'Læreglede & fellesskap',
    desc: 'Elever samlet i trygge skoleomgivelser',
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80',
    preview: 'bg-stone-800',
  },
];

export const ImagePickerField: React.FC<ImagePickerFieldProps> = ({
  label = 'Bakgrunnsbilde & Visuell Stemning',
  sublabel = 'Last opp bilde fra maskinen eller lim inn adresse. Motiver fra biblioteket brukes sjelden.',
  currentUrl,
  currentPreset = 'custom',
  currentScrimOpacity = 75,
  showScrimSlider = true,
  customPresets,
  defaultRestoreUrl,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const presets = customPresets ?? LIBRARY_PRESETS;

  useEffect(() => {
    setUrlInput(currentUrl || '');
  }, [currentUrl]);

  const processFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Vennligst velg en gyldig bildefil (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Bildefilen er over 5 MB. Vennligst velg et bilde under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      onChange({
        backgroundImageUrl: dataUrl,
        backgroundPreset: 'custom',
      });
      setUrlInput('');
    };
    reader.onerror = () => {
      setUploadError('Kunne ikke lese filen. Prøv igjen.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onChange({
      backgroundImageUrl: urlInput.trim(),
      backgroundPreset: 'custom',
    });
  };

  const handleRemoveImage = () => {
    if (defaultRestoreUrl) {
      onChange({
        backgroundImageUrl: defaultRestoreUrl,
        backgroundPreset: 'custom',
      });
      setUrlInput(defaultRestoreUrl);
      return;
    }
    onChange({
      backgroundImageUrl: '',
      backgroundPreset: 'pattern',
    });
    setUrlInput('');
  };

  const applyPreset = (p: ImagePresetOption) => {
    if (p.id === 'pattern') {
      onChange({
        backgroundPreset: 'pattern',
        backgroundImageUrl: '',
      });
      setUrlInput('');
      return;
    }
    if (p.url) {
      onChange({
        backgroundPreset: p.id === 'betyna-group' ? 'custom' : p.id,
        backgroundImageUrl: p.url,
      });
      setUrlInput(p.url);
    }
  };

  const showRestoreDefault =
    defaultRestoreUrl &&
    currentUrl !== defaultRestoreUrl &&
    (!currentUrl?.trim() || currentPreset === 'pattern');

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5 space-y-4 text-xs font-sans">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-stone-900 text-sm flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#4D6B3E]" />
            <span>{label}</span>
          </h4>
          {sublabel && <p className="text-stone-500 text-[11px] mt-0.5">{sublabel}</p>}
        </div>

        {currentUrl && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="flex items-center gap-1 text-rose-700 hover:text-rose-900 font-medium px-2 py-1 rounded cursor-pointer whitespace-nowrap shrink-0 hover:bg-rose-50 transition-colors"
            title={defaultRestoreUrl ? 'Tilbakestill til standard gruppebilde' : 'Fjern bilde'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{defaultRestoreUrl ? 'Tilbakestill' : 'Fjern bilde'}</span>
          </button>
        )}
      </div>

      {showRestoreDefault && (
        <button
          type="button"
          onClick={() =>
            onChange({ backgroundImageUrl: defaultRestoreUrl, backgroundPreset: 'custom' })
          }
          className="w-full text-left px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-[11px] font-medium cursor-pointer hover:bg-amber-100"
        >
          Gjenopprett standard gruppebilde ({defaultRestoreUrl})
        </button>
      )}

      {currentUrl && (
        <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-stone-200">
          <div className="w-14 h-10 rounded overflow-hidden bg-stone-900 shrink-0 border border-stone-300 relative">
            <img
              src={currentUrl.startsWith('/') || currentUrl.includes('://') || currentUrl.startsWith('data:') ? currentUrl : `/${currentUrl}`}
              alt="Gjeldende bilde"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-stone-800 truncate">
              {currentUrl.startsWith('data:') ? 'Lokal opplastet fil' : currentUrl}
            </div>
            <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium mt-0.5">
              <Check className="w-3 h-3" />
              <span>Aktivt bilde på forsiden</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex bg-stone-200/80 p-0.5 rounded-lg border border-stone-300 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-[#4D6B3E]" />
          <span>Last opp</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
            activeTab === 'url'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Link2 className="w-3.5 h-3.5 text-[#4D6B3E]" />
          <span>Bilde-URL / filnavn</span>
        </button>
      </div>

      {activeTab === 'upload' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
            isDragging
              ? 'border-[#4D6B3E] bg-[#A3B18A]/10'
              : 'border-stone-300 bg-white hover:border-[#4D6B3E]'
          }`}
        >
          <label className="cursor-pointer block space-y-2">
            <Upload className="w-6 h-6 text-stone-400 mx-auto" />
            <div>
              <span className="font-medium text-stone-800 underline">Klikk for å velge fil</span>
              <p className="text-[11px] text-stone-500 mt-0.5">JPG, PNG, WebP opptil 5 MB</p>
            </div>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          {uploadError && <p className="text-rose-600 text-xs mt-2 font-medium">{uploadError}</p>}
        </div>
      )}

      {activeTab === 'url' && (
        <form onSubmit={handleApplyUrl} className="space-y-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={`https://… eller ${BETYNA_DEFAULT_HERO_IMAGE}`}
            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-[#4D6B3E] font-sans"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium cursor-pointer"
          >
            Bruk adresse
          </button>
        </form>
      )}

      <div className="border-t border-stone-200 pt-3">
        <button
          type="button"
          onClick={() => setLibraryOpen((o) => !o)}
          className="flex items-center gap-2 text-[11px] font-semibold text-stone-600 hover:text-[#4D6B3E] cursor-pointer"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${libraryOpen ? 'rotate-180' : ''}`} />
          <Sparkles className="w-3.5 h-3.5" />
          Motivbibliotek (sjelden brukt)
        </button>
        {libraryOpen && (
          <ul className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
            {presets.map((p) => {
              const isSelected =
                (p.id === 'pattern' && currentPreset === 'pattern' && !currentUrl) ||
                (p.url && (currentUrl === p.url || currentUrl === `/${p.url}`));
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#4D6B3E] bg-[#A3B18A]/15 text-stone-900'
                        : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-stone-500"> — {p.desc}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showScrimSlider && (
        <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-stone-700">
            <Sliders className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-medium">Mørkhetsgrad på overlegg (scrim):</span>
            <span className="font-mono font-semibold text-stone-900 tabular-nums">
              {currentScrimOpacity}%
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-56">
            <span className="text-[10px] text-stone-400">Lysere (20%)</span>
            <input
              type="range"
              min="20"
              max="95"
              step="5"
              value={currentScrimOpacity}
              onChange={(e) =>
                onChange({
                  scrimOpacity: parseInt(e.target.value, 10),
                })
              }
              className="flex-1 accent-[#4D6B3E] cursor-pointer"
            />
            <span className="text-[10px] text-stone-400">Mørkere (95%)</span>
          </div>
        </div>
      )}
    </div>
  );
};
