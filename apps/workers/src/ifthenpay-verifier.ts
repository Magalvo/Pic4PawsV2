import type { PaymentWebhookVerifier, ParsedWebhookEvent } from './payment-webhook';
import type { DonationWebhookStatus } from './payment-webhook';

type IfthenpayWebhookPayload = {
  requestId: string;
  estado: string;
  valor: string;
  dataHora: string;
  referencia?: string;
  entidade?: string;
};

// Ifthenpay estado codes → domain status.
// "000" = successful payment, "020" = MB WAY timeout/cancelled, others = failed.
function mapEstado(estado: string): DonationWebhookStatus {
  if (estado === '000') return 'paid';
  if (estado === '020') return 'cancelled';
  return 'failed';
}

async function verifyHmacSha256(secret: string, data: string, expected: string): Promise<boolean> {
  if (!expected) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const computed = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Timing-safe comparison
  if (computed.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export const createIfthenpayWebhookVerifier = (): PaymentWebhookVerifier =>
  async ({ rawBody, signatureHeader, secret }): Promise<ParsedWebhookEvent | null> => {
    if (!signatureHeader) return null;

    const valid = await verifyHmacSha256(secret, rawBody, signatureHeader);
    if (!valid) return null;

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const p = payload as Partial<IfthenpayWebhookPayload>;
    if (typeof p.requestId !== 'string' || !p.requestId) return null;
    if (typeof p.estado !== 'string' || !p.estado) return null;

    const full = payload as IfthenpayWebhookPayload;

    return {
      providerEventId: `${full.requestId}:${full.estado}`,
      providerPaymentId: full.requestId,
      newStatus: mapEstado(full.estado),
      payload: payload as Record<string, unknown>,
    };
  };
