/**
 * Vipps MobilePay Recurring API — faste månedlige trekk (fadderbidrag).
 *
 * Slik skrur dere det på (jf. produktdokument og Vipps):
 * 1. Bestill «Recurring Payments» på salgsenheten i Vipps MobilePay bedriftsportal.
 * 2. Fullfør KYC/AML; hent test-nøkler (client_id, client_secret, MSN, subscription key).
 * 3. Backend: POST /recurring/v3/agreements med fast beløp (øre) og interval MONTH.
 * 4. Send bruker til vippsConfirmationUrl; verifiser ACTIVE via webhook eller polling — ikke bare redirect.
 *
 * Docs: https://developer.vippsmobilepay.com/docs/APIs/recurring-api/recurring-api-guide/
 *
 * Frontend skal ikke lagre hemmeligheter. Når VITE_VIPPS_RECURRING_ENABLED=true og
 * /api/vipps/recurring/agreement finnes, kan skjemaet starte avtale med valgt beløp fra CMS.
 */

export const VIPPS_RECURRING_DOCS_URL =
  'https://developer.vippsmobilepay.com/docs/APIs/recurring-api/recurring-api-quick-start/';

export function isVippsRecurringEnabledInFrontend(): boolean {
  return import.meta.env.VITE_VIPPS_RECURRING_ENABLED === 'true';
}

export interface StartVippsRecurringParams {
  sponsorId: string;
  amountKr: number;
  phone: string;
  sponsor?: {
    vippsAgreementId?: string;
    vippsConfirmationUrl?: string;
    vippsAgreementStatus?: string;
  };
}

/** Kalles fra skjema når server-endepunkt er på plass. */
export async function startVippsRecurringAgreement(
  params: StartVippsRecurringParams
): Promise<{
  redirectUrl: string;
  agreementId?: string;
  sponsorPatch?: {
    vippsAgreementId: string;
    vippsConfirmationUrl: string;
    vippsAgreementStatus: 'PENDING';
  };
}> {
  if (!isVippsRecurringEnabledInFrontend()) {
    throw new Error('Vipps faste betalinger er ikke aktivert i dette miljøet.');
  }
  const res = await fetch('/api/vipps/recurring/agreement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sponsorId: params.sponsorId,
      amountOre: Math.round(params.amountKr * 100),
      phone: params.phone,
      sponsor: params.sponsor,
    }),
  });
  if (!res.ok) {
    throw new Error('Kunne ikke starte Vipps-avtale.');
  }
  const data = (await res.json()) as {
    redirectUrl?: string;
    agreementId?: string;
    sponsorPatch?: {
      vippsAgreementId: string;
      vippsConfirmationUrl: string;
      vippsAgreementStatus: 'PENDING';
    };
  };
  if (!data.redirectUrl) throw new Error('Manglende redirect fra Vipps.');
  return {
    redirectUrl: data.redirectUrl,
    agreementId: data.agreementId,
    sponsorPatch: data.sponsorPatch,
  };
}

/** Retur fra Vipps — kun les status, ingen sideeffekt i klienten. */
export async function pollVippsAgreementStatus(agreementId: string): Promise<string | null> {
  if (!agreementId || !isVippsRecurringEnabledInFrontend()) return null;
  const res = await fetch(`/api/vipps/recurring/agreement/${encodeURIComponent(agreementId)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { status?: string };
  return data.status ?? null;
}
