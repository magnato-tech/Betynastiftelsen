import type { SystemTemplateId } from './templates';

/** Hendelser daglig leder kan slå av/på for automatisk e-post. */
export type EmailAutoSendEvent =
  | 'inquiry_answered'
  | 'report_approved'
  | 'sponsor_welcome'
  | 'payment_registered';

export type EmailAutoSendPrefs = Record<EmailAutoSendEvent, boolean>;

export const EMAIL_AUTO_SEND_EVENTS: {
  id: EmailAutoSendEvent;
  title: string;
  when: string;
}[] = [
  {
    id: 'inquiry_answered',
    title: 'Svar på spørsmål',
    when: 'Når admin trykker «Publiser svar til fadder».',
  },
  {
    id: 'report_approved',
    title: 'Ny godkjent rapport',
    when: 'Når admin godkjenner en rapport i køen.',
  },
  {
    id: 'sponsor_welcome',
    title: 'Velkommen som fadder',
    when: 'Når admin registrerer en ny fadder under Barn & Faddere.',
  },
  {
    id: 'payment_registered',
    title: 'Betaling registrert',
    when: 'Når admin merker en innbetaling som avstemt.',
  },
];

/** Svar på spørsmål er på som utgangspunkt (allerede i bruk). Resten av til daglig leder slår dem på. */
export const DEFAULT_EMAIL_AUTO_SEND: EmailAutoSendPrefs = {
  inquiry_answered: true,
  report_approved: false,
  sponsor_welcome: false,
  payment_registered: false,
};

export function migrateEmailAutoSend(raw: unknown): EmailAutoSendPrefs {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    inquiry_answered: o.inquiry_answered !== false,
    report_approved: o.report_approved === true,
    sponsor_welcome: o.sponsor_welcome === true,
    payment_registered: o.payment_registered === true,
  };
}

export function isEmailAutoSendOn(
  prefs: EmailAutoSendPrefs,
  templateId: SystemTemplateId
): boolean {
  if (templateId === 'magic_link') return false;
  if (
    templateId === 'inquiry_answered' ||
    templateId === 'report_approved' ||
    templateId === 'sponsor_welcome' ||
    templateId === 'payment_registered'
  ) {
    return prefs[templateId];
  }
  return false;
}

export function portalSectionForTemplate(templateId: SystemTemplateId): string {
  if (templateId === 'inquiry_answered') return 'sporsmaal';
  if (templateId === 'report_approved') return 'rapporter';
  if (templateId === 'payment_registered') return 'okonomi';
  return 'oversikt';
}
