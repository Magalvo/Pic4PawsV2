import { handleWorkerDonationRequest } from '../donation';
import {
  handleWorkerDonationStatusRequest,
  matchWorkerDonationStatusId,
} from '../donation-status';
import type { WorkerRequestDependencies } from '../dependencies';
import { jsonResponse, parseJsonBody } from './shared';
import type { WorkerParsedConfig } from './shared';

export const handle = async (
  request: Request,
  config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);

  const donationStatusId = matchWorkerDonationStatusId(
    url.pathname,
    config.workers.donationsPath,
  );

  if (donationStatusId !== null) {
    return handleWorkerDonationStatusRequest({
      request,
      donationId: donationStatusId,
      donationStatusRepository: dependencies.donationStatusRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  if (url.pathname !== config.workers.donationsPath) return null;

  const payload = await parseJsonBody(request);

  if (payload === null && request.method === 'POST') {
    return jsonResponse({ status: 'invalid_json' }, { status: 400 });
  }

  return handleWorkerDonationRequest({
    request,
    payload,
    donationRepository: dependencies.donationRepository,
    authenticator: dependencies.petDraftAuthenticator,
    provider: config.payments.primaryProvider,
    now: dependencies.now?.() ?? new Date().toISOString(),
  });
};
