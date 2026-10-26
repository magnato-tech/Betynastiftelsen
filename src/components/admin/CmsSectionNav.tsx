import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  GripVertical,
  HandHeart,
  Image as ImageIcon,
  Landmark,
  Layers,
  Layout,
  BookOpen,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { CmsContent, CmsHomeModuleId } from '../../types';
import { normalizeCmsHomeLayout, reorderHomeModule, setHomeModuleVisible } from '../../utils/cmsHomeLayout';
import { CMS_PAGE_WIDTH_OPTIONS, type CmsPageWidth } from '../../utils/cmsPageWidth';

type CmsSubTab = CmsHomeModuleId | 'media';

const MODULE_META: Record<
  CmsHomeModuleId,
  { label: string; hint: string; icon: LucideIcon }
> = {
  hero: { label: 'Hovedbanner', hint: 'Første inntrykk', icon: Layout },
  steps: { label: 'Fadderordningen', hint: 'Ramme 1–2–3', icon: Layers },
  stotte: { label: 'Hva støtten gjør', hint: 'Tre kort om støtten', icon: HandHeart },
  stories: { label: 'Vitnesbyrd', hint: 'Historier med samtykke', icon: MessageSquare },
  waiting: { label: 'Venter på fadder', hint: 'Anonyme illustrasjonskort', icon: Users },
  about: { label: 'Kjernerammer', hint: 'Verdier og etikk', icon: ShieldCheck },
  kpis: { label: 'Nøkkeltall', hint: 'Faktabånd på forsiden', icon: TrendingUp },
  cta: { label: 'Fadderoppfordring', hint: 'Handlingsbånd', icon: Megaphone },
  behov: { label: 'Aksjoner', hint: 'Konkrete behov', icon: ImageIcon },
  apenhet: { label: 'Økonomi og åpenhet', hint: 'Slik pengene brukes', icon: Landmark },
  omOss: { label: 'Om oss', hint: 'Historien om Betyna', icon: BookOpen },
};

interface CmsSectionNavProps {
  cmsContent: CmsContent;
  activeSubTab: CmsSubTab;
  onSelectTab: (tab: CmsSubTab) => void;
  onUpdateLayout: (layout: CmsContent['homeLayout']) => void;
  storiesCount: number;
  waitingCardsCount: number;
  campaignsCount: number;
  previewOpen: boolean;
  onTogglePreview: () => void;
  pageWidth: number;
  onChangePageWidth: (width: CmsPageWidth) => void;
}

