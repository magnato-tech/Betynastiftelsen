export interface EmailEnv {
  RESEND_API_KEY?: string;
  NEWSLETTER_FROM?: string;
  EMAIL_FROM?: string;
}

type EmailKind = 'inquiry' | 'system' | 'newsletter';
type NewsletterAudience = 'sponsors' | 'coordinators' | 'all';

export interface EmailPayload {
  kind: EmailKind;
  subject: string;
  html: string;
  emails: string[];
  audience?: NewsletterAudience;
  relatedId?: string;
  templateId?: string;
}

export function resendConfigStatus(env: EmailEnv): {
  ok: true;
  configured: boolean;
  from: string;
} {
  return {
    ok: true,
    configured: Boolean(env.RESEND_API_KEY?.trim()),
    from: env.EMAIL_FROM?.trim() || env.NEWSLETTER_FROM?.trim() || 'Betyna <nyhetsbrev@betyna.no>',
  };
}

export function parseEmailPayload(
  body: unknown
): { ok: true; data: EmailPayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Mangler innhold.' };
  }
  const raw = body as Record<string, unknown>;
  const kindRaw = raw.kind;
  const kind: EmailKind =
    kindRaw === 'inquiry' || kindRaw === 'system' || kindRaw === 'newsletter'
      ? kindRaw
      : 'newsletter';

  const subject = typeof raw.subject === 'string' ? raw.subject.trim() : '';
  const html = typeof raw.html === 'string' ? raw.html.trim() : '';
  const emails = Array.isArray(raw.emails)
    ? raw.emails.filter((e): e is string => typeof e === 'string').map((e) => e.trim())
    : [];
  const audience = raw.audience;
  const relatedId = typeof raw.relatedId === 'string' ? raw.relatedId : undefined;
  const templateId = typeof raw.templateId === 'string' ? raw.templateId : undefined;

  if (subject.length < 3) return { ok: false, error: 'Emne må være minst 3 tegn.' };
  if (html.length < 10) return { ok: false, error: 'Meldingstekst mangler.' };
  if (emails.length === 0) return { ok: false, error: 'Ingen gyldige e-postadresser.' };

  if (kind === 'newsletter') {
    if (audience !== 'sponsors' && audience !== 'coordinators' && audience !== 'all') {
      return { ok: false, error: 'Ugyldig mottakergruppe.' };
    }
    return {
      ok: true,
      data: { kind, subject, html, emails, audience, relatedId, templateId },
    };
  }

  return { ok: true, data: { kind, subject, html, emails, relatedId, templateId } };
}

export function wrapEmailHtml(kind: EmailKind, subject: string, bodyHtml: string): string {
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function envFrom(env: EmailEnv): { apiKey: string; from: string } | { apiKey: ''; from: string } {
  return {
    apiKey: env.RESEND_API_KEY?.trim() || '',
    from: env.EMAIL_FROM?.trim() || env.NEWSLETTER_FROM?.trim() || 'Betyna <nyhetsbrev@betyna.no>',
  };
}

/** Sender via Resend HTTP (ikke SDK) slik at Vercel-funksjonen ikke krasjer ved import. */
export async function dispatchEmail(
  body: unknown,
  env: EmailEnv
): Promise<{ status: number; json: Record<string, unknown> }> {
  const parsed = parseEmailPayload(body);
  if (!parsed.ok) {
    return { status: 400, json: { ok: false, code: 'INVALID', message: parsed.error } };
  }

  const { apiKey, from } = envFrom(env);

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
  const fromAddress = from.match(/<([^>]+)>/)?.[1] || from;

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

  const raw = (await res.json().catch(() => ({}))) as { id?: string; message?: string };

  if (!res.ok) {
    return {
      status: 502,
      json: {
        ok: false,
        code: 'RESEND_ERROR',
        message: raw.message || `Resend svarte ${res.status}`,
      },
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

export async function dispatchNewsletter(
  body: unknown,
  env: EmailEnv
): Promise<{ status: number; json: Record<string, unknown> }> {
  const asNewsletter =
    body && typeof body === 'object' && !('kind' in (body as object))
      ? { ...(body as object), kind: 'newsletter' }
      : body;
  return dispatchEmail(asNewsletter, env);
}
