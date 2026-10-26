import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { dbFor, customCtx, markDirty, ensureSeed, seed, startEnv, stopEnv, type Actor } from './harness';

/**
 * Scenariotester for Firestore-reglene. Hver test beskriver en konkret trussel eller et krav.
 * Tester merket "KJENT AVVIK F-xx" dokumenterer dagens (uonskede) oppforsel og blir
 * roede naar regelen rettes - da skal de snus. Se docs/HELSESJEKK.md.
 */

beforeAll(async () => {
  await startEnv();
});
afterAll(async () => {
  await stopEnv();
});
beforeEach(async () => {
  markDirty();
  await ensureSeed();
});

const doc = (actor: Actor, path: string) => dbFor(actor).doc(path);

describe('Rolleeskalering via users-dokumentet (F-01, F-02)', () => {
  it('RETTET F-01: fadder kan IKKE gjore seg selv til admin', async () => {
    await assertFails(doc('sponsorA', 'users/sponsorA').update({ role: 'admin' }));
  });
  it('RETTET F-01: fadder kan IKKE bytte til en annen fadders sponsorId', async () => {
    await assertFails(doc('sponsorA', 'users/sponsorA').update({ sponsorId: 'S2' }));
  });
  it('RETTET F-01: fadder kan IKKE gjore seg til koordinator', async () => {
    await assertFails(doc('sponsorA', 'users/sponsorA').update({ role: 'coordinator', coordinatorId: 'K2' }));
  });
  it('RETTET F-01: koordinator kan IKKE bytte til en annen koordinators id', async () => {
    await assertFails(doc('coordA', 'users/coordA').update({ coordinatorId: 'K2' }));
  });
  it('RETTET F-01: koordinator kan IKKE gjore seg til admin', async () => {
    await assertFails(doc('coordA', 'users/coordA').update({ role: 'admin' }));
  });
  it('RETTET F-02: invitert bruker kan IKKE opprette seg selv som admin', async () => {
    await assertFails(doc('invited', 'users/invited').set({ role: 'admin' }));
  });
  it('RETTET F-02: invitert bruker kan IKKE opprette seg som en annen fadder enn invitasjonen sier', async () => {
    await assertFails(doc('invited', 'users/invited').set({ role: 'sponsor', sponsorId: 'S1' }));
  });
  it('RETTET F-01: eskaleringskjede stoppes - fadder blir ikke admin og leser ikke andres data', async () => {
    await assertFails(doc('sponsorA', 'users/sponsorA').update({ role: 'admin' }));
    await assertFails(doc('sponsorA', 'payments/P2').get());
    await assertFails(doc('sponsorA', 'children/C2').get());
  });
  it('fadder kan fortsatt endre ufarlige felt i egen profil (navn)', async () => {
    await assertSucceeds(doc('sponsorA', 'users/sponsorA').update({ displayName: 'Nytt navn' }));
  });
  it('fremmed innlogget bruker kan IKKE opprette seg selv som admin', async () => {
    await assertFails(doc('stranger', 'users/stranger').set({ role: 'admin' }));
  });
  it('fremmed innlogget bruker kan IKKE opprette seg selv som fadder', async () => {
    await assertFails(doc('stranger', 'users/stranger').set({ role: 'sponsor', sponsorId: 'S1' }));
  });
  it('bruker kan IKKE opprette profil under en annen uid', async () => {
    await assertFails(doc('invited', 'users/sponsorA').set({ role: 'sponsor', sponsorId: 'S1' }));
  });
  it('fadder kan IKKE lese andres brukerprofil', async () => {
    await assertFails(doc('sponsorA', 'users/sponsorB').get());
    await assertFails(doc('sponsorA', 'users/admin1').get());
  });
  it('fadder og koordinator kan IKKE slette sin egen profil', async () => {
    await assertFails(doc('sponsorA', 'users/sponsorA').delete());
    await assertFails(doc('coordA', 'users/coordA').delete());
  });
  it('KJENT AVVIK F-08: bootstrap-admin gjelder uansett om e-posten er verifisert', async () => {
    const db = customCtx('x1', { email: 'magnar.totland@gmail.com', email_verified: false }).firestore();
    await assertSucceeds(db.doc('payments/P1').get());
    await assertSucceeds(db.doc('children/C2').update({ navn: 'Endret av ikke-verifisert' }));
  });
  it('en annen e-postadresse gir ikke bootstrap-rettigheter', async () => {
    const db = customCtx('x2', { email: 'magnar.totland@gmail.com.evil.com' }).firestore();
    await assertFails(db.doc('payments/P1').get());
  });
});

