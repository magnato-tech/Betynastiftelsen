import type { Coordinator, Sponsor } from '../types';
import type { FirestoreUserDirectoryEntry, UserDirectoryStatus } from '../db/firestoreProfile';
import { emailToDirectoryDocId } from '../db/firestoreUser';
import { normalizeUserDirectoryStatus } from '../db/userDirectoryStatus';
import type { SponsorDirectoryStatus } from './sponsorOnboarding';

/** Rad fra Firestore-samlingen userDirectory (innloggingsinvitasjon). */
export type DirectoryRow = FirestoreUserDirectoryEntry & { id: string };

export type PersonRole = FirestoreUserDirectoryEntry['role'];
export type PersonLoginStatus = UserDirectoryStatus | 'ikke-invitert';

/** Én person i admin-listen «Brukere». Fadderbarn er ikke med her. */
export interface PersonRow {
  key: string;
  name: string;
  email: string;
  role: PersonRole;
  loginStatus: PersonLoginStatus;
  directory?: DirectoryRow;
  coordinatorId?: string;
  sponsorId?: string;
  distrikt?: string;
  isBootstrapOnly: boolean;
  /** Arkivert: koordinator med aktiv=false, eller fadder med satt avsluttet-dato. */
  archived: boolean;
  /** Fadders startdato (ISO), fra fadderposten. Mangler for koordinatorer og admin. */
  startDato?: string;
  /** Fadders avslutningsdato (ISO), fra fadderposten når den er arkivert. */
  sluttDato?: string;
}

/** Innloggingsstatus for onboarding-beregningen. Null når personen ikke har innloggingsrad. */
export function onboardingDirectoryStatus(row: PersonRow): SponsorDirectoryStatus {
  if (!row.directory || row.loginStatus === 'ikke-invitert') return null;
  return row.loginStatus;
}

const ROLE_ORDER: Record<PersonRole, number> = { admin: 0, coordinator: 1, sponsor: 2 };

const normEmail = (email: string | undefined | null): string => emailToDirectoryDocId(email ?? '');

/**
 * Slår sammen userDirectory, bootstrap-administratorer, koordinatorer og faddere
 * til én liste. Koordinatorer og faddere som ikke har innloggingsrad vises som
 * «ikke-invitert». Koblingen skjer på id eller på normalisert e-post.
 */
export function buildPeopleRows(
  directoryRows: DirectoryRow[],
  coordinators: Coordinator[],
  sponsors: Sponsor[],
  bootstrapEmails: readonly string[]
): PersonRow[] {
  // Samme e-post to ganger: siste rad vinner (som før).
  const byEmail = new Map<string, DirectoryRow>();
  for (const row of directoryRows) {
    const email = normEmail(row.email || row.id);
    if (!email) continue;
    byEmail.set(email, { ...row, email });
  }

  const coordById = new Map(coordinators.map((c) => [c.id, c]));
  const sponsorById = new Map(sponsors.map((s) => [s.id, s]));
  const coordByEmail = new Map<string, Coordinator>();
  for (const c of coordinators) {
    const e = normEmail(c.epost);
    if (e) coordByEmail.set(e, c);
  }
  const sponsorByEmail = new Map<string, Sponsor>();
  for (const s of sponsors) {
    const e = normEmail(s.epost);
    if (e) sponsorByEmail.set(e, s);
  }

  const coordForRow = (row: DirectoryRow): Coordinator | undefined =>
    (row.coordinatorId ? coordById.get(row.coordinatorId) : undefined) ?? coordByEmail.get(row.email);
  const sponsorForRow = (row: DirectoryRow): Sponsor | undefined =>
    (row.sponsorId ? sponsorById.get(row.sponsorId) : undefined) ?? sponsorByEmail.get(row.email);

  const rows: PersonRow[] = [];
  const coveredCoordIds = new Set<string>();
  const coveredSponsorIds = new Set<string>();

  // a. Rader fra userDirectory.
  for (const row of byEmail.values()) {
    const coord = coordForRow(row);
    const sp = sponsorForRow(row);
    if (coord) coveredCoordIds.add(coord.id);
    if (sp) coveredSponsorIds.add(sp.id);

    let name: string;
    if (row.displayName?.trim()) {
      name = row.displayName.trim();
    } else if (row.role === 'sponsor' && sp) {
      name = sp.navn;
    } else if (row.role === 'coordinator' && coord) {
      name = `${coord.fornavn} ${coord.etternavn}`.trim();
    } else {
      name = row.email.split('@')[0];
    }

    // Arkivering styres av selve koordinator-/fadderposten, ikke av innloggingsraden.
    const archived =
      row.role === 'coordinator' ? coord?.aktiv === false : row.role === 'sponsor' ? !!sp?.avsluttet : false;

    rows.push({
      key: `dir:${row.email}`,
      name,
      email: row.email,
      role: row.role,
      loginStatus: normalizeUserDirectoryStatus(row.status),
      directory: row,
      coordinatorId: row.coordinatorId || coord?.id,
      sponsorId: row.sponsorId || sp?.id,
      distrikt: coord?.distrikt,
      isBootstrapOnly: false,
      archived,
      startDato: sp?.startDato,
      sluttDato: sp?.avsluttet,
    });
  }

  // b. Bootstrap-administratorer uten rad i userDirectory.
  const seenEmails = new Set(byEmail.keys());
  for (const raw of bootstrapEmails) {
    const email = normEmail(raw);
    if (!email || seenEmails.has(email)) continue;
    seenEmails.add(email);
    rows.push({
      key: `dir:${email}`,
      name: email.split('@')[0],
      email,
      role: 'admin',
      loginStatus: 'aktiv',
      isBootstrapOnly: true,
      archived: false,
    });
  }

  // c. Koordinatorer som ikke er representert over.
  for (const c of coordinators) {
    if (coveredCoordIds.has(c.id)) continue;
    rows.push({
      key: `coord:${c.id}`,
      name: `${c.fornavn} ${c.etternavn}`.trim(),
      email: normEmail(c.epost),
      role: 'coordinator',
      loginStatus: 'ikke-invitert',
      coordinatorId: c.id,
      distrikt: c.distrikt,
      isBootstrapOnly: false,
      archived: c.aktiv === false,
    });
  }

  // d. Faddere som ikke er representert over. Fadderbarn er ikke med.
  for (const s of sponsors) {
    if (coveredSponsorIds.has(s.id)) continue;
    rows.push({
      key: `sponsor:${s.id}`,
      name: s.navn.trim(),
      email: normEmail(s.epost),
      role: 'sponsor',
      loginStatus: 'ikke-invitert',
      sponsorId: s.id,
      isBootstrapOnly: false,
      archived: !!s.avsluttet,
      startDato: s.startDato,
      sluttDato: s.avsluttet,
    });
  }

  // e. Sortering: rolle, deretter navn.
  return rows.sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name, 'nb')
  );
}
