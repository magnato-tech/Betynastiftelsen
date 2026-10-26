export interface VippsEnv {
  clientId: string;
  clientSecret: string;
  subscriptionKey: string;
  msn: string;
  testMode: boolean;
  baseUrl: string;
  merchantRedirectUrl: string;
  merchantAgreementUrl: string;
  webhookSecret?: string;
}

export function vippsConfigFromEnv(env: Record<string, string>): VippsEnv | null {
  const clientId = env.VIPPS_CLIENT_ID?.trim();
  const clientSecret = env.VIPPS_CLIENT_SECRET?.trim();
  const subscriptionKey = env.VIPPS_SUBSCRIPTION_KEY?.trim();
  const msn = env.VIPPS_MSN?.trim();
  if (!clientId || !clientSecret || !subscriptionKey || !msn) return null;
  const testMode = env.VIPPS_TEST_MODE !== 'false';
  const baseUrl = testMode ? 'https://apitest.vipps.no' : 'https://api.vipps.no';
  const appUrl = (env.APP_URL || env.VITE_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return {
    clientId,
    clientSecret,
    subscriptionKey,
    msn,
    testMode,
    baseUrl,
    merchantRedirectUrl: env.VIPPS_MERCHANT_REDIRECT_URL || `${appUrl}/?vipps=return`,
    merchantAgreementUrl: env.VIPPS_MERCHANT_AGREEMENT_URL || `${appUrl}/fadder`,
    webhookSecret: env.VIPPS_WEBHOOK_SECRET?.trim(),
  };
}

export function vippsConfigured(env: Record<string, string>): boolean {
  return vippsConfigFromEnv(env) != null || env.VIPPS_MOCK === 'true';
}
