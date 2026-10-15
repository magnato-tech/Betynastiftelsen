import React, { useState } from 'react';
import { Link2, Plus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { childNamesOfSponsor } from '../../utils/sponsorChildren';

export const AdminPeoplePanel: React.FC = () => {
  const {
    childrenList,
    sponsors,
    coordinators,
    addChild,
    addSponsor,
    assignSponsorToChild,
    endSponsorship,
  } = useApp();

  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [sponsorNavn, setSponsorNavn] = useState('');
  const [sponsorEpost, setSponsorEpost] = useState('');
  const [sponsorTelefon, setSponsorTelefon] = useState('');
  const [sponsorPoststed, setSponsorPoststed] = useState('');
  const [sponsorBelop, setSponsorBelop] = useState<250 | 350>(250);
  const [sponsorMetode, setSponsorMetode] = useState<'vipps' | 'bank'>('vipps');
  const [sponsorSavedName, setSponsorSavedName] = useState<string | null>(null);
  const [childFirstName, setChildFirstName] = useState('');
  const [childBirthYear, setChildBirthYear] = useState(2017);
  const [childGender, setChildGender] = useState<'gutt' | 'jente'>('gutt');
  const [childGrade, setChildGrade] = useState('3. klasse');
  const [childSchool, setChildSchool] = useState('École Primaire Sainte-Thérèse, Brazzaville');
  const [childCoordinatorId, setChildCoordinatorId] = useState(coordinators[0]?.id || 'coord-01');
  const [childSavedName, setChildSavedName] = useState<string | null>(null);
  const [selectedChildForAssign, setSelectedChildForAssign] = useState('');
  const [selectedSponsorForAssign, setSelectedSponsorForAssign] = useState('');

  const unassignedChildren = childrenList.filter((c) => !c.tildeltFadderId && c.status === 'aktiv');
  const childrenSorted = [...childrenList].sort((a, b) => a.internKode.localeCompare(b.internKode));
  const sponsorsSorted = [...sponsors].sort((a, b) => b.startDato.localeCompare(a.startDato));

  const handleAddSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorNavn.trim() || !sponsorEpost.trim()) return;
    const newId = addSponsor({
      navn: sponsorNavn.trim(),
      epost: sponsorEpost.trim(),
      telefon: sponsorTelefon.trim(),
      poststed: sponsorPoststed.trim(),
      maanedsbelop: sponsorBelop,
      betalingsmetode: sponsorMetode,
    });
    setSponsorSavedName(sponsorNavn.trim());
    setSelectedSponsorForAssign(newId);
    setSponsorNavn('');
    setSponsorEpost('');
    setSponsorTelefon('');
    setSponsorPoststed('');
    setSponsorBelop(250);
    setSponsorMetode('vipps');
    setShowAddSponsor(false);
  };

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childFirstName.trim()) return;
    addChild({
      fornavn: childFirstName.trim(),
      fodselsaar: childBirthYear,
      kjonn: childGender,
      klassetrinn: childGrade.trim() || '3. klasse',
      skoleNavn: childSchool.trim(),
      koordinatorId: childCoordinatorId,
    });
    setChildSavedName(childFirstName.trim());
    setChildFirstName('');
    setShowAddChild(false);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildForAssign || !selectedSponsorForAssign) return;
    assignSponsorToChild(selectedChildForAssign, selectedSponsorForAssign);
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

  return (
    <div className="space-y-6">
      {(sponsorSavedName || childSavedName) && (
        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {childSavedName ? `${childSavedName} er lagt inn i barnelisten.` : null}
          {childSavedName && sponsorSavedName ? ' ' : null}
          {sponsorSavedName ? `${sponsorSavedName} er lagt til som fadder. Koble til et barn i boksen under.` : null}
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
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-3">
          <h2 className="text-base font-serif font-bold text-stone-900">Barn ({childrenList.length})</h2>
          {plusBtn(showAddChild, () => setShowAddChild((v) => !v), 'Legg til barn')}
        </div>
        {showAddChild && (
          <form onSubmit={handleAddChild} className="p-4 border-b border-stone-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-stone-50/80">
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
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            >
              {coordinators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fornavn} {c.etternavn}
                </option>
              ))}
            </select>
            <div className="flex items-end">
              <button type="submit" className="px-4 py-2 bg-[#4D6B3E] text-white rounded-lg text-xs font-medium cursor-pointer">
                Lagre barn
              </button>
            </div>
          </form>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Kode</th>
                <th className="py-2.5 px-4">Fornavn</th>
                <th className="py-2.5 px-4">Skole & trinn</th>
                <th className="py-2.5 px-4">Fadder</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {childrenSorted.map((ch) => {
                const assignedSponsor = sponsors.find((s) => s.id === ch.tildeltFadderId);
                return (
                  <tr key={ch.id} className="hover:bg-stone-50/60">
                    <td className="py-2.5 px-4 font-mono font-bold text-stone-800">{ch.internKode}</td>
                    <td className="py-2.5 px-4 font-semibold text-stone-900">
                      {ch.fornavn} ({new Date().getFullYear() - ch.fodselsaar} år)
                    </td>
                    <td className="py-2.5 px-4 text-stone-600">
                      <div>{ch.klassetrinn}</div>
                      <div className="text-[11px] text-stone-400">{ch.skoleNavn}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      {assignedSponsor ? (
                        <span className="text-stone-900 font-medium">{assignedSponsor.navn}</span>
                      ) : (
                        <span className="text-[#4D6B3E] font-medium">Ufordelt</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 capitalize text-stone-700">{ch.status}</td>
                    <td className="py-2.5 px-4 text-right">
                      {ch.status === 'aktiv' && ch.tildeltFadderId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Avslutte fadderskap for ${ch.fornavn}?`)) {
                              endSponsorship(ch.id);
                            }
                          }}
                          className="text-stone-500 hover:text-stone-800 cursor-pointer"
                        >
                          Avslutt
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-3">
          <h2 className="text-base font-serif font-bold text-stone-900">Faddere ({sponsors.length})</h2>
          {plusBtn(showAddSponsor, () => setShowAddSponsor((v) => !v), 'Legg til fadder')}
        </div>
        {showAddSponsor && (
          <form onSubmit={handleAddSponsor} className="p-4 border-b border-stone-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-stone-50/80">
            <input
              required
              value={sponsorNavn}
              onChange={(e) => setSponsorNavn(e.target.value)}
              placeholder="Navn"
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            />
            <input
              type="email"
              required
              value={sponsorEpost}
              onChange={(e) => setSponsorEpost(e.target.value)}
              placeholder="E-post"
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            />
            <input
              value={sponsorTelefon}
              onChange={(e) => setSponsorTelefon(e.target.value)}
              placeholder="Telefon"
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            />
            <input
              value={sponsorPoststed}
              onChange={(e) => setSponsorPoststed(e.target.value)}
              placeholder="Poststed"
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            />
            <select
              value={sponsorBelop}
              onChange={(e) => setSponsorBelop(Number(e.target.value) as 250 | 350)}
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            >
              <option value={250}>250 kr</option>
              <option value={350}>350 kr</option>
            </select>
            <select
              value={sponsorMetode}
              onChange={(e) => setSponsorMetode(e.target.value as 'vipps' | 'bank')}
              className="px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs"
            >
              <option value="vipps">Vipps</option>
              <option value="bank">Bank</option>
            </select>
            <div>
              <button type="submit" className="px-4 py-2 bg-[#4D6B3E] text-white rounded-lg text-xs font-medium cursor-pointer">
                Lagre fadder
              </button>
            </div>
          </form>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Navn</th>
                <th className="py-2.5 px-4 font-semibold">Start</th>
                <th className="py-2.5 px-4 font-semibold">Beløp</th>
                <th className="py-2.5 px-4 font-semibold">Barn</th>
                <th className="py-2.5 px-4 font-semibold">Kontakt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sponsorsSorted.map((sp) => (
                <tr key={sp.id} className="hover:bg-stone-50/80">
                  <td className="py-2.5 px-4 font-medium text-stone-900">{sp.navn}</td>
                  <td className="py-2.5 px-4 text-stone-600 tabular-nums">{sp.startDato.split('-').reverse().join('.')}</td>
                  <td className="py-2.5 px-4 text-stone-700">{sp.maanedsbelop} kr</td>
                  <td className="py-2.5 px-4 text-stone-600">{childNamesOfSponsor(childrenList, sp)}</td>
                  <td className="py-2.5 px-4 text-stone-500">{sp.epost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
