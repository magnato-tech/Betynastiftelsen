import type { NewsletterAudience } from './recipients';
import { parseEmailPayload, wrapEmailHtml } from '../email/payload';

export interface NewsletterPayload {
  subject: string;
  html: string;
  audience: NewsletterAudience;
  emails: string[];
}

export function parseNewsletterPayload(body: unknown): { ok: true; data: NewsletterPayload } | { ok: false; error: string } {
  const parsed = parseEmailPayload(
    body && typeof body === 'object' ? { ...(body as object), kind: 'newsletter' } : body
  );
  if (!parsed.ok) return parsed;
  if (!parsed.data.audience) return { ok: false, error: 'Ugyldig mottakergruppe.' };
  return {
    ok: true,
    data: {
      subject: parsed.data.subject,
      html: parsed.data.html,
      audience: parsed.data.audience,
      emails: parsed.data.emails,
    },
  };
}

export function wrapNewsletterHtml(subject: string, bodyHtml: string): string {
  return wrapEmailHtml('newsletter', subject, bodyHtml);
}
