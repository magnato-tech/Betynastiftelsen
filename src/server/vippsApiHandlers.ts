import type { RecurringCharge, RecurringChargeStatus, Sponsor, VippsAgreementStatus } from '../types';
import { sponsorMayStartNewVippsAgreement } from '../utils/paymentLedger';
import { bookPaymentFromVerifiedCharge } from './paymentBooking';
import {
  buildChargeJobStatus,
  currentPeriode,
  dueDateAtLeastOneDayAhead,
  planMonthlyCharges,
  runChargeJob,
  type ChargeJobSponsorInput,
} from './vippsChargeJob';
import { vippsConfigFromEnv, vippsConfigured } from './vippsConfig';
import {
  createVippsAgreement,
  getVippsAgreement,
  getVippsCharge,
  mockCreateAgreement,
  type FetchFn,
} from './vippsRecurringClient';
import { agreementStatusFromEvent, isChargeEvent, parseVippsWebhookBody, verifyWebhookAuth } from './vippsWebhook';

export interface AgreementRequestBody {
  sponsorId: string;
  amountOre: number;
  phone: string;
  sponsor?: Pick<Sponsor, 'vippsAgreementId' | 'vippsConfirmationUrl' | 'vippsAgreementStatus'>;
}

export async function handleCreateAgreement(
  body: AgreementRequestBody,
  env: Record<string, string>,
  fetchImpl: FetchFn = fetch
): Promise<{ status: number; json: Record<string, unknown> }> {
  if (!vippsConfigured(env)) {
    return { status: 503, json: { ok: false, message: 'Vipps er ikke konfigurert på serveren.' } };
  }
  const { sponsorId, amountOre, phone, sponsor } = body;
  if (!sponsorId || !amountOre || amountOre < 10000 || !phone) {
    return { status: 400, json: { ok: false, message: 'Mangler sponsorId, beløp eller telefon.' } };
  }

  if (
    sponsor?.vippsAgreementStatus === 'PENDING' &&
    sponsor.vippsConfirmationUrl &&
    sponsor.vippsAgreementId
  ) {
    return {
      status: 200,
      json: {
        ok: true,
        redirectUrl: sponsor.vippsConfirmationUrl,
        agreementId: sponsor.vippsAgreementId,
        status: 'PENDING',
      },
    };
  }

  if (sponsor && !sponsorMayStartNewVippsAgreement(sponsor as Sponsor)) {
    return { status: 409, json: { ok: false, message: 'Fadder har allerede en aktiv Vipps-avtale.' } };
  }

  const cfg = vippsConfigFromEnv(env);
  const idempotencyKey = `agr_${sponsorId}_${amountOre}`;
  let agreementId: string;
  let redirectUrl: string;

  if (!cfg || env.VIPPS_MOCK === 'true') {
    const mock = mockCreateAgreement({ amountOre, externalId: sponsorId });
    agreementId = mock.agreementId;
    redirectUrl = mock.vippsConfirmationUrl;
  } else {
    const created = await createVippsAgreement(
      cfg,
      { amountOre, phone, idempotencyKey, externalId: sponsorId },
      fetchImpl
    );
    agreementId = created.agreementId;
    redirectUrl = created.vippsConfirmationUrl;
  }

  return {
    status: 200,
    json: {
      ok: true,
      redirectUrl,
      agreementId,
      status: 'PENDING' as VippsAgreementStatus,
      sponsorPatch: {
        vippsAgreementId: agreementId,
        vippsConfirmationUrl: redirectUrl,
        vippsAgreementStatus: 'PENDING',
      },
    },
  };
}

export async function handleAgreementStatus(
  agreementId: string,
  env: Record<string, string>,
  fetchImpl: FetchFn = fetch
): Promise<{ status: number; json: Record<string, unknown> }> {
  if (!vippsConfigured(env)) {
    return { status: 503, json: { ok: false, message: 'Vipps er ikke konfigurert.' } };
  }
  const cfg = vippsConfigFromEnv(env);
  if (!cfg || env.VIPPS_MOCK === 'true') {
    return { status: 200, json: { ok: true, agreementId, status: 'PENDING' } };
  }
  const details = await getVippsAgreement(cfg, agreementId, fetchImpl);
  return { status: 200, json: { ok: true, agreementId: details.id, status: details.status } };
}

export interface WebhookContext {
  sponsors: Sponsor[];
  charges: RecurringCharge[];
  processedEventIds: Set<string>;
  assignments: import('../types').SponsorAssignment[];
  children: import('../types').Child[];
  payments: import('../types').PaymentRecord[];
}

