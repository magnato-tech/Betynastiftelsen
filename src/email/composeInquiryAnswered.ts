import { isValidEmail } from '../newsletter/recipients';
import { buildSponsorPortalLink } from './sponsorPortalLink';
import { fillTemplate, SYSTEM_EMAIL_TEMPLATES } from './templates';

export function composeInquiryAnsweredEmail(input: {
  inquiryId: string;
  sponsorId: string;
  sponsorName: string;
  sponsorEmail: string;
  origin: string;
}): { ok: false } | {
  ok: true;
  kind: 'system';
  subject: string;
  html: string;
  emails: string[];
  templateId: 'inquiry_answered';
  relatedId: string;
} {
  if (!isValidEmail(input.sponsorEmail)) return { ok: false };
  const template = SYSTEM_EMAIL_TEMPLATES.find((t) => t.id === 'inquiry_answered');
  if (!template) return { ok: false };
  const lenke = buildSponsorPortalLink(input.origin, input.sponsorId, 'sporsmaal');
  const vars = { navn: input.sponsorName, lenke };
  return {
    ok: true,
    kind: 'system',
    subject: fillTemplate(template.subject, vars),
    html: fillTemplate(template.body, vars),
    emails: [input.sponsorEmail.trim()],
    templateId: 'inquiry_answered',
    relatedId: input.inquiryId,
  };
}
