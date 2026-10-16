import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { call, emailHandler, lastResendCall, mockResend, newsletterHandler, setEnv } from './harness';

const valid = {
  kind: 'system',
  subject: 'Hei fadder',
  html: 'Dette er en melding som er lang nok.',
  emails: ['fadder@example.com'],
};

beforeEach(() => setEnv({ RESEND_API_KEY: 're_test_123' }));
afterEach(() => {
  vi.unstubAllGlobals();
  setEnv({});
});

describe('api/email: HTTP-metoder', () => {
  it.each(['PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])('%s avvises med 405', async (method) => {
    const res = await call(emailHandler, method, valid);
    expect(res.statusCode).toBe(405);
    expect(res.body.ok).toBe(false);
  });
  it('GET viser konfigurasjonsstatus uten aa avsloere noekkelen', async () => {
    const res = await call(emailHandler, 'GET');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, configured: true, from: 'Betyna <nyhetsbrev@betyna.no>' });
    expect(JSON.stringify(res.body)).not.toContain('re_test_123');
  });
  it('GET uten noekkel viser configured=false', async () => {
    setEnv({});
    const res = await call(emailHandler, 'GET');
    expect(res.body.configured).toBe(false);
  });
  it('GET: blank noekkel regnes som ikke konfigurert', async () => {
    setEnv({ RESEND_API_KEY: '   ' });
    expect((await call(emailHandler, 'GET')).body.configured).toBe(false);
  });
  it('GET: EMAIL_FROM har forrang over NEWSLETTER_FROM', async () => {
    setEnv({ RESEND_API_KEY: 'k', EMAIL_FROM: 'A <a@betyna.no>', NEWSLETTER_FROM: 'B <b@betyna.no>' });
    expect((await call(emailHandler, 'GET')).body.from).toBe('A <a@betyna.no>');
  });
  it('GET: NEWSLETTER_FROM brukes naar EMAIL_FROM mangler', async () => {
    setEnv({ RESEND_API_KEY: 'k', NEWSLETTER_FROM: 'B <b@betyna.no>' });
    expect((await call(emailHandler, 'GET')).body.from).toBe('B <b@betyna.no>');
  });
});

describe('api/email: validering av innhold (POST)', () => {
  const cases: Array<[string, unknown, string]> = [
    ['mangler body', undefined, 'Mangler innhold.'],
    ['body er null', null, 'Mangler innhold.'],
    ['body er tekststreng', 'hei', 'Mangler innhold.'],
    ['emne mangler', { ...valid, subject: undefined }, 'Emne må være minst 3 tegn.'],
    ['emne for kort', { ...valid, subject: 'ab' }, 'Emne må være minst 3 tegn.'],
    ['emne kun mellomrom', { ...valid, subject: '     ' }, 'Emne må være minst 3 tegn.'],
    ['emne er tall', { ...valid, subject: 12345 }, 'Emne må være minst 3 tegn.'],
    ['melding mangler', { ...valid, html: undefined }, 'Meldingstekst mangler.'],
    ['melding for kort', { ...valid, html: 'kort' }, 'Meldingstekst mangler.'],
    ['melding kun mellomrom', { ...valid, html: '          ' }, 'Meldingstekst mangler.'],
    ['emails mangler', { ...valid, emails: undefined }, 'Ingen gyldige e-postadresser.'],
    ['emails er tom liste', { ...valid, emails: [] }, 'Ingen gyldige e-postadresser.'],
    ['emails er tekststreng', { ...valid, emails: 'a@b.no' }, 'Ingen gyldige e-postadresser.'],
    ['emails inneholder bare tall', { ...valid, emails: [1, 2] }, 'Ingen gyldige e-postadresser.'],
  ];
  it.each(cases)('%s gir 400', async (_name, body, message) => {
    const fetchMock = mockResend();
    const res = await call(emailHandler, 'POST', body);
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ ok: false, code: 'INVALID', message });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['sponsors'],
    ['coordinators'],
    ['all'],
  ])('nyhetsbrev med mottakergruppe %s godtas', async (audience) => {
    mockResend();
    const res = await call(emailHandler, 'POST', { ...valid, kind: 'newsletter', audience });
    expect(res.statusCode).toBe(200);
    expect(res.body.audience).toBe(audience);
  });
  it.each([[undefined], ['alle'], ['admins'], [''], [1]])('nyhetsbrev med ugyldig mottakergruppe %s gir 400', async (audience) => {
    mockResend();
    const res = await call(emailHandler, 'POST', { ...valid, kind: 'newsletter', audience });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Ugyldig mottakergruppe.');
  });
  it('ukjent kind behandles som nyhetsbrev og krever mottakergruppe', async () => {
    mockResend();
    const res = await call(emailHandler, 'POST', { ...valid, kind: 'hack' });
    expect(res.statusCode).toBe(400);
  });
  it('mellomrom i adresser fjernes, ikke-tekst filtreres bort', async () => {
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', { ...valid, emails: ['  a@b.no  ', 5, null, 'c@d.no'] });
    expect(lastResendCall(fetchMock).payload.to).toEqual(['a@b.no', 'c@d.no']);
  });
});