describe('Fadder: kun egne data, ingen direkte kontakt med barnet', () => {
  it('fadder kan lese eget barn og egen betaling', async () => {
    await assertSucceeds(doc('sponsorA', 'children/C1').get());
    await assertSucceeds(doc('sponsorA', 'payments/P1').get());
  });
  it('fadder kan IKKE lese andres barn, betalinger, henvendelser eller varsler', async () => {
    await assertFails(doc('sponsorA', 'children/C2').get());
    await assertFails(doc('sponsorA', 'children/C3').get());
    await assertFails(doc('sponsorA', 'payments/P2').get());
    await assertFails(doc('sponsorA', 'inquiries/Q2').get());
    await assertFails(doc('sponsorA', 'notifications/N3').get());
    await assertFails(doc('sponsorA', 'sponsors/S2').get());
  });
  it('fadder kan IKKE lese koordinatorer, fakta, katalogbilder, revisjonslogg, nyhetsbrevlogg eller utboks', async () => {
    for (const p of [
      'coordinators/K1',
      'facts/F1',
      'catalogPhotos/CP1',
      'auditLogs/A1',
      'newsletterLogs/NL1',
      'emailOutbox/E1',
      'settings/emailAutoSend',
      'system/seedLock',
    ]) {
      await assertFails(doc('sponsorA', p).get());
    }
  });
  it('fadder kan IKKE lese ugodkjent rapport om eget barn', async () => {
    await assertFails(doc('sponsorA', 'reports/R2').get());
  });
  it('fadder kan IKKE endre barn, rapporter, milepaeler, betalinger eller eget fadderdokument', async () => {
    await assertFails(doc('sponsorA', 'children/C1').update({ navn: 'Endret' }));
    await assertFails(doc('sponsorA', 'reports/R1').update({ status: 'avvist' }));
    await assertFails(doc('sponsorA', 'milestones/M1').update({ x: 1 }));
    await assertFails(doc('sponsorA', 'payments/P1').update({ belop: 1 }));
    await assertFails(doc('sponsorA', 'sponsors/S1').update({ navn: 'Endret' }));
    await assertFails(doc('sponsorA', 'payments/P99').set({ fadderId: 'S1', belop: 400, status: 'betalt' }));
  });
  it('fadder kan IKKE opprette henvendelse i en annen fadders navn', async () => {
    await assertFails(doc('sponsorA', 'inquiries/QX').set({ fadderId: 'S2', barnId: 'C2', status: 'ny' }));
  });
  it('fadder kan IKKE svare paa eller endre en henvendelse (kun admin/koordinator)', async () => {
    await assertFails(doc('sponsorA', 'inquiries/Q1').update({ status: 'besvart', svar: 'x' }));
  });
  it('KJENT AVVIK F-06: fadder kan opprette henvendelse om et barn vedkommende IKKE er fadder for', async () => {
    await assertSucceeds(doc('sponsorA', 'inquiries/QX').set({ fadderId: 'S1', barnId: 'C2', status: 'ny' }));
  });
  it('KJENT AVVIK F-05: fadder kan skrive varsel direkte til en koordinator (omgaar admin-forvaltning)', async () => {
    await assertSucceeds(
      doc('sponsorA', 'notifications/NX').set({ recipientId: 'K1', targetRole: 'coordinator', tekst: 'Hei' }),
    );
  });
  it('KJENT AVVIK F-05: fadder kan slette og endre andres varsler', async () => {
    await assertSucceeds(doc('sponsorA', 'notifications/N2').update({ lest: true }));
    await assertSucceeds(doc('sponsorA', 'notifications/N2').delete());
  });
  it('barnet har ingen innlogging: ingen regel gir tilgang til meldingsdata for barn', async () => {
    // Det finnes ingen "child"-rolle i reglene; en innlogget bruker uten profil har ingen rettigheter.
    await assertFails(doc('stranger', 'children/C1').get());
    await assertFails(doc('stranger', 'inquiries/Q1').get());
    await assertFails(doc('stranger', 'inquiries/QY').set({ fadderId: 'S1', barnId: 'C1' }));
  });
  it('KJENT AVVIK F-07: fadder faar hele barnedokumentet, ogsaa interne felt', async () => {
    await seed();
    await doc('admin', 'children/C1').set({
      navn: 'Barn 1',
      koordinatorId: 'K1',
      tildeltFadderId: 'S1',
      internKode: 'INT-001',
      koordinatorNotat: 'Intern vurdering',
      adresse: 'Fullstendig adresse',
    });
    const snap = await assertSucceeds(doc('sponsorA', 'children/C1').get());
    const d = snap.data() ?? {};
    if (!d.internKode || !d.koordinatorNotat || !d.adresse) {
      throw new Error('Forventet at interne felt ligger apent for fadder (dagens oppforsel)');
    }
  });
});

