import {
  canPersistMediaUploadIntentForActor,
  createWorkerMediaUploadIntent,
  persistWorkerMediaUploadIntent,
} from '../media-upload';
import { handleWorkerMediaUrlRequest, matchWorkerMediaUrlPath } from '../media-url';
import type { WorkerRequestDependencies } from '../dependencies';
import { jsonResponse, parseJsonBody, authenticateWorkerActor } from './shared';
import type { WorkerParsedConfig } from './shared';

export const handle = async (
  request: Request,
  config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);

  // GET /media/:mediaId/url — signed download URL
  const mediaId = matchWorkerMediaUrlPath(url.pathname, config.workers.mediaUrlPath);
  if (mediaId !== null) {
    if (request.method !== 'GET') {
      return jsonResponse(
        { status: 'method_not_allowed', allowedMethods: ['GET'] },
        { status: 405, headers: { Allow: 'GET' } },
      );
    }

    if (!dependencies.mediaAssetReadRepository) {
      return jsonResponse({ status: 'download_signer_not_configured' }, { status: 501 });
    }

    const result = await handleWorkerMediaUrlRequest({
      mediaId,
      config,
      mediaAssetReadRepository: dependencies.mediaAssetReadRepository,
      mediaDownloadSigner: dependencies.mediaDownloadSigner,
    });

    if (!result.ok) {
      const status =
        result.status === 'not_found' ? 404 :
        result.status === 'forbidden' ? 403 :
        501;
      return jsonResponse({ status: result.status }, { status });
    }

    return jsonResponse(
      { url: result.url, expiresAt: result.expiresAt, mediaId: result.mediaId },
      { status: 200 },
    );
  }

  if (url.pathname !== config.workers.mediaUploadPath) return null;

  if (request.method !== 'POST') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['POST'] },
      { status: 405, headers: { Allow: 'POST' } },
    );
  }

  const payload = await parseJsonBody(request);
  if (payload === null) return jsonResponse({ status: 'invalid_json' }, { status: 400 });

  const requiresAuthenticatedActor = Boolean(
    dependencies.mediaUploadSigner || dependencies.mediaAssetRepository,
  );
  const authenticated = requiresAuthenticatedActor
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
      {
        status:
          resolvedUploadIntent.status === 'upload_signer_failed'
            ? 502
            : resolvedUploadIntent.status === 'upload_signer_not_configured'
              ? 501
              : 400,
      },
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