describe('api/email: uten Resend-noekkel', () => {
  it('gir 503 NOT_CONFIGURED og sender ingenting', async () => {
    setEnv({});
    const fetchMock = mockResend();
    const res = await call(emailHandler, 'POST', valid);
    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({ ok: false, code: 'NOT_CONFIGURED', preparedRecipients: 1, kind: 'system' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('blank noekkel gir ogsaa 503', async () => {
    setEnv({ RESEND_API_KEY: '  ' });
    const res = await call(emailHandler, 'POST', valid);
    expect(res.statusCode).toBe(503);
  });
});

describe('api/email: sending via Resend', () => {
  it('kaller Resend med riktig URL, Bearer-noekkel og JSON', async () => {
    const fetchMock = mockResend({ json: { id: 'abc' } });
    const res = await call(emailHandler, 'POST', valid);
    const sent = lastResendCall(fetchMock);
    expect(sent.url).toBe('https://api.resend.com/emails');
    expect(sent.headers.Authorization).toBe('Bearer re_test_123');
    expect(sent.headers['Content-Type']).toBe('application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, id: 'abc', sent: 1, kind: 'system' });
  });
  it('systemmelding og henvendelse sendes direkte til mottakeren (to)', async () => {
    for (const kind of ['system', 'inquiry']) {
      const fetchMock = mockResend();
      await call(emailHandler, 'POST', { ...valid, kind, emails: ['x@y.no', 'z@y.no'] });
      const { payload } = lastResendCall(fetchMock);
      expect(payload.to).toEqual(['x@y.no', 'z@y.no']);
      expect(payload.bcc).toBeUndefined();
    }
  });
  it('nyhetsbrev bruker skjult kopi (bcc) slik at mottakere ikke ser hverandre', async () => {
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', {
      ...valid,
      kind: 'newsletter',
      audience: 'sponsors',
      emails: ['f1@example.com', 'f2@example.com', 'f3@example.com'],
    });
    const { payload } = lastResendCall(fetchMock);
    expect(payload.bcc).toEqual(['f1@example.com', 'f2@example.com', 'f3@example.com']);
    expect(payload.to).toEqual(['nyhetsbrev@betyna.no']);
  });
  it('nyhetsbrev: to-adressen tas fra avsender uten visningsnavn', async () => {
    setEnv({ RESEND_API_KEY: 'k', EMAIL_FROM: 'ren@betyna.no' });
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', { ...valid, kind: 'newsletter', audience: 'all' });
    expect(lastResendCall(fetchMock).payload.to).toEqual(['ren@betyna.no']);
  });
  it('avsender fra EMAIL_FROM brukes', async () => {
    setEnv({ RESEND_API_KEY: 'k', EMAIL_FROM: 'Betyna <post@betyna.no>' });
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', valid);
    expect(lastResendCall(fetchMock).payload.from).toBe('Betyna <post@betyna.no>');
  });
  it('emnet sendes uendret (trimmet)', async () => {
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', { ...valid, subject: '  Takk for gaven  ' });
    expect(lastResendCall(fetchMock).payload.subject).toBe('Takk for gaven');
  });
  it('relatedId og templateId ignoreres av utsendingen', async () => {
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', { ...valid, relatedId: 'INQ-1', templateId: 'tpl' });
    const { payload } = lastResendCall(fetchMock);
    expect(Object.keys(payload).sort()).toEqual(['from', 'html', 'subject', 'to']);
  });
  it('Resend-feil gir 502 med Resends melding', async () => {
    mockResend({ ok: false, status: 422, json: { message: 'Invalid from' } });
    const res = await call(emailHandler, 'POST', valid);
    expect(res.statusCode).toBe(502);
    expect(res.body).toMatchObject({ ok: false, code: 'RESEND_ERROR', message: 'Invalid from' });
  });
  it('Resend-feil uten melding faar statuskode i teksten', async () => {
    mockResend({ ok: false, status: 429, json: {} });
    const res = await call(emailHandler, 'POST', valid);
    expect(res.body.message).toBe('Resend svarte 429');
  });
  it('Resend som svarer med ugyldig JSON haandteres', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => { throw new Error('x'); } })));
    const res = await call(emailHandler, 'POST', valid);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBeUndefined();
  });
  it('nettverksfeil gir 500 FUNCTION_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('nettverk nede'); }));
    const res = await call(emailHandler, 'POST', valid);
    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({ ok: false, code: 'FUNCTION_ERROR', message: 'nettverk nede' });
  });
  it('noekkelen eksponeres aldri i svar', async () => {
    mockResend();
    const res = await call(emailHandler, 'POST', valid);
    expect(JSON.stringify(res.body)).not.toContain('re_test_123');
  });
});

