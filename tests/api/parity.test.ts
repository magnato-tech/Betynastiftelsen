import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchEmail, dispatchNewsletter, resendConfigStatus } from '../../src/server/sendEmail';
import { parseNewsletterPayload, wrapNewsletterHtml } from '../../src/newsletter/payload';
import { parseEmailPayload, wrapEmailHtml } from '../../src/email/payload';
import { call, emailHandler, lastResendCall, mockResend, newsletterHandler, setEnv } from './harness';

/**
 * Vercel-funksjonene (api/*.js) og utviklerserveren (src/server/*.ts) er to kopier av samme logikk.
 * Disse testene sikrer at de oppfoerer seg likt, slik at kopiene ikke driver fra hverandre (F-31).
 */

const env = { RESEND_API_KEY: 're_parity', EMAIL_FROM: 'Betyna <post@betyna.no>' };

const payloads: Array<[string, unknown]> = [
  ['system', { kind: 'system', subject: 'Hei fadder', html: 'En melding med nok tekst.', emails: ['a@b.no'] }],
  ['inquiry', { kind: 'inquiry', subject: 'Svar paa spoersmaal', html: 'Her er svaret ditt, <b>fadder</b>.', emails: ['a@b.no', 'c@d.no'] }],
  ['nyhetsbrev alle', { kind: 'newsletter', subject: 'Nyhetsbrev', html: 'Nyheter for alle sammen.', emails: ['a@b.no', 'c@d.no'], audience: 'all' }],
  ['nyhetsbrev faddere', { kind: 'newsletter', subject: 'Nyhetsbrev', html: 'Nyheter for faddere her.', emails: ['a@b.no'], audience: 'sponsors' }],
  ['nyhetsbrev koordinatorer', { kind: 'newsletter', subject: 'Nyhetsbrev', html: 'Nyheter for koordinatorer.', emails: ['a@b.no'], audience: 'coordinators' }],
  ['ukjent kind', { kind: 'x', subject: 'Hei hei', html: 'En melding med nok tekst.', emails: ['a@b.no'], audience: 'all' }],
  ['uten kind', { subject: 'Hei hei', html: 'En melding med nok tekst.', emails: ['a@b.no'], audience: 'all' }],
  ['html-tegn', { kind: 'system', subject: '<i>Hei</i>', html: '<script>x</script> & "q"\nlinje2 er her', emails: ['a@b.no'] }],
  ['mangler emne', { kind: 'system', html: 'En melding med nok tekst.', emails: ['a@b.no'] }],
  ['mangler tekst', { kind: 'system', subject: 'Hei hei', emails: ['a@b.no'] }],
  ['ingen mottakere', { kind: 'system', subject: 'Hei hei', html: 'En melding med nok tekst.', emails: [] }],
  ['ugyldig gruppe', { kind: 'newsletter', subject: 'Hei hei', html: 'En melding med nok tekst.', emails: ['a@b.no'], audience: 'hvem' }],
  ['null', null],
  ['tekst', 'hei'],
];

beforeEach(() => setEnv(env));
afterEach(() => {
  vi.unstubAllGlobals();
  setEnv({});
});

describe('api/email.js og src/server/sendEmail.ts oppfoerer seg likt', () => {
  it.each(payloads)('%s: samme statuskode, svar og Resend-nyttelast', async (_name, body) => {
    const apiFetch = mockResend({ json: { id: 'm1' } });
    const apiRes = await call(emailHandler, 'POST', body);
    const apiSent = apiFetch.mock.calls.length ? lastResendCall(apiFetch).payload : undefined;

    const srvFetch = mockResend({ json: { id: 'm1' } });
    const srv = await dispatchEmail(body, env);
    const srvSent = srvFetch.mock.calls.length ? lastResendCall(srvFetch).payload : undefined;

    expect(srv.status).toBe(apiRes.statusCode);
    expect(srv.json).toEqual(apiRes.body);
    expect(srvSent).toEqual(apiSent);
  });

  it.each(payloads)('%s uten noekkel: samme 503/400-svar', async (_name, body) => {
    setEnv({});
    mockResend();
    const apiRes = await call(emailHandler, 'POST', body);
    const srv = await dispatchEmail(body, {});
    expect(srv.status).toBe(apiRes.statusCode);
    expect(srv.json).toEqual(apiRes.body);
  });

  it.each([
    [{ RESEND_API_KEY: 'k' }],
    [{ RESEND_API_KEY: 'k', EMAIL_FROM: 'A <a@betyna.no>' }],
    [{ RESEND_API_KEY: 'k', NEWSLETTER_FROM: 'B <b@betyna.no>' }],
    [{ RESEND_API_KEY: ' ' }],
    [{}],
  ])('konfigurasjonsstatus %j er lik', async (vars) => {
    setEnv(vars as Record<string, string>);
    const apiRes = await call(emailHandler, 'GET');
    expect(resendConfigStatus(vars)).toEqual(apiRes.body);
  });

  it('Resend-feil gir samme 502 i begge', async () => {
    mockResend({ ok: false, status: 422, json: { message: 'Bad' } });
    const apiRes = await call(emailHandler, 'POST', payloads[0][1]);
    mockResend({ ok: false, status: 422, json: { message: 'Bad' } });
    const srv = await dispatchEmail(payloads[0][1], env);
    expect(srv.status).toBe(apiRes.statusCode);
    expect(srv.json).toEqual(apiRes.body);
  });
});

