import { handleWorkerAdoptionRequest } from '../adoption';
import { handleWorkerAdoptionDonorListRequest } from '../adoption-donor-list';
import {
  handleWorkerAdoptionStatusRequest,
  matchWorkerAdoptionStatusId,
} from '../adoption-status';
import { handleWorkerAdoptionViewRequest } from '../adoption-view';
import type { WorkerRequestDependencies } from '../dependencies';
import { jsonResponse, parseJsonBody } from './shared';
import type { WorkerParsedConfig } from './shared';

export const handle = async (
  request: Request,
  config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);

  const adoptionApplicationId = matchWorkerAdoptionStatusId(
    url.pathname,
    config.workers.adoptionsPath,
  );

  if (adoptionApplicationId !== null) {
    if (request.method === 'PATCH') {
      const payload = await parseJsonBody(request);
      return handleWorkerAdoptionStatusRequest({
        request,
        applicationId: adoptionApplicationId,
        payload,
        adoptionStatusRepository: dependencies.adoptionStatusRepository,
        authenticator: dependencies.petDraftAuthenticator,
        notificationRepository: dependencies.notificationRepository,
      });
    }
    if (request.method === 'GET') {
      return handleWorkerAdoptionViewRequest({
        request,
        applicationId: adoptionApplicationId,
        adoptionViewRepository: dependencies.adoptionViewRepository,
        authenticator: dependencies.petDraftAuthenticator,
      });
    }
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET', 'PATCH'] },
      { status: 405, headers: { Allow: 'GET, PATCH' } },
    );
  }

  if (url.pathname !== config.workers.adoptionsPath) return null;

  if (request.method === 'GET') {
    return handleWorkerAdoptionDonorListRequest({
      request,
      adoptionDonorListRepository: dependencies.adoptionDonorListRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const payload = await parseJsonBody(request);

  if (payload === null && request.method === 'POST') {
    return jsonResponse({ status: 'invalid_json' }, { status: 400 });
  }

  return handleWorkerAdoptionRequest({
    request,
    payload,
    adoptionRepository: dependencies.adoptionRepository,
    authenticator: dependencies.petDraftAuthenticator,
    notificationRepository: dependencies.notificationRepository,
    now: dependencies.now?.() ?? new Date().toISOString(),
  });
};
