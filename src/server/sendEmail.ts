import { parseEmailPayload, wrapEmailHtml } from '../email/payload';

export interface EmailEnv {
  RESEND_API_KEY?: string;
  NEWSLETTER_FROM?: string;
  EMAIL_FROM?: string;
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

/** Sender via Resend HTTP (ikke SDK). Samme kontrakt som api/_lib/mail.js på Vercel. */
export async function dispatchEmail(
  body: unknown,
  env: EmailEnv
): Promise<{ status: number; json: Record<string, unknown> }> {
  const parsed = parseEmailPayload(body);
  if (!parsed.ok) {
    return { status: 400, json: { ok: false, code: 'INVALID', message: parsed.error } };
  }

  const apiKey = env.RESEND_API_KEY?.trim() || '';
  const from =
    env.EMAIL_FROM?.trim() || env.NEWSLETTER_FROM?.trim() || 'Betyna <nyhetsbrev@betyna.no>';

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
