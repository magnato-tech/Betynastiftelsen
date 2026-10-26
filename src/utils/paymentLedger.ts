import type {
  Child,
  PaymentAllocation,
  PaymentRecord,
  RecurringCharge,
  RecurringChargeStatus,
  Sponsor,
  SponsorAssignment,
} from '../types';

export function krToOre(kr: number): number {
  return Math.round(kr * 100);
}

export function oreToKr(ore: number): number {
  return ore / 100;
}

export function formatOreAsKr(ore: number): string {
  return oreToKr(ore).toLocaleString('no-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Les beløp i kroner — foretrekker amountOre når satt. */
export function paymentAmountKr(payment: PaymentRecord): number {
  if (payment.amountOre != null) return oreToKr(payment.amountOre);
  return payment.belop;
}

export function paymentAmountOre(payment: PaymentRecord): number {
  if (payment.amountOre != null) return payment.amountOre;
  return krToOre(payment.belop);
}

export function netChargedOre(charge: RecurringCharge, refundertOre = 0): number {
  if (charge.status !== 'CHARGED' && charge.status !== 'PARTIALLY_REFUNDED' && charge.status !== 'REFUNDED') {
    return 0;
  }
  return Math.max(0, charge.amountOre - refundertOre);
}

const EXPECTED_CHARGE_STATUSES: RecurringChargeStatus[] = ['PENDING', 'DUE', 'PROCESSING'];

export function sponsorAssignmentId(sponsorId: string, childId: string, startDato: string): string {
  return `asg_${sponsorId}_${childId}_${startDato}`;
}

export function paymentIdFromChargeOrder(orderId: string): string {
  return `pay_${orderId}`;
}

export function allocationDocId(paymentId: string, maalKey: string): string {
  return `${paymentId}_${maalKey}`;
}

/** Aktive tildelinger for fadder på en gitt dato (YYYY-MM-DD eller ISO). */
export function activeAssignmentsForSponsor(
  assignments: SponsorAssignment[],
  sponsorId: string,
  onDate: string
): SponsorAssignment[] {
  const day = onDate.slice(0, 10);
  return assignments.filter((a) => {
    if (a.sponsorId !== sponsorId) return false;
    if (a.startDato > day) return false;
    if (a.sluttDato && a.sluttDato < day) return false;
    return true;
  });
}

/**
 * Fordeler månedlig belastning på barn (lik andel per barn) og felles buffer.
 * Mangler tildelinger → hele beløpet til buffer.
 */
export function buildPaymentAllocations(params: {
  paymentId: string;
  sponsorId: string;
  periode: string;
  amountOre: number;
  assignments: SponsorAssignment[];
  childrenById: Map<string, Child>;
  onDate: string;
}): PaymentAllocation[] {
  const { paymentId, sponsorId, periode, amountOre, assignments, childrenById, onDate } = params;
  const active = activeAssignmentsForSponsor(assignments, sponsorId, onDate);
  if (active.length === 0) {
    return [
      {
        id: allocationDocId(paymentId, 'buffer'),
        paymentId,
        sponsorId,
        maal: 'buffer',
        periode,
        amountOre,
      },
    ];
  }

  const perChild = Math.floor(amountOre / active.length);
  let remainder = amountOre - perChild * active.length;
  const rows: PaymentAllocation[] = [];

  for (const asg of active) {
    const child = childrenById.get(asg.childId);
    const share = perChild + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    rows.push({
      id: allocationDocId(paymentId, `child_${asg.childId}`),
      paymentId,
      sponsorId,
      maal: 'barn',
      childId: asg.childId,
      koordinatorId: child?.koordinatorId ?? asg.koordinatorId,
      periode,
      amountOre: share,
    });
  }

  if (remainder > 0) {
    rows.push({
      id: allocationDocId(paymentId, 'buffer'),
      paymentId,
      sponsorId,
      maal: 'buffer',
      periode,
      amountOre: remainder,
    });
  }

  const sum = rows.reduce((s, r) => s + r.amountOre, 0);
  if (sum !== amountOre) {
    const buf = rows.find((r) => r.maal === 'buffer');
    if (buf) buf.amountOre += amountOre - sum;
    else {
      rows.push({
        id: allocationDocId(paymentId, 'buffer'),
        paymentId,
        sponsorId,
        maal: 'buffer',
        periode,
        amountOre: amountOre - sum,
      });
    }
  }
  return rows;
}

export function chargeOrderIdForPeriod(agreementId: string, periode: string): string {
  const compact = agreementId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
  return `betyna-${periode}-${compact}`;
}

export function chargeIdempotencyKey(sponsorId: string, periode: string): string {
  return `chg_${sponsorId}_${periode}`;
}

export function mapVippsChargeToPaymentStatus(
  status: RecurringChargeStatus,
  refundertOre: number,
  amountOre: number
): PaymentRecord['status'] {
  if (status === 'REFUNDED' || (refundertOre > 0 && refundertOre >= amountOre)) return 'refundert';
  if (status === 'PARTIALLY_REFUNDED' || (refundertOre > 0 && refundertOre < amountOre)) {
    return 'delvis_refundert';
  }
  if (status === 'CHARGED') return 'fullfort';
  if (EXPECTED_CHARGE_STATUSES.includes(status)) return 'forventet';
  return 'forventet';
}

export interface ReconciliationKpis {
  forventetOre: number;
  trukketOre: number;
  fordeltOre: number;
  avstemtOre: number;
  avvikFordelingOre: number;
}

export function reconciliationKpis(params: {
  charges: RecurringCharge[];
  allocations: PaymentAllocation[];
  payments: PaymentRecord[];
  periode?: string;
  sponsorId?: string;
  childId?: string;
}): ReconciliationKpis {
  const { charges, allocations, payments, periode, sponsorId, childId } = params;

  let filteredCharges = charges;
  if (periode) filteredCharges = filteredCharges.filter((c) => c.periode === periode);
  if (sponsorId) filteredCharges = filteredCharges.filter((c) => c.sponsorId === sponsorId);

  let filteredAllocations = allocations;
  if (periode) filteredAllocations = filteredAllocations.filter((a) => a.periode === periode);
  if (sponsorId) filteredAllocations = filteredAllocations.filter((a) => a.sponsorId === sponsorId);
  if (childId) filteredAllocations = filteredAllocations.filter((a) => a.childId === childId);

  const paymentByCharge = new Map(
    payments.filter((p) => p.chargeOrderId).map((p) => [p.chargeOrderId!, p])
  );

  const forventetOre = filteredCharges
    .filter((c) => EXPECTED_CHARGE_STATUSES.includes(c.status))
    .reduce((s, c) => s + c.amountOre, 0);

  const trukketOre = filteredCharges.reduce((s, c) => {
    const pay = paymentByCharge.get(c.id);
    const refund = pay?.refundertOre ?? 0;
    return s + netChargedOre(c, refund);
  }, 0);

  const fordeltOre = filteredAllocations.reduce((s, a) => s + a.amountOre, 0);

  let filteredPayments = payments.filter((p) => p.type === 'fadderbidrag' && p.kilde === 'vipps');
  if (periode) filteredPayments = filteredPayments.filter((p) => p.periode === periode);
  if (sponsorId) filteredPayments = filteredPayments.filter((p) => p.fadderId === sponsorId);
  const avstemtOre = filteredPayments
    .filter((p) => p.status === 'avstemt')
    .reduce((s, p) => s + paymentAmountOre(p), 0);

  return {
    forventetOre,
    trukketOre,
    fordeltOre,
    avstemtOre,
    avvikFordelingOre: trukketOre - fordeltOre,
  };
}

export function sponsorMayStartNewVippsAgreement(sponsor: Sponsor): boolean {
  const st = sponsor.vippsAgreementStatus;
  if (!st) return true;
  return st === 'STOPPED' || st === 'EXPIRED';
}

export function buildAssignmentOnLink(
  sponsor: Sponsor,
  child: Child,
  startDato: string
): SponsorAssignment {
  const andelOre =
    sponsor.tildeltBarnIds.length > 0
      ? Math.floor(krToOre(sponsor.maanedsbelop) / (sponsor.tildeltBarnIds.length + 1))
      : krToOre(sponsor.maanedsbelop);
  return {
    id: sponsorAssignmentId(sponsor.id, child.id, startDato),
    sponsorId: sponsor.id,
    childId: child.id,
    koordinatorId: child.koordinatorId,
    startDato,
    andelOre,
  };
}
