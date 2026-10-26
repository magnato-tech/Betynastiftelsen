import type { AuditLogItem, Coordinator, PersonLogSubject, Sponsor } from '../types';

/** Personen som et personkort gjelder, fra en koordinator-post. */
export function coordinatorSubject(c: Pick<Coordinator, 'id' | 'fornavn' | 'etternavn'>): PersonLogSubject {
  return { type: 'coordinator', id: c.id, navn: `${c.fornavn} ${c.etternavn}` };
}

/** Personen som et personkort gjelder, fra en fadder-post. */
export function sponsorSubject(s: Pick<Sponsor, 'id' | 'navn'>): PersonLogSubject {
  return { type: 'sponsor', id: s.id, navn: s.navn };
}

/** Millisekundene i id-en «log-<ms>» eller «log-<ms>-<tilfeldig>»; 0 hvis formatet er ukjent. */
function idMillis(id: string): number {
  const ms = Number(id.split('-')[1]);
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Loggoppføringer for én person, nyest først (tidspunkt synkende, deretter tiden i id-en).
 * Tidspunkt har bare minuttoppløsning, og den tilfeldige delen av id-en sier ingenting om
 * rekkefølge; ved helt likt millisekund beholdes rekkefølgen i lista (stabil sortering).
 * Filtrerer på gjelderType + gjelderId, så oppføringer overlever at personen slettes.
 * Gamle oppføringer uten gjelder-felt inngår ikke.
 */
export function logForPerson(auditLogs: AuditLogItem[], subject: PersonLogSubject): AuditLogItem[] {
  return auditLogs
    .filter((l) => l.gjelderType === subject.type && l.gjelderId === subject.id)
    .sort((a, b) => {
      if (a.tidspunkt !== b.tidspunkt) return a.tidspunkt < b.tidspunkt ? 1 : -1;
      return idMillis(b.id) - idMillis(a.id);
    });
}
