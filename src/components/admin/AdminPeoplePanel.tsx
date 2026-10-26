import React, { useEffect, useState } from 'react';
import { Link2, Plus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { childNamesOfSponsor } from '../../utils/sponsorChildren';
import {
  canAssignSponsor,
  childCoordinatorState,
  childrenNeedingCoordinator,
} from '../../utils/coordinatorAssignment';
import { ChildPage, koordinatorCelle, navnPaa } from './ChildPage';

export interface AdminPeoplePanelProps {
  focusChildId?: string | null;
  onClearChildFocus?: () => void;
  onOpenSponsorByEmail?: (email: string) => void;
}

/** Filterverdier for koordinator-velgeren. Andre verdier er koordinator-id. */
const FILTER_ALLE = 'alle';
const FILTER_UGYLDIG = 'ugyldig';

export const AdminPeoplePanel: React.FC<AdminPeoplePanelProps> = ({
  focusChildId,
  onClearChildFocus,
  onOpenSponsorByEmail,
}) => {
  const {
    childrenList,
    sponsors,
    coordinators,
    addChild,
    assignSponsorToChild,
  } = useApp();

  const aktiveKoordinatorer = coordinators.filter((c) => c.aktiv !== false);

  const [showAddChild, setShowAddChild] = useState(false);
  const [childFirstName, setChildFirstName] = useState('');
  const [childBirthYear, setChildBirthYear] = useState(2017);
  const [childGender, setChildGender] = useState<'gutt' | 'jente'>('gutt');
  const [childGrade, setChildGrade] = useState('3. klasse');
  const [childSchool, setChildSchool] = useState('École Primaire Sainte-Thérèse, Brazzaville');
  // Ingen koordinator er valgt på forhånd. Den må velges før barnet kan lagres.
  const [childCoordinatorId, setChildCoordinatorId] = useState('');
  const [addFeil, setAddFeil] = useState<string | null>(null);
  const [childSavedName, setChildSavedName] = useState<string | null>(null);
  const [selectedChildForAssign, setSelectedChildForAssign] = useState('');
  const [selectedSponsorForAssign, setSelectedSponsorForAssign] = useState('');
  const [assignFeil, setAssignFeil] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [koordinatorFilter, setKoordinatorFilter] = useState<string>(FILTER_ALLE);

  useEffect(() => {
    if (focusChildId) {
      setSelectedChildId(focusChildId);
      onClearChildFocus?.();
    }
  }, [focusChildId, onClearChildFocus]);

  // Aktive barn uten gyldig koordinator. Brukes i infolinjen og i filteret «Vis».
  const behovForKoordinator = childrenNeedingCoordinator(childrenList, coordinators);
  const behovIds = new Set(behovForKoordinator.map((c) => c.id));

  // Barn uten fadder som ikke kan kobles før de har koordinator.
  const utenFadderUtenKoordinator = childrenList.filter(
    (c) => !c.tildeltFadderId && c.status === 'aktiv' && !canAssignSponsor(c, coordinators)
  ).length;
  const unassignedChildren = childrenList.filter(
    (c) => !c.tildeltFadderId && c.status === 'aktiv' && canAssignSponsor(c, coordinators)
  );

  const childrenSorted = [...childrenList].sort((a, b) => a.internKode.localeCompare(b.internKode));
  const synligeBarn = childrenSorted.filter((c) => {
    if (koordinatorFilter === FILTER_ALLE) return true;
    if (koordinatorFilter === FILTER_UGYLDIG) return behovIds.has(c.id);
    return c.koordinatorId === koordinatorFilter;
  });

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childFirstName.trim() || !childCoordinatorId) return;
    setAddFeil(null);
    try {
      addChild({
        fornavn: childFirstName.trim(),
        fodselsaar: childBirthYear,
        kjonn: childGender,
        klassetrinn: childGrade.trim() || '3. klasse',
        skoleNavn: childSchool.trim(),
        koordinatorId: childCoordinatorId,
      });
    } catch (err) {
      setAddFeil(err instanceof Error ? err.message : 'Kunne ikke lagre barnet.');
      return;
    }
    setChildSavedName(childFirstName.trim());
    setChildFirstName('');
    setChildCoordinatorId('');
    setShowAddChild(false);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildForAssign || !selectedSponsorForAssign) return;
    setAssignFeil(null);
    try {
      assignSponsorToChild(selectedChildForAssign, selectedSponsorForAssign);
    } catch (err) {
      setAssignFeil(err instanceof Error ? err.message : 'Kunne ikke koble barnet til fadderen.');
      return;
    }
    setSelectedChildForAssign('');
    setSelectedSponsorForAssign('');
  };

  const plusBtn = (open: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? `Lukk ${label}` : label}
      className="w-8 h-8 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 hover:text-[#4D6B3E] flex items-center justify-center cursor-pointer"
    >
      {open ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
    </button>
  );

  const selectedChild = selectedChildId ? childrenList.find((c) => c.id === selectedChildId) : undefined;

  // Hele barnesiden vises i stedet for listen når et barn er valgt.
  if (selectedChild) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setSelectedChildId(null)}
          className="text-xs font-medium text-[#4D6B3E] hover:underline cursor-pointer"
        >
          ← Tilbake til Barn
        </button>
        <ChildPage key={selectedChild.id} child={selectedChild} onOpenSponsorByEmail={onOpenSponsorByEmail} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-stone-900">Barn</h2>
        <p className="text-xs text-stone-600 mt-0.5">
          Barn i programmet. Faddere administreres under Brukere. Klikk en rad for å åpne barnet.
        </p>
      </div>

      {childSavedName && (
        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {childSavedName} er lagt inn i barnelisten.
        </p>
      )}

      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs max-w-3xl">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-[#4D6B3E]" />
          <h2 className="text-sm font-serif font-bold text-stone-900">Koble barn og fadder</h2>
        </div>
        <p className="text-[11px] text-stone-500 mb-3">
          En fadder kan støtte flere barn. Hvert barn har likevel bare én fadder.
        </p>
        <form onSubmit={handleAssignSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={selectedChildForAssign}
            onChange={(e) => setSelectedChildForAssign(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800"
            required
            aria-label="Barn uten fadder"
          >
            <option value="">Barn uten fadder…</option>
            {unassignedChildren.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.internKode} — {ch.fornavn}
              </option>
            ))}
          </select>
          <select
            value={selectedSponsorForAssign}
            onChange={(e) => setSelectedSponsorForAssign(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800"
            required
            aria-label="Fadder"
          >
            <option value="">Fadder…</option>
            {sponsors.map((sp) => {
              const names = childNamesOfSponsor(childrenList, sp);
              return (
                <option key={sp.id} value={sp.id}>
                  {sp.navn}
                  {names !== '—' ? ` (${names})` : ''}
                </option>
              );
            })}
          </select>
          <button
            type="submit"
            disabled={!selectedChildForAssign || !selectedSponsorForAssign}
            className="py-2 px-3 bg-[#4D6B3E] hover:bg-[#3B522F] disabled:opacity-50 text-white rounded-lg text-xs font-medium cursor-pointer"
          >
            Koble
          </button>
        </form>
        {utenFadderUtenKoordinator > 0 && (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
            {`${utenFadderUtenKoordinator} barn uten fadder mangler koordinator og kan ikke kobles ennå. Gi dem koordinator under Barn.`}
          </p>
        )}
        {assignFeil && (
          <p role="alert" className="text-xs text-red-900 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
            {assignFeil}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-3">
          <h2 className="text-base font-serif font-bold text-stone-900">Barn ({childrenList.length})</h2>
          {plusBtn(showAddChild, () => setShowAddChild((v) => !v), 'Legg til barn')}
        </div>

        {behovForKoordinator.length > 0 && (
          <div className="px-4 pt-4">
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            >
              <span>{`${behovForKoordinator.length} barn trenger koordinator`}</span>
              <button
                type="button"
                onClick={() => setKoordinatorFilter(FILTER_UGYLDIG)}
                className="px-2.5 py-1 rounded-md border border-amber-400 bg-white text-amber-900 hover:bg-amber-100 font-medium cursor-pointer"
              >
                Vis
              </button>
            </div>
          </div>
        )}

        <div className="px-4 pt-4 flex flex-wrap items-center gap-2 text-xs text-stone-700">
          <span className="font-medium">Koordinator:</span>
          <select
            value={koordinatorFilter}
            onChange={(e) => setKoordinatorFilter(e.target.value)}
            aria-label="Filtrer på koordinator"
            className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-800"
          >
            <option value={FILTER_ALLE}>Alle</option>
            {aktiveKoordinatorer.map((c) => (
              <option key={c.id} value={c.id}>
                {navnPaa(c)}
              </option>
            ))}
            <option value={FILTER_UGYLDIG}>Uten gyldig koordinator</option>
          </select>
        </div>

        {showAddChild && (
          <form
            onSubmit={handleAddChild}
            className="p-4 border-b border-stone-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-stone-50/80"
          >
            <input
              required
              value={childFirstName}
              onChange={(e) => setChildFirstName(e.target.value)}
              placeholder="Fornavn"
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            />
            <input
              type="number"
              min={2008}
              max={2022}
              value={childBirthYear}
              onChange={(e) => setChildBirthYear(parseInt(e.target.value, 10) || 2017)}
              aria-label="Fødselsår"
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            />
            <select
              value={childGender}
              onChange={(e) => setChildGender(e.target.value as 'gutt' | 'jente')}
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            >
              <option value="gutt">Gutt</option>
              <option value="jente">Jente</option>
            </select>
            <input
              value={childGrade}
              onChange={(e) => setChildGrade(e.target.value)}
              placeholder="Klassetrinn"
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            />
            <input
              value={childSchool}
              onChange={(e) => setChildSchool(e.target.value)}
              placeholder="Skole"
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs sm:col-span-2"
            />
            <select
              value={childCoordinatorId}
              onChange={(e) => setChildCoordinatorId(e.target.value)}
              required
              aria-label="Koordinator for nytt barn"
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            >
              <option value="" disabled>
                Velg koordinator…
              </option>
              {aktiveKoordinatorer.map((c) => (
                <option key={c.id} value={c.id}>
                  {navnPaa(c)}
                </option>
              ))}
            </select>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!childCoordinatorId}
                className="px-4 py-2 bg-[#4D6B3E] text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Lagre barn
              </button>
            </div>
            {addFeil && (
              <p role="alert" className="sm:col-span-2 lg:col-span-3 text-xs text-red-900 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {addFeil}
              </p>
            )}
          </form>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Kode</th>
                <th className="py-2.5 px-4">Fornavn</th>
                <th className="py-2.5 px-4">Skole & trinn</th>
                <th className="py-2.5 px-4">Koordinator</th>
                <th className="py-2.5 px-4">Fadder</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {synligeBarn.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-stone-500">
                    Ingen barn passer filteret.
                  </td>
                </tr>
              )}
              {synligeBarn.map((ch) => {
                const assignedSponsor = sponsors.find((s) => s.id === ch.tildeltFadderId);
                return (
                  <tr
                    key={ch.id}
                    className="hover:bg-stone-50/60 cursor-pointer"
                    onClick={() => setSelectedChildId(ch.id)}
                  >
                    <td className="py-2.5 px-4 font-mono font-bold text-stone-800">{ch.internKode}</td>
                    <td className="py-2.5 px-4 font-semibold text-stone-900">
                      {ch.fornavn} ({new Date().getFullYear() - ch.fodselsaar} år)
                    </td>
                    <td className="py-2.5 px-4 text-stone-600">
                      <div>{ch.klassetrinn}</div>
                      <div className="text-[11px] text-stone-400">{ch.skoleNavn}</div>
                    </td>
                    <td className="py-2.5 px-4">{koordinatorCelle(childCoordinatorState(ch, coordinators))}</td>
                    <td className="py-2.5 px-4">
                      {assignedSponsor ? (
                        <span className="text-stone-900 font-medium">{assignedSponsor.navn}</span>
                      ) : (
                        <span className="text-[#4D6B3E] font-medium">Ufordelt</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 capitalize text-stone-700">{ch.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