describe('Koordinator: kun egne barn og egne data', () => {
  it('koordinator kan IKKE lese fadderdata, betalinger, andre koordinatorer, kampanjeadministrasjon eller logger', async () => {
    for (const p of [
      'sponsors/S1',
      'payments/P1',
      'coordinators/K2',
      'auditLogs/A1',
      'newsletterLogs/NL1',
      'emailOutbox/E1',
      'settings/emailAutoSend',
    ]) {
      await assertFails(doc('coordA', p).get());
    }
  });
  it('koordinator kan IKKE lese andre koordinatorers barn, fakta eller katalogbilder', async () => {
    await assertFails(doc('coordA', 'children/C2').get());
    await assertFails(doc('coordB', 'children/C1').get());
    await assertFails(doc('coordB', 'facts/F1').get());
    await assertFails(doc('coordB', 'catalogPhotos/CP1').get());
  });
  it('koordinator kan IKKE godkjenne egen rapport', async () => {
    await assertFails(doc('coordA', 'reports/R2').update({ status: 'godkjent' }));
  });
  it('RETTET F-04: koordinator kan IKKE opprette rapport som allerede er godkjent', async () => {
    await assertFails(
      doc('coordA', 'reports/RZ').set({ barnId: 'C1', koordinatorId: 'K1', status: 'godkjent' }),
    );
  });
  it('koordinator kan sende inn rapport om eget barn', async () => {
    await assertSucceeds(
      doc('coordA', 'reports/RY').set({ barnId: 'C1', koordinatorId: 'K1', status: 'innsendt' }),
    );
  });
  it('RETTET F-03: koordinator kan IKKE tildele fadder til eget barn (admin-oppgave)', async () => {
    await assertFails(doc('coordA', 'children/C3').update({ tildeltFadderId: 'S1' }));
  });
  it('RETTET F-03: koordinator kan IKKE flytte eget barn til en annen koordinator', async () => {
    await assertFails(doc('coordA', 'children/C1').update({ koordinatorId: 'K2' }));
  });
  it('RETTET F-03: koordinator kan IKKE opprette barn med en annen koordinators id', async () => {
    await assertFails(doc('coordA', 'children/CZ').set({ navn: 'X', koordinatorId: 'K2' }));
  });
  it('RETTET F-03: koordinator kan IKKE opprette barn med fadder', async () => {
    await assertFails(
      doc('coordA', 'children/CZ').set({ navn: 'X', koordinatorId: 'K1', tildeltFadderId: 'S1' }),
    );
  });
  it('RETTET F-03: koordinator kan IKKE endre et barn som tilhorer en annen koordinator', async () => {
    await assertFails(doc('coordA', 'children/C2').update({ navn: 'Overskrevet' }));
  });
  it('koordinator kan endre opplysninger om eget barn', async () => {
    await assertSucceeds(doc('coordA', 'children/C1').update({ navn: 'Rettet navn' }));
  });
  it('fadder kan IKKE endre opplysninger om eget fadderbarn', async () => {
    await assertFails(doc('sponsorA', 'children/C1').update({ navn: 'Fra fadder' }));
  });
  it('koordinator kan IKKE slette barn', async () => {
    await assertFails(doc('coordA', 'children/C1').delete());
  });
  it('koordinator kan IKKE endre eller slette fakta etter innsending', async () => {
    await assertFails(doc('coordA', 'facts/F1').update({ tekst: 'x' }));
    await assertFails(doc('coordA', 'facts/F1').delete());
  });
});

