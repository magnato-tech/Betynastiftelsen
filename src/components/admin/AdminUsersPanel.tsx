import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { BOOTSTRAP_ADMIN_EMAILS } from '../../config/bootstrapAdmins';
import { useApp } from '../../context/AppContext';
import { saveUserDirectoryEntry } from '../../db/firestoreData';
import {
  FIRESTORE_COLLECTIONS,
  type FirestoreUserDirectoryEntry,
  type UserDirectoryStatus,
} from '../../db/firestoreProfile';
import { emailToDirectoryDocId } from '../../db/firestoreUser';
import {
  buildPeopleRows,
  type DirectoryRow,
  type PersonRow,
  type PersonRole,
} from '../../utils/peopleDirectory';
import { UserDirectoryInviteForm } from './UserDirectoryInviteForm';
import { PersonCard, ROLE_LABEL } from './PersonCard';

export interface AdminUsersPanelProps {
  focusEmail?: string | null;
  onClearFocus?: () => void;
  onOpenChild?: (childId: string) => void;
}

type RoleFilter = 'alle' | PersonRole;

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'admin', label: 'Administratorer' },
  { value: 'coordinator', label: 'Koordinatorer' },
  { value: 'sponsor', label: 'Faddere' },
];

export const AdminUsersPanel: React.FC<AdminUsersPanelProps> = ({
  focusEmail,
  onClearFocus,
  onOpenChild,
}) => {
  const {
    sponsors,
    coordinators,
    firestoreEnabled,
    firestoreUserEmail,
    updateUserDirectoryStatus,
    inviteUserToDirectory,
    addSponsor,
  } = useApp();

  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [sponsorNavn, setSponsorNavn] = useState('');
  const [sponsorEpost, setSponsorEpost] = useState('');
  const [sponsorTelefon, setSponsorTelefon] = useState('');
  const [sponsorPoststed, setSponsorPoststed] = useState('');
  const [sponsorBelop, setSponsorBelop] = useState<250 | 350>(250);
  const [sponsorMetode, setSponsorMetode] = useState<'vipps' | 'bank'>('vipps');

  const [rows, setRows] = useState<DirectoryRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('alle');
  const [inviteBusyKey, setInviteBusyKey] = useState<string | null>(null);
  const [inviteNote, setInviteNote] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !firestoreEnabled || !firestoreUserEmail) {
      setRows([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, FIRESTORE_COLLECTIONS.userDirectory),
      (snap) => {
        setLoadError(null);
        const loaded = snap.docs.map((d) => {
          const data = d.data() as FirestoreUserDirectoryEntry;
          return { ...data, id: d.id, email: data.email || d.id };
        });
        setRows(loaded);
      },
      (err) => setLoadError(err.message || 'Kunne ikke lese brukerlisten')
    );
    return () => unsub();
  }, [firestoreEnabled, firestoreUserEmail]);

  // Alle personer: admin, koordinatorer og faddere (ikke fadderbarn).
  const peopleRows = useMemo(
    () => buildPeopleRows(rows, coordinators, sponsors, BOOTSTRAP_ADMIN_EMAILS),
    [rows, coordinators, sponsors]
  );

  const counts = useMemo(() => {
    const c: Record<RoleFilter, number> = { alle: peopleRows.length, admin: 0, coordinator: 0, sponsor: 0 };
    for (const r of peopleRows) c[r.role] += 1;
    return c;
  }, [peopleRows]);

  const visibleRows = useMemo(
    () => (roleFilter === 'alle' ? peopleRows : peopleRows.filter((r) => r.role === roleFilter)),
    [peopleRows, roleFilter]
  );

  useEffect(() => {
    if (focusEmail) {
      // Velg raden for e-posten hvis den finnes, ellers direkte-raden for innloggingen.
      const target = emailToDirectoryDocId(focusEmail);
      const hit = peopleRows.find((r) => r.email === target);
      setSelectedKey(hit ? hit.key : `dir:${target}`);
      onClearFocus?.();
    }
  }, [focusEmail, onClearFocus, peopleRows]);

  const selected = selectedKey ? peopleRows.find((r) => r.key === selectedKey) : undefined;

  const persistStatus = async (row: PersonRow, status: UserDirectoryStatus) => {
    const email = emailToDirectoryDocId(row.email);
    if (row.isBootstrapOnly) {
      if (!db) throw new Error('Firestore er ikke konfigurert');
      await saveUserDirectoryEntry(db, {
        email,
        role: 'admin',
        status,
        displayName: row.directory?.displayName,
      });
      return;
    }
    await updateUserDirectoryStatus(email, status);
  };

  const changeStatus = async (row: PersonRow, status: UserDirectoryStatus) => {
    setStatusBusy(true);
    setLoadError(null);
    try {
      await persistStatus(row, status);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Kunne ikke lagre status');
    } finally {
      setStatusBusy(false);
    }
  };

  // Lager innloggingsinvitasjon for en koordinator/fadder som ikke er invitert ennå.
  const inviteRow = async (row: PersonRow) => {
    if (!row.email) return;
    setInviteBusyKey(row.key);
    setLoadError(null);
    setInviteNote(null);
    try {
      const entry: FirestoreUserDirectoryEntry = {
        email: row.email,
        role: row.role,
        displayName: row.name || undefined,
      };
      if (row.role === 'coordinator' && row.coordinatorId) entry.coordinatorId = row.coordinatorId;
      if (row.role === 'sponsor' && row.sponsorId) entry.sponsorId = row.sponsorId;
      await inviteUserToDirectory(entry);
      setInviteNote(`Invitasjon lagret for ${row.name}`);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Kunne ikke lagre invitasjonen.');
    } finally {
      setInviteBusyKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-stone-900">Brukere</h2>
        <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
          Alle personer i løsningen: administratorer, koordinatorer i Kongo og faddere. Kolonnen Innlogging viser om
          personen kan logge inn. Fadderbarn er ikke brukere og vises under Barn.
        </p>
      </div>

      {loadError && (
        <p className="text-xs text-red-900 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{loadError}</p>
      )}
      {inviteNote && (
        <p className="text-xs text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{inviteNote}</p>
      )}

      <div className="inline-flex flex-wrap rounded-lg border border-stone-300 overflow-hidden text-xs">
        {FILTERS.map((f) => {
          const active = roleFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setRoleFilter(f.value)}
              aria-pressed={active}
              className={`px-3 py-1.5 font-medium cursor-pointer border-r border-stone-300 last:border-r-0 ${
                active ? 'bg-[#4D6B3E] text-white' : 'bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {f.label} ({counts[f.value]})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Navn</th>
                <th className="py-2.5 px-4">E-post</th>
                <th className="py-2.5 px-4">Rolle</th>
                <th className="py-2.5 px-4">Innlogging</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visibleRows.map((row) => (
                <tr
                  key={row.key}
                  className="hover:bg-stone-50/80 cursor-pointer"
                  onClick={() => setSelectedKey(row.key)}
                >
                  <td className="py-2.5 px-4 font-medium text-stone-900">{row.name}</td>
                  <td className="py-2.5 px-4 text-stone-600">
                    {row.email || <span className="text-stone-400">—</span>}
                  </td>
                  <td className="py-2.5 px-4 text-stone-700">{ROLE_LABEL[row.role]}</td>
                  <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                    {row.loginStatus === 'ikke-invitert' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500">Ikke invitert</span>
                        <button
                          type="button"
                          disabled={!row.email || inviteBusyKey !== null}
                          title={!row.email ? 'Mangler e-post' : undefined}
                          onClick={() => void inviteRow(row)}
                          className="px-2 py-1 rounded-md border border-[#4D6B3E] text-[#4D6B3E] hover:bg-[#4D6B3E]/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {inviteBusyKey === row.key ? 'Lagrer…' : 'Inviter'}
                        </button>
                      </div>
                    ) : (
                      <select
                        value={row.loginStatus}
                        disabled={statusBusy}
                        onChange={(e) => void changeStatus(row, e.target.value as UserDirectoryStatus)}
                        className="px-2 py-1 rounded-md border border-stone-300 bg-white text-stone-800"
                        aria-label={`Innlogging for ${row.email || row.name}`}
                      >
                        <option value="aktiv">aktiv</option>
                        <option value="invitert">invitert</option>
                        <option value="sperret">sperret</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-stone-500">
                    Ingen personer i denne gruppen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <button
          type="button"
          onClick={() => setShowAddSponsor((v) => !v)}
          className="text-xs font-medium text-[#4D6B3E] hover:underline cursor-pointer"
        >
          {showAddSponsor ? 'Skjul registrering av fadder' : 'Registrer ny fadder i databasen (uten innlogging)'}
        </button>
        {showAddSponsor && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!sponsorNavn.trim() || !sponsorEpost.trim()) return;
              addSponsor({
                navn: sponsorNavn.trim(),
                epost: sponsorEpost.trim(),
                telefon: sponsorTelefon.trim(),
                poststed: sponsorPoststed.trim(),
                maanedsbelop: sponsorBelop,
                betalingsmetode: sponsorMetode,
              });
              setSponsorNavn('');
              setSponsorEpost('');
              setSponsorTelefon('');
              setSponsorPoststed('');
              setShowAddSponsor(false);
            }}
            className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <input
              required
              value={sponsorNavn}
              onChange={(e) => setSponsorNavn(e.target.value)}
              placeholder="Navn"
              className="px-3 py-2 border border-stone-300 rounded-lg text-xs"
            />
            <input
              type="email"
              required
              value={sponsorEpost}
              onChange={(e) => setSponsorEpost(e.target.value)}
              placeholder="E-post"
              className="px-3 py-2 border border-stone-300 rounded-lg text-xs"
            />
            <input
              value={sponsorTelefon}
              onChange={(e) => setSponsorTelefon(e.target.value)}
              placeholder="Telefon"
              className="px-3 py-2 border border-stone-300 rounded-lg text-xs"
            />
            <input
              value={sponsorPoststed}
              onChange={(e) => setSponsorPoststed(e.target.value)}
              placeholder="Poststed"
              className="px-3 py-2 border border-stone-300 rounded-lg text-xs"
            />
            <select
              value={sponsorBelop}
              onChange={(e) => setSponsorBelop(Number(e.target.value) as 250 | 350)}
              className="px-3 py-2 border border-stone-300 rounded-lg text-xs"
            >
              <option value={250}>250 kr</option>
              <option value={350}>350 kr</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-[#4D6B3E] text-white rounded-lg text-xs font-medium cursor-pointer">
              Lagre fadder
            </button>
          </form>
        )}
        <p className="text-[11px] text-stone-500 mt-2">
          Etter lagring kan du invitere samme person til innlogging nedenfor (koble til fadder-id).
        </p>
      </div>

      <UserDirectoryInviteForm />

      {selected && (
        <PersonCard
          row={selected}
          onClose={() => setSelectedKey(null)}
          onChangeStatus={changeStatus}
          onInvite={inviteRow}
          statusBusy={statusBusy}
          inviteBusy={inviteBusyKey === selected.key}
          onOpenChild={onOpenChild}
        />
      )}
    </div>
  );
};
