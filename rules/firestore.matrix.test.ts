import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  ACTORS,
  ALL,
  STAFF,
  ensureSeed,
  markDirty,
  runOp,
  startEnv,
  stopEnv,
  type Actor,
  type Cell,
  type Op,
} from './harness';

/**
 * Tilgangsmatrise for Firestore-reglene: samling x operasjon x rolle.
 * `allow` er ONSKET policy. `gap` markerer der dagens regler avviker (kjent funn).
 * Kjente avvik kjores som `it.fails`: de er gronne naa, og blir roede naar regelen
 * rettes (da fjernes gap-markeringen). Se docs/HELSESJEKK.md.
 */

const c = (
  title: string,
  path: string,
  op: Op,
  allow: Actor[],
  extra: Partial<Pick<Cell, 'data' | 'gap'>> = {},
): Cell => ({ title, path, op, allow, ...extra });

const CELLS: Cell[] = [
  // userDirectory
  // F-09-merket var feil: admin har alltid kunnet lese invitasjoner (bekreftet mot gamle regler).
  c('userDirectory: les egen invitasjon', 'userDirectory/invited@example.com', 'get', ['invited', ...STAFF]),
  c('userDirectory: opprett', 'userDirectory/ny@example.com', 'create', STAFF, { data: { role: 'sponsor' } }),
  c('userDirectory: endre', 'userDirectory/invited@example.com', 'update', STAFF),
  c('userDirectory: slett', 'userDirectory/invited@example.com', 'delete', STAFF),

  // users
  c('users: les egen profil (fadder)', 'users/sponsorA', 'get', ['sponsorA', ...STAFF]),
  c('users: les egen profil (koordinator)', 'users/coordA', 'get', ['coordA', ...STAFF]),
  c('users: les admin-profil', 'users/admin1', 'get', ['admin', ...STAFF]),
  c('users: oppdater egen profil (ufarlig felt)', 'users/sponsorA', 'update', ['sponsorA', ...STAFF], {
    data: { sistInnlogget: 'na' },
  }),
  c('users: gi seg selv admin-rolle (fadder)', 'users/sponsorA', 'update', STAFF, {
    data: { role: 'admin' },
  }),
  c('users: bytte egen sponsorId (fadder)', 'users/sponsorA', 'update', STAFF, {
    data: { sponsorId: 'S2' },
  }),
  c('users: invitert oppretter egen profil som admin', 'users/invited', 'create', STAFF, {
    data: { role: 'admin', email: 'invited@example.com' },
  }),
  c('users: invitert oppretter egen profil som i invitasjonen', 'users/invited', 'create', ['invited', ...STAFF], {
    data: { role: 'sponsor', sponsorId: 'S3', email: 'invited@example.com' },
  }),
  c('users: opprett ny profil for annen bruker', 'users/ny-bruker', 'create', STAFF, {
    data: { role: 'sponsor', sponsorId: 'S9' },
  }),
  c('users: slett profil', 'users/sponsorA', 'delete', ['admin']),

  // coordinators
  c('coordinators: les K1', 'coordinators/K1', 'get', ['coordA', ...STAFF]),
  c('coordinators: les K2', 'coordinators/K2', 'get', ['coordB', ...STAFF]),
  c('coordinators: opprett', 'coordinators/K9', 'create', STAFF),
  c('coordinators: endre K1', 'coordinators/K1', 'update', STAFF),
  c('coordinators: slett K1', 'coordinators/K1', 'delete', STAFF),

  // sponsors
  c('sponsors: les S1', 'sponsors/S1', 'get', ['sponsorA', ...STAFF]),
  c('sponsors: les S2', 'sponsors/S2', 'get', ['sponsorB', ...STAFF]),
  c('sponsors: opprett', 'sponsors/S9', 'create', STAFF),
  c('sponsors: endre S1', 'sponsors/S1', 'update', STAFF),
  c('sponsors: slett S1', 'sponsors/S1', 'delete', STAFF),

  // children
  c('children: les C1 (fadderbarn, K1)', 'children/C1', 'get', ['coordA', 'sponsorA', ...STAFF]),
  c('children: les C2 (fadderbarn S2, K2)', 'children/C2', 'get', ['coordB', 'sponsorB', ...STAFF]),
  c('children: les C3 (uten fadder, K1)', 'children/C3', 'get', ['coordA', ...STAFF]),
  c('children: endre C1', 'children/C1', 'update', ['coordA', ...STAFF]),
  c('children: endre C2', 'children/C2', 'update', ['coordB', ...STAFF]),
  c('children: opprett barn for K1', 'children/C9', 'create', ['coordA', ...STAFF], {
    data: { navn: 'Nytt', koordinatorId: 'K1', status: 'utkast' },
  }),
  c('children: slett C1', 'children/C1', 'delete', STAFF),

  // facts
  c('facts: les F1', 'facts/F1', 'get', ['coordA', ...STAFF]),
  c('facts: opprett faktum for C1 (K1)', 'facts/F9', 'create', ['coordA', ...STAFF], {
    data: { barnId: 'C1', koordinatorId: 'K1', tekst: 'ny' },
  }),
  c('facts: endre', 'facts/F1', 'update', STAFF),
  c('facts: slett', 'facts/F1', 'delete', STAFF),

  // reports
  c('reports: les godkjent rapport om C1', 'reports/R1', 'get', ['coordA', 'sponsorA', ...STAFF]),
  c('reports: les innsendt (ikke godkjent) rapport om C1', 'reports/R2', 'get', ['coordA', ...STAFF]),
  c('reports: les godkjent rapport om C2', 'reports/R3', 'get', ['coordB', 'sponsorB', ...STAFF]),
  c('reports: opprett innsendt rapport for K1', 'reports/R9', 'create', ['coordA', ...STAFF], {
    data: { barnId: 'C1', koordinatorId: 'K1', status: 'innsendt' },
  }),
  c('reports: opprett allerede-godkjent rapport (omgaar godkjenning)', 'reports/R10', 'create', STAFF, {
    data: { barnId: 'C1', koordinatorId: 'K1', status: 'godkjent' },
  }),
  c('reports: endre', 'reports/R2', 'update', STAFF),
  c('reports: slett', 'reports/R2', 'delete', STAFF),

  // milestones
  c('milestones: les M1 (C1)', 'milestones/M1', 'get', ['coordA', 'sponsorA', ...STAFF]),
  c('milestones: les M2 (C2)', 'milestones/M2', 'get', ['coordB', 'sponsorB', ...STAFF]),
  c('milestones: opprett for C1 (K1)', 'milestones/M9', 'create', ['coordA', ...STAFF], {
    data: { barnId: 'C1', koordinatorId: 'K1' },
  }),
  c('milestones: endre M1', 'milestones/M1', 'update', ['coordA', ...STAFF]),
  c('milestones: slett', 'milestones/M1', 'delete', STAFF),

  // inquiries
  c('inquiries: les Q1 (S1/C1/K1)', 'inquiries/Q1', 'get', ['sponsorA', 'coordA', ...STAFF]),
  c('inquiries: les Q2 (S2/C2/K2)', 'inquiries/Q2', 'get', ['sponsorB', 'coordB', ...STAFF]),
  c('inquiries: fadder oppretter egen henvendelse', 'inquiries/Q9', 'create', ['sponsorA', ...STAFF], {
    data: { fadderId: 'S1', barnId: 'C1', status: 'ny' },
  }),
  c('inquiries: endre Q1', 'inquiries/Q1', 'update', ['coordA', ...STAFF]),
  c('inquiries: slett Q1', 'inquiries/Q1', 'delete', STAFF),

  // payments
  c('payments: les P1', 'payments/P1', 'get', ['sponsorA', ...STAFF]),
  c('payments: les P2', 'payments/P2', 'get', ['sponsorB', ...STAFF]),
  c('payments: opprett', 'payments/P9', 'create', STAFF, { data: { fadderId: 'S1', belop: 100 } }),
  c('payments: endre P1', 'payments/P1', 'update', STAFF),
  c('payments: slett P1', 'payments/P1', 'delete', STAFF),

  // sponsorAssignments
  c('sponsorAssignments: les ASG1 (S1)', 'sponsorAssignments/ASG1', 'get', ['sponsorA', ...STAFF]),
  c('sponsorAssignments: les ASG2 (S2)', 'sponsorAssignments/ASG2', 'get', ['sponsorB', ...STAFF]),
  c('sponsorAssignments: opprett', 'sponsorAssignments/ASG9', 'create', STAFF, {
    data: { sponsorId: 'S1', childId: 'C1', koordinatorId: 'K1', startDato: '2026-01-01', andelOre: 25000 },
  }),
  c('sponsorAssignments: endre', 'sponsorAssignments/ASG1', 'update', STAFF),
  c('sponsorAssignments: slett', 'sponsorAssignments/ASG1', 'delete', STAFF),

  // recurringCharges
  c('recurringCharges: les RC1 (S1)', 'recurringCharges/RC1', 'get', ['sponsorA', ...STAFF]),
  c('recurringCharges: les RC2 (S2)', 'recurringCharges/RC2', 'get', ['sponsorB', ...STAFF]),
  c('recurringCharges: opprett', 'recurringCharges/RC9', 'create', STAFF, {
    data: { sponsorId: 'S1', agreementId: 'AGR1', periode: '2026-11', amountOre: 25000, status: 'PENDING' },
  }),
  c('recurringCharges: endre', 'recurringCharges/RC1', 'update', STAFF),
  c('recurringCharges: slett', 'recurringCharges/RC1', 'delete', STAFF),

  // paymentAllocations
  c('paymentAllocations: les PA1 (S1 barn)', 'paymentAllocations/PA1', 'get', ['sponsorA', 'coordA', ...STAFF]),
  // PA2 er fadder S2 sin betaling satt av til buffer hos K2: fadderen ser egen fordeling.
  c('paymentAllocations: les PA2 (S2, K2 buffer)', 'paymentAllocations/PA2', 'get', ['sponsorB', 'coordB', ...STAFF]),
  c('paymentAllocations: opprett', 'paymentAllocations/PA9', 'create', STAFF, {
    data: { paymentId: 'pay_RC1', sponsorId: 'S1', maal: 'barn', periode: '2026-10', amountOre: 25000 },
  }),
  c('paymentAllocations: endre', 'paymentAllocations/PA1', 'update', STAFF),
  c('paymentAllocations: slett', 'paymentAllocations/PA1', 'delete', STAFF),

  // campaigns
  c('campaigns: les', 'campaigns/CA1', 'get', ALL),
  c('campaigns: opprett', 'campaigns/CA9', 'create', STAFF),
  c('campaigns: endre', 'campaigns/CA1', 'update', STAFF),
  c('campaigns: slett', 'campaigns/CA1', 'delete', STAFF),

  // testimonials
  c('testimonials: les godkjent', 'testimonials/T1', 'get', ALL),
  c('testimonials: les ikke godkjent', 'testimonials/T2', 'get', STAFF),
  c('testimonials: opprett', 'testimonials/T9', 'create', STAFF),
  c('testimonials: endre', 'testimonials/T1', 'update', STAFF),
  c('testimonials: slett', 'testimonials/T1', 'delete', STAFF),

  // notifications
  c('notifications: les til S1', 'notifications/N1', 'get', ['sponsorA', ...STAFF]),
  c('notifications: les til K1', 'notifications/N2', 'get', ['coordA', ...STAFF]),
  c('notifications: les til S2', 'notifications/N3', 'get', ['sponsorB', ...STAFF]),
  c('notifications: les admin-varsel', 'notifications/N4', 'get', STAFF),
  c('notifications: opprett', 'notifications/N9', 'create', ['sponsorA', 'sponsorB', 'coordA', 'coordB', ...STAFF], {
    data: { targetRole: 'admin', tekst: 'ny' },
    gap: { stranger: 'F-05', invited: 'F-05' },
  }),
  c('notifications: marker egen som lest (S1)', 'notifications/N1', 'update', ['sponsorA', ...STAFF], {
    gap: {
      stranger: 'F-05',
      invited: 'F-05',
      sponsorB: 'F-05',
      coordA: 'F-05',
      coordB: 'F-05',
    },
  }),
  c('notifications: slett', 'notifications/N1', 'delete', STAFF, {
    gap: {
      stranger: 'F-05',
      invited: 'F-05',
      sponsorA: 'F-05',
      sponsorB: 'F-05',
      coordA: 'F-05',
      coordB: 'F-05',
    },
  }),

  // auditLogs, cms, newsletterLogs, emailOutbox, settings
  c('auditLogs: les', 'auditLogs/A1', 'get', STAFF),
  c('auditLogs: opprett', 'auditLogs/A9', 'create', STAFF),
  c('auditLogs: endre', 'auditLogs/A1', 'update', STAFF),
  c('auditLogs: slett', 'auditLogs/A1', 'delete', STAFF),
  c('cms: les', 'cms/public', 'get', ALL),
  c('cms: endre', 'cms/public', 'update', STAFF),
  c('cms: opprett', 'cms/andre', 'create', STAFF),
  c('cms: slett', 'cms/public', 'delete', STAFF),
  c('newsletterLogs: les', 'newsletterLogs/NL1', 'get', STAFF),
  c('newsletterLogs: opprett', 'newsletterLogs/NL9', 'create', STAFF),
  c('newsletterLogs: slett', 'newsletterLogs/NL1', 'delete', STAFF),
  c('emailOutbox: les', 'emailOutbox/E1', 'get', STAFF),
  c('emailOutbox: opprett', 'emailOutbox/E9', 'create', STAFF),
  c('emailOutbox: slett', 'emailOutbox/E1', 'delete', STAFF),
  c('settings: les', 'settings/emailAutoSend', 'get', STAFF),
  c('settings: endre', 'settings/emailAutoSend', 'update', STAFF),
  c('settings: opprett', 'settings/annet', 'create', STAFF),

  // catalogPhotos
  c('catalogPhotos: les CP1', 'catalogPhotos/CP1', 'get', ['coordA', ...STAFF]),
  c('catalogPhotos: opprett for K1', 'catalogPhotos/CP9', 'create', ['coordA', ...STAFF], {
    data: { koordinatorId: 'K1', barnId: 'C1' },
  }),
  c('catalogPhotos: endre CP1', 'catalogPhotos/CP1', 'update', ['coordA', ...STAFF]),
  c('catalogPhotos: slett CP1', 'catalogPhotos/CP1', 'delete', STAFF),

  // system
  c('system: les seedLock', 'system/seedLock', 'get', STAFF),
  c('system: opprett seedLock', 'system/seedLock', 'create', STAFF, { data: { by: 'test' } }),
  c('system: opprett annet dokument', 'system/annet', 'create', [] as Actor[], { data: { x: 1 } }),
  c('system: slett seedLock', 'system/seedLock', 'delete', []),
];

