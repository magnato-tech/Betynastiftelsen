import { createRequire } from 'node:module';
import { vi } from 'vitest';

const require = createRequire(import.meta.url);

export type Handler = (req: unknown, res: unknown) => Promise<void>;

export const emailHandler: Handler = require('../../api/email.js');
export const newsletterHandler: Handler = require('../../api/newsletter.js');

export interface FakeRes {
  statusCode: number;
  body: any;
  status(code: number): FakeRes;
  json(payload: unknown): FakeRes;
}

export function fakeRes(): FakeRes {
  const res: FakeRes = {
    statusCode: 0,
    body: undefined,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

export async function call(handler: Handler, method: string, body?: unknown) {
  const res = fakeRes();
  await handler({ method, body }, res);
  return res;
}

export function setEnv(vars: Record<string, string | undefined>) {
  for (const key of ['RESEND_API_KEY', 'EMAIL_FROM', 'NEWSLETTER_FROM']) {
    delete process.env[key];
  }
  for (const [k, v] of Object.entries(vars)) {
    if (v !== undefined) process.env[k] = v;
  }
}

export function mockResend(response: { ok?: boolean; status?: number; json?: unknown } = {}) {
  const fn = vi.fn(async () => ({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.json ?? { id: 'msg_1' },
  }));
  vi.stubGlobal('fetch', fn);
  return fn;
}

export function lastResendCall(fn: ReturnType<typeof mockResend>) {
  const call = fn.mock.calls.at(-1) as unknown as [string, { headers: Record<string, string>; body: string }];
  return { url: call[0], headers: call[1].headers, payload: JSON.parse(call[1].body) };
}
