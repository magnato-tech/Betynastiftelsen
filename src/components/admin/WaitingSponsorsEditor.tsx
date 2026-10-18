import React, { useId, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { CmsWaitingSponsorCard, CmsWaitingSponsorsSection } from '../../types';
import { normalizeCmsHomeLayout, setHomeModuleVisible } from '../../utils/cmsHomeLayout';
import {
  createDemoWaitingSponsorCards,
  getPublishedWaitingSponsorCards,
  withWaitingSponsorsSectionDefaults,
} from '../../utils/waitingSponsors';
import { WAITING_SPONSOR_ILLUSTRATION_PRESETS } from '../../utils/waitingSponsorIllustrations';
import { WaitingSponsorsSection } from '../public/WaitingSponsorsSection';
import { WaitingSponsorPublicCard } from '../public/WaitingSponsorPublicCard';
import { Plus, Save, Trash2, Eye, EyeOff, Image as ImageIcon, Upload, X, Users } from 'lucide-react';

export const WaitingSponsorsEditor: React.FC<{ onViewPublicSite?: () => void }> = ({ onViewPublicSite }) => {
  const { cmsContent, updateCmsSection, uploadMediaLibraryItem } = useApp();
  const section = withWaitingSponsorsSectionDefaults(cmsContent.waitingSponsorsSection);
  const cards = cmsContent.waitingSponsorCards ?? [];
  const published = getPublishedWaitingSponsorCards(cmsContent);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formAge, setFormAge] = useState<number | ''>(10);
  const [formPlace, setFormPlace] = useState('Brazzaville');
  const [formImage, setFormImage] = useState('');
  const [formPublished, setFormPublished] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const uploadInputId = useId();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const draftPreviewCard = useMemo((): CmsWaitingSponsorCard => {
    return {
      id: 'draft-preview',
      publicCode: formCode.trim() || 'COG-…',
      alder: typeof formAge === 'number' ? formAge : 10,
      sted: formPlace.trim() || 'Brazzaville',
      bildeUrl: formImage,
      publisertPaaForside: formPublished,
    };
  }, [formCode, formAge, formPlace, formImage, formPublished]);

  const patchSection = (patch: Partial<CmsWaitingSponsorsSection>) => {
    updateCmsSection('waitingSponsorsSection', { ...section, ...patch });
    if (typeof patch.enabled === 'boolean') {
      updateCmsSection(
        'homeLayout',
        setHomeModuleVisible(normalizeCmsHomeLayout(cmsContent), 'waiting', patch.enabled)
      );
    }
  };

  const saveCards = (next: CmsWaitingSponsorCard[]) => {
    updateCmsSection('waitingSponsorCards', next);
  };

  const openNew = () => {
    setEditingId('new');
    setFormCode(`COG-${new Date().getFullYear()}-${String(cards.length + 1).padStart(3, '0')}`);
    setFormAge(10);
    setFormPlace('Brazzaville');
    setFormImage(WAITING_SPONSOR_ILLUSTRATION_PRESETS[0]?.url ?? '');
    setFormPublished(true);
    setError(null);
  };

  const openEdit = (c: CmsWaitingSponsorCard) => {
    setEditingId(c.id);
    setFormCode(c.publicCode);
    setFormAge(c.alder);
    setFormPlace(c.sted);
    setFormImage(c.bildeUrl);
    setFormPublished(c.publisertPaaForside !== false);
    setError(null);
  };

  const closeCardModal = () => {
    setEditingId(null);
    setError(null);
  };

  const handleSaveCard = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingId) return;
    if (!formCode.trim() || !formImage.trim()) {
      setError('Kode og illustrasjonsbilde er påkrevd.');
      return;
    }
    const payload: CmsWaitingSponsorCard = {
      id: editingId === 'new' ? `wait-${Date.now()}` : editingId,
      publicCode: formCode.trim(),
      alder: typeof formAge === 'number' ? formAge : 10,
      sted: formPlace.trim() || 'Kongo-Brazzaville',
      bildeUrl: formImage.trim(),
      publisertPaaForside: formPublished,
    };
    if (editingId === 'new') {
      saveCards([payload, ...cards]);
    } else {
      saveCards(cards.map((c) => (c.id === editingId ? payload : c)));
    }
    closeCardModal();
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadMediaLibraryItem(file, `Venter fadder: ${formCode || 'kort'}`);
      setFormImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke laste opp.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-serif font-bold text-stone-900">Disse venter på fadder</h3>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl">
              Anonyme kort med illustrasjonsbilde — ingen ekte barnefoto på nettsiden. Kortene ligger i biblioteket og
              kan publiseres på forsiden når modulen er synlig.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={section.enabled !== false}
              onChange={(e) => patchSection({ enabled: e.target.checked })}
              className="rounded border-stone-300 text-[#4D6B3E]"
            />
            Modul på forsiden
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Toppmerking</label>
            <input
              value={section.kicker}
              onChange={(e) => patchSection({ kicker: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-lg"
            />
          </div>
          <div>
            <label className="font-semibold text-stone-700">Lenke øverst til høyre</label>
            <input
              value={section.topLinkText ?? ''}
              onChange={(e) => patchSection({ topLinkText: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="font-semibold text-stone-700">Overskrift</label>
            <input
              value={section.title}
              onChange={(e) => patchSection({ title: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-lg font-serif font-bold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="font-semibold text-stone-700">Ingress</label>
            <textarea
              rows={2}
              value={section.subtitle}
              onChange={(e) => patchSection({ subtitle: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="font-semibold text-stone-700">Knappetekst nederst</label>
            <input
              value={section.footerLinkText ?? ''}
              onChange={(e) => patchSection({ footerLinkText: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1 px-3 py-2 bg-[#4D6B3E] text-white rounded-lg text-xs font-medium cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nytt kort
        </button>
        <button
          type="button"
          onClick={() => saveCards([...createDemoWaitingSponsorCards(), ...cards])}
          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-medium cursor-pointer"
        >
          Legg inn 4 demo-kort (illustrasjon)
        </button>
        {onViewPublicSite && (
          <button
            type="button"
            onClick={onViewPublicSite}
            className="px-3 py-2 text-xs text-[#4D6B3E] font-medium underline cursor-pointer"
          >
            Åpne forhåndsvisning
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {cards.map((c) => (
          <li
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => openEdit(c)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openEdit(c);
              }
            }}
            className="flex items-center justify-between gap-3 p-3 bg-white border border-stone-200 rounded-lg text-xs cursor-pointer hover:border-[#4D6B3E]/40 hover:bg-stone-50/80 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img src={c.bildeUrl} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
              <div className="min-w-0">
                <p className="font-mono font-semibold truncate">{c.publicCode}</p>
                <p className="text-stone-500">{c.alder} år · {c.sted}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {c.publisertPaaForside !== false ? (
                <span className="text-emerald-700 flex items-center gap-0.5">
                  <Eye className="w-3.5 h-3.5" />
                  På forsiden
                </span>
              ) : (
                <span className="text-stone-400 flex items-center gap-0.5">
                  <EyeOff className="w-3.5 h-3.5" />
                  Skjult
                </span>
              )}
              <button
                type="button"
                onClick={() => openEdit(c)}
                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded cursor-pointer"
              >
                Rediger
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(c.id)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                aria-label="Slett kort"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-stone-900/50"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl border border-stone-200 text-xs space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-stone-900">Slette dette kortet?</p>
            <p className="text-stone-600">Kortet fjernes fra biblioteket og forsiden. Dette kan ikke angres.</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-2 rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={() => {
                  saveCards(cards.filter((x) => x.id !== confirmDeleteId));
                  setConfirmDeleteId(null);
                }}
                className="px-3 py-2 rounded-lg bg-rose-600 text-white font-medium cursor-pointer"
              >
                Slett
              </button>
            </div>
          </div>
        </div>
      )}

      {published.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-stone-200">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 bg-stone-50 px-4 py-2">
            Forhåndsvisning (publiserte kort)
          </p>
          <div className="p-4 bg-stone-100">
            <WaitingSponsorsSection
              section={section}
              cards={published.slice(0, 4)}
              onBliFadder={() => undefined}
              onSeeAll={() => undefined}
            />
          </div>
        </div>
      )}

      {editingId && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="waiting-card-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCardModal();
          }}
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-xl border border-stone-200 my-8 max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4D6B3E] mb-1">
                  <Users className="w-4 h-4" />
                  <span>{editingId === 'new' ? 'Nytt fadder-kort' : 'Rediger fadder-kort'}</span>
                </div>
                <h3 id="waiting-card-modal-title" className="text-lg font-serif font-bold text-stone-900">
                  {editingId === 'new' ? 'Anonymt illustrasjonskort' : formCode || 'Kort'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Vises som anonymisert på forsiden — ingen ekte barnefoto eller navn.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCardModal}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                aria-label="Lukk"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="flex flex-col min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 text-xs">
                <div className="md:sticky md:top-0 self-start">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-2">
                    Slik ser kortet ut på forsiden
                  </p>
                  <div className="rounded-xl bg-[#2F4A35] p-4 max-w-[14rem] mx-auto md:mx-0">
                    <WaitingSponsorPublicCard card={draftPreviewCard} previewMode />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Anonym kode (på kortet)</label>
                    <input
                      placeholder="COG-2026-014"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Alder</label>
                      <input
                        type="number"
                        min={5}
                        max={22}
                        value={formAge}
                        onChange={(e) => setFormAge(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Sted</label>
                      <input
                        placeholder="Brazzaville"
                        value={formPlace}
                        onChange={(e) => setFormPlace(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-stone-700 mb-2 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Illustrasjonsbilde
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {WAITING_SPONSOR_ILLUSTRATION_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormImage(p.url)}
                          className={`p-1.5 rounded-lg border cursor-pointer text-left transition-colors ${
                            formImage === p.url
                              ? 'border-[#4D6B3E] ring-2 ring-[#4D6B3E]/30 bg-[#4D6B3E]/5'
                              : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <img src={p.url} alt="" className="w-full aspect-[4/3] object-cover rounded-md" />
                          <span className="block text-[10px] mt-1.5 text-stone-600 leading-tight px-0.5">{p.name}</span>
                        </button>
                      ))}
                    </div>
                    <input
                      ref={uploadInputRef}
                      id={uploadInputId}
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleUpload(f);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => uploadInputRef.current?.click()}
                      className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 font-medium cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Laster opp…' : 'Last opp eget bilde'}
                    </button>
                  </div>

                  <div>
                    <p className="font-semibold text-stone-700 mb-2">Synlighet</p>
                    <div className="flex rounded-lg border border-stone-200 p-0.5 bg-stone-50">
                      <button
                        type="button"
                        onClick={() => setFormPublished(true)}
                        className={`flex-1 py-2 rounded-md text-center font-medium transition-colors cursor-pointer ${
                          formPublished
                            ? 'bg-[#4D6B3E] text-white shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        På forsiden
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormPublished(false)}
                        className={`flex-1 py-2 rounded-md text-center font-medium transition-colors cursor-pointer ${
                          !formPublished
                            ? 'bg-stone-700 text-white shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Skjult
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-rose-600 text-[11px]">{error}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 px-6 py-4 border-t border-stone-100 bg-stone-50/80 shrink-0">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-[#4D6B3E] text-white rounded-lg font-medium cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lagre endringer
                </button>
                <button
                  type="button"
                  onClick={closeCardModal}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-200/80 rounded-lg cursor-pointer"
                >
                  Avbryt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
