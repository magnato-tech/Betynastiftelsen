import { dispatchEmail } from '../src/server/sendEmail';
import { resendConfigStatus } from '../src/server/resendConfig';

type ApiReq = { method?: string; body?: unknown };
type ApiRes = {
  status: (code: number) => ApiRes;
  json: (body: unknown) => void;
};

const env = () => ({
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NEWSLETTER_FROM: process.env.NEWSLETTER_FROM,
  EMAIL_FROM: process.env.EMAIL_FROM,
});

export default async function handler(req: ApiReq, res: ApiRes) {
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
}
