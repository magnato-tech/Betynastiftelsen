import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mediaItemDisplayUrl, sortMediaLibraryNewestFirst } from '../../utils/mediaLibrary';
import { storage as firebaseStorage } from '../../config/firebase';
import { Upload, Trash2, Image as ImageIcon, HardDrive, Loader2 } from 'lucide-react';

export const CmsMediaLibraryPanel: React.FC = () => {
  const { mediaLibrary, uploadMediaLibraryItem, deleteMediaLibraryItem } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const items = sortMediaLibraryNewestFirst(mediaLibrary);

  const onPickFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      await uploadMediaLibraryItem(file, label || undefined);
      setLabel('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke laste opp');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm('Slette bildet fra biblioteket? Det som allerede bruker URL-en i CMS må byttes manuelt.')) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteMediaLibraryItem(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#A3B18A]/20 text-[#4D6B3E]">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-serif font-bold text-stone-900">Mediabibliotek</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Last opp bilder du vil gjenbruke på forsiden, i banner og i vitnesbyrd. Filene lagres i{' '}
              <span className="font-medium">Firebase Storage</span> under <code className="text-[10px]">public/media/</code>
              {firebaseStorage ? ' (aktivt)' : ' — Storage er ikke konfigurert; små bilder lagres midlertidig i databasen'}.
              Metadata synkroniseres til Firestore-samlingen <code className="text-[10px]">mediaLibrary</code>.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Valgfritt navn (f.eks. Synelle og barna)"
            className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-xs"
          />
          <label
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer ${
              busy ? 'bg-stone-300 text-stone-600' : 'bg-[#4D6B3E] text-white hover:bg-[#3B522F]'
            }`}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{busy ? 'Laster opp…' : 'Last opp bilde'}</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => onPickFiles(e.target.files)}
            />
          </label>
        </div>
        {error && <p className="text-xs text-rose-700 mt-2 font-medium">{error}</p>}
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-stone-300 rounded-xl p-10 text-center text-stone-500 text-sm">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Ingen bilder ennå. Last opp det første — deretter kan du velge det fra «Mediabibliotek» i bildevelgeren.
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="group bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs flex flex-col"
            >
              <div className="aspect-[4/3] bg-stone-100 relative">
                <img
                  src={mediaItemDisplayUrl(item.url)}
                  alt={item.label}
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-2.5 flex-1 flex flex-col gap-1">
                <p className="text-[11px] font-semibold text-stone-900 truncate" title={item.label}>
                  {item.label}
                </p>
                <p className="text-[10px] text-stone-500 truncate font-mono" title={item.url}>
                  {item.url.startsWith('data:') ? 'Lokal data-URL' : item.url.replace(/^https?:\/\//, '')}
                </p>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="mt-1 flex items-center gap-1 text-[10px] text-rose-700 hover:text-rose-900 font-medium cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  {deletingId === item.id ? 'Sletter…' : 'Slett'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
