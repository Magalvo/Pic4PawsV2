import type {
  MediaUploadPurpose,
  MediaVisibility,
  PetLifecycleSpecies,
  PublicPetMedicalStatus,
} from '@pic4paws/domain';

export type MediaUploadClientRequest = {
  mediaId: string;
  purpose: MediaUploadPurpose;
  requestedVisibility: MediaVisibility;
  mimeType: string;
  byteSize: number;
  ownerUserId?: string | null;
  shelterId?: string | null;
  originalFilename?: string | null;
};

export type MediaUploadClientIntent = {
  status: 'upload_ready' | 'upload_signer_not_configured';
  mediaId: string;
  bucketName: string;
  objectKey: string;
  contentType: string;
  byteSize: number;
  visibility: MediaVisibility;
  mediaKind: 'image' | 'document';
  ownerUserId: string | null;
  shelterId: string | null;
  signedUrl: string | null;
  expiresAt?: string;
  dryRunOnly: boolean;
  createdAt: string;
  mediaAssetId?: string;
  mediaAssetPersisted?: boolean;
  uploadMethod?: 'PUT' | 'POST';
  uploadHeaders?: Record<string, string>;
};

export type MediaUploadClientFailureStatus =
  | 'unauthenticated'
  | 'actor_not_authorized'
  | 'invalid_upload_request'
  | 'upload_signer_failed'
  | 'invalid_media_asset_persistence'
  | 'media_asset_persistence_failed'
  | 'worker_request_failed';

export type RequestMediaUploadIntentResult =
  | { ok: true; intent: MediaUploadClientIntent }
  | { ok: false; status: MediaUploadClientFailureStatus; reasons: string[] };

