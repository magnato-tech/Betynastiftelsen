// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fakeSync } from './fakeSync';
import { mountApp, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

const adminProfile = { role: 'admin', displayName: 'Kari Admin', email: 'kari@test.no' };
const sponsors = [
  { id: 's1', navn: 'Ola Nordmann', epost: 'ola@test.no', telefon: '', poststed: '', maanedsbelop: 250, betalingsmetode: 'bank' },
  { id: 's2', navn: 'Per Hansen', epost: 'per@test.no', telefon: '', poststed: '', maanedsbelop: 350, betalingsmetode: 'bank' },
];

describe('admin som ser som fadder eller koordinator', () => {
  it('blir skrivebeskyttet, loggfører hvem som ses, og slår på lagring igjen ved retur', () => {
    const m = mountApp({ sponsors }, undefined, { profile: adminProfile });
    expect(m.app.isViewingAs).toBe(false);

    m.run((a) => a.setRole('sponsor'));
    expect(m.app.isViewingAs).toBe(true);
    expect(m.app.firestoreReadOnly).toBe(true);

    m.run((a) => a.setCurrentSponsorId('s1'));
    const logg = m.app.auditLogs.filter((l) => l.handling === 'Så siden som fadder');
    expect(logg).toHaveLength(1);
    expect(logg[0].detaljer).toBe('Ola Nordmann (s1)');
    expect(logg[0].brukerRolle).toBe('Administrator (Norge)');
    expect(logg[0].brukerNavn).toBe('Kari Admin');

    m.run((a) => a.setCurrentSponsorId('s2'));
    expect(m.app.auditLogs.filter((l) => l.handling === 'Så siden som fadder')).toHaveLength(2);

    m.run((a) => a.setRole('admin'));
    expect(m.app.isViewingAs).toBe(false);
    expect(m.app.firestoreReadOnly).toBe(false);
    expect(fakeSync.readOnlyCalls).toEqual(['enter', 'exit']);
  });

  it('gir ingen skrivebeskyttelse for offentlig visning', () => {
    const m = mountApp({ sponsors }, undefined, { profile: adminProfile });
    m.run((a) => a.setRole('public'));
    expect(m.app.isViewingAs).toBe(false);
    expect(fakeSync.readOnlyCalls).toEqual([]);
  });
});