export const CmsSectionNav: React.FC<CmsSectionNavProps> = ({
  cmsContent,
  activeSubTab,
  onSelectTab,
  onUpdateLayout,
  storiesCount,
  waitingCardsCount,
  campaignsCount,
  previewOpen,
  onTogglePreview,
  pageWidth,
  onChangePageWidth,
}) => {
  const layout = normalizeCmsHomeLayout(cmsContent);
  const [dragOverId, setDragOverId] = useState<CmsHomeModuleId | null>(null);

  const patchLayout = (next: ReturnType<typeof normalizeCmsHomeLayout>) => {
    onUpdateLayout(next);
  };

  const countFor = (id: CmsHomeModuleId): string | null => {
    if (id === 'stories') return storiesCount > 0 ? ` (${storiesCount})` : null;
    if (id === 'waiting') return waitingCardsCount > 0 ? ` (${waitingCardsCount})` : null;
    if (id === 'behov') return campaignsCount > 0 ? ` (${campaignsCount})` : null;
    return null;
  };

  const handleDrop = (e: React.DragEvent, targetId: CmsHomeModuleId) => {
    e.preventDefault();
    setDragOverId(null);
    const fromId = e.dataTransfer.getData('text/plain') as CmsHomeModuleId;
    if (!fromId || fromId === targetId) return;
    patchLayout(reorderHomeModule(layout, fromId, targetId));
  };

  return (
    <nav
      aria-label="CMS-seksjoner"
      className={`w-full shrink-0 lg:sticky lg:top-20 bg-white rounded-xl border border-stone-200 shadow-xs p-2 ${
        previewOpen ? 'lg:w-56' : 'lg:w-60'
      }`}
    >
      <button
        type="button"
        onClick={onTogglePreview}
        aria-pressed={previewOpen}
        className={`w-full mb-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5 border ${
          previewOpen
            ? 'bg-[#4D6B3E] border-[#4D6B3E] text-white hover:bg-[#3B522F]'
            : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
        }`}
      >
        <Eye className="w-3.5 h-3.5" />
        <span>{previewOpen ? 'Skjul forhåndsvisning' : 'Vis forhåndsvisning'}</span>
      </button>

      <p className="px-2 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
        Seksjoner
      </p>
      <p className="px-2 pb-2 text-[10px] text-stone-500 leading-snug">
        Dra for rekkefølge. Øye = på forsiden. Skjulte moduler beholdes i biblioteket.
      </p>

      <ul className="space-y-0.5">
        {layout.map((row) => {
          const id = row.moduleId;
          const meta = MODULE_META[id];
          const Icon = meta.icon;
          const visible = row.visible !== false;
          const active = activeSubTab === id;
          const countSuffix = countFor(id) ?? '';

          return (
            <li
              key={id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(id);
              }}
              onDragLeave={() => setDragOverId((cur) => (cur === id ? null : cur))}
              onDrop={(e) => handleDrop(e, id)}
              className={`rounded-lg transition-colors ${
                dragOverId === id ? 'ring-2 ring-[#4D6B3E]/40 ring-offset-1' : ''
              } ${!visible ? 'opacity-60' : ''}`}
            >
              <div
                className={`flex items-stretch gap-0.5 rounded-lg ${
                  active ? 'bg-[#4D6B3E] text-white shadow-xs' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className={`shrink-0 px-1 py-2.5 cursor-grab active:cursor-grabbing rounded-l-lg ${
                    active ? 'text-white/80 hover:bg-white/10' : 'text-stone-400 hover:text-stone-600'
                  }`}
                  aria-label={`Dra ${meta.label}`}
                  title="Dra for å endre rekkefølge"
                >
                  <GripVertical className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className="flex-1 min-w-0 text-left py-2 pr-1 flex items-start gap-2 cursor-pointer"
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-white' : 'text-[#4D6B3E]'}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold truncate">
                      {meta.label}
                      {countSuffix}
                    </span>
                    <span
                      className={`block text-[10px] leading-snug truncate ${
                        active ? 'text-white/80' : 'text-stone-500'
                      }`}
                    >
                      {visible ? meta.hint : 'Kun bibliotek'}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    patchLayout(setHomeModuleVisible(layout, id, !visible));
                  }}
                  className={`shrink-0 px-2 py-2.5 rounded-r-lg cursor-pointer ${
                    active
                      ? 'text-white hover:bg-white/10'
                      : visible
                        ? 'text-emerald-700 hover:bg-emerald-50'
                        : 'text-stone-400 hover:bg-stone-100'
                  }`}
                  aria-label={visible ? `Skjul ${meta.label} på forsiden` : `Vis ${meta.label} på forsiden`}
                  title={visible ? 'Skjul på forsiden' : 'Vis på forsiden'}
                >
                  {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 pt-2 border-t border-stone-100">
        <button
          type="button"
          onClick={() => onSelectTab('media')}
          aria-current={activeSubTab === 'media' ? 'page' : undefined}
          className={`w-full text-left px-3 py-2.5 rounded-lg cursor-pointer transition-colors flex items-start gap-2.5 ${
            activeSubTab === 'media'
              ? 'bg-[#4D6B3E] text-white shadow-xs'
              : 'text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Upload
            className={`w-4 h-4 mt-0.5 shrink-0 ${
              activeSubTab === 'media' ? 'text-white' : 'text-[#4D6B3E]'
            }`}
          />
          <span className="min-w-0">
            <span className="block text-xs font-semibold">Mediabibliotek</span>
            <span
              className={`block text-[10px] leading-snug ${
                activeSubTab === 'media' ? 'text-white/80' : 'text-stone-500'
              }`}
            >
              Bilder i Storage
            </span>
          </span>
        </button>
      </div>
      <div className="mt-2 pt-2 border-t border-stone-100 px-1 pb-1 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Sideoppsett</p>
        <label htmlFor="cms-sidebredde" className="block text-[10px] text-stone-600">
          Sidebredde
        </label>
        <select
          id="cms-sidebredde"
          value={pageWidth}
          onChange={(e) => onChangePageWidth(Number(e.target.value) as CmsPageWidth)}
          className="w-full px-2 py-1 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
        >
          {CMS_PAGE_WIDTH_OPTIONS.map((w) => (
            <option key={w} value={w}>
              {w} px
            </option>
          ))}
        </select>
        <p className="text-[10px] text-stone-500 leading-snug">Gjelder forside, footer og Åpenhet.</p>
      </div>
    </nav>
  );
};
