import React from 'react';
import {
  ArrowLeft,
  Award,
  Camera,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  History,
  Plus,
  School,
} from 'lucide-react';
import type { CatalogPhoto, Child, ChildMilestone, Report } from '../../types';
import { ChildHistoryTimeline } from '../common/ChildHistoryTimeline';
import { catalogPhotosForChild, reportsForChild } from '../../utils/photoCatalog';
import { getCoordinatorUi } from '../../locales/coordinatorUi';
import type { AppLanguage } from '../../types';

interface CoordinatorChildProfileProps {
  child: Child;
  reports: Report[];
  milestones: ChildMilestone[];
  catalogPhotos: CatalogPhoto[];
  language: AppLanguage;
  onBack: () => void;
  onWriteReport: () => void;
  onAddMilestone: () => void;
  onEditMilestone: (m: ChildMilestone) => void;
  onDeleteMilestone: (id: string) => void;
}

export const CoordinatorChildProfile: React.FC<CoordinatorChildProfileProps> = ({
  child,
  reports,
  milestones,
  catalogPhotos,
  language,
  onBack,
  onWriteReport,
  onAddMilestone,
  onEditMilestone,
  onDeleteMilestone,
}) => {
  const ui = getCoordinatorUi(language);
  const childReports = reportsForChild(reports, child.id);
  const childMilestones = milestones.filter((m) => m.barnId === child.id);
  const photos = catalogPhotosForChild(catalogPhotos, child);
  const age = new Date().getFullYear() - child.fodselsaar;
  const isAssigned = !!child.tildeltFadderId;

  const reportStatus = (rep: Report) => {
    if (rep.status === 'godkjent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-xs font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          {ui.approvedPublished}
        </span>
      );
    }
    if (rep.status === 'innsendt') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#A3B18A]/20 text-[#4D6B3E] rounded-md text-xs font-medium">
          <Clock className="w-3.5 h-3.5" />
          {ui.pendingOslo}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-md text-xs font-medium">
        <AlertCircle className="w-3.5 h-3.5" />
        {ui.changesRequired}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-medium text-[#4D6B3E] hover:text-[#3B522F] cursor-pointer inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {ui.backToList}
      </button>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xs space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#4D6B3E]">{ui.profileKicker}</p>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              {child.fornavn}{' '}
              <span className="text-base font-sans font-medium text-stone-500">({ui.years(age)})</span>
            </h2>
            <p className="text-xs text-stone-600 mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold">{child.internKode}</span>
              <span aria-hidden="true">·</span>
              <School className="w-3.5 h-3.5" />
              <span>
                {child.klassetrinn} — {child.skoleNavn}
              </span>
            </p>
            <p className="text-xs mt-2">
              {ui.statusLabel}{' '}
              {isAssigned ? (
                <span className="text-emerald-700 font-semibold">{ui.sponsorVisible}</span>
              ) : (
                <span className="text-stone-500">{ui.awaitingAssign}</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAddMilestone}
              className="px-3 py-2 bg-[#4D6B3E] hover:bg-[#3B522F] text-white text-xs font-medium rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {ui.addMilestone}
            </button>
            <button
              type="button"
              onClick={onWriteReport}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              {ui.writeReport}
            </button>
          </div>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed font-sans">{child.bakgrunnskontekst}</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#4D6B3E]" />
          {ui.profilePhotosTitle}
        </h3>
        {photos.length === 0 ? (
          <p className="text-xs text-stone-500 bg-white border border-stone-200 rounded-xl p-6">{ui.profilePhotosEmpty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((p) => (
              <figure key={p.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                <img src={p.url} alt={p.beskrivelseFr} className="w-full h-40 object-cover bg-stone-100" />
                <figcaption className="p-3 space-y-1">
                  <p className="text-xs text-stone-700">{language === 'no' && p.beskrivelseNo ? p.beskrivelseNo : p.beskrivelseFr}</p>
                  <p className="text-[11px] text-stone-500">
                    {ui.dateLabel} {p.dato}
                    {p.barnIds.length > 1 ? (
                      <span className="ml-2 text-[#4D6B3E] font-medium">{ui.profilePhotosShared}</span>
                    ) : null}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#4D6B3E]" />
          {ui.profileReportsTitle}
        </h3>
        {childReports.length === 0 ? (
          <p className="text-xs text-stone-500 bg-white border border-stone-200 rounded-xl p-6">{ui.profileReportsEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {childReports.map((rep) => (
              <li key={rep.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                  <span>
                    {ui.dateLabel} {rep.dato}
                  </span>
                  {reportStatus(rep)}
                </div>
                <h4 className="text-sm font-serif font-bold text-stone-900">{rep.tittelFransk}</h4>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
          <History className="w-4 h-4 text-[#4D6B3E]" />
          {ui.profileMilestonesTitle}
          <span className="text-xs font-sans font-medium text-stone-500 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            {ui.jalonsCount(childMilestones.length)}
          </span>
        </h3>
        <ChildHistoryTimeline
          milestones={childMilestones}
          childName={child.fornavn}
          childCode={child.internKode}
          isCoordinatorView={true}
          emptyMessage={ui.profileMilestonesEmpty}
          onAddMilestoneClick={onAddMilestone}
          onEditMilestone={onEditMilestone}
          onDeleteMilestone={onDeleteMilestone}
        />
      </section>
    </div>
  );
};
