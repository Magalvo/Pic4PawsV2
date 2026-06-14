import {
  canPersistMediaUploadIntentForActor,
  createWorkerMediaUploadIntent,
  persistWorkerMediaUploadIntent,
} from '../media-upload';
import type { WorkerRequestDependencies } from '../dependencies';
import { jsonResponse, parseJsonBody, authenticateWorkerActor } from './shared';
import type { WorkerParsedConfig } from './shared';

export const handle = async (
  request: Request,
  config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);
  if (url.pathname !== config.workers.mediaUploadPath) return null;

  if (request.method !== 'POST') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['POST'] },
      { status: 405, headers: { Allow: 'POST' } },
    );
  }

  const payload = await parseJsonBody(request);
  if (payload === null) return jsonResponse({ status: 'invalid_json' }, { status: 400 });

  const authenticated = dependencies.mediaAssetRepository
    ? await authenticateWorkerActor(request, dependencies)
    : null;

  if (authenticated && !authenticated.ok) return authenticated.response;

  const resolvedUploadIntent = await createWorkerMediaUploadIntent({
    payload,
    config,
    now: dependencies.now?.() ?? new Date().toISOString(),
    signer: dependencies.mediaUploadSigner,
  });

  if (!resolvedUploadIntent.ok) {
    return jsonResponse(
      { status: resolvedUploadIntent.status, reasons: resolvedUploadIntent.reasons },
      { status: resolvedUploadIntent.status === 'upload_signer_failed' ? 502 : 400 },
    );
  }

  if (dependencies.mediaAssetRepository && authenticated?.ok) {
    if (!canPersistMediaUploadIntentForActor(authenticated.actor, resolvedUploadIntent.intent)) {
      return jsonResponse(
        { status: 'actor_not_authorized', reasons: ['actor_not_authorized'] },
        { status: 403 },
      );
    }

    const persistedMedia = await persistWorkerMediaUploadIntent({
      intent: resolvedUploadIntent.intent,
      actor: authenticated.actor,
      repository: dependencies.mediaAssetRepository,
    });

    if (!persistedMedia.ok) {
      return jsonResponse(
        { status: persistedMedia.status, reasons: persistedMedia.reasons },
        { status: persistedMedia.status === 'media_asset_persistence_failed' ? 502 : 400 },
      );
    }

    return jsonResponse(
      {
        ...resolvedUploadIntent.intent,
        mediaAssetId: persistedMedia.mediaAssetId,
        mediaAssetPersisted: true,
      },
      { status: 201 },
    );
  }

  return jsonResponse(resolvedUploadIntent.intent, {
    status: resolvedUploadIntent.intent.status === 'upload_ready' ? 200 : 501,
  });
};
