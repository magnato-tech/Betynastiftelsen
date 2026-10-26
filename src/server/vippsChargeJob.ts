import type { RecurringCharge, Sponsor, VippsChargeJobStatus } from '../types';
import {
  chargeIdempotencyKey,
  chargeOrderIdForPeriod,
  krToOre,
} from '../utils/paymentLedger';
import type { VippsEnv } from './vippsConfig';
import { createVippsCharge, type FetchFn } from './vippsRecurringClient';

export interface ChargeJobSponsorInput {
  sponsor: Sponsor;
  existingChargeForPeriod?: RecurringCharge;
}

export interface PlannedCharge {
  orderId: string;
  sponsorId: string;
  agreementId: string;
  periode: string;
  amountOre: number;
  due: string;
  idempotencyKey: string;
  skipped: boolean;
  reason?: string;
}

export function dueDateAtLeastOneDayAhead(from: Date = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + 2);
  return d.toISOString().slice(0, 10);
}

export function currentPeriode(from: Date = new Date()): string {
  const y = from.getUTCFullYear();
  const m = String(from.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function planMonthlyCharges(
  sponsors: ChargeJobSponsorInput[],
  periode: string,
  due: string
): PlannedCharge[] {
  return sponsors.map(({ sponsor, existingChargeForPeriod }) => {
    if (sponsor.betalingsmetode !== 'vipps' || sponsor.vippsAgreementStatus !== 'ACTIVE') {
      return {
        orderId: '',
        sponsorId: sponsor.id,
        agreementId: sponsor.vippsAgreementId ?? '',
        periode,
        amountOre: 0,
        due,
        idempotencyKey: '',
        skipped: true,
        reason: 'ingen_aktiv_vipps_avtale',
      };
    }
    if (!sponsor.vippsAgreementId) {
      return {
        orderId: '',
        sponsorId: sponsor.id,
        agreementId: '',
        periode,
        amountOre: 0,
        due,
        idempotencyKey: '',
        skipped: true,
        reason: 'mangler_agreement_id',
      };
    }
    if (existingChargeForPeriod) {
      return {
        orderId: existingChargeForPeriod.id,
        sponsorId: sponsor.id,
        agreementId: sponsor.vippsAgreementId,
        periode,
        amountOre: existingChargeForPeriod.amountOre,
        due: existingChargeForPeriod.due,
        idempotencyKey: existingChargeForPeriod.idempotencyKey,
        skipped: true,
        reason: 'finnes_allerede',
      };
    }
    const orderId = chargeOrderIdForPeriod(sponsor.vippsAgreementId, periode);
    const amountOre = krToOre(sponsor.maanedsbelop);
    return {
      orderId,
      sponsorId: sponsor.id,
      agreementId: sponsor.vippsAgreementId,
      periode,
      amountOre,
      due,
      idempotencyKey: chargeIdempotencyKey(sponsor.id, periode),
      skipped: false,
    };
  });
}

export async function runChargeJob(
  cfg: VippsEnv,
  planned: PlannedCharge[],
  fetchImpl: FetchFn = fetch
): Promise<{ created: number; failed: number; charges: RecurringCharge[] }> {
  let created = 0;
  let failed = 0;
  const charges: RecurringCharge[] = [];

  for (const row of planned) {
    if (row.skipped) continue;
    try {
      await createVippsCharge(
        cfg,
        row.agreementId,
        {
          amountOre: row.amountOre,
          due: row.due,
          orderId: row.orderId,
          idempotencyKey: row.idempotencyKey,
          description: `Fadderbidrag ${row.periode}`,
        },
        fetchImpl
      );
      created += 1;
      charges.push({
        id: row.orderId,
        agreementId: row.agreementId,
        sponsorId: row.sponsorId,
        periode: row.periode,
        amountOre: row.amountOre,
        due: row.due,
        status: 'PENDING',
        idempotencyKey: row.idempotencyKey,
      });
    } catch {
      failed += 1;
    }
  }
  return { created, failed, charges };
}

export function buildChargeJobStatus(
  created: number,
  failed: number,
  melding?: string
): VippsChargeJobStatus {
  return {
    sistKjort: new Date().toISOString(),
    opprettet: created,
    feilet: failed,
    melding,
  };
}
