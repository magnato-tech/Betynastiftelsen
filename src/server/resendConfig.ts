import type { EmailEnv } from './sendEmail';

export function resendConfigStatus(env: EmailEnv): {
  ok: true;
  configured: boolean;
  from: string;
} {
  return {
    ok: true,
    configured: Boolean(env.RESEND_API_KEY?.trim()),
    from: env.EMAIL_FROM?.trim() || env.NEWSLETTER_FROM?.trim() || 'Betyna <nyhetsbrev@betyna.no>',
  };
}
