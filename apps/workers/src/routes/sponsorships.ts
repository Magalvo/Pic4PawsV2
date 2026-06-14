import { handleWorkerSponsorshipRequest } from '../sponsorship';
import { handleWorkerSponsorshipDonorListRequest } from '../sponsorship-donor-list';
import {
  handleWorkerSponsorshipManageRequest,
  matchWorkerSponsorshipManageId,
} from '../sponsorship-manage';
import type { WorkerRequestDependencies } from '../dependencies';
import { jsonResponse, parseJsonBody } from './shared';
import type { WorkerParsedConfig } from './shared';

export const handle = async (
  request: Request,
  config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);

  const sponsorshipManageId = matchWorkerSponsorshipManageId(
    url.pathname,
    config.workers.sponsorshipsPath,
  );

  if (sponsorshipManageId !== null) {
    const payload = await parseJsonBody(request);
    return handleWorkerSponsorshipManageRequest({
      request,
      sponsorshipId: sponsorshipManageId,
      payload,
      sponsorshipManageRepository: dependencies.sponsorshipManageRepository,
      authenticator: dependencies.petDraftAuthenticator,
      notificationRepository: dependencies.notificationRepository,
    });
  }

  if (url.pathname !== config.workers.sponsorshipsPath) return null;

  if (request.method === 'GET') {
    return handleWorkerSponsorshipDonorListRequest({
      request,
      sponsorshipDonorListRepository: dependencies.sponsorshipDonorListRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const payload = await parseJsonBody(request);

  if (payload === null && request.method === 'POST') {
    return jsonResponse({ status: 'invalid_json' }, { status: 400 });
  }

  return handleWorkerSponsorshipRequest({
    request,
    payload,
    sponsorshipRepository: dependencies.sponsorshipRepository,
    authenticator: dependencies.petDraftAuthenticator,
    provider: config.payments.primaryProvider,
    now: dependencies.now?.() ?? new Date().toISOString(),
  });
};