describe('api/newsletter.js og dispatchNewsletter oppfoerer seg likt', () => {
  const news = [
    { subject: 'Nyhetsbrev', html: 'Nyheter for alle sammen.', emails: ['a@b.no'], audience: 'all' },
    { kind: 'system', subject: 'Nyhetsbrev', html: 'Nyheter for alle sammen.', emails: ['a@b.no'], audience: 'all' },
    { subject: 'Nyhetsbrev', html: 'Nyheter for alle sammen.', emails: ['a@b.no'] },
  ];
  it.each([0, 2].map((i) => [i, news[i]] as const))('variant %i er identisk', async (_i, body) => {
    const f1 = mockResend();
    const apiRes = await call(newsletterHandler, 'POST', body);
    const f2 = mockResend();
    const srv = await dispatchNewsletter(body, env);
    expect(srv.status).toBe(apiRes.statusCode);
    expect(srv.json).toEqual(apiRes.body);
    if (f1.mock.calls.length) expect(lastResendCall(f2).payload).toEqual(lastResendCall(f1).payload);
  });
  it('KJENT AVVIK F-31: med eksplisitt kind=system bruker api/newsletter.js nyhetsbrev-bunntekst, mens src/server bruker systemmelding-bunntekst', async () => {
    const body = news[1];
    const f1 = mockResend();
    await call(newsletterHandler, 'POST', body);
    const f2 = mockResend();
    await dispatchNewsletter(body, env);
    const apiHtml = lastResendCall(f1).payload.html as string;
    const srvHtml = lastResendCall(f2).payload.html as string;
    expect(apiHtml).toContain('nyhetsbrev fra Betyna');
    expect(srvHtml).toContain('systemmelding fra Betyna');
    const withoutFooter = (html: string) => html.split('\n').filter((line) => !line.includes('fra Betyna.')).join('\n');
    expect(withoutFooter(apiHtml)).toBe(withoutFooter(srvHtml));
  });
});

describe('src/email/payload.ts og api/email.js validerer likt', () => {
  it.each(payloads)('%s: parse gir samme gyldighet og feilmelding', async (_name, body) => {
    mockResend();
    const apiRes = await call(emailHandler, 'POST', body);
    const parsed = parseEmailPayload(body);
    if (parsed.ok) expect(apiRes.statusCode).toBe(200);
    else {
      expect(apiRes.statusCode).toBe(400);
      expect(apiRes.body.message).toBe(parsed.error);
    }
  });
  it('wrapEmailHtml gir samme HTML som funksjonen sender', async () => {
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', payloads[7][1]);
    const sent = lastResendCall(fetchMock).payload.html as string;
    const body = payloads[7][1] as { subject: string; html: string };
    expect(sent).toBe(wrapEmailHtml('system', body.subject.trim(), body.html.trim()));
  });
  it('parseNewsletterPayload krever mottakergruppe og tvinger kind=newsletter', () => {
    expect(parseNewsletterPayload({ subject: 'Hei hei', html: 'Melding med nok tekst.', emails: ['a@b.no'] }).ok).toBe(false);
    expect(parseNewsletterPayload({ kind: 'system', subject: 'Hei hei', html: 'Melding med nok tekst.', emails: ['a@b.no'], audience: 'all' }).ok).toBe(true);
    expect(parseNewsletterPayload(null).ok).toBe(false);
  });
  it('wrapNewsletterHtml bruker nyhetsbrev-bunntekst', () => {
    expect(wrapNewsletterHtml('Emne her', 'Tekst')).toContain('nyhetsbrev fra Betyna');
  });
});
