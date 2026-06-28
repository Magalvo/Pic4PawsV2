import { handleWorkerPaymentWebhookRequest } from '../payment-webhook';
import type { WorkerRequestDependencies } from '../dependencies';
import { resolveWorkerRequestDependencies } from '../dependencies';
import { createIfthenpayWebhookVerifier } from '../ifthenpay-verifier';
import { createEupagoVerifier } from '../eupago-verifier';
import { decryptCredential } from '../crypto';
import { jsonResponse } from './shared';
import type { WorkerParsedConfig } from './shared';

export const handle = async (
  request: Request,
  config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);
  const basePath = config.workers.paymentWebhookPath;
  const { pathname } = url;

  if (!pathname.startsWith(basePath)) return null;

  const subPath = pathname.slice(basePath.length);

  // ── 1. Ifthenpay route: GET /webhooks/payments/ifthenpay ─────────────────────
  if (subPath === '/ifthenpay') {
    if (request.method !== 'GET') {
      return jsonResponse(
        { status: 'method_not_allowed', allowedMethods: ['GET'] },
        { status: 405, headers: { Allow: 'GET' } },
      );
    }

    if (!config.payments.webhooksEnabled) {
      return jsonResponse(
        { status: 'payment_webhooks_disabled', provider: 'ifthenpay' },
        { status: 503 },
      );
    }

    const rawBody = await request.text();
    const requestId = url.searchParams.get('requestId');
    const resolved = resolveWorkerRequestDependencies({ config, dependencies });

    let antiPhishingKey: string | null = null;
    if (requestId && resolved.eupagoWebhookRepository) {
      const shelterId = await resolved.eupagoWebhookRepository
        .getShelterId(requestId)
        .catch(() => null);
      antiPhishingKey = shelterId
        ? await resolved.eupagoWebhookRepository
            .getIfthenpayAntiPhishingKey(shelterId)
            .catch(() => null)
        : null;
    }

    if (!antiPhishingKey) {
      return jsonResponse({ status: 'webhook_signature_invalid' }, { status: 401 });
    }

    return handleWorkerPaymentWebhookRequest({
      request,
      rawBody,
      provider: 'ifthenpay',
      webhookSecret: antiPhishingKey,
      paymentWebhookVerifier:
        resolved.paymentWebhookVerifier ?? createIfthenpayWebhookVerifier(),
      paymentWebhookRepository: resolved.paymentWebhookRepository,
      notificationRepository: resolved.notificationRepository,
      now: resolved.now?.() ?? new Date().toISOString(),
    });
  }

  // ── 2. Eupago route: POST /webhooks/payments/eupago ──────────────────────────
  if (subPath === '/eupago') {
    if (request.method !== 'POST') {
      return jsonResponse(
        { status: 'method_not_allowed', allowedMethods: ['POST'] },
        { status: 405, headers: { Allow: 'POST' } },
      );
    }

    if (!config.payments.webhooksEnabled) {
      return jsonResponse(
        { status: 'payment_webhooks_disabled', provider: 'eupago' },
        { status: 503 },
      );
    }

    const rawBody = await request.text();

    let transactionId: string | null = null;
    try {
      const body = JSON.parse(rawBody) as Record<string, unknown>;
      transactionId = typeof body.transactionId === 'string' ? body.transactionId : null;
    } catch { /* keep null */ }

    const resolved = resolveWorkerRequestDependencies({ config, dependencies });
    let decryptedSecret: string | null = null;

    if (transactionId && resolved.eupagoWebhookRepository) {
      const shelterId = await resolved.eupagoWebhookRepository
        .getShelterId(transactionId)
        .catch(() => null);
      const encryptedSecret = shelterId
        ? await resolved.eupagoWebhookRepository
            .getEncryptedEupagoWebhookSecret(shelterId)
            .catch(() => null)
        : null;
      if (encryptedSecret && config.payments.encryptionSecret) {
        decryptedSecret = await decryptCredential(
          encryptedSecret,
          config.payments.encryptionSecret,
        ).catch(() => null);
      }
    }

    if (!decryptedSecret) {
      return jsonResponse({ status: 'webhook_signature_invalid' }, { status: 401 });
    }

    return handleWorkerPaymentWebhookRequest({
      request,
      rawBody,
      provider: 'eupago',
      webhookSecret: decryptedSecret,
      paymentWebhookVerifier: resolved.paymentWebhookVerifier ?? createEupagoVerifier(),
      paymentWebhookRepository: resolved.paymentWebhookRepository,
      notificationRepository: resolved.notificationRepository,
      now: resolved.now?.() ?? new Date().toISOString(),
    });
  }

  // ── 3. Legacy path: GET|POST /webhooks/payments → 410 Gone ───────────────────
  if (subPath === '') {
    const hint =
      request.method === 'GET'
        ? 'Use GET /webhooks/payments/ifthenpay'
        : 'Use POST /webhooks/payments/eupago';
    return jsonResponse({ status: 'gone', message: hint }, { status: 410 });
  }

  return null;
};
