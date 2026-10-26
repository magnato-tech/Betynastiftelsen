import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  type RulesTestContext,
} from '@firebase/rules-unit-testing';

export const ACTORS = [
  'anon', // ikke innlogget
  'stranger', // innlogget Google-konto uten profil eller invitasjon
  'invited', // innlogget, finnes i userDirectory, har ikke users-dokument ennå
  'sponsorA', // fadder S1 (har barn C1)
  'sponsorB', // fadder S2 (har barn C2)
  'coordA', // koordinator K1 (barn C1, C3)
  'coordB', // koordinator K2 (barn C2)
  'admin', // users/{uid}.role == 'admin'
  'bootstrap', // bootstrap-admin via e-post, uten users-dokument
] as const;
export type Actor = (typeof ACTORS)[number];

export const ALL: Actor[] = [...ACTORS];
export const STAFF: Actor[] = ['admin', 'bootstrap'];

let env: RulesTestEnvironment;
let dirty = true;

export async function startEnv() {
  env = await initializeTestEnvironment({
    projectId: 'demo-betyna',
    firestore: { rules: readFileSync(process.env.RULES_FILE ?? 'firestore.rules', 'utf8') },
  });
  return env;
}
export async function stopEnv() {
  await env.cleanup();
}

export function ctxFor(actor: Actor): RulesTestContext {
  switch (actor) {
    case 'anon':
      return env.unauthenticatedContext();
    case 'stranger':
      return env.authenticatedContext('stranger', { email: 'stranger@example.com' });
    case 'invited':
      return env.authenticatedContext('invited', { email: 'invited@example.com' });
    case 'sponsorA':
      return env.authenticatedContext('sponsorA', { email: 'sponsor.a@example.com' });
    case 'sponsorB':
      return env.authenticatedContext('sponsorB', { email: 'sponsor.b@example.com' });
    case 'coordA':
      return env.authenticatedContext('coordA', { email: 'coord.a@example.com' });
    case 'coordB':
      return env.authenticatedContext('coordB', { email: 'coord.b@example.com' });
    case 'admin':
      return env.authenticatedContext('admin1', { email: 'admin@example.com' });
    case 'bootstrap':
      return env.authenticatedContext('boot', { email: 'magnar.totland@gmail.com' });
  }
}

export function customCtx(uid: string, claims: Record<string, unknown>): RulesTestContext {
  return env.authenticatedContext(uid, claims);
}

export function dbFor(actor: Actor) {
  return ctxFor(actor).firestore();
}

