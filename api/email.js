function env() {
  return {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEWSLETTER_FROM: process.env.NEWSLETTER_FROM,
    EMAIL_FROM: process.env.EMAIL_FROM,
  };
}

function resendConfigStatus(e) {
  return {
    ok: true,
    configured: Boolean(e.RESEND_API_KEY && String(e.RESEND_API_KEY).trim()),
    from:
      (e.EMAIL_FROM && String(e.EMAIL_FROM).trim()) ||
      (e.NEWSLETTER_FROM && String(e.NEWSLETTER_FROM).trim()) ||
      'Betyna <nyhetsbrev@betyna.no>',
  };
}

function parseEmailPayload(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Mangler innhold.' };
  }
  const kindRaw = body.kind;
  const kind =
    kindRaw === 'inquiry' || kindRaw === 'system' || kindRaw === 'newsletter' ? kindRaw : 'newsletter';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const html = typeof body.html === 'string' ? body.html.trim() : '';
  const emails = Array.isArray(body.emails)
    ? body.emails.filter((x) => typeof x === 'string').map((x) => x.trim())
    : [];
  const audience = body.audience;
  const relatedId = typeof body.relatedId === 'string' ? body.relatedId : undefined;
  const templateId = typeof body.templateId === 'string' ? body.templateId : undefined;
  if (subject.length < 3) return { ok: false, error: 'Emne må være minst 3 tegn.' };
  if (html.length < 10) return { ok: false, error: 'Meldingstekst mangler.' };
  if (emails.length === 0) return { ok: false, error: 'Ingen gyldige e-postadresser.' };
  if (kind === 'newsletter') {
    if (audience !== 'sponsors' && audience !== 'coordinators' && audience !== 'all') {
      return { ok: false, error: 'Ugyldig mottakergruppe.' };
    }
    return { ok: true, data: { kind, subject, html, emails, audience, relatedId, templateId } };
  }
  return { ok: true, data: { kind, subject, html, emails, relatedId, templateId } };
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapEmailHtml(kind, subject, bodyHtml) {
  const safeBody = escapeHtml(bodyHtml).replace(/\n/g, '<br/>');
  const footer =
    kind === 'newsletter'
      ? 'Dette er et nyhetsbrev fra Betyna. Svar til avsenderen hvis du har spørsmål.'
      : kind === 'inquiry'
        ? 'Dette er svar på en henvendelse til Betyna. Ikke oppgi intern kode eller etternavn på barn i svaret.'
        : 'Dette er en systemmelding fra Betyna. Ingen barneprofiler i denne e-posten.';
  return `<!DOCTYPE html>
<html lang="nb">
<body style="font-family:Georgia,serif;color:#3C3C3C;line-height:1.5;max-width:560px;margin:0 auto;padding:24px;">
  <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#4D6B3E;">Betyna</p>
  <h1 style="font-size:22px;font-weight:700;">${escapeHtml(subject)}</h1>
  <div>${safeBody}</div>
  <p style="font-size:12px;color:#78716c;margin-top:32px;">${escapeHtml(footer)}</p>
</body>
</html>`;
}

async function dispatchEmail(body, e) {
  const parsed = parseEmailPayload(body);
  if (!parsed.ok) {
    return { status: 400, json: { ok: false, code: 'INVALID', message: parsed.error } };
  }
  const apiKey = e.RESEND_API_KEY ? String(e.RESEND_API_KEY).trim() : '';
  const from =
    (e.EMAIL_FROM && String(e.EMAIL_FROM).trim()) ||
    (e.NEWSLETTER_FROM && String(e.NEWSLETTER_FROM).trim()) ||
    'Betyna <nyhetsbrev@betyna.no>';
  if (!apiKey) {
    return {
      status: 503,
      json: {
        ok: false,
        code: 'NOT_CONFIGURED',
        message:
          'RESEND_API_KEY er ikke satt. Utkastet er klart. Nøkkel og avsender settes i Vercel/.env senere — ikke i koden.',
        preparedRecipients: parsed.data.emails.length,
        kind: parsed.data.kind,
      },
    };
  }
  const html = wrapEmailHtml(parsed.data.kind, parsed.data.subject, parsed.data.html);
  const fromMatch = from.match(/<([^>]+)>/);
  const fromAddress = fromMatch ? fromMatch[1] : from;
  const sendPayload =
    parsed.data.kind === 'newsletter'
      ? { from, to: [fromAddress], bcc: parsed.data.emails, subject: parsed.data.subject, html }
      : { from, to: parsed.data.emails, subject: parsed.data.subject, html };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sendPayload),
  });
  let raw = {};
  try {
    raw = await res.json();
  } catch {
    raw = {};
  }
  if (!res.ok) {
    return {
      status: 502,
      json: { ok: false, code: 'RESEND_ERROR', message: raw.message || `Resend svarte ${res.status}` },
    };
  }
  return {
    status: 200,
    json: {
      ok: true,
      id: raw.id,
      sent: parsed.data.emails.length,
      kind: parsed.data.kind,
      audience: parsed.data.audience,
    },
  };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      res.status(200).json(resendConfigStatus(env()));
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, message: 'Kun GET eller POST.' });
      return;
    }
    const result = await dispatchEmail(req.body, env());
    res.status(result.status).json(result.json);
  } catch (err) {
    res.status(500).json({
      ok: false,
      code: 'FUNCTION_ERROR',
      message: err instanceof Error ? err.message : 'Ukjent feil i e-postfunksjonen.',
    });
  }
};
