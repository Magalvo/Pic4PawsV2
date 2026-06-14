import { handleWorkerPaymentWebhookRequest } from '../payment-webhook';
import type { WorkerRequestDependencies } from '../dependencies';
import { jsonResponse } from './shared';
import type { WorkerParsedConfig } from './shared';

export const handle = async (
  request: Request,
  config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);
  if (url.pathname !== config.workers.paymentWebhookPath) return null;

  if (request.method !== 'POST') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['POST'] },
      { status: 405, headers: { Allow: 'POST' } },
    );
  }

  const rawBody = await request.text();
  const provider = config.payments.primaryProvider;
  const webhookSecretMap: Record<string, string | null> = {
    eupago: config.payments.eupagoWebhookSecret,
    ifthenpay: config.payments.ifthenpayWebhookSecret,
    stripe: config.payments.stripeWebhookSecret,
  };
  const webhookSecret = webhookSecretMap[provider] ?? '';

  return handleWorkerPaymentWebhookRequest({
    request,
    rawBody,
    provider,
    webhookSecret,
    paymentWebhookVerifier: dependencies.paymentWebhookVerifier,
    paymentWebhookRepository: dependencies.paymentWebhookRepository,
    notificationRepository: dependencies.notificationRepository,
    now: dependencies.now?.() ?? new Date().toISOString(),
  });
};
