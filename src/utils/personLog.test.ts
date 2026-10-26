import { describe, expect, it } from 'vitest';
import type { AuditLogItem } from '../types';
import { coordinatorSubject, logForPerson, sponsorSubject } from './personLog';

const logg = (over: Partial<AuditLogItem> & { id: string }): AuditLogItem => ({
  tidspunkt: '2026-10-01 10:00',
  brukerRolle: 'Administrator (Norge)',
  brukerNavn: 'Admin',
  handling: 'Test',
  detaljer: '',
  ...over,
});

describe('logForPerson', () => {
  it('returnerer bare oppføringer for den aktuelle personen', () => {
    const logs = [
      logg({ id: 'a', gjelderType: 'coordinator', gjelderId: 'k1' }),
      logg({ id: 'b', gjelderType: 'sponsor', gjelderId: 'k1' }),
      logg({ id: 'c', gjelderType: 'coordinator', gjelderId: 'k2' }),
      logg({ id: 'd' }),
    ];
    expect(logForPerson(logs, { type: 'coordinator', id: 'k1', navn: 'Kari' }).map((l) => l.id)).toEqual(['a']);
  });

  it('sorterer nyest først: tidspunkt synkende, deretter id synkende', () => {
    const logs = [
      logg({ id: 'log-1', tidspunkt: '2026-10-01 09:00', gjelderType: 'sponsor', gjelderId: 's1' }),
      logg({ id: 'log-2', tidspunkt: '2026-10-02 08:00', gjelderType: 'sponsor', gjelderId: 's1' }),
      logg({ id: 'log-3', tidspunkt: '2026-10-02 08:00', gjelderType: 'sponsor', gjelderId: 's1' }),
    ];
    const ids = logForPerson(logs, { type: 'sponsor', id: 's1', navn: 'Fadder' }).map((l) => l.id);
    expect(ids).toEqual(['log-3', 'log-2', 'log-1']);
  });

  it('muterer ikke innsendt liste', () => {
    const logs = [
      logg({ id: 'x', tidspunkt: '2026-10-01 09:00', gjelderType: 'admin', gjelderId: 'a@x.no' }),
      logg({ id: 'y', tidspunkt: '2026-10-03 09:00', gjelderType: 'admin', gjelderId: 'a@x.no' }),
    ];
    logForPerson(logs, { type: 'admin', id: 'a@x.no', navn: 'A' });
    expect(logs.map((l) => l.id)).toEqual(['x', 'y']);
  });

  it('gamle oppføringer uten gjelder-felt havner ikke på personkort', () => {
    expect(logForPerson([logg({ id: 'gammel' })], { type: 'coordinator', id: 'k1', navn: 'K' })).toEqual([]);
  });
});

describe('subject-hjelpere', () => {
  it('bygger navn fra koordinator og fadder', () => {
    expect(coordinatorSubject({ id: 'k1', fornavn: 'Kari', etternavn: 'Nordmann' })).toEqual({
      type: 'coordinator',
      id: 'k1',
      navn: 'Kari Nordmann',
    });
    expect(sponsorSubject({ id: 's1', navn: 'Fadder Ett' })).toEqual({ type: 'sponsor', id: 's1', navn: 'Fadder Ett' });
  });
});
