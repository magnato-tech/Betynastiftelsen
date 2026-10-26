// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { makeCoordinator, makeReport } from '../../src/test/testData';
import { mountApp, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

const adminVarsel = (id: string, relatedEntityId: string) => ({
  id,
  targetRole: 'admin',
  title: 'Ny feltrapport krever godkjenning',
  message: 'Test',
  timestamp: '2026-10-16 10:00',
  type: 'report_needs_approval',
  read: false,
  actionSection: 'godkjenning',
  relatedEntityId,
});

const world = () => ({
  coordinators: [makeCoordinator({ id: 'k1' })],
  reports: [makeReport({ id: 'r1', status: 'innsendt' }), makeReport({ id: 'r2', status: 'innsendt' })],
  notifications: [adminVarsel('n-r1', 'r1'), adminVarsel('n-r2', 'r2')],
});

describe('Varsler om rapporter ved godkjenning', () => {
  it('approveReport markerer admin-varsler om rapporten som lest, og sletter dem ikke', () => {
    const m = mountApp(world());
    m.run((a) => a.approveReport('r1'));
    const n1 = m.app.notifications.find((n) => n.id === 'n-r1');
    const n2 = m.app.notifications.find((n) => n.id === 'n-r2');
    expect(n1?.read).toBe(true);
    expect(n2?.read).toBe(false);
    expect(m.app.notifications.some((n) => n.id === 'n-r1')).toBe(true);
  });

  it('rejectReport markerer admin-varsler om rapporten som lest', () => {
    const m = mountApp(world());
    m.run((a) => a.rejectReport('r2', 'Mangler detaljer'));
    expect(m.app.notifications.find((n) => n.id === 'n-r2')?.read).toBe(true);
    expect(m.app.notifications.find((n) => n.id === 'n-r1')?.read).toBe(false);
  });
});
