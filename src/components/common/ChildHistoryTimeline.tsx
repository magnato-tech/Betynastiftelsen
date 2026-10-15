import React, { useState, useMemo } from 'react';
import { ChildMilestone, MilestoneCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  HeartPulse,
  Palette,
  Package,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  ArrowUpDown,
  Tag,
  ShieldCheck,
  Edit2,
  Trash2,
  Plus,
} from 'lucide-react';

interface ChildHistoryTimelineProps {
  milestones: ChildMilestone[];
  childName?: string;
  childCode?: string;
  isCoordinatorView?: boolean;
  onAddMilestoneClick?: () => void;
  onEditMilestone?: (milestone: ChildMilestone) => void;
  onDeleteMilestone?: (id: string) => void;
  emptyMessage?: string;
}

export const ChildHistoryTimeline: React.FC<ChildHistoryTimelineProps> = ({
  milestones,
  childName,
  childCode,
  isCoordinatorView = false,
  onAddMilestoneClick,
  onEditMilestone,
  onDeleteMilestone,
  emptyMessage,
}) => {
  const { language } = useApp();
  const isFr = language === 'fr';
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredMilestones = useMemo(() => {
    let list = milestones;
    if (selectedCategory !== 'all') {
      list = list.filter((m) => m.kategori === selectedCategory);
    }
    return [...list].sort((a, b) => {
      const comp = new Date(b.dato).getTime() - new Date(a.dato).getTime();
      return sortOrder === 'desc' ? comp : -comp;
    });
  }, [milestones, selectedCategory, sortOrder]);

  const getCategoryMeta = (cat: MilestoneCategory) => {
    switch (cat) {
      case 'skole':
        return {
          labelNo: 'Skole & Faglig',
          labelFr: 'Scolaire & Académique',
          icon: GraduationCap,
          badgeBg: 'bg-[#4D6B3E]/10',
          badgeText: 'text-[#4D6B3E]',
          dotBorder: 'border-[#4D6B3E]',
          dotBg: 'bg-[#4D6B3E]',
        };
      case 'helse':
        return {
          labelNo: 'Helse & Velvære',
          labelFr: 'Santé & Bien-être',
          icon: HeartPulse,
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-700',
          dotBorder: 'border-emerald-600',
          dotBg: 'bg-emerald-600',
        };
      case 'aktivitet':
        return {
          labelNo: 'Kultur & Fritid',
          labelFr: 'Activités & Loisirs',
          icon: Palette,
          badgeBg: 'bg-sky-50',
          badgeText: 'text-sky-700',
          dotBorder: 'border-sky-600',
          dotBg: 'bg-sky-600',
        };
      case 'utstyr':
        return {
          labelNo: 'Materiell & Uniform',
          labelFr: 'Équipement & Matériel',
          icon: Package,
          badgeBg: 'bg-[#A3B18A]/20',
          badgeText: 'text-[#4D6B3E]',
          dotBorder: 'border-[#A3B18A]',
          dotBg: 'bg-[#A3B18A]',
        };
      case 'personlig':
      default:
        return {
          labelNo: 'Mestring & Utvikling',
          labelFr: 'Développement personnel',
          icon: Award,
          badgeBg: 'bg-purple-50',
          badgeText: 'text-purple-700',
          dotBorder: 'border-purple-600',
          dotBg: 'bg-purple-600',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Category Filters & Sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs text-xs">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-stone-400 text-xs px-1 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>{isFr ? 'Catégorie :' : 'Kategori :'}</span>
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#4D6B3E] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70'
            }`}
          >
            {isFr ? 'Tous' : 'Alle'} ({milestones.length})
          </button>
          <button
            onClick={() => setSelectedCategory('skole')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'skole'
                ? 'bg-[#4D6B3E] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70'
            }`}
          >
            {isFr ? 'Scolaire' : 'Skole'}
          </button>
          <button
            onClick={() => setSelectedCategory('utstyr')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'utstyr'
                ? 'bg-[#4D6B3E] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70'
            }`}
          >
            {isFr ? 'Équipement' : 'Materiell'}
          </button>
          <button
            onClick={() => setSelectedCategory('helse')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'helse'
                ? 'bg-[#4D6B3E] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70'
            }`}
          >
            {isFr ? 'Santé' : 'Helse'}
          </button>
          <button
            onClick={() => setSelectedCategory('aktivitet')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'aktivitet'
                ? 'bg-[#4D6B3E] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70'
            }`}
          >
            {isFr ? 'Loisirs' : 'Aktivitet'}
          </button>
          <button
            onClick={() => setSelectedCategory('personlig')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'personlig'
                ? 'bg-[#4D6B3E] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70'
            }`}
          >
            {isFr ? 'Développement' : 'Mestring'}
          </button>
        </div>

        {/* Right tools: Sort & Optional Add Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200/70 text-stone-700 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1"
            title={sortOrder === 'desc' ? 'Sorter eldste først' : 'Sorter nyeste først'}
          >
            <ArrowUpDown className="w-3 h-3 text-stone-500" />
            <span>{sortOrder === 'desc' ? (isFr ? 'Plus récents d’abord' : 'Nyeste først') : (isFr ? 'Plus anciens d’abord' : 'Eldste først')}</span>
          </button>

          {isCoordinatorView && onAddMilestoneClick && (
            <button
              onClick={onAddMilestoneClick}
              className="px-3 py-1 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFr ? 'Nouveau jalon' : 'Ny milepæl'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Vertical Timeline Container */}
      <div className="relative pl-6 sm:pl-8 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#DFD9CB]">
        {filteredMilestones.map((m, idx) => {
          const meta = getCategoryMeta(m.kategori);
          const Icon = meta.icon;

          return (
            <div key={m.id} className="relative pb-8 last:pb-2 group">
              {/* Timeline dot / category icon marker */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 ${meta.dotBorder} bg-white shadow-xs flex items-center justify-center transition-transform group-hover:scale-110`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${meta.dotBg}`} />
              </div>

              {/* Milestone Card */}
              <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs hover:border-[#A3B18A] transition-colors space-y-3">
                {/* Card Top: Date & Category & Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-stone-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#4D6B3E]" />
                      <strong className="font-mono text-[#3C3C3C]">{m.dato}</strong>
                    </span>
                    <span className="text-stone-300">·</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${meta.badgeBg} ${meta.badgeText}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{isFr ? meta.labelFr : meta.labelNo}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {m.merknad && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-stone-100 border border-stone-200/80 rounded-md text-[11px] font-mono text-stone-700">
                        <Tag className="w-3 h-3 text-stone-400" />
                        <span>{m.merknad}</span>
                      </span>
                    )}

                    {isCoordinatorView && (
                      <div className="flex items-center gap-1 pl-2 border-l border-stone-200">
                        {onEditMilestone && (
                          <button
                            onClick={() => onEditMilestone(m)}
                            className="p-1 text-stone-400 hover:text-[#4D6B3E] rounded hover:bg-stone-100 transition-colors cursor-pointer"
                            title={isFr ? 'Modifier ce jalon' : 'Rediger milepæl'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteMilestone && (
                          confirmDeleteId === m.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[10px]">
                              <span className="text-rose-700 font-medium">{isFr ? 'Supprimer ?' : 'Slette?'}</span>
                              <button
                                onClick={() => {
                                  onDeleteMilestone(m.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-1 py-0.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 cursor-pointer"
                              >
                                {isFr ? 'Oui' : 'Ja'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1 py-0.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                              >
                                {isFr ? 'Non' : 'Nei'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(m.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                              title={isFr ? 'Supprimer ce jalon' : 'Slett milepæl'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Content: Title & Description */}
                <div>
                  <h4 className="text-base sm:text-lg font-serif font-bold text-[#3C3C3C]">
                    {isFr ? m.tittelFransk : m.tittelNorsk}
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed font-sans">
                    {isFr ? m.beskrivelseFransk : m.beskrivelseNorsk}
                  </p>
                </div>

                {/* Coordinator view: Show both French & Norwegian translation for cross-validation */}
                {isCoordinatorView && (
                  <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-lg text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                      {isFr
                        ? 'Texte traduit affiché au parrain (norvégien) :'
                        : 'Fransk kildetekst (felt):'}
                    </span>
                    <p className="font-semibold text-stone-800">{isFr ? m.tittelNorsk : m.tittelFransk}</p>
                    <p className="text-stone-600 text-[11px]">{isFr ? m.beskrivelseNorsk : m.beskrivelseFransk}</p>
                  </div>
                )}

                {/* Verification & Provenance Footer */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
                  <div className="flex items-center gap-1.5 text-[#4D6B3E] font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {isFr
                        ? `Validé sur le terrain · ${m.koordinatorNavn}`
                        : `Bekreftet av feltkoordinator i Kongo (${m.koordinatorNavn})`}
                    </span>
                  </div>
                  <span className="text-stone-400">
                    {isFr
                      ? `Ref: ${m.barnNavn}`
                      : `Loggført for ${m.barnNavn} (${childCode || 'Fadderbarn'})`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMilestones.length === 0 && (
          <div className="p-10 bg-white rounded-2xl border border-stone-200 text-center space-y-2">
            <Clock className="w-8 h-8 text-stone-300 mx-auto mb-1" />
            <h4 className="text-sm font-semibold text-stone-700">
              {isFr ? 'Aucun jalon enregistré pour cette sélection' : 'Ingen milepæler å vise for dette utvalget'}
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto font-sans">
              {emptyMessage ||
                (isFr
                  ? 'Utilisez le formulaire ci-dessus pour documenter le premier événement ou succès scolaire de cet élève.'
                  : 'Feltkoordinator i Kongo dokumenterer elevens milepæler underveis i skoleåret. Nye oppdateringer vil vises her automatisk.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
