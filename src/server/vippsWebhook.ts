import type { VippsAgreementStatus } from '../types';

export const VIPPS_RECURRING_EVENTS = [
  'recurring.agreement-activated.v1',
  'recurring.agreement-rejected.v1',
  'recurring.agreement-stopped.v1',
  'recurring.agreement-expired.v1',
  'recurring.charge-captured.v1',
  'recurring.charge-failed.v1',
  'recurring.charge-canceled.v1',
  'recurring.charge-refunded.v1',
  'recurring.charge-creation-failed.v1',
] as const;

export type VippsRecurringEventName = (typeof VIPPS_RECURRING_EVENTS)[number];

export interface VippsWebhookEvent {
  id: string;
  eventType: string;
  agreementId?: string;
  chargeId?: string;
  orderId?: string;
}

export function parseVippsWebhookBody(body: unknown): VippsWebhookEvent | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const id = String(o.id ?? o.eventId ?? '');
  const eventType = String(o.eventType ?? o.name ?? '');
  if (!id || !eventType) return null;
  const agreementId = o.agreementId ? String(o.agreementId) : undefined;
  const chargeId = o.chargeId ? String(o.chargeId) : undefined;
  const orderId = o.orderId ? String(o.orderId) : undefined;
  return { id, eventType, agreementId, chargeId, orderId };
}

export function agreementStatusFromEvent(eventType: string): VippsAgreementStatus | null {
  if (eventType === 'recurring.agreement-activated.v1') return 'ACTIVE';
  if (eventType === 'recurring.agreement-stopped.v1') return 'STOPPED';
  if (eventType === 'recurring.agreement-expired.v1') return 'EXPIRED';
  if (eventType === 'recurring.agreement-rejected.v1') return 'STOPPED';
  return null;
}

export function isChargeEvent(eventType: string): boolean {
  return eventType.startsWith('recurring.charge-');
}

/** Enkel HMAC-sjekk når secret er satt (testmiljø kan hoppe over). */
export function verifyWebhookAuth(
  headers: Record<string, string | string[] | undefined>,
  secret?: string
): boolean {
  if (!secret) return true;
  const auth = headers.authorization ?? headers.Authorization;
  if (typeof auth === 'string' && auth === `Bearer ${secret}`) return true;
  return false;
}
