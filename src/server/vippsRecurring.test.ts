import { describe, expect, it, vi } from 'vitest';
import { resetVippsTokenCache, createVippsAgreement, getVippsAccessToken } from './vippsRecurringClient';
import type { VippsEnv } from './vippsConfig';
import { handleCreateAgreement } from './vippsApiHandlers';
import { planMonthlyCharges } from './vippsChargeJob';
import { makeSponsor } from '../test/testData';

const cfg: VippsEnv = {
  clientId: 'cid',
  clientSecret: 'sec',
  subscriptionKey: 'sub',
  msn: '123456',
  testMode: true,
  baseUrl: 'https://apitest.vipps.no',
  merchantRedirectUrl: 'http://localhost:3000/?vipps=return',
  merchantAgreementUrl: 'http://localhost:3000/fadder',
};

describe('vippsRecurringClient', () => {
  it('requests LEGACY MONTH agreement with øre amount', async () => {
    resetVippsTokenCache();
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/accesstoken/get')) {
        return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 });
      }
      expect(url).toContain('/recurring/v3/agreements');
      const body = JSON.parse(String(init?.body));
      expect(body.pricing).toEqual({ type: 'LEGACY', amount: 25000, currency: 'NOK' });
      expect(body.interval).toEqual({ unit: 'MONTH', count: 1 });
      return new Response(
        JSON.stringify({
          agreementId: 'agr-1',
          vippsConfirmationUrl: 'https://example.com/confirm',
        }),
        { status: 201 }
      );
    });
    const res = await createVippsAgreement(
      cfg,
      { amountOre: 25000, phone: '+4790000000', idempotencyKey: 'idem-1', externalId: 'sponsor-1' },
      fetchMock as typeof fetch
    );
    expect(res.agreementId).toBe('agr-1');
    expect(await getVippsAccessToken(cfg, fetchMock as typeof fetch)).toBe('tok');
  });
});

describe('vippsApiHandlers', () => {
  it('returns 503 without credentials', async () => {
    const res = await handleCreateAgreement(
      { sponsorId: 's1', amountOre: 25000, phone: '+4712345678' },
      {}
    );
    expect(res.status).toBe(503);
  });

  it('creates mock agreement when VIPPS_MOCK=true', async () => {
    const res = await handleCreateAgreement(
      { sponsorId: 's1', amountOre: 25000, phone: '+4712345678' },
      { VIPPS_MOCK: 'true' }
    );
    expect(res.status).toBe(200);
    expect(res.json.redirectUrl).toBeTruthy();
    expect(res.json.sponsorPatch).toMatchObject({ vippsAgreementStatus: 'PENDING' });
  });
});

describe('vippsChargeJob', () => {
  it('skips sponsors without active agreement', () => {
    const planned = planMonthlyCharges(
      [{ sponsor: makeSponsor({ vippsAgreementStatus: 'PENDING' }) }],
      '2026-11',
      '2026-11-20'
    );
    expect(planned[0].skipped).toBe(true);
  });
});
