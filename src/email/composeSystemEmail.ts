import { isValidEmail } from '../newsletter/recipients';
import { portalSectionForTemplate } from './autoSendPrefs';
import { buildSponsorPortalLink } from './sponsorPortalLink';
import { fillTemplate, SYSTEM_EMAIL_TEMPLATES, type SystemTemplateId } from './templates';

export function composeSystemEmail(input: {
  templateId: SystemTemplateId;
  relatedId: string;
  sponsorId: string;
  sponsorName: string;
  sponsorEmail: string;
  origin: string;
}):
  | { ok: false }
  | {
      ok: true;
      kind: 'system';
      subject: string;
      html: string;
      emails: string[];
      templateId: SystemTemplateId;
      relatedId: string;
    } {
  if (!isValidEmail(input.sponsorEmail)) return { ok: false };
  const template = SYSTEM_EMAIL_TEMPLATES.find((t) => t.id === input.templateId);
  if (!template) return { ok: false };
  const lenke = buildSponsorPortalLink(
    input.origin,
    input.sponsorId,
    portalSectionForTemplate(input.templateId)
  );
  const vars = { navn: input.sponsorName, lenke };
  return {
    ok: true,
    kind: 'system',
    subject: fillTemplate(template.subject, vars),
    html: fillTemplate(template.body, vars),
    emails: [input.sponsorEmail.trim()],
    templateId: input.templateId,
    relatedId: input.relatedId,
  };
}
