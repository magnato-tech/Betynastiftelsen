import { parseEmailPayload } from '../email/payload';
import { parseNewsletterPayload, wrapNewsletterHtml } from '../newsletter/payload';
import { dispatchEmail, type EmailEnv } from './sendEmail';

export type NewsletterEnv = EmailEnv;

export async function dispatchNewsletter(
  body: unknown,
  env: NewsletterEnv
): Promise<{ status: number; json: Record<string, unknown> }> {
  const asNewsletter =
    body && typeof body === 'object' && !('kind' in (body as object))
      ? { ...(body as object), kind: 'newsletter' }
      : body;
  return dispatchEmail(asNewsletter, env);
}

export { parseNewsletterPayload, wrapNewsletterHtml, parseEmailPayload };
