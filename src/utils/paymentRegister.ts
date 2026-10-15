import type { PaymentRecord } from '../types';

export type PaymentSortKey = 'dato' | 'giver' | 'type' | 'metode' | 'referanse' | 'belop' | 'status';
export type PaymentSortDir = 'asc' | 'desc';

export function paymentsInRange(
  payments: PaymentRecord[],
  fromIso: string,
  toIso: string
): PaymentRecord[] {
  return payments.filter((p) => {
    if (fromIso && p.dato < fromIso) return false;
    if (toIso && p.dato > toIso) return false;
    return true;
  });
}

export function sortPayments(
  payments: PaymentRecord[],
  key: PaymentSortKey,
  dir: PaymentSortDir
): PaymentRecord[] {
  const mul = dir === 'asc' ? 1 : -1;
  return [...payments].sort((a, b) => {
    let cmp = 0;
    if (key === 'dato') cmp = a.dato.localeCompare(b.dato);
    else if (key === 'giver') cmp = a.fadderNavn.localeCompare(b.fadderNavn, 'nb');
    else if (key === 'type') cmp = a.type.localeCompare(b.type);
    else if (key === 'metode') cmp = a.metode.localeCompare(b.metode);
    else if (key === 'referanse') cmp = a.referanse.localeCompare(b.referanse);
    else if (key === 'belop') cmp = a.belop - b.belop;
    else cmp = a.status.localeCompare(b.status);
    return cmp * mul || b.dato.localeCompare(a.dato);
  });
}

export function paymentTotals(payments: PaymentRecord[]) {
  const total = payments.reduce((sum, p) => sum + p.belop, 0);
  const aksjon = payments.filter((p) => p.type === 'aksjon').reduce((sum, p) => sum + p.belop, 0);
  const fadder = payments.filter((p) => p.type === 'fadderbidrag').reduce((sum, p) => sum + p.belop, 0);
  const avstemt = payments.filter((p) => p.status === 'avstemt').reduce((sum, p) => sum + p.belop, 0);
  const avstemmingsgrad = total === 0 ? null : Math.round((avstemt / total) * 100);
  return { total, aksjon, fadder, avstemt, avstemmingsgrad };
}
