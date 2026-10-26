import { describe, expect, it } from 'vitest';
import { makeChild, makeSponsor } from '../test/testData';
import {
  buildPaymentAllocations,
  chargeIdempotencyKey,
  krToOre,
  paymentIdFromChargeOrder,
  reconciliationKpis,
  sponsorMayStartNewVippsAgreement,
} from './paymentLedger';
import { bookPaymentFromVerifiedCharge } from '../server/paymentBooking';

describe('paymentLedger', () => {
  it('converts kr to whole øre', () => {
    expect(krToOre(250)).toBe(25000);
    expect(krToOre(350.5)).toBe(35050);
  });

  it('allocates evenly to children with buffer remainder', () => {
    const sponsor = makeSponsor({ id: 's1' });
    const child = makeChild({ id: 'c1', koordinatorId: 'k1' });
    const paymentId = paymentIdFromChargeOrder('ord-1');
    const rows = buildPaymentAllocations({
      paymentId,
      sponsorId: 's1',
      periode: '2026-10',
      amountOre: 25000,
      assignments: [
        {
          id: 'a1',
          sponsorId: 's1',
          childId: 'c1',
          koordinatorId: 'k1',
          startDato: '2026-01-01',
          andelOre: 25000,
        },
      ],
      childrenById: new Map([['c1', child]]),
      onDate: '2026-10-15',
    });
    expect(rows.reduce((s, r) => s + r.amountOre, 0)).toBe(25000);
    expect(rows.find((r) => r.maal === 'barn')?.childId).toBe('c1');
  });

  it('sends full amount to buffer without assignments', () => {
    const rows = buildPaymentAllocations({
      paymentId: 'pay_x',
      sponsorId: 's1',
      periode: '2026-10',
      amountOre: 35000,
      assignments: [],
      childrenById: new Map(),
      onDate: '2026-10-01',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].maal).toBe('buffer');
    expect(rows[0].amountOre).toBe(35000);
  });

  it('uses stable idempotency keys per sponsor and month', () => {
    expect(chargeIdempotencyKey('s1', '2026-11')).toBe('chg_s1_2026-11');
  });

  it('blocks new agreement while ACTIVE', () => {
    expect(sponsorMayStartNewVippsAgreement(makeSponsor({ vippsAgreementStatus: 'ACTIVE' }))).toBe(false);
    expect(sponsorMayStartNewVippsAgreement(makeSponsor({ vippsAgreementStatus: 'STOPPED' }))).toBe(true);
  });

  it('books exactly one payment row when CHARGED', () => {
    const sponsor = makeSponsor({ id: 's1', navn: 'Ola' });
    const child = makeChild({ id: 'c1' });
    const charge = {
      id: 'ord-99',
      agreementId: 'agr-1',
      sponsorId: 's1',
      periode: '2026-10',
      amountOre: 25000,
      due: '2026-10-15',
      status: 'PENDING' as const,
      idempotencyKey: 'chg_s1_2026-10',
    };
    const booked = bookPaymentFromVerifiedCharge({
      charge,
      vippsCharge: {
        id: 'ord-99',
        status: 'CHARGED',
        amount: 25000,
        due: '2026-10-15',
        agreementId: 'agr-1',
      },
      sponsor,
      assignments: [],
      children: [child],
      sponsorNavn: sponsor.navn,
      processedEventIds: new Set(),
      eventId: 'evt-1',
    });
    expect(booked?.payment.id).toBe('pay_ord-99');
    expect(booked?.payment.status).toBe('fullfort');
    expect(booked?.allocations.reduce((s, a) => s + a.amountOre, 0)).toBe(25000);
  });

  it('computes reconciliation KPIs for a period', () => {
    const kpis = reconciliationKpis({
      charges: [
        {
          id: 'o1',
          agreementId: 'a',
          sponsorId: 's1',
          periode: '2026-10',
          amountOre: 25000,
          due: '2026-10-10',
          status: 'DUE',
          idempotencyKey: 'k1',
        },
        {
          id: 'o2',
          agreementId: 'a',
          sponsorId: 's1',
          periode: '2026-10',
          amountOre: 25000,
          due: '2026-10-12',
          status: 'CHARGED',
          idempotencyKey: 'k2',
        },
      ],
      allocations: [
        {
          id: 'p1_b',
          paymentId: 'pay_o2',
          sponsorId: 's1',
          maal: 'buffer',
          periode: '2026-10',
          amountOre: 25000,
        },
      ],
      payments: [
        {
          id: 'pay_o2',
          fadderId: 's1',
          fadderNavn: 'Ola',
          belop: 250,
          amountOre: 25000,
          chargeOrderId: 'o2',
          kilde: 'vipps',
          periode: '2026-10',
          dato: '2026-10-12',
          type: 'fadderbidrag',
          metode: 'vipps',
          status: 'avstemt',
          referanse: 'o2',
        },
      ],
      periode: '2026-10',
    });
    expect(kpis.forventetOre).toBe(25000);
    expect(kpis.trukketOre).toBe(25000);
    expect(kpis.fordeltOre).toBe(25000);
    expect(kpis.avstemtOre).toBe(25000);
  });
});
