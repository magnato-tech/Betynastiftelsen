import type {
  Child,
  PaymentAllocation,
  PaymentRecord,
  RecurringCharge,
  Sponsor,
  SponsorAssignment,
} from '../types';
import {
  buildPaymentAllocations,
  mapVippsChargeToPaymentStatus,
  paymentIdFromChargeOrder,
} from '../utils/paymentLedger';
import type { VippsChargeDetails } from './vippsRecurringClient';

export interface BookingInput {
  charge: RecurringCharge;
  vippsCharge: VippsChargeDetails;
  sponsor: Sponsor;
  assignments: SponsorAssignment[];
  children: Child[];
  existingPayment?: PaymentRecord;
  sponsorNavn: string;
  processedEventIds: Set<string>;
  eventId?: string;
}

export interface BookingResult {
  payment: PaymentRecord;
  allocations: PaymentAllocation[];
  chargePatch: Partial<RecurringCharge>;
  skippedDuplicateEvent: boolean;
}

export function refundertOreFromVipps(vippsCharge: VippsChargeDetails, amountOre: number): number {
  if (vippsCharge.status === 'REFUNDED') return amountOre;
  if (vippsCharge.status === 'PARTIALLY_REFUNDED') {
    return Math.floor(amountOre / 2);
  }
  return 0;
}

export function bookPaymentFromVerifiedCharge(input: BookingInput): BookingResult | null {
  if (input.eventId && input.processedEventIds.has(input.eventId)) {
    return {
      payment: input.existingPayment ?? placeholderPayment(input),
      allocations: [],
      chargePatch: { status: input.vippsCharge.status },
      skippedDuplicateEvent: true,
    };
  }

  const refundertOre = refundertOreFromVipps(input.vippsCharge, input.charge.amountOre);
  const status = mapVippsChargeToPaymentStatus(
    input.vippsCharge.status,
    refundertOre,
    input.charge.amountOre
  );

  if (status === 'forventet' && input.vippsCharge.status !== 'CHARGED') {
    return {
      payment: {
        id: paymentIdFromChargeOrder(input.charge.id),
        fadderId: input.sponsor.id,
        fadderNavn: input.sponsorNavn,
        belop: input.charge.amountOre / 100,
        amountOre: input.charge.amountOre,
        refundertOre,
        chargeOrderId: input.charge.id,
        agreementId: input.charge.agreementId,
        periode: input.charge.periode,
        kilde: 'vipps',
        dato: input.charge.due.slice(0, 10),
        type: 'fadderbidrag',
        metode: 'vipps',
        status: 'forventet',
        referanse: input.charge.id,
      },
      allocations: [],
      chargePatch: { status: input.vippsCharge.status },
      skippedDuplicateEvent: false,
    };
  }

  if (input.vippsCharge.status !== 'CHARGED' && input.vippsCharge.status !== 'REFUNDED' && input.vippsCharge.status !== 'PARTIALLY_REFUNDED') {
    return null;
  }

  const paymentId = paymentIdFromChargeOrder(input.charge.id);
  const childrenById = new Map(input.children.map((c) => [c.id, c]));
  const allocations = buildPaymentAllocations({
    paymentId,
    sponsorId: input.sponsor.id,
    periode: input.charge.periode,
    amountOre: input.charge.amountOre,
    assignments: input.assignments,
    childrenById,
    onDate: input.charge.due,
  });

  const payment: PaymentRecord = {
    id: paymentId,
    fadderId: input.sponsor.id,
    fadderNavn: input.sponsorNavn,
    belop: input.charge.amountOre / 100,
    amountOre: input.charge.amountOre,
    refundertOre,
    chargeOrderId: input.charge.id,
    agreementId: input.charge.agreementId,
    periode: input.charge.periode,
    kilde: 'vipps',
    dato: new Date().toISOString().slice(0, 10),
    type: 'fadderbidrag',
    metode: 'vipps',
    status,
    referanse: input.charge.id,
  };

  return {
    payment,
    allocations,
    chargePatch: { status: input.vippsCharge.status },
    skippedDuplicateEvent: false,
  };
}

function placeholderPayment(input: BookingInput): PaymentRecord {
  return {
    id: paymentIdFromChargeOrder(input.charge.id),
    fadderId: input.sponsor.id,
    fadderNavn: input.sponsorNavn,
    belop: input.charge.amountOre / 100,
    amountOre: input.charge.amountOre,
    chargeOrderId: input.charge.id,
    agreementId: input.charge.agreementId,
    periode: input.charge.periode,
    kilde: 'vipps',
    dato: input.charge.due.slice(0, 10),
    type: 'fadderbidrag',
    metode: 'vipps',
    status: 'forventet',
    referanse: input.charge.id,
  };
}
