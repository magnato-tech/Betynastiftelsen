import type { RecurringChargeStatus, VippsAgreementStatus } from '../types';
import type { VippsEnv } from './vippsConfig';

export type FetchFn = typeof fetch;

export interface VippsAccessToken {
  access_token: string;
  expires_in: number;
}

export interface VippsAgreementResponse {
  agreementId: string;
  vippsConfirmationUrl: string;
}

export interface VippsAgreementDetails {
  id: string;
  status: VippsAgreementStatus;
}

export interface VippsChargeDetails {
  id: string;
  status: RecurringChargeStatus;
  amount: number;
  due: string;
  agreementId: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export function resetVippsTokenCache(): void {
  cachedToken = null;
}

export async function getVippsAccessToken(
  cfg: VippsEnv,
  fetchImpl: FetchFn = fetch
): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 5000) {
    return cachedToken.token;
  }
  const res = await fetchImpl(`${cfg.baseUrl}/accesstoken/get`, {
    method: 'POST',
    headers: {
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      'Ocp-Apim-Subscription-Key': cfg.subscriptionKey,
      'Merchant-Serial-Number': cfg.msn,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (!res.ok) {
    throw new Error(`Vipps token feilet (${res.status})`);
  }
  const data = (await res.json()) as VippsAccessToken;
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

function vippsHeaders(cfg: VippsEnv, token: string, idempotencyKey?: string): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': cfg.subscriptionKey,
    'Merchant-Serial-Number': cfg.msn,
  };
  if (idempotencyKey) h['Idempotency-Key'] = idempotencyKey;
  return h;
}

export async function createVippsAgreement(
  cfg: VippsEnv,
  params: {
    amountOre: number;
    phone: string;
    idempotencyKey: string;
    externalId: string;
  },
  fetchImpl: FetchFn = fetch
): Promise<VippsAgreementResponse> {
  const token = await getVippsAccessToken(cfg, fetchImpl);
  const body = {
    pricing: { type: 'LEGACY', amount: params.amountOre, currency: 'NOK' },
    interval: { unit: 'MONTH', count: 1 },
    phoneNumber: params.phone.replace(/\s/g, ''),
    merchantRedirectUrl: cfg.merchantRedirectUrl,
    merchantAgreementUrl: cfg.merchantAgreementUrl,
    externalId: params.externalId,
    productName: 'Fadderbidrag Betyna',
  };
  const res = await fetchImpl(`${cfg.baseUrl}/recurring/v3/agreements`, {
    method: 'POST',
    headers: vippsHeaders(cfg, token, params.idempotencyKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Vipps avtale feilet (${res.status})`);
  }
  const data = (await res.json()) as VippsAgreementResponse;
  if (!data.agreementId || !data.vippsConfirmationUrl) {
    throw new Error('Ufullstendig svar fra Vipps avtale');
  }
  return data;
}

export async function getVippsAgreement(
  cfg: VippsEnv,
  agreementId: string,
  fetchImpl: FetchFn = fetch
): Promise<VippsAgreementDetails> {
  const token = await getVippsAccessToken(cfg, fetchImpl);
  const res = await fetchImpl(`${cfg.baseUrl}/recurring/v3/agreements/${agreementId}`, {
    headers: vippsHeaders(cfg, token),
  });
  if (!res.ok) throw new Error(`Vipps GET avtale feilet (${res.status})`);
  const data = (await res.json()) as { id?: string; agreementId?: string; status: VippsAgreementStatus };
  return { id: data.agreementId ?? data.id ?? agreementId, status: data.status };
}

export async function stopVippsAgreement(
  cfg: VippsEnv,
  agreementId: string,
  idempotencyKey: string,
  fetchImpl: FetchFn = fetch
): Promise<void> {
  const token = await getVippsAccessToken(cfg, fetchImpl);
  const res = await fetchImpl(`${cfg.baseUrl}/recurring/v3/agreements/${agreementId}`, {
    method: 'PATCH',
    headers: vippsHeaders(cfg, token, idempotencyKey),
    body: JSON.stringify({ status: 'STOPPED' }),
  });
  if (!res.ok) throw new Error(`Vipps stopp avtale feilet (${res.status})`);
}

export async function createVippsCharge(
  cfg: VippsEnv,
  agreementId: string,
  params: {
    amountOre: number;
    due: string;
    orderId: string;
    idempotencyKey: string;
    description: string;
  },
  fetchImpl: FetchFn = fetch
): Promise<void> {
  const token = await getVippsAccessToken(cfg, fetchImpl);
  const body = {
    amount: params.amountOre,
    currency: 'NOK',
    description: params.description,
    due: params.due,
    transactionType: 'DIRECT_CAPTURE',
    type: 'RECURRING',
    orderId: params.orderId,
    retryDays: 2,
  };
  const res = await fetchImpl(`${cfg.baseUrl}/recurring/v3/agreements/${agreementId}/charges`, {
    method: 'POST',
    headers: vippsHeaders(cfg, token, params.idempotencyKey),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Vipps charge feilet (${res.status})`);
}

export async function getVippsCharge(
  cfg: VippsEnv,
  agreementId: string,
  orderId: string,
  fetchImpl: FetchFn = fetch
): Promise<VippsChargeDetails> {
  const token = await getVippsAccessToken(cfg, fetchImpl);
  const res = await fetchImpl(
    `${cfg.baseUrl}/recurring/v3/agreements/${agreementId}/charges/${orderId}`,
    { headers: vippsHeaders(cfg, token) }
  );
  if (!res.ok) throw new Error(`Vipps GET charge feilet (${res.status})`);
  const data = (await res.json()) as {
    id?: string;
    chargeId?: string;
    status: RecurringChargeStatus;
    amount: number;
    due: string;
    agreementId?: string;
  };
  return {
    id: data.chargeId ?? data.id ?? orderId,
    status: data.status,
    amount: data.amount,
    due: data.due,
    agreementId: data.agreementId ?? agreementId,
  };
}

/** Mock for lokale tester uten nøkler. */
export function mockCreateAgreement(params: {
  amountOre: number;
  externalId: string;
}): VippsAgreementResponse {
  const id = `agr_mock_${params.externalId}`;
  return {
    agreementId: id,
    vippsConfirmationUrl: `https://apitest.vipps.no/mock-confirm/${id}?amount=${params.amountOre}`,
  };
}
