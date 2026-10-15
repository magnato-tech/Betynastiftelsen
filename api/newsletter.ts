import { dispatchNewsletter } from './_lib/mail';

type ApiReq = { method?: string; body?: unknown };
type ApiRes = {
  status: (code: number) => ApiRes;
  json: (body: unknown) => void;
};

export default async function handler(req: ApiReq, res: ApiRes) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, message: 'Kun POST.' });
      return;
    }

    const result = await dispatchNewsletter(req.body, {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      NEWSLETTER_FROM: process.env.NEWSLETTER_FROM,
      EMAIL_FROM: process.env.EMAIL_FROM,
    });
    res.status(result.status).json(result.json);
  } catch (err) {
    res.status(500).json({
      ok: false,
      code: 'FUNCTION_ERROR',
      message: err instanceof Error ? err.message : 'Ukjent feil i nyhetsbrevfunksjonen.',
    });
  }
}
