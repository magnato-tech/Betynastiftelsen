import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { Archive, ArchiveRestore } from 'lucide-react';
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
  onboardingDirectoryStatus,
  type DirectoryRow,
  type PersonRow,
  type PersonRole,
} from '../../utils/peopleDirectory';
import { coordinatorSubject, sponsorSubject } from '../../utils/personLog';
import { isOpenAdminTask, onboardingStepOf } from '../../utils/sponsorOnboarding';
import { formatDuration, formatNorwegianDate } from '../../utils/memberSince';
import type { PersonLogSubject, SponsorOnboardingStep } from '../../types';
import { UserDirectoryInviteForm } from './UserDirectoryInviteForm';
import {
  ARKIVERT_LOGIN_LABEL,
  ARKIVERT_STATUS_FEIL,
  PersonCard,
  ROLE_LABEL,
  blokkerStatusForArkivert,
} from './PersonCard';

export interface AdminUsersPanelProps {
  focusEmail?: string | null;
  /** Fadder-id fra et varsel (bjella). Åpner personkortet på fanen «Ny fadder». */
  focusSponsorId?: string | null;
  onClearFocus?: () => void;
  onOpenChild?: (childId: string) => void;
}

/** «nye» viser faddere med åpen onboarding-oppgave. «arkivert» viser kun arkiverte personer. Andre filtre viser aktive. */
type RoleFilter = 'alle' | PersonRole | 'arkivert' | 'nye';

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'nye', label: 'Nye' },
  { value: 'alle', label: 'Alle' },
  { value: 'admin', label: 'Administratorer' },
  { value: 'coordinator', label: 'Koordinatorer' },
  { value: 'sponsor', label: 'Faddere' },
  { value: 'arkivert', label: 'Arkivert' },
];

/** Sortering på «Med siden»: eldst eller nyest først. Null = listens vanlige rekkefølge. */
type MedSidenSort = 'eldst' | 'nyest' | null;

/** Innhold i kolonnen «Med siden». Bare faddere med startdato har tall. */
const MedSidenCelle: React.FC<{ row: PersonRow; dempet: string }> = ({ row, dempet }) => {
  if (row.role !== 'sponsor' || !row.startDato) return <span className="text-stone-400">—</span>;
  const start = formatNorwegianDate(row.startDato);
  if (!start) return <span className="text-stone-400">—</span>;

  // Arkivert fadder: vis perioden, og varigheten under.
  if (row.sluttDato) {
    const slutt = formatNorwegianDate(row.sluttDato);
    const varighet = formatDuration(row.startDato, row.sluttDato);
    return (
      <div className={dempet || 'text-stone-700'}>
        <div className="text-xs">{slutt ? `${start} – ${slutt}` : start}</div>
        {varighet && <div className="text-[11px] text-stone-500">{varighet}</div>}
      </div>
    );
  }

  const varighet = formatDuration(row.startDato);
  return (
    <div className={dempet || 'text-stone-700'}>
      <div className="text-xs">{start}</div>
      {varighet && <div className="text-[11px] text-stone-500">{varighet}</div>}
    </div>
  );
};

