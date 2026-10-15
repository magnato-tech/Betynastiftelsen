import { describe, expect, it } from 'vitest';
import { parseNewsletterPayload } from './payload';
import { dispatchNewsletter } from '../server/sendNewsletter';

describe('ADM-10 nyhetsbrev payload', () => {
  it('avviser tomt emne og tom liste', () => {
    expect(parseNewsletterPayload({ subject: 'Hei', html: 'Lang nok tekst her', audience: 'sponsors', emails: [] }).ok).toBe(
      false
    );
    expect(parseNewsletterPayload({ subject: 'Hi', html: 'Kort', audience: 'sponsors', emails: ['a@b.no'] }).ok).toBe(false);
  });

  it('godtar gyldig utkast', () => {
    const r = parseNewsletterPayload({
      subject: 'Høst fra Brazzaville',
      html: 'Kjære faddere, her er en kort oppdatering.',
      audience: 'sponsors',
      emails: ['kari@example.no'],
    });
    expect(r.ok).toBe(true);
  });

  it('ADM-10: uten RESEND_API_KEY er sending forberedt men ikke utført', async () => {
    const result = await dispatchNewsletter(
      {
        subject: 'Høst fra Brazzaville',
        html: 'Kjære faddere, her er en kort oppdatering.',
        audience: 'sponsors',
        emails: ['kari@example.no'],
      },
      {}
    );
    expect(result.status).toBe(503);
    expect(result.json.code).toBe('NOT_CONFIGURED');
    expect(result.json.preparedRecipients).toBe(1);
  });
});
