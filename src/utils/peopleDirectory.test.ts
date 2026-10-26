import { describe, expect, it } from 'vitest';
import type { Coordinator, Sponsor } from '../types';
import { buildPeopleRows, type DirectoryRow } from './peopleDirectory';

const coord = (p: Partial<Coordinator> & { id: string; fornavn: string; etternavn: string }): Coordinator =>
  ({ epost: '', telefon: '', distrikt: '', aktiv: true, ...p }) as Coordinator;

const sponsor = (p: Partial<Sponsor> & { id: string; navn: string }): Sponsor =>
  ({ epost: '', telefon: '', poststed: '', maanedsbelop: 250, startDato: '2026-01-01', ...p }) as Sponsor;

describe('buildPeopleRows', () => {
  it('uinvitert koordinator og fadder vises som ikke-invitert', () => {
    const rows = buildPeopleRows(
      [],
      [coord({ id: 'c1', fornavn: 'Kari', etternavn: 'Nordmann', epost: 'Kari@Example.no', distrikt: 'Nord' })],
      [sponsor({ id: 's1', navn: 'Ola Hansen', epost: '' })],
      []
    );
    const k = rows.find((r) => r.coordinatorId === 'c1');
    expect(k).toMatchObject({
      key: 'coord:c1',
      name: 'Kari Nordmann',
      email: 'kari@example.no',
      role: 'coordinator',
      loginStatus: 'ikke-invitert',
      distrikt: 'Nord',
      isBootstrapOnly: false,
    });
    const s = rows.find((r) => r.sponsorId === 's1');
    expect(s).toMatchObject({ key: 'sponsor:s1', name: 'Ola Hansen', email: '', role: 'sponsor', loginStatus: 'ikke-invitert' });
    expect(rows).toHaveLength(2);
  });

  it('invitert koordinator kobles via coordinatorId og vises én gang', () => {
    const dir: DirectoryRow[] = [
      { id: 'kari@example.no', email: 'kari@example.no', role: 'coordinator', status: 'invitert', coordinatorId: 'c1' },
    ];
    const rows = buildPeopleRows(dir, [coord({ id: 'c1', fornavn: 'Kari', etternavn: 'Nordmann' })], [], []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      key: 'dir:kari@example.no',
      name: 'Kari Nordmann',
      loginStatus: 'invitert',
      coordinatorId: 'c1',
    });
    expect(rows[0].directory).toEqual(dir[0]);
  });

  it('invitert fadder kobles via e-post (case-insensitivt) og vises én gang', () => {
    const dir: DirectoryRow[] = [
      { id: 'ola@example.no', email: 'Ola@Example.NO', role: 'sponsor', status: 'sperret' },
    ];
    const rows = buildPeopleRows(dir, [], [sponsor({ id: 's1', navn: 'Ola Hansen', epost: ' ola@example.no ' })], []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      key: 'dir:ola@example.no',
      name: 'Ola Hansen',
      loginStatus: 'sperret',
      sponsorId: 's1',
      role: 'sponsor',
    });
  });

  it('displayName har forrang over koblet navn', () => {
    const dir: DirectoryRow[] = [
      { id: 'x@e.no', email: 'x@e.no', role: 'sponsor', displayName: 'Spesial', sponsorId: 's1' },
    ];
    const rows = buildPeopleRows(dir, [], [sponsor({ id: 's1', navn: 'Ola' })], []);
    expect(rows[0].name).toBe('Spesial');
  });

  it('bootstrap-admin uten rad legges til én gang og er aktiv', () => {
    const rows = buildPeopleRows([], [], [], ['Boss@Example.no', 'boss@example.no']);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      key: 'dir:boss@example.no',
      name: 'boss',
      role: 'admin',
      loginStatus: 'aktiv',
      isBootstrapOnly: true,
    });
    expect(rows[0].directory).toBeUndefined();
  });

  it('bootstrap-admin med egen rad er ikke bootstrap-only', () => {
    const dir: DirectoryRow[] = [{ id: 'boss@example.no', email: 'boss@example.no', role: 'admin', status: 'sperret' }];
    const rows = buildPeopleRows(dir, [], [], ['boss@example.no']);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ loginStatus: 'sperret', isBootstrapOnly: false });
  });

  it('sorterer etter rolle (admin, koordinator, fadder) og deretter navn', () => {
    const rows = buildPeopleRows(
      [{ id: 'z@e.no', email: 'z@e.no', role: 'sponsor', displayName: 'Zeta' }],
      [
        coord({ id: 'c2', fornavn: 'Øystein', etternavn: 'Berg' }),
        coord({ id: 'c1', fornavn: 'Anne', etternavn: 'Berg' }),
      ],
      [sponsor({ id: 's1', navn: 'Bjørn' }), sponsor({ id: 's2', navn: 'Åse' })],
      ['admin@e.no']
    );
    expect(rows.map((r) => r.role)).toEqual([
      'admin',
      'coordinator',
      'coordinator',
      'sponsor',
      'sponsor',
      'sponsor',
    ]);
    expect(rows.filter((r) => r.role === 'coordinator').map((r) => r.name)).toEqual(['Anne Berg', 'Øystein Berg']);
    expect(rows.filter((r) => r.role === 'sponsor').map((r) => r.name)).toEqual(['Bjørn', 'Zeta', 'Åse']);
  });

  it('nøklene er unike', () => {
    const rows = buildPeopleRows(
      [{ id: 'a@e.no', email: 'a@e.no', role: 'coordinator', coordinatorId: 'c1' }],
      [coord({ id: 'c1', fornavn: 'A', etternavn: 'B', epost: 'a@e.no' }), coord({ id: 'c2', fornavn: 'C', etternavn: 'D' })],
      [sponsor({ id: 's1', navn: 'E' })],
      []
    );
    const keys = rows.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('archived: koordinator med aktiv=false og fadder med avsluttet er arkivert', () => {
    const rows = buildPeopleRows(
      [],
      [
        coord({ id: 'c1', fornavn: 'Aktiv', etternavn: 'Person', aktiv: true }),
        coord({ id: 'c2', fornavn: 'Inaktiv', etternavn: 'Person', aktiv: false }),
      ],
      [
        sponsor({ id: 's1', navn: 'Aktiv Fadder' }),
        sponsor({ id: 's2', navn: 'Avsluttet Fadder', avsluttet: '2026-05-01' }),
      ],
      []
    );
    const byId = (id: string) => rows.find((r) => r.coordinatorId === id || r.sponsorId === id);
    expect(byId('c1')?.archived).toBe(false);
    expect(byId('c2')?.archived).toBe(true);
    expect(byId('s1')?.archived).toBe(false);
    expect(byId('s2')?.archived).toBe(true);
  });

  it('archived for innloggingsrader følger koblet koordinator/fadder, ikke raden selv', () => {
    const dir: DirectoryRow[] = [
      { id: 'kari@example.no', email: 'kari@example.no', role: 'coordinator', status: 'aktiv', coordinatorId: 'c1' },
      { id: 'ola@example.no', email: 'ola@example.no', role: 'sponsor', status: 'aktiv', sponsorId: 's1' },
      { id: 'ny@example.no', email: 'ny@example.no', role: 'sponsor', status: 'aktiv' },
    ];
    const rows = buildPeopleRows(
      dir,
      [coord({ id: 'c1', fornavn: 'Kari', etternavn: 'Nordmann', aktiv: false })],
      [sponsor({ id: 's1', navn: 'Ola', avsluttet: '2026-01-01' })],
      []
    );
    expect(rows.find((r) => r.email === 'kari@example.no')?.archived).toBe(true);
    expect(rows.find((r) => r.email === 'ola@example.no')?.archived).toBe(true);
    expect(rows.find((r) => r.email === 'ny@example.no')?.archived).toBe(false);
  });

  it('admin-rader er aldri arkivert', () => {
    const rows = buildPeopleRows([], [], [], ['boss@example.no']);
    expect(rows[0].archived).toBe(false);
  });
});
