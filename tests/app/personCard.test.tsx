// @vitest-environment jsdom
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { logForPerson } from '../../src/utils/personLog';
import { makeChild, makeCoordinator, makeSponsor } from '../../src/test/testData';
import { mountApp, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

const kari = { type: 'coordinator' as const, id: 'k1', navn: 'Kari Nordmann' };
const ola = { type: 'sponsor' as const, id: 's1', navn: 'Fadder Ett' };

const setup = () =>
  mountApp({
    coordinators: [makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'Nordmann', telefon: '111' })],
    sponsors: [makeSponsor({ id: 's1', navn: 'Fadder Ett' })],
    children: [makeChild({ id: 'c1', koordinatorId: 'k1', tildeltFadderId: undefined })],
  });

describe('personkort: data og handlinger', () => {
  it('updateCoordinator endrer feltet, ignorerer id-endring og logger med subject', () => {
    const m = setup();
    m.run((a) => a.updateCoordinator('k1', { telefon: '456', id: 'annen' } as never));

    expect(m.app.coordinators.map((c) => c.id)).toEqual(['k1']);
    expect(m.app.coordinators[0].telefon).toBe('456');
    const logg = logForPerson(m.app.auditLogs, kari);
    expect(logg).toHaveLength(1);
    expect(logg[0]).toMatchObject({
      handling: 'Endret opplysninger',
      gjelderType: 'coordinator',
      gjelderId: 'k1',
      gjelderNavn: 'Kari Nordmann',
    });
    expect(logg[0].detaljer).toContain('telefon: 111 → 456');
    expect(logg[0].detaljer).not.toContain('annen');
  });

  it('updateSponsor logger ikke når ingenting endres', () => {
    const m = setup();
    m.run((a) => a.updateSponsor('s1', { navn: 'Fadder Ett' }));
    expect(logForPerson(m.app.auditLogs, ola)).toHaveLength(0);
  });

  it('to logger i samme millisekund får ulike id-er', () => {
    const m = setup();
    m.run((a) => {
      a.addAuditLog('Første', '1');
      a.addAuditLog('Andre', '2');
    });
    const ids = m.app.auditLogs.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('addPersonComment ignorerer tomt, trimmer og lagrer kommentar', () => {
    const m = setup();
    m.run((a) => a.addPersonComment(kari, '   '));
    expect(logForPerson(m.app.auditLogs, kari)).toHaveLength(0);

    m.run((a) => a.addPersonComment(kari, '  Ring tilbake i uke 44  '));
    const [k] = logForPerson(m.app.auditLogs, kari);
    expect(k).toMatchObject({ handling: 'Kommentar', detaljer: 'Ring tilbake i uke 44', type: 'kommentar' });
  });

  it('deactivatePerson og reactivatePerson (uten Firestore) endrer status og logger', async () => {
    const m = setup();
    // Koordinatoren med aktiv elev kan ikke arkiveres; eleven settes avsluttet først.
    m.run((a) => a.updateChild('c1', { status: 'avsluttet' }));
    await act(async () => {
      await m.app.deactivatePerson(kari);
    });
    expect(m.app.coordinators[0].aktiv).toBe(false);
    expect(logForPerson(m.app.auditLogs, kari)[0].handling).toBe('Avsluttet');

    await act(async () => {
      await m.app.reactivatePerson(kari);
    });
    expect(m.app.coordinators[0].aktiv).toBe(true);
    expect(logForPerson(m.app.auditLogs, kari)[0].handling).toBe('Gjenåpnet');
  });

  it('fadder avsluttes med dato og gjenåpnes ved å fjerne datoen', async () => {
    const m = setup();
    await act(async () => {
      await m.app.deactivatePerson(ola);
    });
    expect(m.app.sponsors[0].avsluttet).toBeTruthy();
    await act(async () => {
      await m.app.reactivatePerson(ola);
    });
    expect(m.app.sponsors[0].avsluttet).toBeUndefined();
    expect('avsluttet' in m.app.sponsors[0]).toBe(false);
  });

  it('deletePerson blokkeres ved feil navn og ved koblinger', async () => {
    const m = setup();
    await expect(m.app.deletePerson(kari, 'Kari')).rejects.toThrow(/fullt navn/);
    await expect(m.app.deletePerson(kari, 'Kari Nordmann')).rejects.toThrow(
      'Kan ikke slette: 1 barn er koblet til personen. Flytt eller avslutt dem først.'
    );
    expect(m.app.coordinators).toHaveLength(1);
  });

  it('deletePerson fjerner personen når den ikke har koblinger, og loggen består', async () => {
    const m = setup();
    await act(async () => {
      await m.app.deletePerson(ola, 'Fadder Ett');
    });
    expect(m.app.sponsors.map((s) => s.id)).not.toContain('s1');
    const logg = logForPerson(m.app.auditLogs, ola);
    expect(logg[0]).toMatchObject({ handling: 'Slettet', gjelderNavn: 'Fadder Ett' });
  });

  it('administratorer kan ikke slettes eller avsluttes i personkortet', async () => {
    const m = setup();
    const admin = { type: 'admin' as const, id: 'a@example.no', navn: 'a' };
    await expect(m.app.deletePerson(admin, 'a')).rejects.toThrow('Administratorer kan ikke slettes her.');
    await expect(m.app.deactivatePerson(admin)).rejects.toThrow('Administratorer kan ikke slettes her.');
    await act(async () => {
      m.app.addPersonComment(admin, 'Kommentar til admin');
    });
    expect(logForPerson(m.app.auditLogs, admin)).toHaveLength(1);
  });
});
