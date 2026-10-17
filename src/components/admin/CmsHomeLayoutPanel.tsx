import React from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import type { CmsContent, CmsHomeModuleId } from '../../types';
import {
  CMS_HOME_MODULE_LABELS,
  moveHomeModule,
  normalizeCmsHomeLayout,
  setHomeModuleVisible,
} from '../../utils/cmsHomeLayout';
import type { CmsPreviewSection } from '../../utils/cmsPreview';

const MODULE_TO_TAB: Record<CmsHomeModuleId, CmsPreviewSection> = {
  hero: 'hero',
  stories: 'stories',
  steps: 'steps',
  about: 'about',
  kpis: 'kpis',
  cta: 'cta',
  behov: 'behov',
};

interface CmsHomeLayoutPanelProps {
  cmsContent: CmsContent;
  onUpdateLayout: (layout: CmsContent['homeLayout']) => void;
  onEditModule: (tab: CmsPreviewSection) => void;
}

export const CmsHomeLayoutPanel: React.FC<CmsHomeLayoutPanelProps> = ({
  cmsContent,
  onUpdateLayout,
  onEditModule,
}) => {
  const layout = normalizeCmsHomeLayout(cmsContent);

  const patch = (next: typeof layout) => {
    onUpdateLayout(next);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
      <div className="flex items-start gap-2">
        <LayoutGrid className="w-4 h-4 text-[#4D6B3E] shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-serif font-bold text-stone-900">Forside</h3>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Moduler som er på listen vises på nettsiden i denne rekkefølgen. Avslått modul ligger fortsatt i
            biblioteket — rediger innholdet under fanene til venstre.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {layout.map((row, idx) => {
          const visible = row.visible !== false;
          return (
            <li
              key={row.moduleId}
              className={`flex flex-wrap items-center gap-2 p-3 rounded-lg border text-xs ${
                visible ? 'border-[#A3B18A]/50 bg-[#F6F4ED]/60' : 'border-stone-200 bg-stone-50'
              }`}
            >
              <span className="font-mono text-stone-400 w-5">{idx + 1}.</span>
              <span className="font-semibold text-stone-900 flex-1 min-w-[10rem]">
                {CMS_HOME_MODULE_LABELS[row.moduleId]}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-stone-500">
                {visible ? 'På forsiden' : 'Kun bibliotek'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => patch(moveHomeModule(layout, row.moduleId, 'up'))}
                  className="p-1.5 rounded border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-30 cursor-pointer"
                  aria-label="Flytt opp"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === layout.length - 1}
                  onClick={() => patch(moveHomeModule(layout, row.moduleId, 'down'))}
                  className="p-1.5 rounded border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-30 cursor-pointer"
                  aria-label="Flytt ned"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => patch(setHomeModuleVisible(layout, row.moduleId, !visible))}
                  className={`px-2 py-1.5 rounded border font-medium flex items-center gap-1 cursor-pointer ${
                    visible
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {visible ? 'Vis' : 'Skjul'}
                </button>
                <button
                  type="button"
                  onClick={() => onEditModule(MODULE_TO_TAB[row.moduleId])}
                  className="px-2.5 py-1.5 rounded bg-stone-900 text-white font-medium cursor-pointer"
                >
                  Rediger
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