export type MediaUploadClientFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type CreateMediaUploadClientInput = {
  workerBaseUrl: string;
  mediaUploadPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type MediaUploadClient = {
  requestMediaUploadIntent: (
    request: MediaUploadClientRequest,
  ) => Promise<RequestMediaUploadIntentResult>;
};

export type PetDraftClientDraftInput = {
  petId: string;
  shelterId: string;
  name?: string | null;
  species?: PetLifecycleSpecies | null;
  locationLabel?: string | null;
  shortDescription?: string | null;
  mediaIds: string[];
  heroMediaId?: string | null;
  medical: PublicPetMedicalStatus;
};

export type PetDraftClientSuccessStatus = 'pet_draft_created' | 'pet_draft_updated';

export type PetDraftClientSuccess = {
  ok: true;
  status: PetDraftClientSuccessStatus;
  petId: string;
};

export type PetDraftClientFailureStatus =
  | 'unauthenticated'
  | 'actor_not_authorized'
  | 'invalid_pet_draft'
  | 'auth_adapter_not_configured'
  | 'pet_draft_repository_not_configured'
  | 'worker_request_failed';

export type PetDraftClientFailure = {
  ok: false;
  status: PetDraftClientFailureStatus;
  reasons: string[];
};

export type PetDraftClientResult = PetDraftClientSuccess | PetDraftClientFailure;

export type CreatePetDraftClientInput = {
  workerBaseUrl: string;
  petDraftsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type PetDraftClient = {
  createPetDraft: (draft: PetDraftClientDraftInput) => Promise<PetDraftClientResult>;
  updatePetDraft: (draft: PetDraftClientDraftInput) => Promise<PetDraftClientResult>;
};

export type MediaUploadBinaryFailureStatus =
  | 'upload_intent_not_ready'
  | 'upload_intent_missing_signed_url'
  | 'upload_content_mismatch'
  | 'signed_upload_failed';

export type UploadMediaBinaryInput = {
  intent: MediaUploadClientIntent;
  body: BodyInit;
  contentType: string;
  byteSize: number;
};

export type UploadMediaBinaryResult =
  | {
      ok: true;
      status: 'uploaded';
      mediaId: string;
      objectKey: string;
      responseStatus: number;
    }
  | {
      ok: false;
      status: MediaUploadBinaryFailureStatus;
      reasons: string[];
      responseStatus?: number;
    };

export type CreateMediaUploadBinaryClientInput = {
  fetch: MediaUploadClientFetch;
};

export type MediaUploadBinaryClient = {
  uploadMediaBinary: (input: UploadMediaBinaryInput) => Promise<UploadMediaBinaryResult>;
};

export type SafeMediaUploadIntentMetadata = {
  mediaId: string;
  objectKey: string;
  contentType: string;
  byteSize: number;
  visibility: MediaVisibility;
  mediaKind: 'image' | 'document';
  ownerUserId: string | null;
  shelterId: string | null;
  expiresAt?: string;
  createdAt: string;
  mediaAssetId?: string;
  mediaAssetPersisted?: boolean;
};

export type UploadMediaFlowInput = {
  request: MediaUploadClientRequest;
  body: BodyInit;
};

export type UploadMediaFlowResult =
  | {
      ok: true;
      status: 'uploaded';
      mediaId: string;
      objectKey: string;
      responseStatus: number;
      intent: SafeMediaUploadIntentMetadata;
    }
  | {
      ok: false;
      phase: 'intent';
      status: MediaUploadClientFailureStatus;
      reasons: string[];
    }
  | {
      ok: false;
      phase: 'binary_upload';
      status: MediaUploadBinaryFailureStatus;
      reasons: string[];
      responseStatus?: number;
      mediaId: string;
      objectKey: string;
    };

export type CreateMediaUploadFlowClientInput = CreateMediaUploadClientInput;

export type MediaUploadFlowClient = {
  uploadMedia: (input: UploadMediaFlowInput) => Promise<UploadMediaFlowResult>;
};

export type PetMediaAttachClientRequest = {
  petId: string;
  mediaId: string;
};

export type PetMediaAttachClientSuccess = {
  ok: true;
  status: 'pet_media_attached';
  petId: string;
  mediaId: string;
  mediaIds: string[];
  heroMediaId: string | null;
};

export type PetMediaAttachClientFailureStatus =
  | 'unauthenticated'
  | 'actor_not_authorized'
  | 'invalid_pet_media_attach_request'
  | 'pet_media_attach_context_not_found'
  | 'pet_media_attach_rejected'
  | 'worker_request_failed';

export type PetMediaAttachClientFailure = {
  ok: false;
  status: PetMediaAttachClientFailureStatus;
  reasons: string[];
};

export type PetMediaAttachClientResult =
  | PetMediaAttachClientSuccess
  | PetMediaAttachClientFailure;

export type CreatePetMediaAttachClientInput = {
  workerBaseUrl: string;
  petDraftsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type PetMediaAttachClient = {
  attachPetMedia: (
    request: PetMediaAttachClientRequest,
  ) => Promise<PetMediaAttachClientResult>;
};

export type PetPublishClientRequest = {
  petId: string;
};

export type PetPublishClientSuccess = {
  ok: true;
  status: 'pet_published';
  petId: string;
  publishedAt: string;
};

export type PetPublishClientFailureStatus =
  | 'unauthenticated'
  | 'actor_not_authorized'
  | 'pet_draft_not_found'
  | 'pet_publish_rejected'
  | 'auth_adapter_not_configured'
  | 'pet_publish_repository_not_configured'
  | 'worker_request_failed';

export type PetPublishClientFailure = {
  ok: false;
  status: PetPublishClientFailureStatus;
  reasons: string[];
};

export type PetPublishClientResult = PetPublishClientSuccess | PetPublishClientFailure;

export type CreatePetPublishClientInput = {
  workerBaseUrl: string;
  petDraftsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type PetPublishClient = {
  publishPetDraft: (request: PetPublishClientRequest) => Promise<PetPublishClientResult>;
};

export type PetMediaUploadAttachFlowFileInput = {
  name: string;
  type: string;
  size: number;
  body: BodyInit;
};

export type PetMediaUploadAttachFlowInput = {
  petId: string;
  shelterId: string;
  ownerUserId?: string | null;
  file: PetMediaUploadAttachFlowFileInput;
};

export type PetMediaUploadAttachFlowSuccess = {
  ok: true;
  status: 'pet_media_uploaded_and_attached';
  petId: string;
  mediaId: string;
  objectKey: string;
  mediaIds: string[];
  heroMediaId: string | null;
  upload: {
    mediaId: string;
    objectKey: string;
    responseStatus: number;
  };
  attach: {
    mediaId: string;
    mediaIds: string[];
    heroMediaId: string | null;
  };
};

export type PetMediaUploadAttachFlowFailure =
  | {
      ok: false;
      phase: 'upload_intent';
      status: MediaUploadClientFailureStatus;
      reasons: string[];
    }
  | {
      ok: false;
      phase: 'binary_upload';
      status: MediaUploadBinaryFailureStatus;
      reasons: string[];
      responseStatus?: number;
      mediaId: string;
      objectKey: string;
    }
  | {
      ok: false;
      phase: 'attach';
      status: PetMediaAttachClientFailureStatus;
      reasons: string[];
      mediaId: string;
      objectKey: string;
    };

export type PetMediaUploadAttachFlowResult =
  | PetMediaUploadAttachFlowSuccess
  | PetMediaUploadAttachFlowFailure;

export type CreatePetMediaUploadAttachFlowClientInput = {
  uploadClient: Pick<MediaUploadFlowClient, 'uploadMedia'>;
  attachClient: Pick<PetMediaAttachClient, 'attachPetMedia'>;
  generateMediaId: () => string;
};

export type PetMediaUploadAttachFlowClient = {
  uploadAndAttachPetMedia: (
    input: PetMediaUploadAttachFlowInput,
  ) => Promise<PetMediaUploadAttachFlowResult>;
};

const sanitizeMediaUploadPayload = (request: MediaUploadClientRequest): MediaUploadClientRequest => ({
  mediaId: request.mediaId,
  purpose: request.purpose,
  requestedVisibility: request.requestedVisibility,
  mimeType: request.mimeType,
  byteSize: request.byteSize,
  ownerUserId: request.ownerUserId ?? null,
  shelterId: request.shelterId ?? null,
  originalFilename: request.originalFilename ?? null,
});

const createWorkerUrl = (workerBaseUrl: string, mediaUploadPath: `/${string}`): string => {
  const normalizedBaseUrl = workerBaseUrl.endsWith('/') ? workerBaseUrl : `${workerBaseUrl}/`;

  return new URL(mediaUploadPath.slice(1), normalizedBaseUrl).toString();
};

const createWorkerSubUrl = (
  workerBaseUrl: string,
  basePath: `/${string}`,
  ...pathParts: string[]
): string => {
  const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const encodedPathParts = pathParts.map((part) => encodeURIComponent(part));

  return createWorkerUrl(workerBaseUrl, `${normalizedBasePath}/${encodedPathParts.join('/')}` as `/${string}`);
};

const parseJsonResponse = async (response: Response): Promise<Record<string, unknown> | null> => {
  try {
    const parsed = await response.json();

    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const parseReasons = (body: Record<string, unknown> | null): string[] => {
  if (!Array.isArray(body?.reasons)) {
    return ['worker_request_failed'];
  }

  const reasons = body.reasons.filter((reason): reason is string => typeof reason === 'string');

  return reasons.length > 0 ? reasons : ['worker_request_failed'];
};

const unsafeClientReasonMarkers = [
  'signedurl',
  'signed_url',
  'temporary=',
  'service-role',
  'service_role',
  'r2-secret',
  'r2_secret',
  'r2-access',
  'r2_access',
  'user-access-token',
  'user-token-marker',
  'bearer ',
];

const sanitizeReasons = (reasons: string[], fallback: string): string[] => {
  const safeReasons = reasons.filter((reason) => {
    const normalizedReason = reason.toLowerCase();

    return !unsafeClientReasonMarkers.some((marker) => normalizedReason.includes(marker));
  });

  return safeReasons.length > 0 ? safeReasons : [fallback];
};

const parseFailureStatus = (
  body: Record<string, unknown> | null,
): MediaUploadClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'actor_not_authorized' ||
    status === 'invalid_upload_request' ||
    status === 'upload_signer_failed' ||
    status === 'invalid_media_asset_persistence' ||
    status === 'media_asset_persistence_failed'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parseSuccessIntent = (body: Record<string, unknown> | null): MediaUploadClientIntent | null => {
  if (!body || (body.status !== 'upload_ready' && body.status !== 'upload_signer_not_configured')) {
    return null;
  }

  return body as MediaUploadClientIntent;
};

const parsePetMediaAttachFailureStatus = (
  body: Record<string, unknown> | null,
): PetMediaAttachClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'actor_not_authorized' ||
    status === 'invalid_pet_media_attach_request' ||
    status === 'pet_media_attach_context_not_found' ||
    status === 'pet_media_attach_rejected'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parsePetMediaAttachSuccess = (
  body: Record<string, unknown> | null,
): PetMediaAttachClientSuccess | null => {
  if (
    body?.status !== 'pet_media_attached' ||
    typeof body.petId !== 'string' ||
    typeof body.mediaId !== 'string' ||
    !Array.isArray(body.mediaIds) ||
    !body.mediaIds.every((mediaId) => typeof mediaId === 'string') ||
    (body.heroMediaId !== null && typeof body.heroMediaId !== 'string')
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'pet_media_attached',
    petId: body.petId,
    mediaId: body.mediaId,
    mediaIds: body.mediaIds,
    heroMediaId: body.heroMediaId,
  };
};

const sanitizePetDraftPayload = (draft: PetDraftClientDraftInput): PetDraftClientDraftInput => ({
  petId: draft.petId,
  shelterId: draft.shelterId,
  name: draft.name ?? null,
  species: draft.species ?? null,
  locationLabel: draft.locationLabel ?? null,
  shortDescription: draft.shortDescription ?? null,
  mediaIds: [...draft.mediaIds],
  heroMediaId: draft.heroMediaId ?? null,
  medical: draft.medical,
});

const parsePetDraftFailureStatus = (
  body: Record<string, unknown> | null,
): PetDraftClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'actor_not_authorized' ||
    status === 'invalid_pet_draft' ||
    status === 'auth_adapter_not_configured' ||
    status === 'pet_draft_repository_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parsePetDraftSuccess = (
  body: Record<string, unknown> | null,
  expectedStatus: PetDraftClientSuccessStatus,
): PetDraftClientSuccess | null => {
  if (body?.status !== expectedStatus || typeof body.petId !== 'string') {
    return null;
  }

  return {
    ok: true,
    status: expectedStatus,
    petId: body.petId,
  };
};

const createPetDraftFailure = (
  body: Record<string, unknown> | null,
): PetDraftClientFailure => {
  const status = parsePetDraftFailureStatus(body);
  const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

  return {
    ok: false,
    status,
    reasons: sanitizeReasons(reasons, status),
  };
};

export const createPetDraftClient = ({
  workerBaseUrl,
  petDraftsPath,
  getAccessToken,
  fetch,
}: CreatePetDraftClientInput): PetDraftClient => {
  const submitDraft = async (
    draft: PetDraftClientDraftInput,
    operation: 'create' | 'update',
  ): Promise<PetDraftClientResult> => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    const response = await fetch(
      operation === 'create'
        ? createWorkerUrl(workerBaseUrl, petDraftsPath)
        : createWorkerSubUrl(workerBaseUrl, petDraftsPath, draft.petId),
      {
        method: operation === 'create' ? 'POST' : 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizePetDraftPayload(draft)),
      },
    );
    const body = await parseJsonResponse(response);

    if (!response.ok) {
      return createPetDraftFailure(body);
    }

    const success = parsePetDraftSuccess(
      body,
      operation === 'create' ? 'pet_draft_created' : 'pet_draft_updated',
    );

    if (!success) {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  };

  return {
    createPetDraft: (draft) => submitDraft(draft, 'create'),
    updatePetDraft: (draft) => submitDraft(draft, 'update'),
  };
};

const parsePetPublishFailureStatus = (
  body: Record<string, unknown> | null,
): PetPublishClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'actor_not_authorized' ||
    status === 'pet_draft_not_found' ||
    status === 'pet_publish_rejected' ||
    status === 'auth_adapter_not_configured' ||
    status === 'pet_publish_repository_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parsePetPublishSuccess = (
  body: Record<string, unknown> | null,
): PetPublishClientSuccess | null => {
  if (
    body?.status !== 'pet_published' ||
    typeof body.petId !== 'string' ||
    typeof body.publishedAt !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'pet_published',
    petId: body.petId,
    publishedAt: body.publishedAt,
  };
};

export const createPetPublishClient = ({
  workerBaseUrl,
  petDraftsPath,
  getAccessToken,
  fetch,
}: CreatePetPublishClientInput): PetPublishClient => ({
  publishPetDraft: async ({ petId }) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    const response = await fetch(createWorkerSubUrl(workerBaseUrl, petDraftsPath, petId, 'publish'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parsePetPublishFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parsePetPublishSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

export const createPetMediaAttachClient = ({
  workerBaseUrl,
  petDraftsPath,
  getAccessToken,
  fetch,
}: CreatePetMediaAttachClientInput): PetMediaAttachClient => ({
  attachPetMedia: async ({ petId, mediaId }) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    const response = await fetch(createWorkerSubUrl(workerBaseUrl, petDraftsPath, petId, 'media'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mediaId }),
    });
    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parsePetMediaAttachFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parsePetMediaAttachSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

export type PetDraftSaveFlowFileInput = {
  name: string;
  type: string;
  size: number;
  body: BodyInit;
};

export type PetDraftSaveFlowInput = {
  operation: 'create' | 'update';
  petId: string;
  shelterId: string;
  ownerUserId?: string | null;
  name?: string | null;
  species?: PetLifecycleSpecies | null;
  locationLabel?: string | null;
  shortDescription?: string | null;
  existingMediaIds: string[];
  heroMediaId?: string | null;
  medical: PublicPetMedicalStatus;
  newFiles?: PetDraftSaveFlowFileInput[];
};

export type PetDraftSaveFlowUploadedMedia = {
  mediaId: string;
  objectKey: string;
  mediaIds: string[];
  heroMediaId: string | null;
};

export type PetDraftSaveFlowSuccess = {
  ok: true;
  status: 'pet_draft_saved';
  petId: string;
  operation: 'create' | 'update';
  uploadedMedia: PetDraftSaveFlowUploadedMedia[];
};

export type PetDraftSaveFlowFailure =
  | {
      ok: false;
      phase: 'draft_save';
      status: PetDraftClientFailureStatus;
      reasons: string[];
    }
  | {
      ok: false;
      phase: 'media_upload';
      subPhase: 'upload_intent';
      status: MediaUploadClientFailureStatus;
      reasons: string[];
    }
  | {
      ok: false;
      phase: 'media_upload';
      subPhase: 'binary_upload';
      status: MediaUploadBinaryFailureStatus;
      reasons: string[];
      responseStatus?: number;
      mediaId: string;
      objectKey: string;
    }
  | {
      ok: false;
      phase: 'media_upload';
      subPhase: 'attach';
      status: PetMediaAttachClientFailureStatus;
      reasons: string[];
      mediaId: string;
      objectKey: string;
    };

export type PetDraftSaveFlowResult = PetDraftSaveFlowSuccess | PetDraftSaveFlowFailure;

export type CreatePetDraftSaveFlowClientInput = {
  draftClient: Pick<PetDraftClient, 'createPetDraft' | 'updatePetDraft'>;
  uploadAttachClient: Pick<PetMediaUploadAttachFlowClient, 'uploadAndAttachPetMedia'>;
};

export type PetDraftSaveFlowClient = {
  savePetDraft: (input: PetDraftSaveFlowInput) => Promise<PetDraftSaveFlowResult>;
};

export const createPetDraftSaveFlowClient = ({
  draftClient,
  uploadAttachClient,
}: CreatePetDraftSaveFlowClientInput): PetDraftSaveFlowClient => ({
  savePetDraft: async (input) => {
    const draftInput: PetDraftClientDraftInput = {
      petId: input.petId,
      shelterId: input.shelterId,
      name: input.name ?? null,
      species: input.species ?? null,
      locationLabel: input.locationLabel ?? null,
      shortDescription: input.shortDescription ?? null,
      mediaIds: [...input.existingMediaIds],
      heroMediaId: input.heroMediaId ?? null,
      medical: input.medical,
    };

    const draftResult =
      input.operation === 'create'
        ? await draftClient.createPetDraft(draftInput)
        : await draftClient.updatePetDraft(draftInput);

    if (!draftResult.ok) {
      return {
        ok: false,
        phase: 'draft_save',
        status: draftResult.status,
        reasons: sanitizeReasons(draftResult.reasons, draftResult.status),
      };
    }

    const { petId } = draftResult;
    const uploadedMedia: PetDraftSaveFlowUploadedMedia[] = [];

    for (const file of input.newFiles ?? []) {
      const uploadResult = await uploadAttachClient.uploadAndAttachPetMedia({
        petId,
        shelterId: input.shelterId,
        ownerUserId: input.ownerUserId ?? null,
        file,
      });

      if (!uploadResult.ok) {
        if (uploadResult.phase === 'upload_intent') {
          return {
            ok: false,
            phase: 'media_upload',
            subPhase: 'upload_intent',
            status: uploadResult.status,
            reasons: sanitizeReasons(uploadResult.reasons, uploadResult.status),
          };
        }

        if (uploadResult.phase === 'binary_upload') {
          return {
            ok: false,
            phase: 'media_upload',
            subPhase: 'binary_upload',
            status: uploadResult.status,
            reasons: sanitizeReasons(uploadResult.reasons, uploadResult.status),
            responseStatus: uploadResult.responseStatus,
            mediaId: uploadResult.mediaId,
            objectKey: uploadResult.objectKey,
          };
        }

        return {
          ok: false,
          phase: 'media_upload',
          subPhase: 'attach',
          status: uploadResult.status,
          reasons: sanitizeReasons(uploadResult.reasons, uploadResult.status),
          mediaId: uploadResult.mediaId,
          objectKey: uploadResult.objectKey,
        };
      }

      uploadedMedia.push({
        mediaId: uploadResult.mediaId,
        objectKey: uploadResult.objectKey,
        mediaIds: uploadResult.mediaIds,
        heroMediaId: uploadResult.heroMediaId,
      });
    }

    return {
      ok: true,
      status: 'pet_draft_saved',
      petId,
      operation: input.operation,
      uploadedMedia,
    };
  },
});

export const createPetMediaUploadAttachFlowClient = ({
  uploadClient,
  attachClient,
  generateMediaId,
}: CreatePetMediaUploadAttachFlowClientInput): PetMediaUploadAttachFlowClient => ({
  uploadAndAttachPetMedia: async ({ petId, shelterId, ownerUserId = null, file }) => {
    const mediaId = generateMediaId();
    const uploadResult = await uploadClient.uploadMedia({
      request: {
        mediaId,
        purpose: 'pet_public_image',
        requestedVisibility: 'public',
        mimeType: file.type,
        byteSize: file.size,
        ownerUserId,
        shelterId,
        originalFilename: file.name,
      },
      body: file.body,
    });

    if (!uploadResult.ok && uploadResult.phase === 'intent') {
      return {
        ok: false,
        phase: 'upload_intent',
        status: uploadResult.status,
        reasons: sanitizeReasons(uploadResult.reasons, uploadResult.status),
      };
    }

    if (!uploadResult.ok) {
      return {
        ok: false,
        phase: 'binary_upload',
        status: uploadResult.status,
        reasons: sanitizeReasons(uploadResult.reasons, uploadResult.status),
        responseStatus: uploadResult.responseStatus,
        mediaId: uploadResult.mediaId,
        objectKey: uploadResult.objectKey,
      };
    }

    const attachMediaId = uploadResult.intent.mediaAssetId ?? uploadResult.mediaId;
    const attachResult = await attachClient.attachPetMedia({
      petId,
      mediaId: attachMediaId,
    });

    if (!attachResult.ok) {
      return {
        ok: false,
        phase: 'attach',
        status: attachResult.status,
        reasons: sanitizeReasons(attachResult.reasons, attachResult.status),
        mediaId: attachMediaId,
        objectKey: uploadResult.objectKey,
      };
    }

    return {
      ok: true,
      status: 'pet_media_uploaded_and_attached',
      petId: attachResult.petId,
      mediaId: attachResult.mediaId,
      objectKey: uploadResult.objectKey,
      mediaIds: attachResult.mediaIds,
      heroMediaId: attachResult.heroMediaId,
      upload: {
        mediaId: uploadResult.mediaId,
        objectKey: uploadResult.objectKey,
        responseStatus: uploadResult.responseStatus,
      },
      attach: {
        mediaId: attachResult.mediaId,
        mediaIds: attachResult.mediaIds,
        heroMediaId: attachResult.heroMediaId,
      },
    };
  },
});

export const createMediaUploadClient = ({
  workerBaseUrl,
  mediaUploadPath,
  getAccessToken,
  fetch,
}: CreateMediaUploadClientInput): MediaUploadClient => {
  const uploadUrl = createWorkerUrl(workerBaseUrl, mediaUploadPath);

  return {
    requestMediaUploadIntent: async (request) => {
      const accessToken = await getAccessToken();

      if (!accessToken?.trim()) {
        return {
          ok: false,
          status: 'unauthenticated',
          reasons: ['missing_access_token'],
        };
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizeMediaUploadPayload(request)),
      });
      const body = await parseJsonResponse(response);

      if (!response.ok) {
        return {
          ok: false,
          status: parseFailureStatus(body),
          reasons: parseReasons(body),
        };
      }

      const intent = parseSuccessIntent(body);

      if (!intent) {
        return {
          ok: false,
          status: 'worker_request_failed',
          reasons: ['invalid_worker_response'],
        };
      }

      return { ok: true, intent };
    },
  };
};

const unsafeUploadHeaderNameTokenGroups = [
  ['authorization'],
  ['cookie'],
  ['proxy', 'authorization'],
  ['r2', 'access', 'key'],
  ['r2', 'secret', 'key'],
  ['supabase', 'service', 'role', 'key'],
];

const isUnsafeUploadHeaderName = (name: string): boolean => {
  const tokens = name.toLowerCase().split(/[^a-z0-9]+/u);

  return unsafeUploadHeaderNameTokenGroups.some((group) =>
    group.every((token) => tokens.includes(token)),
  );
};

const containsSecretLikeValue = (value: string): boolean => {
  const normalizedValue = value.toLowerCase();

  return [
    ['service', 'role'],
    ['secret', 'key'],
    ['access', 'token'],
  ].some((group) => group.every((token) => normalizedValue.includes(token)));
};

const sanitizeUploadHeaders = (intent: MediaUploadClientIntent): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': intent.contentType,
  };

  for (const [name, value] of Object.entries(intent.uploadHeaders ?? {})) {
    if (isUnsafeUploadHeaderName(name) || containsSecretLikeValue(value)) {
      continue;
    }

    headers[name] = value;
  }

  return headers;
};

const validateBinaryUploadInput = ({
  intent,
  contentType,
  byteSize,
}: UploadMediaBinaryInput): UploadMediaBinaryResult | null => {
  if (intent.status !== 'upload_ready' || intent.dryRunOnly) {
    return {
      ok: false,
      status: 'upload_intent_not_ready',
      reasons: ['upload_intent_not_ready'],
    };
  }

  if (!intent.signedUrl?.trim()) {
    return {
      ok: false,
      status: 'upload_intent_missing_signed_url',
      reasons: ['missing_signed_url'],
    };
  }

  if (contentType !== intent.contentType) {
    return {
      ok: false,
      status: 'upload_content_mismatch',
      reasons: ['content_type_mismatch'],
    };
  }

  if (byteSize !== intent.byteSize) {
    return {
      ok: false,
      status: 'upload_content_mismatch',
      reasons: ['byte_size_mismatch'],
    };
  }

  return null;
};

export const createMediaUploadBinaryClient = ({
  fetch,
}: CreateMediaUploadBinaryClientInput): MediaUploadBinaryClient => ({
  uploadMediaBinary: async (input) => {
    const invalidInput = validateBinaryUploadInput(input);

    if (invalidInput) {
      return invalidInput;
    }

    try {
      const response = await fetch(input.intent.signedUrl as string, {
        method: input.intent.uploadMethod ?? 'PUT',
        headers: sanitizeUploadHeaders(input.intent),
        body: input.body,
      });

      if (!response.ok) {
        return {
          ok: false,
          status: 'signed_upload_failed',
          reasons: ['signed_upload_rejected'],
          responseStatus: response.status,
        };
      }

      return {
        ok: true,
        status: 'uploaded',
        mediaId: input.intent.mediaId,
        objectKey: input.intent.objectKey,
        responseStatus: response.status,
      };
    } catch {
      return {
        ok: false,
        status: 'signed_upload_failed',
        reasons: ['signed_upload_network_error'],
      };
    }
  },
});

const createSafeMediaUploadIntentMetadata = (
  intent: MediaUploadClientIntent,
): SafeMediaUploadIntentMetadata => ({
  mediaId: intent.mediaId,
  objectKey: intent.objectKey,
  contentType: intent.contentType,
  byteSize: intent.byteSize,
  visibility: intent.visibility,
  mediaKind: intent.mediaKind,
  ownerUserId: intent.ownerUserId,
  shelterId: intent.shelterId,
  expiresAt: intent.expiresAt,
  createdAt: intent.createdAt,
  mediaAssetId: intent.mediaAssetId,
  mediaAssetPersisted: intent.mediaAssetPersisted,
});

export const createMediaUploadFlowClient = (
  input: CreateMediaUploadFlowClientInput,
): MediaUploadFlowClient => {
  const intentClient = createMediaUploadClient(input);
  const binaryClient = createMediaUploadBinaryClient({ fetch: input.fetch });

  return {
    uploadMedia: async ({ request, body }) => {
      const intentResult = await intentClient.requestMediaUploadIntent(request);

      if (!intentResult.ok) {
        return {
          ok: false,
          phase: 'intent',
          status: intentResult.status,
          reasons: intentResult.reasons,
        };
      }

      const binaryResult = await binaryClient.uploadMediaBinary({
        intent: intentResult.intent,
        body,
        contentType: request.mimeType,
        byteSize: request.byteSize,
      });

      if (!binaryResult.ok) {
        return {
          ok: false,
          phase: 'binary_upload',
          status: binaryResult.status,
          reasons: binaryResult.reasons,
          responseStatus: binaryResult.responseStatus,
          mediaId: intentResult.intent.mediaId,
          objectKey: intentResult.intent.objectKey,
        };
      }

      return {
        ok: true,
        status: 'uploaded',
        mediaId: binaryResult.mediaId,
        objectKey: binaryResult.objectKey,
        responseStatus: binaryResult.responseStatus,
        intent: createSafeMediaUploadIntentMetadata(intentResult.intent),
      };
    },
  };
};
