export interface EmailApiResult {
  ok?: boolean;
  code?: string;
  message?: string;
  sent?: number;
  kind?: string;
  id?: string;
}

export async function fetchResendStatus(): Promise<{ configured: boolean; from: string }> {
  const res = await fetch('/api/email');
  const json = (await res.json()) as { configured?: boolean; from?: string };
  return {
    configured: Boolean(json.configured),
    from: json.from || 'Betyna <nyhetsbrev@betyna.no>',
  };
}

export async function postBetynaEmail(payload: Record<string, unknown>): Promise<{
  status: number;
  json: EmailApiResult;
}> {
  const res = await fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as EmailApiResult;
  return { status: res.status, json };
}
