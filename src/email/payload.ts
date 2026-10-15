import type { EmailKind } from '../types';
import type { NewsletterAudience } from '../newsletter/recipients';

export interface EmailPayload {
  kind: EmailKind;
  subject: string;
  html: string;
  emails: string[];
  audience?: NewsletterAudience;
  relatedId?: string;
  templateId?: string;
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
