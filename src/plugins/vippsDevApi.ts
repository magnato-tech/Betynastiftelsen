import type { IncomingMessage, ServerResponse } from 'http';
import type { Plugin } from 'vite';
import {
  handleAgreementStatus,
  handleCreateAgreement,
  handleRunChargeJob,
  handleVippsWebhook,
  type WebhookContext,
} from '../server/vippsApiHandlers';

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

const processedWebhookEvents = new Set<string>();

export function vippsDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'betyna-vipps-api',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith('/api/vipps/')) {
          next();
          return;
        }

        try {
          if (req.method === 'GET' && url.startsWith('/api/vipps/recurring/agreement/')) {
            const agreementId = decodeURIComponent(url.split('/').pop() ?? '');
            const result = await handleAgreementStatus(agreementId, env);
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.json));
            return;
          }

          if (req.method === 'POST' && url === '/api/vipps/recurring/agreement') {
            const body = (await readJsonBody(req)) as Record<string, unknown>;
            const result = await handleCreateAgreement(
              {
                sponsorId: String(body.sponsorId ?? ''),
                amountOre: Number(body.amountOre ?? 0),
                phone: String(body.phone ?? ''),
                sponsor: body.sponsor as Parameters<typeof handleCreateAgreement>[0]['sponsor'],
              },
              env
            );
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.json));
            return;
          }

          if (req.method === 'POST' && url === '/api/vipps/webhook') {
            const body = await readJsonBody(req);
            const emptyCtx: WebhookContext = {
              sponsors: [],
              charges: [],
              processedEventIds: processedWebhookEvents,
              assignments: [],
              children: [],
              payments: [],
            };
            const result = await handleVippsWebhook(body, req.headers, env, emptyCtx);
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.json));
            return;
          }

          if (req.method === 'POST' && url === '/api/vipps/recurring/run-charge-job') {
            const body = (await readJsonBody(req)) as { sponsors?: unknown };
            const result = await handleRunChargeJob(
              { sponsors: (body.sponsors as Parameters<typeof handleRunChargeJob>[0]['sponsors']) ?? [] },
              env
            );
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.json));
            return;
          }

          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, message: 'Ukjent Vipps-rute.' }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: false,
              message: err instanceof Error ? err.message : 'Vipps-feil',
            })
          );
        }
      });
    },
  };
}
