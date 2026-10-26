import type { AppDataSnapshot } from '../db/appDataSnapshot';
import type { Child, ChildStatus } from '../types';

/** Personer/poster som andre records kan peke på via id-felt. */
export type LinkTarget = 'children' | 'sponsors' | 'coordinators';

export interface IntegrityIssue {
  collection: string;
  id: string;
  field: string;
  missingId: string;
  pointsTo: LinkTarget;
}

/** Samlinger i snapshot som er lister av poster (ikke f.eks. vippsChargeJob). */
type ListKey = {
  [K in keyof AppDataSnapshot]-?: AppDataSnapshot[K] extends unknown[] ? K : never;
}[keyof AppDataSnapshot];

type ElementOf<C extends ListKey> = AppDataSnapshot[C] extends (infer E)[] ? E : never;

interface LinkSpec {
  collection: ListKey;
  field: string;
  pointsTo: LinkTarget;
  /** true når feltet er en liste med id-er (f.eks. tildeltBarnIds). */
  many: boolean;
}

/**
 * Alle kjente id-lenker i datamodellen. Feltnavnene er typesjekket mot de
 * faktiske typene, så en skrivefeil gir kompileringsfeil.
 * Merk: CatalogPhoto.barnIds er bevisst utelatt — kommentaren i typen sier at
 * verdien kan være child-id, internKode eller fornavn, så den er ikke en ren id-lenke.
 */
function link<C extends ListKey>(
  collection: C,
  field: keyof ElementOf<C> & string,
  pointsTo: LinkTarget,
  many = false,
): LinkSpec {
  return { collection, field, pointsTo, many };
}

const LINK_SPECS: LinkSpec[] = [
  link('children', 'koordinatorId', 'coordinators'),
  link('children', 'tildeltFadderId', 'sponsors'),
  link('sponsors', 'tildeltBarnIds', 'children', true),
  link('campaigns', 'barnIds', 'children', true),
  link('reports', 'barnId', 'children'),
  link('reports', 'koordinatorId', 'coordinators'),
  link('milestones', 'barnId', 'children'),
  link('facts', 'barnId', 'children'),
  link('facts', 'koordinatorId', 'coordinators'),
  link('inquiries', 'barnId', 'children'),
  link('inquiries', 'fadderId', 'sponsors'),
  link('inquiries', 'koordinatorId', 'coordinators'),
  link('payments', 'fadderId', 'sponsors'),
  link('sponsorAssignments', 'sponsorId', 'sponsors'),
  link('sponsorAssignments', 'childId', 'children'),
  link('sponsorAssignments', 'koordinatorId', 'coordinators'),
  link('recurringCharges', 'sponsorId', 'sponsors'),
  link('paymentAllocations', 'sponsorId', 'sponsors'),
  link('paymentAllocations', 'childId', 'children'),
  link('paymentAllocations', 'koordinatorId', 'coordinators'),
];

/** Barn med disse statusene regnes som avsluttet og blokkerer ikke sletting av fadder. */
const INAKTIVE_BARN_STATUS: ChildStatus[] = ['avsluttet', 'arkivert'];

/** Liste over poster i en samling, eller undefined hvis samlingen ikke finnes i snapshot. */
function postene(snapshot: Partial<AppDataSnapshot>, collection: ListKey): { id: string }[] | undefined {
  return snapshot[collection] as { id: string }[] | undefined;
}

/** Gyldige id-er for en måltype, eller undefined hvis målsamlingen mangler i snapshot. */
function gyldigeIder(snapshot: Partial<AppDataSnapshot>, pointsTo: LinkTarget): Set<string> | undefined {
  const liste = postene(snapshot, pointsTo);
  if (!liste) return undefined;
  return new Set(liste.map((p) => p.id));
}

/** Leser verdien(e) i et id-felt som en liste av ikke-tomme id-er. */
function verdierI(record: unknown, field: string, many: boolean): string[] {
  const raw = (record as Record<string, unknown>)[field];
  const kandidater = many ? (Array.isArray(raw) ? raw : []) : [raw];
  return kandidater.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
}

/**
 * Finner lenker som peker på en id som ikke finnes.
 * Tomme/udefinerte felt ignoreres. Hvis målsamlingen mangler helt i snapshot
 * (Partial), kan vi ikke avgjøre noe om lenkene mot den, og de hoppes over.
 */
export function findBrokenLinks(snapshot: Partial<AppDataSnapshot>): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const cache = new Map<LinkTarget, Set<string> | undefined>();

  for (const spec of LINK_SPECS) {
    const liste = postene(snapshot, spec.collection);
    if (!liste) continue;
    if (!cache.has(spec.pointsTo)) cache.set(spec.pointsTo, gyldigeIder(snapshot, spec.pointsTo));
    const finnes = cache.get(spec.pointsTo);
    if (!finnes) continue;

    for (const record of liste) {
      for (const missingId of verdierI(record, spec.field, spec.many)) {
        if (!finnes.has(missingId)) {
          issues.push({
            collection: spec.collection,
            id: record.id,
            field: spec.field,
            missingId,
            pointsTo: spec.pointsTo,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Teller poster som peker på en gitt id, per samling. Samlinger uten treff utelates.
 * Filteret kan utelate enkeltposter fra telling (brukes for å ignorere inaktive barn).
 */
function tellLenker(
  snapshot: Partial<AppDataSnapshot>,
  pointsTo: LinkTarget,
  personId: string,
  inkluder: (collection: ListKey, record: unknown) => boolean,
): { collection: string; count: number }[] {
  const teller = new Map<string, number>();

  for (const spec of LINK_SPECS) {
    if (spec.pointsTo !== pointsTo) continue;
    const liste = postene(snapshot, spec.collection);
    if (!liste) continue;

    for (const record of liste) {
      if (!inkluder(spec.collection, record)) continue;
      if (verdierI(record, spec.field, spec.many).includes(personId)) {
        teller.set(spec.collection, (teller.get(spec.collection) ?? 0) + 1);
      }
    }
  }

  return [...teller.entries()].map(([collection, count]) => ({ collection, count }));
}

/**
 * Hvor mange poster som refererer til en koordinator. Alle koblinger telles,
 * også historiske (f.eks. avsluttede barn), fordi de ville mistet sin koordinator
 * ved sletting.
 */
export function linksToCoordinator(
  snapshot: Partial<AppDataSnapshot>,
  coordinatorId: string,
): { collection: string; count: number }[] {
  return tellLenker(snapshot, 'coordinators', coordinatorId, () => true);
}

/**
 * Hvor mange poster som refererer til en fadder, som blokkerer sletting.
 * Valg: barn med status avsluttet/arkivert telles IKKE (de er ikke lenger aktive
 * koblinger). Alle andre koblinger telles, inkludert betalinger, henvendelser og
 * historiske tildelinger, fordi de ellers ville stått igjen som foreldreløse.
 */
export function linksToSponsor(
  snapshot: Partial<AppDataSnapshot>,
  sponsorId: string,
): { collection: string; count: number }[] {
  return tellLenker(snapshot, 'sponsors', sponsorId, (collection, record) => {
    if (collection !== 'children') return true;
    const status = (record as Child).status;
    return !INAKTIVE_BARN_STATUS.includes(status);
  });
}
