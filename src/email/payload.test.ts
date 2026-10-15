import { describe, expect, it } from 'vitest';
import { parseEmailPayload } from './payload';
import { dispatchEmail } from '../server/sendEmail';
import { fillTemplate, SYSTEM_EMAIL_TEMPLATES } from './templates';

describe('E-post: henvendelse, system og nyhetsbrev', () => {
  it('krever e-postadresser', () => {
    expect(
      parseEmailPayload({
        kind: 'inquiry',
        subject: 'Svar fra Betyna',
        html: 'Takk for henvendelsen din.',
        emails: [],
      }).ok
    ).toBe(false);
  });

  it('godtar henvendelse uten audience', () => {
    const r = parseEmailPayload({
      kind: 'inquiry',
      subject: 'Svar fra Betyna',
      html: 'Takk for henvendelsen din.',
      emails: ['kari@example.no'],
      relatedId: 'inq-1',
    });
    expect(r.ok).toBe(true);
  });

  it('systemmal fyller navn', () => {
    const t = SYSTEM_EMAIL_TEMPLATES.find((x) => x.id === 'report_approved')!;
    expect(fillTemplate(t.body, 'Kari')).toContain('Hei Kari');
  });

  it('uten RESEND_API_KEY: 503 for systemmelding', async () => {
    const result = await dispatchEmail(
      {
        kind: 'system',
        subject: 'Ny rapport om barnet du følger',
        html: 'Hei Kari, en ny skoleoppdatering er klar.',
        emails: ['kari@example.no'],
        templateId: 'report_approved',
      },
      {}
    );
    expect(result.status).toBe(503);
    expect(result.json.code).toBe('NOT_CONFIGURED');
    expect(result.json.kind).toBe('system');
  });
});