/** Fast, kjent datasett. Ingen "seed" i appen - dette er kun testdata i emulatoren. */
export async function seed() {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const put = (path: string, data: Record<string, unknown>) => db.doc(path).set(data);
    await Promise.all([
      put('users/admin1', { role: 'admin', email: 'admin@example.com' }),
      put('users/sponsorA', { role: 'sponsor', sponsorId: 'S1', email: 'sponsor.a@example.com' }),
      put('users/sponsorB', { role: 'sponsor', sponsorId: 'S2', email: 'sponsor.b@example.com' }),
      put('users/coordA', { role: 'coordinator', coordinatorId: 'K1', email: 'coord.a@example.com' }),
      put('users/coordB', { role: 'coordinator', coordinatorId: 'K2', email: 'coord.b@example.com' }),
      put('userDirectory/invited@example.com', { role: 'sponsor', sponsorId: 'S3' }),
      put('coordinators/K1', { navn: 'Koordinator 1' }),
      put('coordinators/K2', { navn: 'Koordinator 2' }),
      put('sponsors/S1', { navn: 'Fadder 1', epost: 'sponsor.a@example.com' }),
      put('sponsors/S2', { navn: 'Fadder 2', epost: 'sponsor.b@example.com' }),
      put('children/C1', { navn: 'Barn 1', koordinatorId: 'K1', tildeltFadderId: 'S1', status: 'aktiv' }),
      put('children/C2', { navn: 'Barn 2', koordinatorId: 'K2', tildeltFadderId: 'S2', status: 'aktiv' }),
      put('children/C3', { navn: 'Barn 3', koordinatorId: 'K1', status: 'trenger_fadder' }),
      put('facts/F1', { barnId: 'C1', koordinatorId: 'K1', tekst: 'Faktum' }),
      put('reports/R1', { barnId: 'C1', koordinatorId: 'K1', status: 'godkjent' }),
      put('reports/R2', { barnId: 'C1', koordinatorId: 'K1', status: 'innsendt' }),
      put('reports/R3', { barnId: 'C2', koordinatorId: 'K2', status: 'godkjent' }),
      put('milestones/M1', { barnId: 'C1', koordinatorId: 'K1' }),
      put('milestones/M2', { barnId: 'C2', koordinatorId: 'K2' }),
      put('inquiries/Q1', { fadderId: 'S1', barnId: 'C1', koordinatorId: 'K1', status: 'ny' }),
      put('inquiries/Q2', { fadderId: 'S2', barnId: 'C2', koordinatorId: 'K2', status: 'ny' }),
      put('payments/P1', { fadderId: 'S1', belop: 400 }),
      put('payments/P2', { fadderId: 'S2', belop: 400 }),
      put('sponsorAssignments/ASG1', { sponsorId: 'S1', childId: 'C1', koordinatorId: 'K1', startDato: '2026-01-01', andelOre: 25000 }),
      put('sponsorAssignments/ASG2', { sponsorId: 'S2', childId: 'C2', koordinatorId: 'K2', startDato: '2026-01-01', andelOre: 25000 }),
      put('recurringCharges/RC1', { sponsorId: 'S1', agreementId: 'AGR1', periode: '2026-10', amountOre: 25000, status: 'CHARGED' }),
      put('recurringCharges/RC2', { sponsorId: 'S2', agreementId: 'AGR2', periode: '2026-10', amountOre: 25000, status: 'DUE' }),
      put('paymentAllocations/PA1', { paymentId: 'pay_RC1', sponsorId: 'S1', childId: 'C1', koordinatorId: 'K1', maal: 'barn', periode: '2026-10', amountOre: 25000 }),
      put('paymentAllocations/PA2', { paymentId: 'pay_RC2', sponsorId: 'S2', koordinatorId: 'K2', maal: 'buffer', periode: '2026-10', amountOre: 25000 }),
      put('campaigns/CA1', { tittel: 'Kampanje' }),
      put('testimonials/T1', { tekst: 'Godkjent', godkjentAvAdmin: true }),
      put('testimonials/T2', { tekst: 'Venter', godkjentAvAdmin: false }),
      put('notifications/N1', { recipientId: 'S1', tekst: 'til fadder 1' }),
      put('notifications/N2', { recipientId: 'K1', tekst: 'til koordinator 1' }),
      put('notifications/N3', { recipientId: 'S2', tekst: 'til fadder 2' }),
      put('notifications/N4', { targetRole: 'admin', tekst: 'til admin' }),
      put('auditLogs/A1', { handling: 'test' }),
      put('cms/public', { tittel: 'Forside' }),
      put('newsletterLogs/NL1', { emne: 'x' }),
      put('emailOutbox/E1', { til: 'x@example.com' }),
      put('catalogPhotos/CP1', { koordinatorId: 'K1', barnId: 'C1' }),
      put('settings/emailAutoSend', { enabled: false }),
    ]);
  });
  dirty = false;
}

export async function ensureSeed() {
  if (dirty) await seed();
}
export function markDirty() {
  dirty = true;
}

export type Op = 'get' | 'create' | 'update' | 'delete';

export interface Cell {
  title: string;
  path: string; // "samling/id"
  op: Op;
  data?: Record<string, unknown>;
  /** Hvem som SKAL ha lov (ønsket policy). */
  allow: Actor[];
  /** Aktører der dagens regler avviker fra ønsket policy -> funn-ID. */
  gap?: Partial<Record<Actor, string>>;
}

export async function runOp(actor: Actor, cell: Cell): Promise<void> {
  const ref = dbFor(actor).doc(cell.path);
  if (cell.op === 'get') await ref.get();
  else if (cell.op === 'create') await ref.set(cell.data ?? { test: true });
  else if (cell.op === 'update') await ref.update(cell.data ?? { notat: 'endret' });
  else await ref.delete();
}