export const AdminUsersPanel: React.FC<AdminUsersPanelProps> = ({
  focusEmail,
  focusSponsorId,
  onClearFocus,
  onOpenChild,
}) => {
  const {
    sponsors,
    coordinators,
    childrenList,
    firestoreEnabled,
    firestoreUserEmail,
    updateUserDirectoryStatus,
    inviteUserToDirectory,
    addSponsor,
    deactivatePerson,
    reactivatePerson,
    markSponsorOnboardingDone,
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
  // Raden som skal åpnes på fanen «Ny fadder» (fra varsel). Nullstilles ved vanlig klikk.
  const [nyFaneKey, setNyFaneKey] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('alle');
  const [inviteBusyKey, setInviteBusyKey] = useState<string | null>(null);
  const [notat, setNotat] = useState<string | null>(null);
  // Avkrysning for massehandlinger. Nøkler fra personlisten.
  const [valgte, setValgte] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [rowBusyKey, setRowBusyKey] = useState<string | null>(null);
  // Angre-tilbud etter enkeltarkivering. Gjelder i 5 sekunder.
  const [angre, setAngre] = useState<{ navn: string; subject: PersonLogSubject } | null>(null);
  // Sortering på «Med siden». Null = listens vanlige rekkefølge.
  const [medSiden, setMedSiden] = useState<MedSidenSort>(null);

  useEffect(() => {
    if (!angre) return;
    const t = window.setTimeout(() => setAngre(null), 5000);
    return () => window.clearTimeout(t);
  }, [angre]);

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

  // Arkiverte skjules fra alle vanlige visninger og telles bare under «Arkivert».
  const aktiveRader = useMemo(() => peopleRows.filter((r) => !r.archived), [peopleRows]);
  const arkiverteRader = useMemo(() => peopleRows.filter((r) => r.archived), [peopleRows]);

  // Onboarding-steg per fadderrad. Rader uten fadder (eller utenom onboarding) får null.
  const stepByKey = useMemo(() => {
    const m = new Map<string, SponsorOnboardingStep | null>();
    for (const row of peopleRows) {
      const sp = row.role === 'sponsor' && row.sponsorId ? sponsors.find((s) => s.id === row.sponsorId) : undefined;
      if (sp) m.set(row.key, onboardingStepOf(sp, childrenList, onboardingDirectoryStatus(row)));
    }
    return m;
  }, [peopleRows, sponsors, childrenList]);

  const harApnOppgave = (row: PersonRow): boolean => isOpenAdminTask(stepByKey.get(row.key) ?? null);

  const counts = useMemo(() => {
    const c: Record<RoleFilter, number> = {
      nye: 0,
      alle: aktiveRader.length,
      admin: 0,
      coordinator: 0,
      sponsor: 0,
      arkivert: arkiverteRader.length,
    };
    for (const r of aktiveRader) {
      c[r.role] += 1;
      if (isOpenAdminTask(stepByKey.get(r.key) ?? null)) c.nye += 1;
    }
    return c;
  }, [aktiveRader, arkiverteRader, stepByKey]);

  const filtrerteRader = useMemo(() => {
    if (roleFilter === 'arkivert') return arkiverteRader;
    if (roleFilter === 'alle') return aktiveRader;
    if (roleFilter === 'nye') return aktiveRader.filter((r) => isOpenAdminTask(stepByKey.get(r.key) ?? null));
    return aktiveRader.filter((r) => r.role === roleFilter);
  }, [roleFilter, aktiveRader, arkiverteRader, stepByKey]);

  // Rader uten startdato havner nederst i begge retninger.
  const visibleRows = useMemo(() => {
    if (!medSiden) return filtrerteRader;
    return [...filtrerteRader].sort((a, b) => {
      const da = a.startDato ?? '';
      const db = b.startDato ?? '';
      if (!da || !db) return da ? -1 : db ? 1 : 0;
      return medSiden === 'eldst' ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [filtrerteRader, medSiden]);

  const erArkivVisning = roleFilter === 'arkivert';
  // Admin-rader kan ikke velges eller arkiveres her.
  const velgbare = visibleRows.filter((r) => r.role !== 'admin');
  const valgteRader = visibleRows.filter((r) => valgte.has(r.key));
  const alleValgt = velgbare.length > 0 && velgbare.every((r) => valgte.has(r.key));

  useEffect(() => {
    if (focusEmail) {
      // Velg raden for e-posten hvis den finnes, ellers direkte-raden for innloggingen.
      const target = emailToDirectoryDocId(focusEmail);
      const hit = peopleRows.find((r) => r.email === target);
      setSelectedKey(hit ? hit.key : `dir:${target}`);
      setNyFaneKey(null);
      onClearFocus?.();
    }
  }, [focusEmail, onClearFocus, peopleRows]);

  // Fra varselklokken: åpne fadderens personkort på fanen «Ny fadder».
  useEffect(() => {
    if (!focusSponsorId) return;
    const hit = peopleRows.find((r) => r.role === 'sponsor' && r.sponsorId === focusSponsorId);
    if (hit) {
      setSelectedKey(personIdentity(hit));
      setNyFaneKey(hit.key);
    }
    onClearFocus?.();
  }, [focusSponsorId, onClearFocus, peopleRows]);

  // Innlogget første gang (status aktiv): marker onboarding som ferdig, én gang per fadder.
  const markerteFerdig = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const row of peopleRows) {
      if (row.role !== 'sponsor' || !row.sponsorId) continue;
      const sp = sponsors.find((s) => s.id === row.sponsorId);
      if (!sp?.onboarding || sp.onboarding.steg !== 'invitert') continue;
      if (onboardingDirectoryStatus(row) !== 'aktiv') continue;
      if (markerteFerdig.current.has(sp.id)) continue;
      markerteFerdig.current.add(sp.id);
      markSponsorOnboardingDone(sp.id);
    }
  }, [peopleRows, sponsors, markSponsorOnboardingDone]);

  // Raden bytter nøkkel (sponsor:<id> → dir:<e-post>) når personen får innlogging.
  // Kortet skal da bli stående åpent, så vi matcher også på fadder-/koordinator-id.
  const personIdentity = (row: PersonRow) =>
    row.sponsorId ? `sponsor:${row.sponsorId}` : row.coordinatorId ? `coord:${row.coordinatorId}` : row.key;
  const selected = selectedKey
    ? peopleRows.find((r) => r.key === selectedKey || personIdentity(r) === selectedKey)
    : undefined;

  // Koordinator- eller fadderposten til raden. Admin har ingen slik post.
  const subjectFor = (row: PersonRow): PersonLogSubject | undefined => {
    if (row.role === 'coordinator' && row.coordinatorId) {
      const c = coordinators.find((x) => x.id === row.coordinatorId);
      return c ? coordinatorSubject(c) : undefined;
    }
    if (row.role === 'sponsor' && row.sponsorId) {
      const s = sponsors.find((x) => x.id === row.sponsorId);
      return s ? sponsorSubject(s) : undefined;
    }
    return undefined;
  };

  const changeVisning = (f: RoleFilter) => {
    setRoleFilter(f);
    setValgte(new Set());
  };

  const toggleValgt = (key: string) => {
    setValgte((prev) => {
      const neste = new Set(prev);
      if (neste.has(key)) neste.delete(key);
      else neste.add(key);
      return neste;
    });
  };

  const toggleAlle = () => setValgte(alleValgt ? new Set() : new Set(velgbare.map((r) => r.key)));

  const persistStatus = async (row: PersonRow, status: UserDirectoryStatus) => {
    // Vakt også her: arkiverte får ikke innlogging før de gjenopprettes.
    if (blokkerStatusForArkivert(row.archived, status)) throw new Error(ARKIVERT_STATUS_FEIL);
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
    if (blokkerStatusForArkivert(row.archived, status)) {
      setLoadError(ARKIVERT_STATUS_FEIL);
      return;
    }
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
    setNotat(null);
    try {
      const entry: FirestoreUserDirectoryEntry = {
        email: row.email,
        role: row.role,
        displayName: row.name || undefined,
      };
      if (row.role === 'coordinator' && row.coordinatorId) entry.coordinatorId = row.coordinatorId;
      if (row.role === 'sponsor' && row.sponsorId) entry.sponsorId = row.sponsorId;
      await inviteUserToDirectory(entry);
      setNotat(`Invitasjon lagret for ${row.name}`);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Kunne ikke lagre invitasjonen.');
    } finally {
      setInviteBusyKey(null);
    }
  };

  // Arkiverer én person. Angre-tilbudet vises i en banner over tabellen.
  const arkiverRad = async (row: PersonRow) => {
    const subject = subjectFor(row);
    if (!subject) return;
    setRowBusyKey(row.key);
    setLoadError(null);
    setNotat(null);
    try {
      await deactivatePerson(subject);
      setAngre({ navn: row.name, subject });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Kunne ikke arkivere personen.');
    } finally {
      setRowBusyKey(null);
    }
  };

  const gjenopprettRad = async (row: PersonRow) => {
    const subject = subjectFor(row);
    if (!subject) return;
    setRowBusyKey(row.key);
    setLoadError(null);
    setNotat(null);
    try {
      await reactivatePerson(subject);
      setNotat(`${row.name} er gjenopprettet`);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Kunne ikke gjenopprette personen.');
    } finally {
      setRowBusyKey(null);
    }
  };

  const angreArkivering = async () => {
    if (!angre) return;
    const { navn, subject } = angre;
    setAngre(null);
    setLoadError(null);
    try {
      await reactivatePerson(subject);
      setNotat(`${navn} er gjenopprettet`);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Kunne ikke angre arkiveringen.');
    }
  };

  // Arkiverer eller gjenoppretter alle valgte, etter hverandre.
  const kjorMassehandling = async () => {
    const arkiver = !erArkivVisning;
    const mål = valgteRader
      .map((row) => ({ row, subject: subjectFor(row) }))
      .filter((x): x is { row: PersonRow; subject: PersonLogSubject } => !!x.subject);
    if (mål.length === 0) return;
    if (arkiver && !window.confirm(`Arkivere ${mål.length} personer? De skjules fra listen og mister innlogging. Kan angres under Arkivert.`)) {
      return;
    }
    setBulkBusy(true);
    setLoadError(null);
    setNotat(null);
    setAngre(null);
    let ferdig = 0;
    try {
      for (const { subject } of mål) {
        if (arkiver) await deactivatePerson(subject);
        else await reactivatePerson(subject);
        ferdig += 1;
      }
      setNotat(arkiver ? `${ferdig} arkivert` : `${ferdig} gjenopprettet`);
      setValgte(new Set());
    } catch (err) {
      const melding = err instanceof Error ? err.message : 'Kunne ikke endre alle personene.';
      setLoadError(`${melding} (${ferdig} av ${mål.length} ble utført.)`);
    } finally {
      setBulkBusy(false);
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
      {notat && (
        <p className="text-xs text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{notat}</p>
      )}
      {angre && (
        <p className="text-xs text-green-900 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
          <span>{angre.navn} er arkivert.</span>
          <button
            type="button"
            onClick={() => void angreArkivering()}
            className="font-medium underline cursor-pointer"
          >
            Angre
          </button>
        </p>
      )}

      <div className="inline-flex flex-wrap rounded-lg border border-stone-300 overflow-hidden text-xs">
        {FILTERS.map((f) => {
          const active = roleFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => changeVisning(f.value)}
              aria-pressed={active}
              className={`px-3 py-1.5 font-medium cursor-pointer border-r border-stone-300 last:border-r-0 ${
                active ? 'bg-[#4D6B3E] text-white' : 'bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {f.value === 'nye' && counts.nye > 0 && (
                <span aria-hidden="true" className="inline-block w-1.5 h-1.5 mr-1.5 mb-0.5 rounded-full bg-amber-500" />
              )}
              {f.label} ({counts[f.value]})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {valgteRader.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-stone-50 border-b border-stone-200 text-xs">
            <span className="font-medium text-stone-800">{valgteRader.length} valgt</span>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => void kjorMassehandling()}
              className="px-2.5 py-1 rounded-md bg-[#4D6B3E] text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {bulkBusy ? 'Lagrer…' : erArkivVisning ? 'Gjenopprett valgte' : 'Arkiver valgte'}
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => setValgte(new Set())}
              className="text-stone-600 hover:underline cursor-pointer disabled:opacity-40"
            >
              Fjern valg
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4 w-8">
                  <input
                    type="checkbox"
                    aria-label="Velg alle synlige"
                    checked={alleValgt}
                    disabled={velgbare.length === 0}
                    onChange={toggleAlle}
                    className="cursor-pointer accent-[#4D6B3E]"
                  />
                </th>
                <th className="py-2.5 px-4">Navn</th>
                <th className="py-2.5 px-4">E-post</th>
                <th className="py-2.5 px-4">Rolle</th>
                <th
                  className="py-2.5 px-4"
                  aria-sort={medSiden === 'eldst' ? 'ascending' : medSiden === 'nyest' ? 'descending' : 'none'}
                >
                  <button
                    type="button"
                    onClick={() => setMedSiden((m) => (m === 'eldst' ? 'nyest' : 'eldst'))}
                    className="inline-flex items-center gap-1 uppercase tracking-wider font-semibold hover:text-stone-900 cursor-pointer"
                  >
                    Med siden
                    <span aria-hidden="true">{medSiden === 'eldst' ? '↑' : medSiden === 'nyest' ? '↓' : '↕'}</span>
                  </button>
                </th>
                <th className="py-2.5 px-4">Innlogging</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visibleRows.map((row) => {
                const erAdmin = row.role === 'admin';
                const dempet = erArkivVisning ? 'text-stone-500' : '';
                return (
                  <tr
                    key={row.key}
                    className="hover:bg-stone-50/80 cursor-pointer"
                    onClick={() => {
                      setSelectedKey(personIdentity(row));
                      setNyFaneKey(null);
                    }}
                  >
                    <td className="py-2.5 px-4 w-8" onClick={(e) => e.stopPropagation()}>
                      {!erAdmin && (
                        <input
                          type="checkbox"
                          aria-label={`Velg ${row.name}`}
                          checked={valgte.has(row.key)}
                          onChange={() => toggleValgt(row.key)}
                          className="cursor-pointer accent-[#4D6B3E]"
                        />
                      )}
                    </td>
                    <td className={`py-2.5 px-4 font-medium ${dempet || 'text-stone-900'}`}>
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {row.name}
                        {harApnOppgave(row) && (
                          <span
                            aria-label="Ny fadder – trenger behandling"
                            title="Ny fadder – trenger behandling"
                            className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold uppercase tracking-wide"
                          >
                            Ny
                          </span>
                        )}
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 ${dempet || 'text-stone-600'}`}>
                      {row.email || <span className="text-stone-400">—</span>}
                    </td>
                    <td className={`py-2.5 px-4 ${dempet || 'text-stone-700'}`}>{ROLE_LABEL[row.role]}</td>
                    <td className="py-2.5 px-4">
                      <MedSidenCelle row={row} dempet={dempet} />
                    </td>
                    <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap items-center gap-2">
                        {row.archived ? (
                          <span className="text-stone-500">{ARKIVERT_LOGIN_LABEL}</span>
                        ) : row.loginStatus === 'ikke-invitert' ? (
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

                        {!erAdmin && !erArkivVisning && (
                          <button
                            type="button"
                            disabled={rowBusyKey !== null || bulkBusy}
                            onClick={() => void arkiverRad(row)}
                            aria-label={`Arkiver ${row.name}`}
                            title={`Arkiver ${row.name}`}
                            className="p-1.5 rounded-md border border-stone-300 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!erAdmin && row.archived && (
                          <button
                            type="button"
                            disabled={rowBusyKey !== null || bulkBusy}
                            onClick={() => void gjenopprettRad(row)}
                            aria-label={`Gjenopprett ${row.name}`}
                            title={`Gjenopprett ${row.name}`}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-[#4D6B3E] text-[#4D6B3E] font-medium hover:bg-[#4D6B3E]/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <ArchiveRestore className="w-3.5 h-3.5" aria-hidden="true" />
                            Gjenopprett
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-stone-500">
                    {erArkivVisning ? 'Ingen arkiverte personer.' : 'Ingen personer i denne gruppen.'}
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
          key={personIdentity(selected)}
          row={selected}
          onClose={() => setSelectedKey(null)}
          onChangeStatus={changeStatus}
          onInvite={inviteRow}
          statusBusy={statusBusy}
          inviteBusy={inviteBusyKey === selected.key}
          onOpenChild={onOpenChild}
          startFane={nyFaneKey === selected.key ? 'ny' : undefined}
        />
      )}
    </div>
  );
};