describe('api/email: HTML-sikkerhet', () => {
  it.each([
    ['<script>alert(1)</script>', '&lt;script&gt;alert(1)&lt;/script&gt;'],
    ['<img src=x onerror=alert(1)>', '&lt;img src=x onerror=alert(1)&gt;'],
    ['a & b', 'a &amp; b'],
    ['"sitat"', '&quot;sitat&quot;'],
  ])('meldingstekst %s escapes', async (input, expected) => {
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', { ...valid, html: `Hei ${input} slutt` });
    const html = lastResendCall(fetchMock).payload.html as string;
    expect(html).toContain(expected);
    expect(html).not.toContain(input.includes('<') ? input : '\u0000');
  });
  it('emnet escapes i HTML-overskriften', async () => {
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', { ...valid, subject: '<b>Fet</b> emne' });
    const html = lastResendCall(fetchMock).payload.html as string;
    expect(html).toContain('<h1 style="font-size:22px;font-weight:700;">&lt;b&gt;Fet&lt;/b&gt; emne</h1>');
  });
  it('linjeskift blir <br/>', async () => {
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', { ...valid, html: 'Linje en\nLinje to er her' });
    expect(lastResendCall(fetchMock).payload.html).toContain('Linje en<br/>Linje to er her');
  });
  it.each([
    ['newsletter', 'nyhetsbrev fra Betyna'],
    ['inquiry', 'svar på en henvendelse'],
    ['system', 'systemmelding fra Betyna'],
  ])('bunntekst for %s', async (kind, text) => {
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', { ...valid, kind, audience: 'all' });
    expect(lastResendCall(fetchMock).payload.html).toContain(text);
  });
  it('systemmelding lover "ingen barneprofiler i denne e-posten"', async () => {
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', valid);
    expect(lastResendCall(fetchMock).payload.html).toContain('Ingen barneprofiler');
  });
});