export async function handleVippsWebhook(
  body: unknown,
  headers: Record<string, string | string[] | undefined>,
  env: Record<string, string>,
  ctx: WebhookContext,
  fetchImpl: FetchFn = fetch
): Promise<{ status: number; json: Record<string, unknown> }> {
  const cfg = vippsConfigFromEnv(env);
  if (!verifyWebhookAuth(headers, cfg?.webhookSecret)) {
    return { status: 401, json: { ok: false, message: 'Webhook ikke autorisert.' } };
  }
  const event = parseVippsWebhookBody(body);
  if (!event) return { status: 400, json: { ok: false, message: 'Ugyldig webhook.' } };

  const writes: Record<string, unknown>[] = [];

  const agreementStatus = agreementStatusFromEvent(event.eventType);
  if (agreementStatus && event.agreementId) {
    if (!cfg || env.VIPPS_MOCK === 'true') {
      writes.push({ collection: 'sponsors', id: 'lookup', patch: { vippsAgreementStatus: agreementStatus } });
    } else {
      const verified = await getVippsAgreement(cfg, event.agreementId, fetchImpl);
      writes.push({
        collection: 'sponsors',
        agreementId: verified.id,
        patch: { vippsAgreementStatus: verified.status },
      });
    }
  }

  if (isChargeEvent(event.eventType) && event.agreementId) {
    const orderId = event.orderId ?? event.chargeId;
    if (!orderId) return { status: 400, json: { ok: false, message: 'Mangler charge-id.' } };
    const charge = ctx.charges.find((c) => c.id === orderId);
    const sponsor = ctx.sponsors.find((s) => s.vippsAgreementId === event.agreementId);
    if (!charge || !sponsor) {
      return { status: 202, json: { ok: true, message: 'Charge eller sponsor ikke funnet lokalt.' } };
    }
    let vippsCharge;
    if (!cfg || env.VIPPS_MOCK === 'true') {
      vippsCharge = {
        id: orderId,
        status: (event.eventType.includes('captured') ? 'CHARGED' : 'FAILED') as RecurringChargeStatus,
        amount: charge.amountOre,
        due: charge.due,
        agreementId: event.agreementId,
      };
    } else {
      vippsCharge = await getVippsCharge(cfg, event.agreementId, orderId, fetchImpl);
    }
    const booked = bookPaymentFromVerifiedCharge({
      charge,
      vippsCharge,
      sponsor,
      assignments: ctx.assignments,
      children: ctx.children,
      sponsorNavn: sponsor.navn,
      processedEventIds: ctx.processedEventIds,
      eventId: event.id,
      existingPayment: ctx.payments.find((p) => p.chargeOrderId === orderId),
    });
    if (booked && !booked.skippedDuplicateEvent) {
      writes.push({ type: 'payment', payment: booked.payment, allocations: booked.allocations });
    }
  }

  return { status: 200, json: { ok: true, eventId: event.id, writes } };
}

export async function handleRunChargeJob(
  body: { sponsors?: ChargeJobSponsorInput[] },
  env: Record<string, string>,
  fetchImpl: FetchFn = fetch
): Promise<{ status: number; json: Record<string, unknown> }> {
  if (!vippsConfigured(env)) {
    return { status: 503, json: { ok: false, message: 'Vipps er ikke konfigurert.' } };
  }
  const cfg = vippsConfigFromEnv(env);
  const periode = currentPeriode();
  const due = dueDateAtLeastOneDayAhead();
  const planned = planMonthlyCharges(body.sponsors ?? [], periode, due);
  if (!cfg || env.VIPPS_MOCK === 'true') {
    const mockCharges = planned.filter((p) => !p.skipped).map((p) => ({
      id: p.orderId,
      agreementId: p.agreementId,
      sponsorId: p.sponsorId,
      periode: p.periode,
      amountOre: p.amountOre,
      due: p.due,
      status: 'PENDING' as const,
      idempotencyKey: p.idempotencyKey,
    }));
    const status = buildChargeJobStatus(mockCharges.length, 0, 'mock');
    return { status: 200, json: { ok: true, planned, charges: mockCharges, job: status } };
  }
  const result = await runChargeJob(cfg, planned, fetchImpl);
  const job = buildChargeJobStatus(result.created, result.failed);
  return { status: 200, json: { ok: true, planned, charges: result.charges, job } };
}
