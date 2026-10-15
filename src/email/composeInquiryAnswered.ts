import { composeSystemEmail } from './composeSystemEmail';

export function composeInquiryAnsweredEmail(input: {
  inquiryId: string;
  sponsorId: string;
  sponsorName: string;
  sponsorEmail: string;
  origin: string;
}) {
  return composeSystemEmail({
    templateId: 'inquiry_answered',
    relatedId: input.inquiryId,
    sponsorId: input.sponsorId,
    sponsorName: input.sponsorName,
    sponsorEmail: input.sponsorEmail,
    origin: input.origin,
  });
}
