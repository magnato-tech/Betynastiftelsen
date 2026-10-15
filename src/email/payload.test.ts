import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it('kaller Resend HTTP når nøkkel er satt', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 're_test_id' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await dispatchEmail(
      {
        kind: 'system',
        subject: 'Svar på spørsmålet ditt hos Betyna',
        html: 'Hei Magnar, det ligger et svar på faddersiden.',
        emails: ['magnar.totland@gmail.com'],
        templateId: 'inquiry_answered',
      },
      { RESEND_API_KEY: 're_test', EMAIL_FROM: 'Betyna <varsel@betyna.no>' }
    );
    expect(result.status).toBe(200);
    expect(result.json.id).toBe('re_test_id');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
