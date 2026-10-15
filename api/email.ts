import { dispatchEmail, resendConfigStatus } from './_lib/mail';

type ApiReq = { method?: string; body?: unknown };
type ApiRes = {
  status: (code: number) => ApiRes;
  json: (body: unknown) => void;
};

function env() {
  return {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEWSLETTER_FROM: process.env.NEWSLETTER_FROM,
    EMAIL_FROM: process.env.EMAIL_FROM,
  };
}

export default async function handler(req: ApiReq, res: ApiRes) {
  try {
    if (req.method === 'GET') {
      res.status(200).json(resendConfigStatus(env()));
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, message: 'Kun GET eller POST.' });
      return;
    }

    const result = await dispatchEmail(req.body, env());
    res.status(result.status).json(result.json);
  } catch (err) {
    res.status(500).json({
      ok: false,
      code: 'FUNCTION_ERROR',
      message: err instanceof Error ? err.message : 'Ukjent feil i e-postfunksjonen.',
    });
  }
}
