import { describe, expect, it } from 'vitest';
import { makePayment } from '../test/testData';
import { paymentTotals, paymentsInRange, sortPayments } from './paymentRegister';

const payments = [
  makePayment({ id: 'p1', type: 'aksjon', belop: 3000, dato: '2026-10-05', status: 'avstemt' }),
  makePayment({ id: 'p2', type: 'aksjon', belop: 1500, dato: '2026-09-20', status: 'fullfort' }),
  makePayment({ id: 'p3', type: 'fadderbidrag', belop: 250, dato: '2026-10-10', status: 'fullfort' }),
  makePayment({ id: 'p4', type: 'fadderbidrag', belop: 1050, dato: '2026-10-12', status: 'avstemt' }),
];

describe('paymentRegister', () => {
  it('sums payments by type from the ledger', () => {
    const { aksjon, fadder, avstemmingsgrad } = paymentTotals(payments);
    expect(aksjon).toBe(4500);
    expect(fadder).toBe(1300);
    expect(avstemmingsgrad).toBe(Math.round((4050 / 5800) * 100));
  });

  it('has no reconciliation rate for an empty ledger', () => {
    expect(paymentTotals([]).avstemmingsgrad).toBeNull();
  });

  it('filters by inclusive date range', () => {
    const oct = paymentsInRange(payments, '2026-10-01', '2026-10-31');
    expect(oct.every((p) => p.dato.startsWith('2026-10'))).toBe(true);
    expect(oct.find((p) => p.id === 'p2')).toBeUndefined();
  });

  it('sorts by amount', () => {
    const sorted = sortPayments(payments, 'belop', 'desc');
    expect(sorted[0].belop).toBe(3000);
    expect(sorted[sorted.length - 1].belop).toBe(250);
  });
});
