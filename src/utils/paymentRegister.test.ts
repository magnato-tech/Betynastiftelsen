import { describe, expect, it } from 'vitest';
import { INITIAL_PAYMENTS } from '../data/initialData';
import { paymentTotals, paymentsInRange, sortPayments } from './paymentRegister';

describe('paymentRegister', () => {
  it('sums aksjon payments from the ledger, not a typed campaign field', () => {
    const { aksjon, fadder, avstemmingsgrad } = paymentTotals(INITIAL_PAYMENTS);
    expect(aksjon).toBe(4500);
    expect(fadder).toBe(1300);
    expect(avstemmingsgrad).not.toBe(100);
    expect(avstemmingsgrad).toBe(Math.round((2800 / 5800) * 100));
  });

  it('filters by inclusive date range', () => {
    const oct = paymentsInRange(INITIAL_PAYMENTS, '2026-10-01', '2026-10-31');
    expect(oct.every((p) => p.dato.startsWith('2026-10'))).toBe(true);
    expect(oct.find((p) => p.id === 'pay-02')).toBeUndefined();
  });

  it('sorts by amount then date', () => {
    const sorted = sortPayments(INITIAL_PAYMENTS, 'belop', 'desc');
    expect(sorted[0].belop).toBe(3000);
    expect(sorted[sorted.length - 1].belop).toBe(250);
  });
});
