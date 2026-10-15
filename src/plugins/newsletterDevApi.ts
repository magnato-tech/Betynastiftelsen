import type { IncomingMessage, ServerResponse } from 'http';
import type { Plugin } from 'vite';
import { dispatchEmail } from '../server/sendEmail';
import { dispatchNewsletter } from '../server/sendNewsletter';
import { resendConfigStatus } from '../server/resendConfig';

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Ugyldig JSON'));
      }
    });
    req.on('error', reject);
  });
}

export function newsletterDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'betyna-newsletter-api',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url?.split('?')[0];
        if (url !== '/api/newsletter' && url !== '/api/email') {
          next();
          return;
        }
        const envVars = {
          RESEND_API_KEY: env.RESEND_API_KEY,
          NEWSLETTER_FROM: env.NEWSLETTER_FROM,
          EMAIL_FROM: env.EMAIL_FROM,
        };

        if (req.method === 'GET' && url === '/api/email') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(resendConfigStatus(envVars)));
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, message: 'Kun GET eller POST.' }));
          return;
        }
        try {
          const body = await readJsonBody(req);
          const result =
            url === '/api/email' ? await dispatchEmail(body, envVars) : await dispatchNewsletter(body, envVars);
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result.json));
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, message: 'Kunne ikke lese forespørselen.' }));
        }
      });
    },
  };
}