describe('api/newsletter', () => {
  it.each(['GET', 'PUT', 'DELETE'])('%s avvises med 405', async (method) => {
    expect((await call(newsletterHandler, method)).statusCode).toBe(405);
  });
  it('setter kind=newsletter naar den mangler', async () => {
    const fetchMock = mockResend();
    const res = await call(newsletterHandler, 'POST', {
      subject: 'Nyhetsbrev oktober',
      html: 'Dette er et nyhetsbrev som er langt nok.',
      emails: ['a@example.com'],
      audience: 'sponsors',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.kind).toBe('newsletter');
    expect(lastResendCall(fetchMock).payload.bcc).toEqual(['a@example.com']);
  });
  it('krever mottakergruppe', async () => {
    mockResend();
    const res = await call(newsletterHandler, 'POST', { subject: 'Emne her', html: 'Lang nok melding her.', emails: ['a@b.no'] });
    expect(res.statusCode).toBe(400);
  });
  it('uten noekkel gir 503', async () => {
    setEnv({});
    const res = await call(newsletterHandler, 'POST', { subject: 'Emne her', html: 'Lang nok melding her.', emails: ['a@b.no'], audience: 'all' });
    expect(res.statusCode).toBe(503);
  });
  it('har egen bunntekst for nyhetsbrev (alltid)', async () => {
    const fetchMock = mockResend();
    await call(newsletterHandler, 'POST', { kind: 'system', subject: 'Emne her', html: 'Lang nok melding her.', emails: ['a@b.no'] });
    expect(lastResendCall(fetchMock).payload.html).toContain('nyhetsbrev fra Betyna');
  });
  it('body=null gir 400 og ikke krasj', async () => {
    const res = await call(newsletterHandler, 'POST', null);
    expect(res.statusCode).toBe(400);
  });
  it('Resend-feil gir 502', async () => {
    mockResend({ ok: false, status: 500, json: { message: 'nede' } });
    const res = await call(newsletterHandler, 'POST', { subject: 'Emne her', html: 'Lang nok melding her.', emails: ['a@b.no'], audience: 'all' });
    expect(res.statusCode).toBe(502);
  });
});

describe('api: KJENT AVVIK - ingen autentisering eller begrensning (F-12, F-13)', () => {
  it('F-12: hvem som helst uten innlogging kan sende e-post fra Betyna-domenet', async () => {
    const fetchMock = mockResend();
    const res = await call(emailHandler, 'POST', { ...valid, emails: ['offer@example.org'], html: 'Falsk melding fra Betyna.' });
    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('F-12: ingen sjekk av Authorization-header (kall uten token godtas)', async () => {
    mockResend();
    const handler = emailHandler as unknown as (r: unknown, s: unknown) => Promise<void>;
    let status = 0;
    await handler({ method: 'POST', headers: {}, body: valid }, { status: (c: number) => { status = c; return { json: () => undefined }; } });
    expect(status).toBe(200);
  });
  it('F-13: ugyldig e-postformat valideres ikke', async () => {
    const fetchMock = mockResend();
    const res = await call(emailHandler, 'POST', { ...valid, emails: ['ikke-en-epost', 'a b c'] });
    expect(res.statusCode).toBe(200);
    expect(lastResendCall(fetchMock).payload.to).toEqual(['ikke-en-epost', 'a b c']);
  });
  it('F-13: ingen oevre grense for antall mottakere (1000 godtas)', async () => {
    const fetchMock = mockResend();
    const emails = Array.from({ length: 1000 }, (_, i) => `u${i}@example.com`);
    const res = await call(emailHandler, 'POST', { ...valid, emails });
    expect(res.statusCode).toBe(200);
    expect(lastResendCall(fetchMock).payload.to).toHaveLength(1000);
  });
  it('F-13: ingen grense for meldingslengde (200 000 tegn godtas)', async () => {
    mockResend();
    const res = await call(emailHandler, 'POST', { ...valid, html: 'x'.repeat(200_000) });
    expect(res.statusCode).toBe(200);
  });
  it('F-13: ingen rate limiting - 25 kall paa rad lykkes alle', async () => {
    mockResend();
    for (let i = 0; i < 25; i += 1) {
      expect((await call(emailHandler, 'POST', valid)).statusCode).toBe(200);
    }
  });
  it('F-13: e-post-headerinjeksjon i emne er ikke filtrert (sendes videre til Resend uendret)', async () => {
    const fetchMock = mockResend();
    await call(emailHandler, 'POST', { ...valid, subject: 'Emne\r\nBcc: x@evil.com' });
    expect(lastResendCall(fetchMock).payload.subject).toContain('\r\n');
  });
});