describe('Spoerringer (listing)', () => {
  it('fadder kan liste egne barn med filter paa egen id', async () => {
    await assertSucceeds(dbFor('sponsorA').collection('children').where('tildeltFadderId', '==', 'S1').get());
  });
  it('fadder kan IKKE liste barn med annen fadders id', async () => {
    await assertFails(dbFor('sponsorA').collection('children').where('tildeltFadderId', '==', 'S2').get());
  });
  it('fadder kan IKKE liste alle barn uten filter', async () => {
    await assertFails(dbFor('sponsorA').collection('children').get());
  });
  it('fadder kan liste egne betalinger og IKKE alle', async () => {
    await assertSucceeds(dbFor('sponsorA').collection('payments').where('fadderId', '==', 'S1').get());
    await assertFails(dbFor('sponsorA').collection('payments').get());
  });
  it('fadder kan liste egne varsler og IKKE alle', async () => {
    await assertSucceeds(dbFor('sponsorA').collection('notifications').where('recipientId', '==', 'S1').get());
    await assertFails(dbFor('sponsorA').collection('notifications').get());
  });
  it('koordinator kan liste egne barn og IKKE alle eller andres', async () => {
    await assertSucceeds(dbFor('coordA').collection('children').where('koordinatorId', '==', 'K1').get());
    await assertFails(dbFor('coordA').collection('children').where('koordinatorId', '==', 'K2').get());
    await assertFails(dbFor('coordA').collection('children').get());
  });
  it('anonym kan liste kampanjer og cms, men ikke barn, fadderne eller betalinger', async () => {
    await assertSucceeds(dbFor('anon').collection('campaigns').get());
    await assertSucceeds(dbFor('anon').collection('cms').get());
    await assertFails(dbFor('anon').collection('children').get());
    await assertFails(dbFor('anon').collection('sponsors').get());
    await assertFails(dbFor('anon').collection('payments').get());
    await assertFails(dbFor('anon').collection('reports').get());
  });
  it('anonym kan liste godkjente uttalelser, men ikke alle', async () => {
    await assertSucceeds(dbFor('anon').collection('testimonials').where('godkjentAvAdmin', '==', true).get());
    await assertFails(dbFor('anon').collection('testimonials').get());
  });
  it('admin kan liste alle samlinger som appen laster ved oppstart', async () => {
    for (const col of [
      'children',
      'sponsors',
      'coordinators',
      'facts',
      'reports',
      'milestones',
      'inquiries',
      'payments',
      'campaigns',
      'testimonials',
      'notifications',
      'auditLogs',
      'catalogPhotos',
      'newsletterLogs',
      'emailOutbox',
    ]) {
      await assertSucceeds(dbFor('admin').collection(col).get());
      await assertSucceeds(dbFor('bootstrap').collection(col).get());
    }
  });
});

describe('Ikke innlogget', () => {
  it('anonym kan IKKE skrive i noen samling', async () => {
    for (const p of [
      'children/Cx',
      'sponsors/Sx',
      'coordinators/Kx',
      'reports/Rx',
      'inquiries/Qx',
      'payments/Px',
      'notifications/Nx',
      'cms/public',
      'campaigns/CA1',
      'testimonials/T1',
      'users/ux',
      'userDirectory/x@example.com',
      'auditLogs/Ax',
      'emailOutbox/Ex',
    ]) {
      await assertFails(doc('anon', p).set({ x: 1 }));
    }
  });
  it('anonym kan IKKE slette offentlig innhold', async () => {
    await assertFails(doc('anon', 'cms/public').delete());
    await assertFails(doc('anon', 'campaigns/CA1').delete());
  });
});

describe('Systemlaas (seedLock)', () => {
  it('seedLock kan opprettes en gang av admin, men aldri endres eller slettes (heller ikke av admin)', async () => {
    await assertSucceeds(doc('admin', 'system/seedLock').set({ ok: true }));
    await assertFails(doc('admin', 'system/seedLock').update({ ok: false }));
    await assertFails(doc('admin', 'system/seedLock').delete());
    await assertFails(doc('bootstrap', 'system/seedLock').delete());
  });
});

