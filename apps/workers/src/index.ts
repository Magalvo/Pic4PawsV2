import { appConfig, parseEnvironmentConfig, type EnvironmentRecord } from '@pic4paws/config';
import { createWorkerMediaUploadIntent, type MediaUploadSigner } from './media-upload';
import {
  handleWorkerPetDraftRequest,
  matchWorkerPetDraftRoute,
  type PetDraftRepository,
  type PetPublishRepository,
  type WorkerPetDraftAuthenticator,
} from './pet-drafts';
export {
  createSupabasePetRepositories,
  SupabasePetRepositoryError,
} from './pet-supabase';
export type {
  SupabaseClientLike,
  SupabaseQueryResult,
  SupabaseTableQueryLike,
} from './pet-supabase';

export { createWorkerMediaUploadIntent } from './media-upload';
export type { MediaUploadSigner, MediaUploadSignerInput } from './media-upload';
export { handleWorkerPetDraftRequest, matchWorkerPetDraftRoute } from './pet-drafts';
export type { PetDraftRepository, PetPublishRepository, WorkerPetDraftAuthenticator } from './pet-drafts';

export type WorkerEnv = EnvironmentRecord;
export type WorkerRequestDependencies = {
  mediaUploadSigner?: MediaUploadSigner;
  petDraftAuthenticator?: WorkerPetDraftAuthenticator;
  petDraftRepository?: PetDraftRepository;
  petPublishRepository?: PetPublishRepository;
  now?: () => string;
};

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const parseJsonBody = async (request: Request): Promise<unknown | null> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

export const handleWorkerRequest = async (
  request: Request,
  env: WorkerEnv,
  dependencies: WorkerRequestDependencies = {},
): Promise<Response> => {
  const parsedConfig = parseEnvironmentConfig(env);

  if (!parsedConfig.ok) {
    return jsonResponse(
      {
        status: 'configuration_error',
        errors: parsedConfig.errors,
      },
      { status: 500 },
    );
  }

  const config = parsedConfig.config;
  const url = new URL(request.url);
  const petDraftRoute = matchWorkerPetDraftRoute(url.pathname, config);

  if (url.pathname === '/health') {
    return jsonResponse({
      status: 'ok',
      service: appConfig.serviceName,
      environment: config.app.environment,
    });
  }

  if (url.pathname === config.workers.paymentWebhookPath) {
    if (request.method !== 'POST') {
      return jsonResponse(
        {
          status: 'method_not_allowed',
          allowedMethods: ['POST'],
        },
        {
          status: 405,
          headers: { Allow: 'POST' },
        },
      );
    }

    const payload = await parseJsonBody(request);

    if (payload === null) {
      return jsonResponse({ status: 'invalid_json' }, { status: 400 });
    }

    return jsonResponse(
      {
        status: 'provider_adapter_not_configured',
        provider: config.payments.primaryProvider,
      },
      { status: 501 },
    );
  }

  if (url.pathname === config.workers.mediaUploadPath) {
    if (request.method !== 'POST') {
      return jsonResponse(
        {
          status: 'method_not_allowed',
          allowedMethods: ['POST'],
        },
        {
          status: 405,
          headers: { Allow: 'POST' },
        },
      );
    }

    const payload = await parseJsonBody(request);

    if (payload === null) {
      return jsonResponse({ status: 'invalid_json' }, { status: 400 });
    }

    const uploadIntent = createWorkerMediaUploadIntent({
      payload,
      config,
      now: dependencies.now?.() ?? new Date().toISOString(),
      signer: dependencies.mediaUploadSigner,
    });
    const resolvedUploadIntent = await uploadIntent;

    if (!resolvedUploadIntent.ok) {
      return jsonResponse(
        {
          status: resolvedUploadIntent.status,
          reasons: resolvedUploadIntent.reasons,
        },
        { status: resolvedUploadIntent.status === 'upload_signer_failed' ? 502 : 400 },
      );
    }

    return jsonResponse(resolvedUploadIntent.intent, {
      status: resolvedUploadIntent.intent.status === 'upload_ready' ? 200 : 501,
    });
  }

  if (petDraftRoute.matched) {
    const payload = await parseJsonBody(request);

    if (payload === null) {
      return jsonResponse({ status: 'invalid_json' }, { status: 400 });
    }

    return handleWorkerPetDraftRequest({
      request,
      config,
      payload,
      route: petDraftRoute,
      dependencies: {
        petDraftAuthenticator: dependencies.petDraftAuthenticator,
        petDraftRepository: dependencies.petDraftRepository,
        petPublishRepository: dependencies.petPublishRepository,
        now: dependencies.now,
      },
    });
  }

  return jsonResponse({ message: 'Not found' }, { status: 404 });
};

export default {
  fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return handleWorkerRequest(request, env);
  },
};
