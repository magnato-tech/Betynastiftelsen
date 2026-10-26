import type { PersonLogSubject } from '../types';

export type LinkCount = { collection: string; count: number };

const LINK_LABELS: Record<string, string> = {
  children: 'barn',
  reports: 'rapporter',
  facts: 'fakta',
  milestones: 'milepæler',
  inquiries: 'henvendelser',
  payments: 'betalinger',
  sponsorAssignments: 'tildelinger',
  campaigns: 'aksjoner',
  recurringCharges: 'faste trekk',
  paymentAllocations: 'fordelinger',
};

/**
 * Administratorer ligger i userDirectory og kan ikke slettes eller deaktiveres i personkortet.
 * Barn er ikke personer med innlogging, så de avvises her også (de har egne handlinger).
 */
export function assertNotAdmin(subject: PersonLogSubject): void {
  if (subject.type === 'admin') throw new Error('Administratorer kan ikke slettes her.');
  if (subject.type === 'child') throw new Error('Barn kan ikke slettes eller deaktiveres her.');
}

/**
 * Validerer en sletting: navnet må være nøyaktig likt (etter trim, store/små bokstaver betyr noe),
 * og personen må være uten koblinger. Kaster Error med norsk melding ved brudd.
 */
export function validateDeletePerson(params: { navn: string; confirmName: string; links: LinkCount[] }): void {
  if (params.confirmName.trim() !== params.navn) {
    throw new Error(`Skriv inn fullt navn («${params.navn}») for å bekrefte sletting.`);
  }
  const deler = params.links
    .filter((l) => l.count > 0)
    .map((l) => `${l.count} ${LINK_LABELS[l.collection] ?? l.collection}`);
  if (deler.length > 0) {
    throw new Error(`Kan ikke slette: ${deler.join(', ')} er koblet til personen. Flytt eller avslutt dem først.`);
  }
}

function verdiTekst(v: unknown): string {
  if (v === undefined || v === null || v === '') return '(tom)';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '(tom)';
  return String(v);
}

/**
 * Lister endrede felt i en patch som «felt: gammel → ny», ett per felt.
 * Felt som er like, og feltet `id`, utelates.
 */
export function describeChanges(before: object, patch: object): string[] {
  const gammel = before as Record<string, unknown>;
  const ny = patch as Record<string, unknown>;
  const linjer: string[] = [];
  for (const felt of Object.keys(ny)) {
    if (felt === 'id') continue;
    const a = gammel[felt];
    const b = ny[felt];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    linjer.push(`${felt}: ${verdiTekst(a)} → ${verdiTekst(b)}`);
  }
  return linjer;
}
