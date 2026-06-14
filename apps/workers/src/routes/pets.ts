import { handleWorkerPetFeedRequest } from '../pet-feed';
import { handleWorkerPetProfileRequest, matchWorkerPetProfileId } from '../pet-profile';
import { handleWorkerPetDraftRequest, matchWorkerPetDraftRoute } from '../pet-drafts';
import { handleWorkerPetDraftLoadRequest } from '../pet-draft-load';
import {
  handleWorkerPetArchiveRequest,
  handleWorkerPetStatusHistoryRequest,
  matchWorkerPetArchiveId,
  matchWorkerPetStatusHistoryId,
} from '../pet-archive';
import {
  resolveWorkerRequestDependencies,
  WorkerSupabaseWiringError,
  type WorkerRequestDependencies,
} from '../dependencies';
import { jsonResponse, parseJsonBody } from './shared';
import type { WorkerParsedConfig } from './shared';

export const handle = async (
  request: Request,
  config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);
  const petDraftRoute = matchWorkerPetDraftRoute(url.pathname, config);

  if (url.pathname === config.workers.petFeedPath) {
    return handleWorkerPetFeedRequest({
      request,
      petFeedRepository: dependencies.petFeedRepository,
    });
  }

  if (petDraftRoute.matched) {
    let resolvedDependencies: WorkerRequestDependencies;
    try {
      resolvedDependencies = resolveWorkerRequestDependencies({ config, dependencies });
    } catch (error) {
      if (error instanceof WorkerSupabaseWiringError) {
        return jsonResponse({ status: 'dependency_configuration_error' }, { status: 500 });
      }
      throw error;
    }

    if (request.method === 'GET' && petDraftRoute.operation === 'update') {
      return handleWorkerPetDraftLoadRequest({
        request,
        petId: petDraftRoute.petId,
        petDraftRepository: resolvedDependencies.petDraftRepository,
        authenticator: resolvedDependencies.petDraftAuthenticator,
      });
    }

    const payload = await parseJsonBody(request);
    if (payload === null) return jsonResponse({ status: 'invalid_json' }, { status: 400 });

    return handleWorkerPetDraftRequest({
      request,
      config,
      payload,
      route: petDraftRoute,
      dependencies: {
        petDraftAuthenticator: resolvedDependencies.petDraftAuthenticator,
        petDraftRepository: resolvedDependencies.petDraftRepository,
        petMediaAttachRepository: resolvedDependencies.petMediaAttachRepository,
        petPublishRepository: resolvedDependencies.petPublishRepository,
        now: resolvedDependencies.now,
      },
    });
  }

  const statusHistoryPetId = matchWorkerPetStatusHistoryId(url.pathname, config.workers.petFeedPath);
  if (statusHistoryPetId !== null) {
    return handleWorkerPetStatusHistoryRequest({
      request,
      petId: statusHistoryPetId,
      petArchiveRepository: dependencies.petArchiveRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const archivePetId = matchWorkerPetArchiveId(url.pathname, config.workers.petFeedPath);
  if (archivePetId !== null) {
    const archivePayload = await parseJsonBody(request);
    return handleWorkerPetArchiveRequest({
      request,
      petId: archivePetId,
      payload: archivePayload,
      petArchiveRepository: dependencies.petArchiveRepository,
      authenticator: dependencies.petDraftAuthenticator,
      now: dependencies.now?.() ?? new Date().toISOString(),
    });
  }

  const profilePetId = matchWorkerPetProfileId(url.pathname, config.workers.petFeedPath);
  if (profilePetId !== null) {
    return handleWorkerPetProfileRequest({
      request,
      petId: profilePetId,
      petProfileRepository: dependencies.petProfileRepository,
    });
  }

  return null;
};