beforeAll(async () => {
  await startEnv();
});
afterAll(async () => {
  await stopEnv();
});

for (const cell of CELLS) {
  describe(`${cell.title} [${cell.op} ${cell.path}]`, () => {
    for (const actor of ACTORS) {
      const shouldAllow = cell.allow.includes(actor);
      const gapId = cell.gap?.[actor];
      const label = `${actor} ${shouldAllow ? 'faar' : 'faar IKKE'}${gapId ? ` (KJENT AVVIK ${gapId})` : ''}`;
      const body = async () => {
        // Seed -> forbered dokumenter. For operasjoner som aapner for skriving, merk skitten.
        if (cell.path === 'system/seedLock' && cell.op === 'create') {
          // seedLock finnes ikke i grunndata, slik at create kan testes.
        }
        await ensureSeed();
        if (cell.op !== 'get') markDirty();
        const run = runOp(actor, cell);
        // Kjent avvik: vi bekrefter at dagens regel faktisk gir MOTSATT svar av ønsket policy.
        const expectAllowed = gapId ? !shouldAllow : shouldAllow;
        if (expectAllowed) await assertSucceeds(run);
        else await assertFails(run);
      };
      it(label, body);
    }
  });
}

describe('matrise-sanity', () => {
  it('har dekket alle aktorer og minst 80 celler', () => {
    expect(ACTORS.length).toBe(9);
    expect(CELLS.length).toBeGreaterThanOrEqual(80);
  });
});
