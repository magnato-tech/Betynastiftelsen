import { describe, expect, it } from 'vitest';
import { composeInquiryAnsweredEmail } from './composeInquiryAnswered';
import { parseSponsorPortalLink } from './sponsorPortalLink';

describe('Systemmelding når svar publiseres', () => {
  it('lager e-post med innloggingslenke, uten sværteksten', () => {
    const mail = composeInquiryAnsweredEmail({
      inquiryId: 'inq-01',
      sponsorId: 'sponsor-01',
      sponsorName: 'Kari Johansen',
      sponsorEmail: 'kari@example.no',
      origin: 'http://localhost:3000',
    });
    expect(mail.ok).toBe(true);
    if (!mail.ok) return;
    expect(mail.subject).toContain('Svar på spørsmålet');
    expect(mail.html).toContain('Kari Johansen');
    expect(mail.html).toContain('portal=sponsor');
    expect(mail.html).toContain('sponsor=sponsor-01');
    expect(mail.html).toContain('seksjon=sporsmaal');
    expect(mail.html).not.toContain('malaria');
    expect(mail.templateId).toBe('inquiry_answered');
  });

  it('avviser ugyldig e-post', () => {
    expect(
      composeInquiryAnsweredEmail({
        inquiryId: 'inq-01',
        sponsorId: 'sponsor-01',
        sponsorName: 'Kari',
        sponsorEmail: 'ikke-en-epost',
        origin: 'http://localhost:3000',
      }).ok
    ).toBe(false);
  });

  it('lenken åpner fadderportal i prototypen', () => {
    const parsed = parseSponsorPortalLink('?portal=sponsor&sponsor=sponsor-01&seksjon=sporsmaal');
    expect(parsed).toEqual({ sponsorId: 'sponsor-01', section: 'sporsmaal' });
  });
});
