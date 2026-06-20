import { handleWorkerPaymentWebhookRequest } from '../payment-webhook';
import {
  resolveWorkerRequestDependencies,
  WorkerSupabaseWiringError,
  type WorkerRequestDependencies,
} from '../dependencies';
import { jsonResponse } from './shared';
import type { WorkerParsedConfig } from './shared';

const providerWebhookMethods = {
  eupago: 'POST',
  ifthenpay: 'GET',
  stripe: 'POST',
} as const;

export const handle = async (
  request: Request,
  config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);
  if (url.pathname !== config.workers.paymentWebhookPath) return null;
  const provider = config.payments.primaryProvider;
  const allowedMethod = providerWebhookMethods[provider];

  if (request.method !== allowedMethod) {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: [allowedMethod] },
      { status: 405, headers: { Allow: allowedMethod } },
    );
  }

  const rawBody = await request.text();
  if (!config.payments.webhooksEnabled) {
    return jsonResponse({ status: 'payment_webhooks_disabled', provider }, { status: 503 });
  }

  let resolvedDependencies = dependencies;
  if (dependencies.paymentWebhookVerifier && !dependencies.paymentWebhookRepository) {
    try {
      resolvedDependencies = resolveWorkerRequestDependencies({ config, dependencies });
    } catch (error) {
      if (error instanceof WorkerSupabaseWiringError) {
        return jsonResponse({ status: 'dependency_configuration_error' }, { status: 500 });
      }
      throw error;
    }
  }

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
    paymentWebhookVerifier: resolvedDependencies.paymentWebhookVerifier,
    paymentWebhookRepository: resolvedDependencies.paymentWebhookRepository,
    notificationRepository: resolvedDependencies.notificationRepository,
    now: resolvedDependencies.now?.() ?? new Date().toISOString(),
  });
};
