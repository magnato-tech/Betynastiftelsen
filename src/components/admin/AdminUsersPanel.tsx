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
import { normalizeUserDirectoryStatus } from '../../db/userDirectoryStatus';
import { childNamesOfSponsor } from '../../utils/sponsorChildren';
import { UserDirectoryInviteForm } from './UserDirectoryInviteForm';
import { AdminOverlayModal } from './AdminOverlayModal';

export interface AdminUsersPanelProps {
  focusEmail?: string | null;
  onClearFocus?: () => void;
  onOpenChild?: (childId: string) => void;
}

type DirectoryRow = FirestoreUserDirectoryEntry & { id: string };

const ROLE_LABEL: Record<FirestoreUserDirectoryEntry['role'], string> = {
  admin: 'Administrator',
  coordinator: 'Koordinator',
  sponsor: 'Fadder',
};

export const AdminUsersPanel: React.FC<AdminUsersPanelProps> = ({
  focusEmail,
  onClearFocus,
  onOpenChild,
}) => {
  const {
    sponsors,
    childrenList,
    coordinators,
    firestoreEnabled,
    firestoreUserEmail,
    updateUserDirectoryStatus,
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
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

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

  const mergedRows = useMemo(() => {
    const byEmail = new Map<string, DirectoryRow>();
    for (const row of rows) {
      byEmail.set(emailToDirectoryDocId(row.email), row);
    }
    for (const email of BOOTSTRAP_ADMIN_EMAILS) {
      const id = emailToDirectoryDocId(email);
      if (!byEmail.has(id)) {
        byEmail.set(id, {
          id,
          email: id,
          role: 'admin',
          status: 'aktiv',
          displayName: id.split('@')[0],
        });
      }
    }
    return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
  }, [rows]);

  useEffect(() => {
    if (focusEmail) {
      setSelectedEmail(emailToDirectoryDocId(focusEmail));
      onClearFocus?.();
    }
  }, [focusEmail, onClearFocus]);

  const selected = selectedEmail
    ? mergedRows.find((r) => emailToDirectoryDocId(r.email) === selectedEmail)
    : undefined;

  const displayNameFor = (row: DirectoryRow) => {
    if (row.displayName?.trim()) return row.displayName.trim();
    if (row.role === 'sponsor' && row.sponsorId) {
      const sp = sponsors.find((s) => s.id === row.sponsorId);
      if (sp) return sp.navn;
    }
    if (row.role === 'coordinator' && row.coordinatorId) {
      const c = coordinators.find((x) => x.id === row.coordinatorId);
      if (c) return `${c.fornavn} ${c.etternavn}`;
    }
    return row.email.split('@')[0];
  };

  const persistStatus = async (row: DirectoryRow, status: UserDirectoryStatus) => {
    const email = emailToDirectoryDocId(row.email);
    const isBootstrapOnly =
      BOOTSTRAP_ADMIN_EMAILS.some((e) => emailToDirectoryDocId(e) === email) &&
      !rows.some((r) => emailToDirectoryDocId(r.email) === email);
    if (isBootstrapOnly) {
      if (!db) throw new Error('Firestore er ikke konfigurert');
      await saveUserDirectoryEntry(db, {
        email,
        role: 'admin',
        status,
        displayName: row.displayName,
      });
      return;
    }
    await updateUserDirectoryStatus(email, status);
  };

  const changeStatus = async (row: DirectoryRow, status: UserDirectoryStatus) => {
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

  const sponsorForRow = (row: DirectoryRow) =>
    row.sponsorId ? sponsors.find((s) => s.id === row.sponsorId) : undefined;

  const childrenForSponsorRow = (row: DirectoryRow) => {
    const sp = sponsorForRow(row);
    if (!sp) return [];
    return childrenList.filter((c) => c.tildeltFadderId === sp.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-stone-900">Brukere</h2>
        <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
          Alle som kan logge inn: administratorer, koordinatorer i Kongo og faddere. Status styres i{' '}
          <code className="text-[10px]">userDirectory</code>.
        </p>
      </div>

      {loadError && (
        <p className="text-xs text-red-900 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{loadError}</p>
      )}

      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Navn</th>
                <th className="py-2.5 px-4">E-post</th>
                <th className="py-2.5 px-4">Rolle</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {mergedRows.map((row) => {
                const status = normalizeUserDirectoryStatus(row.status);
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-stone-50/80 cursor-pointer"
                    onClick={() => setSelectedEmail(emailToDirectoryDocId(row.email))}
                  >
                    <td className="py-2.5 px-4 font-medium text-stone-900">{displayNameFor(row)}</td>
                    <td className="py-2.5 px-4 text-stone-600">{row.email}</td>
                    <td className="py-2.5 px-4 text-stone-700">{ROLE_LABEL[row.role]}</td>
                    <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={status}
                        disabled={statusBusy}
                        onChange={(e) => void changeStatus(row, e.target.value as UserDirectoryStatus)}
                        className="px-2 py-1 rounded-md border border-stone-300 bg-white text-stone-800"
                        aria-label={`Status for ${row.email}`}
                      >
                        <option value="aktiv">aktiv</option>
                        <option value="invitert">invitert</option>
                        <option value="sperret">sperret</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
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
        <AdminOverlayModal title={displayNameFor(selected)} onClose={() => setSelectedEmail(null)}>
          <dl className="space-y-2 text-xs">
            <div>
              <dt className="text-stone-500">E-post</dt>
              <dd className="font-medium">{selected.email}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Rolle</dt>
              <dd>{ROLE_LABEL[selected.role]}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Status</dt>
              <dd className="capitalize">{normalizeUserDirectoryStatus(selected.status)}</dd>
            </div>
          </dl>

          {selected.role === 'sponsor' && sponsorForRow(selected) && (
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <p className="text-xs font-semibold text-stone-800">Fadderdetaljer</p>
              <p className="text-xs text-stone-600">
                Start: {sponsorForRow(selected)!.startDato} · {sponsorForRow(selected)!.maanedsbelop} kr/mnd
              </p>
              <p className="text-xs text-stone-600">
                Barn: {childNamesOfSponsor(childrenList, sponsorForRow(selected)!)}
              </p>
              <ul className="space-y-1">
                {childrenForSponsorRow(selected).map((ch) => (
                  <li key={ch.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEmail(null);
                        onOpenChild?.(ch.id);
                      }}
                      className="text-[#4D6B3E] hover:underline font-medium cursor-pointer"
                    >
                      {ch.internKode} — {ch.fornavn}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.role === 'coordinator' && selected.coordinatorId && (
            <p className="text-xs text-stone-600 pt-2 border-t border-stone-100">
              Koordinator-ID: <span className="font-mono">{selected.coordinatorId}</span>
            </p>
          )}
        </AdminOverlayModal>
      )}
    </div>
  );
};
