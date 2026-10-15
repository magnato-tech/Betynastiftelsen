import React, { useState } from 'react';
import { Camera, CheckCircle, Clock, AlertCircle, Upload } from 'lucide-react';
import type { Child } from '../../types';
import { readImageFileAsDataUrl } from '../../utils/readImageFile';
import { useApp } from '../../context/AppContext';
import { getCoordinatorUi } from '../../locales/coordinatorUi';
import { photoTaggedForChild } from '../../utils/photoCatalog';

interface CoordinatorPhotoPanelProps {
  children: Child[];
  onSubmitPhoto: (childId: string, dataUrl: string, beskrivelseFr: string) => void;
}

export const CoordinatorPhotoPanel: React.FC<CoordinatorPhotoPanelProps> = ({ children, onSubmitPhoto }) => {
  const { language, catalogPhotos, addCatalogPhoto } = useApp();
  const ui = getCoordinatorUi(language);
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id || '');
  const [beskrivelseFr, setBeskrivelseFr] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>(children[0]?.id ? [children[0].id] : []);
  const [catalogPreview, setCatalogPreview] = useState<string | null>(null);
  const [catalogCaption, setCatalogCaption] = useState('');

  const toggleTag = (id: string) => {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selected = children.find((c) => c.id === selectedChildId);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const url = await readImageFileAsDataUrl(file);
      setPreviewUrl(url);
    } catch {
      setToast(ui.photoInvalid);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || !previewUrl || !selected?.samtykkeFoto) return;
    onSubmitPhoto(selectedChildId, previewUrl, beskrivelseFr.trim() || ui.defaultCaption);
    setToast(ui.photoSent(selected.fornavn));
    setPreviewUrl(null);
    setBeskrivelseFr('');
    setTimeout(() => setToast(null), 5000);
  };

  const handleCatalogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogPreview || tagIds.length === 0) {
      setToast(ui.noChildrenTagged);
      setTimeout(() => setToast(null), 3000);
      return;
    }
    addCatalogPhoto({
      barnIds: tagIds,
      url: catalogPreview,
      beskrivelseFr: catalogCaption.trim() || ui.defaultCaption,
      koordinatorId: children.find((c) => tagIds.includes(c.id))?.koordinatorId || '',
      dato: new Date().toISOString().slice(0, 10),
      status: 'publisert',
    });
    setToast(ui.catalogSaved);
    setCatalogPreview(null);
    setCatalogCaption('');
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-stone-900">{ui.photoTitle}</h2>
        <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
          {ui.photoIntro}
        </p>
      </div>

      {toast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {toast}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.selectPupil}</label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
            required
          >
            {children.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.internKode} — {ch.fornavn}
                {ch.ventendeFotoStatus === 'innsendt' ? ui.photoPending : ''}
              </option>
            ))}
          </select>
        </div>

        {selected && !selected.samtykkeFoto && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {ui.noPhotoConsent}
          </div>
        )}

        {selected?.publisertFotoUrl && (
          <p className="text-xs text-stone-500 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            {ui.photoAlready}
          </p>
        )}

        {selected?.ventendeFotoStatus === 'innsendt' && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {ui.photoInQueue(selected.ventendeFotoInnsendtDato || '')}
          </p>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.caption}</label>
          <input
            type="text"
            value={beskrivelseFr}
            onChange={(e) => setBeskrivelseFr(e.target.value)}
            placeholder={ui.captionPh}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-2">{ui.imageFile}</label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-xl p-6 cursor-pointer hover:bg-stone-50 transition-colors">
            <Upload className="w-8 h-8 text-stone-400" />
            <span className="text-xs text-stone-600">{ui.choosePhoto}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </label>
          {previewUrl && (
            <img src={previewUrl} alt={ui.preview} className="mt-3 max-h-48 rounded-lg border border-stone-200 object-cover" />
          )}
        </div>

        <button
          type="submit"
          disabled={!previewUrl || !selected?.samtykkeFoto}
          className="w-full py-3 bg-[#4D6B3E] hover:bg-[#3B522F] disabled:opacity-50 text-white font-medium rounded-lg text-sm cursor-pointer flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          {ui.submitPhoto}
        </button>
      </form>

      <form onSubmit={handleCatalogSubmit} className="max-w-2xl bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-serif font-bold text-stone-900">{ui.catalogTitle}</h3>
          <p className="text-xs text-stone-600 mt-1">{ui.tagChildrenHint}</p>
        </div>
        <fieldset>
          <legend className="text-xs font-semibold text-stone-700 mb-2">{ui.tagChildren}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {children.map((ch) => (
              <label key={ch.id} className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tagIds.includes(ch.id)}
                  onChange={() => toggleTag(ch.id)}
                  className="rounded border-stone-300"
                />
                <span>
                  {ch.fornavn} <span className="font-mono text-stone-500">({ch.internKode})</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">{ui.caption}</label>
          <input
            type="text"
            value={catalogCaption}
            onChange={(e) => setCatalogCaption(e.target.value)}
            placeholder={ui.captionPh}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
          />
        </div>
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-xl p-6 cursor-pointer hover:bg-stone-50 transition-colors">
          <Upload className="w-8 h-8 text-stone-400" />
          <span className="text-xs text-stone-600">{ui.choosePhoto}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              readImageFileAsDataUrl(file)
                .then(setCatalogPreview)
                .catch(() => {
                  setToast(ui.photoInvalid);
                  setTimeout(() => setToast(null), 3000);
                });
            }}
          />
        </label>
        {catalogPreview && (
          <img src={catalogPreview} alt={ui.preview} className="max-h-48 rounded-lg border border-stone-200 object-cover" />
        )}
        <button
          type="submit"
          disabled={!catalogPreview || tagIds.length === 0}
          className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-medium rounded-lg text-sm cursor-pointer"
        >
          {ui.catalogTitle}
        </button>
      </form>

      {catalogPhotos.filter((p) => children.some((c) => photoTaggedForChild(p, c))).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogPhotos
            .filter((p) => children.some((c) => photoTaggedForChild(p, c)))
            .map((p) => (
              <div key={p.id} className="bg-white border border-stone-200 rounded-lg overflow-hidden text-xs">
                <img src={p.url} alt={p.beskrivelseFr} className="w-full h-32 object-cover bg-stone-100" />
                <div className="p-3 space-y-1">
                  <p className="text-stone-700">{p.beskrivelseFr}</p>
                  <p className="text-stone-500">
                    {ui.taggedAs} {p.barnIds.join(', ')}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((ch) => (
          <div key={ch.id} className="bg-white border border-stone-200 rounded-lg p-4 text-xs space-y-2">
            <p className="font-semibold text-stone-900">{ch.fornavn}</p>
            {ch.publisertFotoUrl ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {ui.published}
              </span>
            ) : ch.ventendeFotoStatus === 'innsendt' ? (
              <span className="text-amber-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {ui.waitingOslo}
              </span>
            ) : (
              <span className="text-stone-500">{ui.noPublishedPhoto}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
