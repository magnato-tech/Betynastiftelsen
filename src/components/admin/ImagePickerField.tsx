import React, { useState } from 'react';
import { Upload, Link2, Sparkles, Trash2, Sliders, Check, Image as ImageIcon } from 'lucide-react';

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
  onChange: (updates: {
    backgroundImageUrl?: string;
    backgroundPreset?: 'pattern' | 'classroom' | 'workshop' | 'books' | 'students' | 'custom' | string;
    scrimOpacity?: number;
  }) => void;
}

const DEFAULT_PRESETS: ImagePresetOption[] = [
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
  sublabel = 'Velg et kuratert motiv, last opp en lokal bildefil fra maskinen, eller lim inn en direkte bilde-URL.',
  currentUrl,
  currentPreset = 'pattern',
  currentScrimOpacity = 75,
  showScrimSlider = true,
  customPresets,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const presets = customPresets || DEFAULT_PRESETS;

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
    onChange({
      backgroundImageUrl: '',
      backgroundPreset: 'pattern',
    });
    setUrlInput('');
  };

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5 space-y-4 text-xs font-sans">
      {/* Header and remove action */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-stone-900 text-sm flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#4D6B3E]" />
            <span>{label}</span>
          </h4>
          {sublabel && <p className="text-stone-500 text-[11px] mt-0.5">{sublabel}</p>}
        </div>

        {(currentUrl || (currentPreset && currentPreset !== 'pattern')) && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="flex items-center gap-1 text-rose-700 hover:text-rose-900 font-medium px-2 py-1 rounded cursor-pointer whitespace-nowrap shrink-0 hover:bg-rose-50 transition-colors"
            title="Fjern bilde og tilbakestill"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Fjern bilde</span>
          </button>
        )}
      </div>

      {/* Mini preview strip if image is active */}
      {currentUrl && (
        <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-stone-200">
          <div className="w-14 h-10 rounded overflow-hidden bg-stone-900 shrink-0 border border-stone-300 relative">
            <img
              src={currentUrl}
              alt="Gjeldende bilde"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-stone-800 truncate">
              {currentUrl.startsWith('data:') ? 'Lokal opplastet fil (innstøpt base64)' : currentUrl}
            </div>
            <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium mt-0.5">
              <Check className="w-3 h-3" />
              <span>Aktivt bilde i bruk på komponenten</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs for choosing method */}
      <div className="flex bg-stone-200/80 p-0.5 rounded-lg border border-stone-300 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
            activeTab === 'presets'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#4D6B3E]" />
          <span>Forhåndsdefinerte motiver</span>
        </button>
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
          <span>Last opp lokal fil</span>
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
          <span>Bilde-URL</span>
        </button>
      </div>

      {/* Tab 1: Presets */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {presets.map((p) => {
            const isSelected = (currentPreset === p.id && !currentUrl) || (p.url && currentUrl === p.url);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (p.id === 'pattern') {
                    onChange({
                      backgroundPreset: 'pattern',
                      backgroundImageUrl: '',
                    });
                  } else {
                    onChange({
                      backgroundPreset: p.id,
                      backgroundImageUrl: p.url,
                    });
                  }
                }}
                className={`p-3 text-left rounded-lg border transition-all cursor-pointer flex flex-col justify-between h-24 ${
                  isSelected
                    ? 'border-[#4D6B3E] bg-[#A3B18A]/15 shadow-xs ring-1 ring-[#4D6B3E]'
                    : 'border-stone-300 bg-white hover:border-stone-400'
                }`}
              >
                <div>
                  <div className="font-semibold text-stone-900 text-xs">{p.name}</div>
                  <div className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">{p.desc}</div>
                </div>
                <span className="text-[10px] font-mono uppercase text-[#4D6B3E] font-medium">
                  {isSelected ? '✓ Valgt motiv' : 'Velg motiv'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 2: Upload local file */}
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
              <span className="font-medium text-stone-800 underline">Klikk for å velge fil fra datamaskinen</span>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Eller dra og slipp bildefilen her (JPG, PNG, WebP opptil 5 MB).
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {uploadError && (
            <p className="text-rose-600 text-xs mt-2 font-medium">{uploadError}</p>
          )}
        </div>
      )}

      {/* Tab 3: URL input */}
      {activeTab === 'url' && (
        <form onSubmit={handleApplyUrl} className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://eksempel.no/bilde.jpg"
            className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 focus:outline-hidden focus:border-[#4D6B3E] font-sans"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0"
          >
            Bruk URL
          </button>
        </form>
      )}

      {/* Scrim Opacity Slider */}
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
                  scrimOpacity: parseInt(e.target.value),
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