describe('Invitasjon av koordinator: hele forlopet', () => {
  const coordDb = () => customCtx('nyKoord', { email: 'ny.koord@example.com' }).firestore();

  it('admin inviterer, koordinator logger inn forste gang, blir aktiv og ser bare egne elever', async () => {
    // 1. Admin inviterer (slik appen gjor det: e-post som dokument-id, status invitert)
    await assertSucceeds(
      doc('admin', 'userDirectory/ny.koord@example.com').set({
        email: 'ny.koord@example.com',
        role: 'coordinator',
        coordinatorId: 'K1',
        status: 'invitert',
        displayName: 'Ny Koordinator',
      })
    );
    const db = coordDb();
    // 2. Forste innlogging: profil med samme rolle og koordinator som invitasjonen
    await assertSucceeds(
      db.doc('users/nyKoord').set({
        id: 'nyKoord',
        role: 'coordinator',
        coordinatorId: 'K1',
        email: 'ny.koord@example.com',
        displayName: 'Ny Koordinator',
        createdAt: '2026-10-26T08:00:00.000Z',
      })
    );
    // 3. Personen setter selv invitert -> aktiv (var feilen: dette ble avvist for)
    await assertSucceeds(db.doc('userDirectory/ny.koord@example.com').update({ status: 'aktiv' }));
    // 4. Ser egne elever (K1), ikke andres (K2)
    await assertSucceeds(db.doc('children/C1').get());
    await assertSucceeds(db.doc('children/C3').get());
    await assertFails(db.doc('children/C2').get());
    await assertFails(db.doc('payments/P1').get());
  });

  it('invitert koordinator kan IKKE opprette profil med en annen koordinator enn invitasjonen', async () => {
    await assertSucceeds(
      doc('admin', 'userDirectory/ny.koord@example.com').set({
        email: 'ny.koord@example.com',
        role: 'coordinator',
        coordinatorId: 'K1',
        status: 'invitert',
      })
    );
    await assertFails(coordDb().doc('users/nyKoord').set({ role: 'coordinator', coordinatorId: 'K2' }));
  });

  it('personen kan bare endre egen status fra invitert til aktiv - ikke rolle, ikke sperret->aktiv', async () => {
    await assertSucceeds(
      doc('admin', 'userDirectory/ny.koord@example.com').set({
        email: 'ny.koord@example.com',
        role: 'coordinator',
        coordinatorId: 'K1',
        status: 'invitert',
      })
    );
    const db = coordDb();
    await assertFails(db.doc('userDirectory/ny.koord@example.com').update({ role: 'admin' }));
    await assertFails(
      db.doc('userDirectory/ny.koord@example.com').update({ status: 'aktiv', coordinatorId: 'K2' })
    );
    await assertFails(doc('sponsorA', 'userDirectory/ny.koord@example.com').update({ status: 'aktiv' }));
    await assertSucceeds(
      doc('admin', 'userDirectory/ny.koord@example.com').update({ status: 'sperret' })
    );
    await assertFails(db.doc('userDirectory/ny.koord@example.com').update({ status: 'aktiv' }));
  });
});

describe('Sperret bruker mister tilgang i databasen, ikke bare i appen', () => {
  const sperr = (email: string) =>
    doc('admin', `userDirectory/${email}`).set({ email, status: 'sperret' }, { merge: true });

  it('sperret koordinator kan IKKE lese egne elever lenger', async () => {
    await assertSucceeds(doc('coordA', 'children/C1').get());
    await assertSucceeds(sperr('coord.a@example.com'));
    await assertFails(doc('coordA', 'children/C1').get());
    await assertFails(doc('coordA', 'coordinators/K1').get());
  });

  it('sperret fadder kan IKKE lese eget barn eller egne betalinger', async () => {
    await assertSucceeds(doc('sponsorA', 'payments/P1').get());
    await assertSucceeds(sperr('sponsor.a@example.com'));
    await assertFails(doc('sponsorA', 'payments/P1').get());
    await assertFails(doc('sponsorA', 'children/C1').get());
  });

  it('sperret admin (ikke bootstrap) mister admin-tilgang', async () => {
    await assertSucceeds(doc('admin', 'payments/P2').get());
    await assertSucceeds(doc('bootstrap', 'userDirectory/admin@example.com').set({ status: 'sperret' }));
    await assertFails(doc('admin', 'payments/P2').get());
  });

  it('aktiv status og manglende rad gir fortsatt vanlig tilgang', async () => {
    await assertSucceeds(
      doc('admin', 'userDirectory/coord.a@example.com').set({ email: 'coord.a@example.com', status: 'aktiv' })
    );
    await assertSucceeds(doc('coordA', 'children/C1').get());
    await assertSucceeds(doc('coordB', 'children/C2').get());
  });
});
