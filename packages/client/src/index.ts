import type {
  MediaUploadPurpose,
  MediaVisibility,
  PetLifecycleSpecies,
  PetLifecycleStatus,
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

export type LoadPetDraftClientDraft = {
  petId: string;
  shelterId: string;
  status: PetLifecycleStatus;
  name: string | null;
  species: PetLifecycleSpecies | null;
  locationLabel: string | null;
  shortDescription: string | null;
  mediaIds: string[];
  heroMediaId: string | null;
  medical: PublicPetMedicalStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LoadPetDraftClientSuccess = {
  ok: true;
  status: 'pet_draft_loaded';
  draft: LoadPetDraftClientDraft;
};

export type LoadPetDraftClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'pet_draft_not_found'
  | 'auth_adapter_not_configured'
  | 'pet_draft_repository_not_configured'
  | 'worker_request_failed';

export type LoadPetDraftClientFailure = {
  ok: false;
  status: LoadPetDraftClientFailureStatus;
  reasons: string[];
};

export type LoadPetDraftClientResult = LoadPetDraftClientSuccess | LoadPetDraftClientFailure;

export type CreatePetDraftClientInput = {
  workerBaseUrl: string;
  petDraftsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type PetDraftClient = {
  createPetDraft: (draft: PetDraftClientDraftInput) => Promise<PetDraftClientResult>;
  updatePetDraft: (draft: PetDraftClientDraftInput) => Promise<PetDraftClientResult>;
  loadPetDraft: (petId: string) => Promise<LoadPetDraftClientResult>;
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

  const parseLoadPetDraftFailureStatus = (
    body: Record<string, unknown> | null,
  ): LoadPetDraftClientFailureStatus => {
    const status = body?.status;

    if (
      status === 'unauthenticated' ||
      status === 'forbidden' ||
      status === 'pet_draft_not_found' ||
      status === 'auth_adapter_not_configured' ||
      status === 'pet_draft_repository_not_configured'
    ) {
      return status;
    }

    return 'worker_request_failed';
  };

  const parseLoadPetDraftSuccess = (
    body: Record<string, unknown> | null,
  ): LoadPetDraftClientSuccess | null => {
    if (body?.status !== 'ok' || typeof body.draft !== 'object' || body.draft === null) {
      return null;
    }

    const d = body.draft as Record<string, unknown>;

    if (
      typeof d.petId !== 'string' ||
      typeof d.shelterId !== 'string' ||
      typeof d.status !== 'string' ||
      !Array.isArray(d.mediaIds) ||
      typeof d.createdAt !== 'string' ||
      typeof d.updatedAt !== 'string'
    ) {
      return null;
    }

    return {
      ok: true,
      status: 'pet_draft_loaded',
      draft: {
        petId: d.petId,
        shelterId: d.shelterId,
        status: d.status as PetLifecycleStatus,
        name: typeof d.name === 'string' ? d.name : null,
        species: typeof d.species === 'string' ? (d.species as PetLifecycleSpecies) : null,
        locationLabel: typeof d.locationLabel === 'string' ? d.locationLabel : null,
        shortDescription: typeof d.shortDescription === 'string' ? d.shortDescription : null,
        mediaIds: d.mediaIds as string[],
        heroMediaId: typeof d.heroMediaId === 'string' ? d.heroMediaId : null,
        medical: (d.medical ?? 'unknown') as PublicPetMedicalStatus,
        publishedAt: typeof d.publishedAt === 'string' ? d.publishedAt : null,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    };
  };

  return {
    createPetDraft: (draft) => submitDraft(draft, 'create'),
    updatePetDraft: (draft) => submitDraft(draft, 'update'),
    loadPetDraft: async (petId) => {
      const accessToken = await getAccessToken();

      if (!accessToken?.trim()) {
        return {
          ok: false,
          status: 'unauthenticated',
          reasons: ['missing_access_token'],
        };
      }

      const response = await fetch(createWorkerSubUrl(workerBaseUrl, petDraftsPath, petId), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await parseJsonResponse(response);

      if (!response.ok) {
        const status = parseLoadPetDraftFailureStatus(body);
        const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

        return {
          ok: false,
          status,
          reasons: sanitizeReasons(reasons, status),
        };
      }

      const success = parseLoadPetDraftSuccess(body);

      if (!success) {
        return {
          ok: false,
          status: 'worker_request_failed',
          reasons: ['invalid_worker_response'],
        };
      }

      return success;
    },
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

export type PetFeedPet = {
  id: string;
  shelterId: string;
  name: string | null;
  species: PetLifecycleSpecies | null;
  locationLabel: string | null;
  shortDescription: string | null;
  heroMediaId: string | null;
  mediaIds: string[];
  publishedAt: string;
};

export type PetFeedClientQuery = {
  species?: PetLifecycleSpecies | null;
  location?: string | null;
  limit?: number | null;
  offset?: number | null;
};

export type PetFeedClientSuccess = {
  ok: true;
  status: 'ok';
  pets: PetFeedPet[];
  total: number;
};

export type PetFeedClientFailureStatus = 'worker_request_failed' | 'worker_response_invalid';

export type PetFeedClientFailure = {
  ok: false;
  status: PetFeedClientFailureStatus;
  reasons: string[];
};

export type PetFeedClientResult = PetFeedClientSuccess | PetFeedClientFailure;

export type CreatePetFeedClientInput = {
  workerBaseUrl: string;
  petFeedPath: `/${string}`;
  fetch: MediaUploadClientFetch;
};

export type PetFeedClient = {
  loadFeed: (query: PetFeedClientQuery) => Promise<PetFeedClientResult>;
};

const parsePetFeedSuccess = (
  body: Record<string, unknown> | null,
): PetFeedClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.pets) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    pets: body.pets as PetFeedPet[],
    total: body.total,
  };
};

export const createPetFeedClient = ({
  workerBaseUrl,
  petFeedPath,
  fetch,
}: CreatePetFeedClientInput): PetFeedClient => ({
  loadFeed: async (query) => {
    const base = createWorkerUrl(workerBaseUrl, petFeedPath);
    const url = new URL(base);

    if (query.species != null) url.searchParams.set('species', query.species);
    if (query.location != null) url.searchParams.set('location', query.location);
    if (query.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString());
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : ['worker_request_failed'];

      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: sanitizeReasons(reasons, 'worker_request_failed'),
      };
    }

    const success = parsePetFeedSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

export type PetProfilePet = {
  id: string;
  shelterId: string;
  name: string | null;
  species: PetLifecycleSpecies | null;
  locationLabel: string | null;
  shortDescription: string | null;
  heroMediaId: string | null;
  mediaIds: string[];
  publishedAt: string;
  medical: PublicPetMedicalStatus;
};

export type PetProfileClientSuccess = {
  ok: true;
  status: 'ok';
  pet: PetProfilePet;
};

export type PetProfileClientFailureStatus =
  | 'pet_not_found'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type PetProfileClientFailure = {
  ok: false;
  status: PetProfileClientFailureStatus;
  reasons: string[];
};

export type PetProfileClientResult = PetProfileClientSuccess | PetProfileClientFailure;

export type CreatePetProfileClientInput = {
  workerBaseUrl: string;
  petFeedPath: `/${string}`;
  fetch: MediaUploadClientFetch;
};

export type PetProfileClient = {
  loadProfile: (petId: string) => Promise<PetProfileClientResult>;
};

const parsePetProfileSuccess = (
  body: Record<string, unknown> | null,
): PetProfileClientSuccess | null => {
  if (!body || body.status !== 'ok' || typeof body.pet !== 'object' || body.pet === null) {
    return null;
  }

  const pet = body.pet as Record<string, unknown>;

  if (
    typeof pet.id !== 'string' ||
    typeof pet.shelterId !== 'string' ||
    typeof pet.publishedAt !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    pet: pet as PetProfilePet,
  };
};

export const createPetProfileClient = ({
  workerBaseUrl,
  petFeedPath,
  fetch,
}: CreatePetProfileClientInput): PetProfileClient => ({
  loadProfile: async (petId) => {
    let response: Response;

    try {
      response = await fetch(createWorkerSubUrl(workerBaseUrl, petFeedPath, petId));
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (response.status === 404) {
      return { ok: false, status: 'pet_not_found', reasons: ['pet_not_found'] };
    }

    if (!response.ok) {
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : ['worker_request_failed'];

      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: sanitizeReasons(reasons, 'worker_request_failed'),
      };
    }

    const success = parsePetProfileSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

export type ShelterKind = 'shelter' | 'sanctuary' | 'association' | 'foster_network';

export type ShelterVerificationStatus =
  | 'draft'
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'suspended';

export type ShelterProfileClientShelter = {
  id: string;
  name: string;
  slug: string;
  kind: ShelterKind;
  verificationStatus: ShelterVerificationStatus;
  publicEmail: string | null;
  publicPhone: string | null;
  city: string;
  district: string | null;
  countryCode: string;
  description: string | null;
  logoMediaId: string | null;
  coverMediaId: string | null;
};

export type ShelterProfileClientSuccess = {
  ok: true;
  status: 'ok';
  shelter: ShelterProfileClientShelter;
};

export type ShelterProfileClientFailureStatus =
  | 'shelter_not_found'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ShelterProfileClientFailure = {
  ok: false;
  status: ShelterProfileClientFailureStatus;
  reasons: string[];
};

export type ShelterProfileClientResult =
  | ShelterProfileClientSuccess
  | ShelterProfileClientFailure;

export type CreateShelterProfileClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  fetch: MediaUploadClientFetch;
};

export type ShelterProfileClient = {
  loadProfile: (shelterId: string) => Promise<ShelterProfileClientResult>;
};

const parseShelterProfileSuccess = (
  body: Record<string, unknown> | null,
): ShelterProfileClientSuccess | null => {
  if (!body || body.status !== 'ok' || typeof body.shelter !== 'object' || body.shelter === null) {
    return null;
  }

  const shelter = body.shelter as Record<string, unknown>;

  if (
    typeof shelter.id !== 'string' ||
    typeof shelter.name !== 'string' ||
    typeof shelter.slug !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    shelter: shelter as ShelterProfileClientShelter,
  };
};

export const createShelterProfileClient = ({
  workerBaseUrl,
  shelterPath,
  fetch,
}: CreateShelterProfileClientInput): ShelterProfileClient => ({
  loadProfile: async (shelterId) => {
    let response: Response;

    try {
      response = await fetch(createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId));
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (response.status === 404) {
      return { ok: false, status: 'shelter_not_found', reasons: ['shelter_not_found'] };
    }

    if (!response.ok) {
      const reasons = Array.isArray(body?.reasons)
        ? parseReasons(body)
        : ['worker_request_failed'];

      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: sanitizeReasons(reasons, 'worker_request_failed'),
      };
    }

    const success = parseShelterProfileSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Shelter Search Client ────────────────────────────────────────────────────

export type ShelterSearchClientShelter = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  verificationStatus: string;
  city: string;
  district: string | null;
  countryCode: string;
  logoMediaId: string | null;
};

export type ShelterSearchClientQuery = {
  kind?: string | null;
  limit?: number | null;
  offset?: number | null;
};

export type ShelterSearchClientSuccess = {
  ok: true;
  status: 'ok';
  shelters: ShelterSearchClientShelter[];
  total: number;
};

export type ShelterSearchClientFailureStatus =
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ShelterSearchClientFailure = {
  ok: false;
  status: ShelterSearchClientFailureStatus;
  reasons: string[];
};

export type ShelterSearchClientResult =
  | ShelterSearchClientSuccess
  | ShelterSearchClientFailure;

export type CreateShelterSearchClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  fetch: MediaUploadClientFetch;
};

export type ShelterSearchClient = {
  searchShelters: (query: ShelterSearchClientQuery) => Promise<ShelterSearchClientResult>;
};

const parseShelterSearchSuccess = (
  body: Record<string, unknown> | null,
): ShelterSearchClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.shelters) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    shelters: body.shelters as ShelterSearchClientShelter[],
    total: body.total,
  };
};

export const createShelterSearchClient = ({
  workerBaseUrl,
  shelterPath,
  fetch,
}: CreateShelterSearchClientInput): ShelterSearchClient => ({
  searchShelters: async (query) => {
    const base = createWorkerUrl(workerBaseUrl, shelterPath);
    const url = new URL(base);

    if (query.kind != null) url.searchParams.set('kind', query.kind);
    if (query.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString());
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const reasons = Array.isArray(body?.reasons)
        ? parseReasons(body)
        : ['worker_request_failed'];

      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: sanitizeReasons(reasons, 'worker_request_failed'),
      };
    }

    const success = parseShelterSearchSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Adoption Application Client ─────────────────────────────────────────────

export type HousingType = 'apartment' | 'house' | 'farm' | 'other';

export type AdoptionApplicationClientInput = {
  petId: string;
  applicantFullName: string;
  applicantEmail: string;
  applicantPhoneNumber: string;
  applicantCity: string;
  applicantDistrict?: string | null;
  applicantPostalCode?: string | null;
  housingType: HousingType;
  hasOutdoorSpace: boolean;
  hasChildren: boolean;
  hasOtherAnimals: boolean;
  otherAnimalsDescription?: string | null;
  previousPetExperience: string;
  dailyRoutine: string;
  adoptionMotivation: string;
  veterinarianContact?: string | null;
  dataProcessingAccepted: true;
  shelterContactAccepted: boolean;
  consentVersion: string;
  consentAcceptedAt: string;
};

export type AdoptionApplicationClientSuccess = {
  ok: true;
  status: 'adoption_application_submitted';
  applicationId: string;
  petId: string;
  shelterId: string;
  submittedAt: string;
};

export type AdoptionApplicationClientFailureStatus =
  | 'unauthenticated'
  | 'pet_not_found'
  | 'invalid_adoption_application'
  | 'adoption_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type AdoptionApplicationClientFailure = {
  ok: false;
  status: AdoptionApplicationClientFailureStatus;
  reasons: string[];
};

export type AdoptionApplicationClientResult =
  | AdoptionApplicationClientSuccess
  | AdoptionApplicationClientFailure;

export type CreateAdoptionApplicationClientInput = {
  workerBaseUrl: string;
  adoptionsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type AdoptionApplicationClient = {
  submitApplication: (
    input: AdoptionApplicationClientInput,
  ) => Promise<AdoptionApplicationClientResult>;
};

const parseAdoptionSuccess = (
  body: Record<string, unknown> | null,
): AdoptionApplicationClientSuccess | null => {
  if (
    body?.status !== 'adoption_application_submitted' ||
    typeof body.applicationId !== 'string' ||
    typeof body.petId !== 'string' ||
    typeof body.shelterId !== 'string' ||
    typeof body.submittedAt !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'adoption_application_submitted',
    applicationId: body.applicationId,
    petId: body.petId,
    shelterId: body.shelterId,
    submittedAt: body.submittedAt,
  };
};

const parseAdoptionFailureStatus = (
  body: Record<string, unknown> | null,
): AdoptionApplicationClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'pet_not_found' ||
    status === 'invalid_adoption_application' ||
    status === 'adoption_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const buildAdoptionPayload = (input: AdoptionApplicationClientInput): Record<string, unknown> => ({
  petId: input.petId,
  applicantFullName: input.applicantFullName,
  applicantEmail: input.applicantEmail,
  applicantPhoneNumber: input.applicantPhoneNumber,
  applicantCity: input.applicantCity,
  applicantDistrict: input.applicantDistrict ?? null,
  applicantPostalCode: input.applicantPostalCode ?? null,
  housingType: input.housingType,
  hasOutdoorSpace: input.hasOutdoorSpace,
  hasChildren: input.hasChildren,
  hasOtherAnimals: input.hasOtherAnimals,
  otherAnimalsDescription: input.otherAnimalsDescription ?? null,
  previousPetExperience: input.previousPetExperience,
  dailyRoutine: input.dailyRoutine,
  adoptionMotivation: input.adoptionMotivation,
  veterinarianContact: input.veterinarianContact ?? null,
  dataProcessingAccepted: input.dataProcessingAccepted,
  shelterContactAccepted: input.shelterContactAccepted,
  consentVersion: input.consentVersion,
  consentAcceptedAt: input.consentAcceptedAt,
});

export const createAdoptionApplicationClient = ({
  workerBaseUrl,
  adoptionsPath,
  getAccessToken,
  fetch,
}: CreateAdoptionApplicationClientInput): AdoptionApplicationClient => ({
  submitApplication: async (input) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(createWorkerUrl(workerBaseUrl, adoptionsPath), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildAdoptionPayload(input)),
      });
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseAdoptionFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseAdoptionSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Adoption List Client ────────────────────────────────────────────────────

export type AdoptionApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_info_requested'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'expired';

export type AdoptionListApplication = {
  applicationId: string;
  petId: string;
  applicantUserId: string;
  applicantFullName: string;
  applicantEmail: string;
  applicantCity: string;
  status: AdoptionApplicationStatus;
  submittedAt: string | null;
};

export type AdoptionListQuery = {
  limit?: number | null;
  offset?: number | null;
};

export type AdoptionListClientSuccess = {
  ok: true;
  status: 'ok';
  applications: AdoptionListApplication[];
  total: number;
};

export type AdoptionListClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'adoption_list_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type AdoptionListClientFailure = {
  ok: false;
  status: AdoptionListClientFailureStatus;
  reasons: string[];
};

export type AdoptionListClientResult = AdoptionListClientSuccess | AdoptionListClientFailure;

export type CreateAdoptionListClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type AdoptionListClient = {
  loadApplications: (
    shelterId: string,
    query?: AdoptionListQuery,
  ) => Promise<AdoptionListClientResult>;
};

const parseAdoptionListSuccess = (
  body: Record<string, unknown> | null,
): AdoptionListClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.applications) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    applications: body.applications as AdoptionListApplication[],
    total: body.total,
  };
};

const parseAdoptionListFailureStatus = (
  body: Record<string, unknown> | null,
): AdoptionListClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'adoption_list_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createAdoptionListClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateAdoptionListClientInput): AdoptionListClient => ({
  loadApplications: async (shelterId, query = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    const base = createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'adoptions');
    const url = new URL(base);

    if (query?.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query?.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseAdoptionListFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseAdoptionListSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Donation Client ─────────────────────────────────────────────────────────

export type DonationClientKind = 'one_time_donation' | 'monthly_sponsorship';

export type DonationClientPaymentMethod =
  | 'mb_way'
  | 'multibanco'
  | 'card'
  | 'bank_transfer'
  | 'unknown';

export type DonationClientInput = {
  shelterId: string;
  amountCents: number;
  kind: DonationClientKind;
  paymentMethod: DonationClientPaymentMethod;
  dataProcessingAccepted: true;
  petId?: string | null;
  publicMessage?: string | null;
  anonymous?: boolean;
  donorDisplayName?: string | null;
  donorEmail?: string | null;
};

export type DonationClientSuccess = {
  ok: true;
  status: 'donation_created';
  donationId: string;
  amountCents: number;
  currency: string;
  kind: DonationClientKind;
  shelterId: string;
  createdAt: string;
};

export type DonationClientFailureStatus =
  | 'unauthenticated'
  | 'invalid_donation'
  | 'donation_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type DonationClientFailure = {
  ok: false;
  status: DonationClientFailureStatus;
  reasons: string[];
};

export type DonationClientResult = DonationClientSuccess | DonationClientFailure;

export type CreateDonationClientInput = {
  workerBaseUrl: string;
  donationsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type DonationClient = {
  submitDonation: (input: DonationClientInput) => Promise<DonationClientResult>;
};

const parseDonationSuccess = (
  body: Record<string, unknown> | null,
): DonationClientSuccess | null => {
  if (
    !body ||
    body.status !== 'donation_created' ||
    typeof body.donationId !== 'string' ||
    typeof body.amountCents !== 'number' ||
    typeof body.currency !== 'string' ||
    typeof body.kind !== 'string' ||
    typeof body.shelterId !== 'string' ||
    typeof body.createdAt !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'donation_created',
    donationId: body.donationId,
    amountCents: body.amountCents,
    currency: body.currency,
    kind: body.kind as DonationClientKind,
    shelterId: body.shelterId,
    createdAt: body.createdAt,
  };
};

const parseDonationFailureStatus = (
  body: Record<string, unknown> | null,
): DonationClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'invalid_donation' ||
    status === 'donation_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const buildDonationPayload = (input: DonationClientInput): Record<string, unknown> => ({
  shelterId: input.shelterId,
  amountCents: input.amountCents,
  kind: input.kind,
  paymentMethod: input.paymentMethod,
  petId: input.petId ?? null,
  publicMessage: input.publicMessage ?? null,
  anonymous: input.anonymous ?? false,
  donorDisplayName: input.donorDisplayName ?? null,
  donorEmail: input.donorEmail ?? null,
  dataProcessingAccepted: input.dataProcessingAccepted,
});

export const createDonationClient = ({
  workerBaseUrl,
  donationsPath,
  getAccessToken,
  fetch,
}: CreateDonationClientInput): DonationClient => ({
  submitDonation: async (input) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(createWorkerUrl(workerBaseUrl, donationsPath), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildDonationPayload(input)),
      });
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseDonationFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseDonationSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Donation List Client ────────────────────────────────────────────────────

export type DonationClientStatus =
  | 'created'
  | 'pending_payment'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type DonationListApplication = {
  donationId: string;
  kind: DonationClientKind;
  status: DonationClientStatus;
  amountCents: number;
  currency: string;
  paymentMethod: DonationClientPaymentMethod;
  anonymous: boolean;
  donorDisplayName: string | null;
  publicMessage: string | null;
  createdAt: string;
};

export type DonationListQuery = {
  limit?: number | null;
  offset?: number | null;
};

export type DonationListClientSuccess = {
  ok: true;
  status: 'ok';
  donations: DonationListApplication[];
  total: number;
};

export type DonationListClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'donation_list_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type DonationListClientFailure = {
  ok: false;
  status: DonationListClientFailureStatus;
  reasons: string[];
};

export type DonationListClientResult = DonationListClientSuccess | DonationListClientFailure;

export type CreateDonationListClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type DonationListClient = {
  loadDonations: (
    shelterId: string,
    query?: DonationListQuery,
  ) => Promise<DonationListClientResult>;
};

const parseDonationListSuccess = (
  body: Record<string, unknown> | null,
): DonationListClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.donations) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    donations: body.donations as DonationListApplication[],
    total: body.total,
  };
};

const parseDonationListFailureStatus = (
  body: Record<string, unknown> | null,
): DonationListClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'donation_list_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createDonationListClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateDonationListClientInput): DonationListClient => ({
  loadDonations: async (shelterId, query = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    const base = createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'donations');
    const url = new URL(base);

    if (query?.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query?.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseDonationListFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseDonationListSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Donation Status Client ──────────────────────────────────────────────────

export type DonationStatusClientItem = {
  donationId: string;
  kind: DonationClientKind;
  donationStatus: DonationClientStatus;
  amountCents: number;
  currency: string;
  paymentMethod: DonationClientPaymentMethod;
  shelterId: string;
  petId: string | null;
  createdAt: string;
};

export type DonationStatusClientSuccess = {
  ok: true;
  status: 'ok';
  donation: DonationStatusClientItem;
};

export type DonationStatusClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'donation_not_found'
  | 'donation_status_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type DonationStatusClientFailure = {
  ok: false;
  status: DonationStatusClientFailureStatus;
  reasons: string[];
};

export type DonationStatusClientResult =
  | DonationStatusClientSuccess
  | DonationStatusClientFailure;

export type CreateDonationStatusClientInput = {
  workerBaseUrl: string;
  donationsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type DonationStatusClient = {
  loadDonationStatus: (donationId: string) => Promise<DonationStatusClientResult>;
};

const parseDonationStatusSuccess = (
  body: Record<string, unknown> | null,
): DonationStatusClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !body.donation ||
    typeof body.donation !== 'object' ||
    Array.isArray(body.donation)
  ) {
    return null;
  }

  const d = body.donation as Record<string, unknown>;

  if (
    typeof d.donationId !== 'string' ||
    typeof d.kind !== 'string' ||
    typeof d.donationStatus !== 'string' ||
    typeof d.amountCents !== 'number' ||
    typeof d.currency !== 'string' ||
    typeof d.paymentMethod !== 'string' ||
    typeof d.shelterId !== 'string' ||
    typeof d.createdAt !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    donation: {
      donationId: d.donationId,
      kind: d.kind as DonationClientKind,
      donationStatus: d.donationStatus as DonationClientStatus,
      amountCents: d.amountCents,
      currency: d.currency,
      paymentMethod: d.paymentMethod as DonationClientPaymentMethod,
      shelterId: d.shelterId,
      petId: typeof d.petId === 'string' ? d.petId : null,
      createdAt: d.createdAt,
    },
  };
};

const parseDonationStatusFailureStatus = (
  body: Record<string, unknown> | null,
): DonationStatusClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'donation_not_found' ||
    status === 'donation_status_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createDonationStatusClient = ({
  workerBaseUrl,
  donationsPath,
  getAccessToken,
  fetch,
}: CreateDonationStatusClientInput): DonationStatusClient => ({
  loadDonationStatus: async (donationId) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, donationsPath, donationId),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseDonationStatusFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseDonationStatusSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Sponsorship Client ──────────────────────────────────────────────────────

export type SponsorshipClientRecurringInterval = 'monthly' | 'quarterly' | 'annual';

export type SponsorshipClientInput = {
  shelterId: string;
  amountCents: number;
  paymentMethod: DonationClientPaymentMethod;
  recurringInterval: SponsorshipClientRecurringInterval;
  dataProcessingAccepted: true;
  petId?: string | null;
};

export type SponsorshipClientSuccess = {
  ok: true;
  status: 'sponsorship_created';
  sponsorshipId: string;
  amountCents: number;
  currency: string;
  recurringInterval: SponsorshipClientRecurringInterval;
  shelterId: string;
  createdAt: string;
};

export type SponsorshipClientFailureStatus =
  | 'unauthenticated'
  | 'invalid_sponsorship'
  | 'sponsorship_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type SponsorshipClientFailure = {
  ok: false;
  status: SponsorshipClientFailureStatus;
  reasons: string[];
};

export type SponsorshipClientResult = SponsorshipClientSuccess | SponsorshipClientFailure;

export type CreateSponsorshipClientInput = {
  workerBaseUrl: string;
  sponsorshipsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type SponsorshipClient = {
  submitSponsorship: (input: SponsorshipClientInput) => Promise<SponsorshipClientResult>;
};

const parseSponsorshipSuccess = (
  body: Record<string, unknown> | null,
): SponsorshipClientSuccess | null => {
  if (
    !body ||
    body.status !== 'sponsorship_created' ||
    typeof body.sponsorshipId !== 'string' ||
    typeof body.amountCents !== 'number' ||
    typeof body.currency !== 'string' ||
    typeof body.recurringInterval !== 'string' ||
    typeof body.shelterId !== 'string' ||
    typeof body.createdAt !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'sponsorship_created',
    sponsorshipId: body.sponsorshipId,
    amountCents: body.amountCents,
    currency: body.currency,
    recurringInterval: body.recurringInterval as SponsorshipClientRecurringInterval,
    shelterId: body.shelterId,
    createdAt: body.createdAt,
  };
};

const parseSponsorshipFailureStatus = (
  body: Record<string, unknown> | null,
): SponsorshipClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'invalid_sponsorship' ||
    status === 'sponsorship_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const buildSponsorshipPayload = (input: SponsorshipClientInput): Record<string, unknown> => ({
  shelterId: input.shelterId,
  amountCents: input.amountCents,
  paymentMethod: input.paymentMethod,
  recurringInterval: input.recurringInterval,
  petId: input.petId ?? null,
  dataProcessingAccepted: input.dataProcessingAccepted,
});

export const createSponsorshipClient = ({
  workerBaseUrl,
  sponsorshipsPath,
  getAccessToken,
  fetch,
}: CreateSponsorshipClientInput): SponsorshipClient => ({
  submitSponsorship: async (input) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(createWorkerUrl(workerBaseUrl, sponsorshipsPath), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildSponsorshipPayload(input)),
      });
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseSponsorshipFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseSponsorshipSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Sponsorship List Client ────────────────────────────────────────────────

export type SponsorshipClientStatus = 'active' | 'cancelled' | 'paused';

export type SponsorshipListItem = {
  sponsorshipId: string;
  amountCents: number;
  currency: string;
  paymentMethod: DonationClientPaymentMethod;
  recurringInterval: SponsorshipClientRecurringInterval;
  status: SponsorshipClientStatus;
  petId: string | null;
  createdAt: string;
};

export type SponsorshipListQuery = {
  limit?: number | null;
  offset?: number | null;
};

export type SponsorshipListClientSuccess = {
  ok: true;
  status: 'ok';
  sponsorships: SponsorshipListItem[];
  total: number;
};

export type SponsorshipListClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'sponsorship_list_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type SponsorshipListClientFailure = {
  ok: false;
  status: SponsorshipListClientFailureStatus;
  reasons: string[];
};

export type SponsorshipListClientResult =
  | SponsorshipListClientSuccess
  | SponsorshipListClientFailure;

export type CreateSponsorshipListClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type SponsorshipListClient = {
  loadSponsorships: (
    shelterId: string,
    query?: SponsorshipListQuery,
  ) => Promise<SponsorshipListClientResult>;
};

const parseSponsorshipListSuccess = (
  body: Record<string, unknown> | null,
): SponsorshipListClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.sponsorships) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    sponsorships: body.sponsorships as SponsorshipListItem[],
    total: body.total,
  };
};

const parseSponsorshipListFailureStatus = (
  body: Record<string, unknown> | null,
): SponsorshipListClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'sponsorship_list_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createSponsorshipListClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateSponsorshipListClientInput): SponsorshipListClient => ({
  loadSponsorships: async (shelterId, query = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    const base = createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'sponsorships');
    const url = new URL(base);

    if (query?.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query?.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseSponsorshipListFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseSponsorshipListSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Sponsorship Manage Client ───────────────────────────────────────────────

export type SponsorshipManageClientInput = {
  sponsorshipId: string;
  status: SponsorshipClientStatus;
};

export type SponsorshipManageClientSuccess = {
  ok: true;
  status: 'ok';
  sponsorshipId: string;
  newStatus: SponsorshipClientStatus;
};

export type SponsorshipManageClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'sponsorship_not_found'
  | 'invalid_sponsorship_manage'
  | 'sponsorship_manage_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type SponsorshipManageClientFailure = {
  ok: false;
  status: SponsorshipManageClientFailureStatus;
  reasons: string[];
};

export type SponsorshipManageClientResult =
  | SponsorshipManageClientSuccess
  | SponsorshipManageClientFailure;

export type CreateSponsorshipManageClientInput = {
  workerBaseUrl: string;
  sponsorshipsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type SponsorshipManageClient = {
  manageSponsorship: (
    sponsorshipId: string,
    status: SponsorshipClientStatus,
  ) => Promise<SponsorshipManageClientResult>;
};

const parseSponsorshipManageSuccess = (
  body: Record<string, unknown> | null,
): SponsorshipManageClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    typeof body.sponsorshipId !== 'string' ||
    typeof body.newStatus !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    sponsorshipId: body.sponsorshipId,
    newStatus: body.newStatus as SponsorshipClientStatus,
  };
};

const parseSponsorshipManageFailureStatus = (
  body: Record<string, unknown> | null,
): SponsorshipManageClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'sponsorship_not_found' ||
    status === 'invalid_sponsorship_manage' ||
    status === 'sponsorship_manage_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createSponsorshipManageClient = ({
  workerBaseUrl,
  sponsorshipsPath,
  getAccessToken,
  fetch,
}: CreateSponsorshipManageClientInput): SponsorshipManageClient => ({
  manageSponsorship: async (sponsorshipId, status) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, sponsorshipsPath, sponsorshipId),
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        },
      );
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseSponsorshipManageFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return {
        ok: false,
        status: failureStatus,
        reasons: sanitizeReasons(reasons, failureStatus),
      };
    }

    const success = parseSponsorshipManageSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Sponsorship Donor List Client ──────────────────────────────────────────

export type SponsorshipDonorListQuery = {
  limit?: number | null;
  offset?: number | null;
};

export type SponsorshipDonorListClientSuccess = {
  ok: true;
  status: 'ok';
  sponsorships: SponsorshipListItem[];
  total: number;
};

export type SponsorshipDonorListClientFailureStatus =
  | 'unauthenticated'
  | 'sponsorship_donor_list_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type SponsorshipDonorListClientFailure = {
  ok: false;
  status: SponsorshipDonorListClientFailureStatus;
  reasons: string[];
};

export type SponsorshipDonorListClientResult =
  | SponsorshipDonorListClientSuccess
  | SponsorshipDonorListClientFailure;

export type CreateSponsorshipDonorListClientInput = {
  workerBaseUrl: string;
  sponsorshipsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type SponsorshipDonorListClient = {
  loadDonorSponsorships: (
    query?: SponsorshipDonorListQuery,
  ) => Promise<SponsorshipDonorListClientResult>;
};

const parseSponsorshipDonorListSuccess = (
  body: Record<string, unknown> | null,
): SponsorshipDonorListClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.sponsorships) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    sponsorships: body.sponsorships as SponsorshipListItem[],
    total: body.total,
  };
};

const parseSponsorshipDonorListFailureStatus = (
  body: Record<string, unknown> | null,
): SponsorshipDonorListClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'sponsorship_donor_list_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createSponsorshipDonorListClient = ({
  workerBaseUrl,
  sponsorshipsPath,
  getAccessToken,
  fetch,
}: CreateSponsorshipDonorListClientInput): SponsorshipDonorListClient => ({
  loadDonorSponsorships: async (query = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    const base = createWorkerUrl(workerBaseUrl, sponsorshipsPath);
    const url = new URL(base);

    if (query?.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query?.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseSponsorshipDonorListFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseSponsorshipDonorListSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Adoption Status Client ───────────────────────────────────────────────────

export type AdoptionStatusShelterManageStatus =
  | 'under_review'
  | 'more_info_requested'
  | 'approved'
  | 'rejected';

export type AdoptionStatusClientSuccess = {
  ok: true;
  status: 'ok';
  applicationId: string;
  newStatus: AdoptionStatusShelterManageStatus;
};

export type AdoptionStatusClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'adoption_not_found'
  | 'invalid_adoption_status'
  | 'adoption_status_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type AdoptionStatusClientFailure = {
  ok: false;
  status: AdoptionStatusClientFailureStatus;
  reasons: string[];
};

export type AdoptionStatusClientResult =
  | AdoptionStatusClientSuccess
  | AdoptionStatusClientFailure;

export type CreateAdoptionStatusClientInput = {
  workerBaseUrl: string;
  adoptionsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type AdoptionStatusClient = {
  manageAdoptionStatus: (
    applicationId: string,
    status: AdoptionStatusShelterManageStatus,
  ) => Promise<AdoptionStatusClientResult>;
};

const parseAdoptionStatusSuccess = (
  body: Record<string, unknown> | null,
): AdoptionStatusClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    typeof body.applicationId !== 'string' ||
    typeof body.newStatus !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    applicationId: body.applicationId,
    newStatus: body.newStatus as AdoptionStatusShelterManageStatus,
  };
};

const parseAdoptionStatusFailureStatus = (
  body: Record<string, unknown> | null,
): AdoptionStatusClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'adoption_not_found' ||
    status === 'invalid_adoption_status' ||
    status === 'adoption_status_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createAdoptionStatusClient = ({
  workerBaseUrl,
  adoptionsPath,
  getAccessToken,
  fetch,
}: CreateAdoptionStatusClientInput): AdoptionStatusClient => ({
  manageAdoptionStatus: async (applicationId, status) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, adoptionsPath, applicationId),
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        },
      );
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseAdoptionStatusFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return {
        ok: false,
        status: failureStatus,
        reasons: sanitizeReasons(reasons, failureStatus),
      };
    }

    const success = parseAdoptionStatusSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Adoption View Client ─────────────────────────────────────────────────────

export type AdoptionViewClientApplication = {
  applicationId: string;
  applicationStatus: AdoptionApplicationStatus;
  shelterId: string;
  petId: string | null;
};

export type AdoptionViewClientSuccess = {
  ok: true;
  status: 'ok';
  application: AdoptionViewClientApplication;
};

export type AdoptionViewClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'adoption_not_found'
  | 'adoption_view_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type AdoptionViewClientFailure = {
  ok: false;
  status: AdoptionViewClientFailureStatus;
  reasons: string[];
};

export type AdoptionViewClientResult =
  | AdoptionViewClientSuccess
  | AdoptionViewClientFailure;

export type CreateAdoptionViewClientInput = {
  workerBaseUrl: string;
  adoptionsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type AdoptionViewClient = {
  loadAdoptionView: (applicationId: string) => Promise<AdoptionViewClientResult>;
};

const parseAdoptionViewSuccess = (
  body: Record<string, unknown> | null,
): AdoptionViewClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    typeof body.applicationId !== 'string' ||
    typeof body.applicationStatus !== 'string' ||
    typeof body.shelterId !== 'string' ||
    (body.petId !== null && typeof body.petId !== 'string')
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    application: {
      applicationId: body.applicationId,
      applicationStatus: body.applicationStatus as AdoptionApplicationStatus,
      shelterId: body.shelterId,
      petId: typeof body.petId === 'string' ? body.petId : null,
    },
  };
};

const parseAdoptionViewFailureStatus = (
  body: Record<string, unknown> | null,
): AdoptionViewClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'adoption_not_found' ||
    status === 'adoption_view_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createAdoptionViewClient = ({
  workerBaseUrl,
  adoptionsPath,
  getAccessToken,
  fetch,
}: CreateAdoptionViewClientInput): AdoptionViewClient => ({
  loadAdoptionView: async (applicationId) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, adoptionsPath, applicationId),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseAdoptionViewFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return {
        ok: false,
        status: failureStatus,
        reasons: sanitizeReasons(reasons, failureStatus),
      };
    }

    const success = parseAdoptionViewSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Shelter Member Client ────────────────────────────────────────────────────

export type ShelterMemberClientRole = 'shelter_owner' | 'shelter_member';

export type ShelterMemberClientSummary = {
  memberId: string;
  userId: string;
  role: ShelterMemberClientRole;
  joinedAt: string;
};

export type ShelterMemberLoadSuccess = {
  ok: true;
  status: 'ok';
  members: ShelterMemberClientSummary[];
  total: number;
};

export type ShelterMemberAddSuccess = {
  ok: true;
  status: 'ok';
  memberId: string;
  userId: string;
  role: ShelterMemberClientRole;
};

export type ShelterMemberRemoveSuccess = {
  ok: true;
  status: 'ok';
  memberId: string;
};

export type ShelterMemberClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'member_not_found'
  | 'member_already_exists'
  | 'shelter_member_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ShelterMemberClientFailure = {
  ok: false;
  status: ShelterMemberClientFailureStatus;
  reasons: string[];
};

export type ShelterMemberLoadResult = ShelterMemberLoadSuccess | ShelterMemberClientFailure;
export type ShelterMemberAddResult = ShelterMemberAddSuccess | ShelterMemberClientFailure;
export type ShelterMemberRemoveResult = ShelterMemberRemoveSuccess | ShelterMemberClientFailure;

export type ShelterMemberListQuery = {
  limit?: number | null;
  offset?: number | null;
};

export type CreateShelterMemberClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type ShelterMemberClient = {
  loadShelterMembers: (
    shelterId: string,
    query?: ShelterMemberListQuery,
  ) => Promise<ShelterMemberLoadResult>;
  addShelterMember: (
    shelterId: string,
    input: { userId: string; role: ShelterMemberClientRole },
  ) => Promise<ShelterMemberAddResult>;
  removeShelterMember: (
    shelterId: string,
    memberId: string,
  ) => Promise<ShelterMemberRemoveResult>;
};

const parseShelterMemberLoadSuccess = (
  body: Record<string, unknown> | null,
): ShelterMemberLoadSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.members) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  const members: ShelterMemberClientSummary[] = [];

  for (const m of body.members) {
    if (!m || typeof m !== 'object') return null;

    const member = m as Record<string, unknown>;

    if (
      typeof member.memberId !== 'string' ||
      typeof member.userId !== 'string' ||
      typeof member.role !== 'string' ||
      typeof member.joinedAt !== 'string'
    ) {
      return null;
    }

    members.push({
      memberId: member.memberId,
      userId: member.userId,
      role: member.role as ShelterMemberClientRole,
      joinedAt: member.joinedAt,
    });
  }

  return { ok: true, status: 'ok', members, total: body.total };
};

const parseShelterMemberAddSuccess = (
  body: Record<string, unknown> | null,
): ShelterMemberAddSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    typeof body.memberId !== 'string' ||
    typeof body.userId !== 'string' ||
    typeof body.role !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    memberId: body.memberId,
    userId: body.userId,
    role: body.role as ShelterMemberClientRole,
  };
};

const parseShelterMemberRemoveSuccess = (
  body: Record<string, unknown> | null,
): ShelterMemberRemoveSuccess | null => {
  if (!body || body.status !== 'ok' || typeof body.memberId !== 'string') {
    return null;
  }

  return { ok: true, status: 'ok', memberId: body.memberId };
};

const parseShelterMemberClientFailureStatus = (
  body: Record<string, unknown> | null,
): ShelterMemberClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'member_not_found' ||
    status === 'member_already_exists' ||
    status === 'shelter_member_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createShelterMemberClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateShelterMemberClientInput): ShelterMemberClient => ({
  loadShelterMembers: async (shelterId, query = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const base = createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'members');
    const url = new URL(base);

    if (query?.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query?.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseShelterMemberClientFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parseShelterMemberLoadSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },

  addShelterMember: async (shelterId, input) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'members'),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        },
      );
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseShelterMemberClientFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parseShelterMemberAddSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },

  removeShelterMember: async (shelterId, memberId) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'members', memberId),
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseShelterMemberClientFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parseShelterMemberRemoveSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

// ─── Pet Archive Client ───────────────────────────────────────────────────────

export type PetArchiveClientSuccess = {
  ok: true;
  status: 'ok';
  petId: string;
};

export type PetArchiveClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'pet_not_found'
  | 'pet_already_archived'
  | 'invalid_payload'
  | 'pet_archive_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type PetArchiveClientFailure = {
  ok: false;
  status: PetArchiveClientFailureStatus;
  reasons: string[];
};

export type PetArchiveClientResult = PetArchiveClientSuccess | PetArchiveClientFailure;

export type PetRepublishClientSuccess = {
  ok: true;
  status: 'ok';
  petId: string;
};

export type PetRepublishClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'pet_not_found'
  | 'pet_not_archived'
  | 'invalid_payload'
  | 'pet_archive_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type PetRepublishClientFailure = {
  ok: false;
  status: PetRepublishClientFailureStatus;
  reasons: string[];
};

export type PetRepublishClientResult = PetRepublishClientSuccess | PetRepublishClientFailure;

export type CreatePetArchiveClientInput = {
  workerBaseUrl: string;
  petFeedPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type PetArchiveClient = {
  archivePet: (petId: string) => Promise<PetArchiveClientResult>;
  republishPet: (petId: string) => Promise<PetRepublishClientResult>;
};

const parsePetArchiveSuccess = (
  body: Record<string, unknown> | null,
): PetArchiveClientSuccess | null => {
  if (!body || body.status !== 'ok' || typeof body.petId !== 'string') return null;

  return { ok: true, status: 'ok', petId: body.petId };
};

const parsePetArchiveFailureStatus = (
  body: Record<string, unknown> | null,
): PetArchiveClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'pet_not_found' ||
    status === 'pet_already_archived' ||
    status === 'invalid_payload' ||
    status === 'pet_archive_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parsePetRepublishSuccess = (
  body: Record<string, unknown> | null,
): PetRepublishClientSuccess | null => {
  if (!body || body.status !== 'ok' || typeof body.petId !== 'string') return null;

  return { ok: true, status: 'ok', petId: body.petId };
};

const parsePetRepublishFailureStatus = (
  body: Record<string, unknown> | null,
): PetRepublishClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'pet_not_found' ||
    status === 'pet_not_archived' ||
    status === 'invalid_payload' ||
    status === 'pet_archive_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createPetArchiveClient = ({
  workerBaseUrl,
  petFeedPath,
  getAccessToken,
  fetch,
}: CreatePetArchiveClientInput): PetArchiveClient => ({
  archivePet: async (petId: string): Promise<PetArchiveClientResult> => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, petFeedPath, petId, 'status'),
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'archived' }),
        },
      );
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parsePetArchiveFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return {
        ok: false,
        status: failureStatus,
        reasons: sanitizeReasons(reasons, failureStatus),
      };
    }

    const success = parsePetArchiveSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },

  republishPet: async (petId: string): Promise<PetRepublishClientResult> => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, petFeedPath, petId, 'status'),
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'published' }),
        },
      );
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parsePetRepublishFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return {
        ok: false,
        status: failureStatus,
        reasons: sanitizeReasons(reasons, failureStatus),
      };
    }

    const success = parsePetRepublishSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Notification Client ─────────────────────────────────────────────────────

export type NotificationClientType =
  | 'adoption_status_changed'
  | 'new_adoption_application'
  | 'donation_paid'
  | 'sponsorship_status_changed';

export type NotificationSummary = {
  notificationId: string;
  type: NotificationClientType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type ListNotificationsClientSuccess = {
  ok: true;
  status: 'ok';
  notifications: NotificationSummary[];
  total: number;
  unreadCount: number;
};

export type ListNotificationsClientFailureStatus =
  | 'unauthenticated'
  | 'notification_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ListNotificationsClientFailure = {
  ok: false;
  status: ListNotificationsClientFailureStatus;
  reasons: string[];
};

export type ListNotificationsClientResult =
  | ListNotificationsClientSuccess
  | ListNotificationsClientFailure;

export type MarkNotificationReadClientSuccess = {
  ok: true;
  status: 'notification_marked_read';
  notificationId: string;
};

export type MarkNotificationReadClientFailureStatus =
  | 'unauthenticated'
  | 'notification_not_found'
  | 'notification_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type MarkNotificationReadClientFailure = {
  ok: false;
  status: MarkNotificationReadClientFailureStatus;
  reasons: string[];
};

export type MarkNotificationReadClientResult =
  | MarkNotificationReadClientSuccess
  | MarkNotificationReadClientFailure;

export type ListNotificationsClientQuery = {
  limit?: number;
  offset?: number;
};

export type CreateNotificationClientInput = {
  workerBaseUrl: string;
  notificationsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type NotificationClient = {
  listNotifications: (
    query?: ListNotificationsClientQuery,
  ) => Promise<ListNotificationsClientResult>;
  markNotificationRead: (
    notificationId: string,
  ) => Promise<MarkNotificationReadClientResult>;
};

const parseListNotificationsSuccess = (
  body: Record<string, unknown> | null,
): ListNotificationsClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.notifications) ||
    typeof body.total !== 'number' ||
    typeof body.unreadCount !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    notifications: body.notifications as NotificationSummary[],
    total: body.total,
    unreadCount: body.unreadCount,
  };
};

const parseListNotificationsFailureStatus = (
  body: Record<string, unknown> | null,
): ListNotificationsClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'notification_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parseMarkNotificationReadFailureStatus = (
  body: Record<string, unknown> | null,
  responseStatus: number,
): MarkNotificationReadClientFailureStatus => {
  const status = body?.status;

  if (responseStatus === 404 || status === 'notification_not_found') {
    return 'notification_not_found';
  }

  if (
    status === 'unauthenticated' ||
    status === 'notification_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createNotificationClient = ({
  workerBaseUrl,
  notificationsPath,
  getAccessToken,
  fetch,
}: CreateNotificationClientInput): NotificationClient => ({
  listNotifications: async (query = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const base = createWorkerUrl(workerBaseUrl, notificationsPath);
    const url = new URL(base);

    if (query.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseListNotificationsFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parseListNotificationsSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },

  markNotificationRead: async (notificationId: string) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, notificationsPath, notificationId, 'read'),
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseMarkNotificationReadFailureStatus(body, response.status);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    if (
      !body ||
      body.status !== 'notification_marked_read' ||
      typeof body.notificationId !== 'string'
    ) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return { ok: true, status: 'notification_marked_read', notificationId: body.notificationId };
  },
});

// ─── Notification Preferences Client ─────────────────────────────────────────

export type NotificationPreferenceItem = {
  type: NotificationClientType;
  enabled: boolean;
};

export type LoadNotificationPreferencesClientSuccess = {
  ok: true;
  status: 'ok';
  preferences: NotificationPreferenceItem[];
};

export type LoadNotificationPreferencesClientFailureStatus =
  | 'unauthenticated'
  | 'notification_preferences_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type LoadNotificationPreferencesClientFailure = {
  ok: false;
  status: LoadNotificationPreferencesClientFailureStatus;
  reasons: string[];
};

export type LoadNotificationPreferencesClientResult =
  | LoadNotificationPreferencesClientSuccess
  | LoadNotificationPreferencesClientFailure;

export type UpdateNotificationPreferencesClientSuccess = {
  ok: true;
  status: 'ok';
  preferences: NotificationPreferenceItem[];
};

export type UpdateNotificationPreferencesClientFailureStatus =
  | 'unauthenticated'
  | 'invalid_body'
  | 'notification_preferences_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type UpdateNotificationPreferencesClientFailure = {
  ok: false;
  status: UpdateNotificationPreferencesClientFailureStatus;
  reasons: string[];
};

export type UpdateNotificationPreferencesClientResult =
  | UpdateNotificationPreferencesClientSuccess
  | UpdateNotificationPreferencesClientFailure;

export type CreateNotificationPreferencesClientInput = {
  workerBaseUrl: string;
  notificationsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type NotificationPreferencesClient = {
  loadPreferences: () => Promise<LoadNotificationPreferencesClientResult>;
  updatePreferences: (
    preferences: NotificationPreferenceItem[],
  ) => Promise<UpdateNotificationPreferencesClientResult>;
};

const parsePreferencesSuccess = (
  body: Record<string, unknown> | null,
): LoadNotificationPreferencesClientSuccess | null => {
  if (!body || body.status !== 'ok' || !Array.isArray(body.preferences)) return null;
  return { ok: true, status: 'ok', preferences: body.preferences as NotificationPreferenceItem[] };
};

const parseLoadPreferencesFailureStatus = (
  body: Record<string, unknown> | null,
): LoadNotificationPreferencesClientFailureStatus => {
  const status = body?.status;
  if (
    status === 'unauthenticated' ||
    status === 'notification_preferences_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }
  return 'worker_request_failed';
};

const parseUpdatePreferencesFailureStatus = (
  body: Record<string, unknown> | null,
): UpdateNotificationPreferencesClientFailureStatus => {
  const status = body?.status;
  if (status === 'invalid_body') return 'invalid_body';
  if (
    status === 'unauthenticated' ||
    status === 'notification_preferences_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }
  return 'worker_request_failed';
};

export const createNotificationPreferencesClient = ({
  workerBaseUrl,
  notificationsPath,
  getAccessToken,
  fetch,
}: CreateNotificationPreferencesClientInput): NotificationPreferencesClient => ({
  loadPreferences: async () => {
    const accessToken = await getAccessToken();
    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const url = createWorkerSubUrl(workerBaseUrl, notificationsPath, 'preferences');
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseLoadPreferencesFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];
      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parsePreferencesSuccess(body);
    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },

  updatePreferences: async (preferences: NotificationPreferenceItem[]) => {
    const accessToken = await getAccessToken();
    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const url = createWorkerSubUrl(workerBaseUrl, notificationsPath, 'preferences');
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseUpdatePreferencesFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];
      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parsePreferencesSuccess(body);
    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success as UpdateNotificationPreferencesClientSuccess;
  },
});

// ─── Adoption Donor List Client ───────────────────────────────────────────────

export type AdoptionDonorListItem = {
  applicationId: string;
  petId: string;
  shelterId: string;
  status: AdoptionApplicationStatus;
  submittedAt: string | null;
};

export type AdoptionDonorListQuery = {
  limit?: number | null;
  offset?: number | null;
};

export type AdoptionDonorListClientSuccess = {
  ok: true;
  status: 'ok';
  applications: AdoptionDonorListItem[];
  total: number;
};

export type AdoptionDonorListClientFailureStatus =
  | 'unauthenticated'
  | 'adoption_donor_list_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type AdoptionDonorListClientFailure = {
  ok: false;
  status: AdoptionDonorListClientFailureStatus;
  reasons: string[];
};

export type AdoptionDonorListClientResult =
  | AdoptionDonorListClientSuccess
  | AdoptionDonorListClientFailure;

export type CreateAdoptionDonorListClientInput = {
  workerBaseUrl: string;
  adoptionsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type AdoptionDonorListClient = {
  loadDonorAdoptions: (query?: AdoptionDonorListQuery) => Promise<AdoptionDonorListClientResult>;
};

const parseAdoptionDonorListSuccess = (
  body: Record<string, unknown> | null,
): AdoptionDonorListClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.applications) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    applications: body.applications as AdoptionDonorListItem[],
    total: body.total,
  };
};

const parseAdoptionDonorListFailureStatus = (
  body: Record<string, unknown> | null,
): AdoptionDonorListClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'adoption_donor_list_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

export const createAdoptionDonorListClient = ({
  workerBaseUrl,
  adoptionsPath,
  getAccessToken,
  fetch,
}: CreateAdoptionDonorListClientInput): AdoptionDonorListClient => ({
  loadDonorAdoptions: async (query = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    const base = createWorkerUrl(workerBaseUrl, adoptionsPath);
    const url = new URL(base);

    if (query?.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query?.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseAdoptionDonorListFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseAdoptionDonorListSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

// ─── Media Upload Flow Client ─────────────────────────────────────────────────

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

// ─── Financials Client ────────────────────────────────────────────────────────

export type FinancialsClientDonationBreakdown = {
  status: string;
  count: number;
  totalCents: number;
};

export type FinancialsClientSummary = {
  shelterId: string;
  currency: string;
  donations: {
    count: number;
    paidTotalCents: number;
    byStatus: FinancialsClientDonationBreakdown[];
  };
  sponsorships: {
    activeCount: number;
    pausedCount: number;
    cancelledCount: number;
    activeTotalCents: number;
  };
};

export type LoadFinancialsClientSuccess = {
  ok: true;
  status: 'ok';
  summary: FinancialsClientSummary;
};

export type LoadFinancialsClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'financials_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type LoadFinancialsClientFailure = {
  ok: false;
  status: LoadFinancialsClientFailureStatus;
  reasons: string[];
};

export type LoadFinancialsClientResult =
  | LoadFinancialsClientSuccess
  | LoadFinancialsClientFailure;

export type CreateFinancialsClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type FinancialsClient = {
  loadFinancials: (shelterId: string) => Promise<LoadFinancialsClientResult>;
};

const parseFinancialsFailureStatus = (
  body: Record<string, unknown> | null,
): LoadFinancialsClientFailureStatus => {
  const status = body?.status;
  if (status === 'forbidden') return 'forbidden';
  if (
    status === 'unauthenticated' ||
    status === 'financials_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }
  return 'worker_request_failed';
};

const parseFinancialsSuccess = (
  body: Record<string, unknown> | null,
): LoadFinancialsClientSuccess | null => {
  if (!body || body.status !== 'ok') return null;
  if (typeof body.shelterId !== 'string') return null;
  if (typeof body.currency !== 'string') return null;

  const donations = body.donations as Record<string, unknown> | undefined;
  const sponsorships = body.sponsorships as Record<string, unknown> | undefined;
  if (!donations || !sponsorships) return null;

  return {
    ok: true,
    status: 'ok',
    summary: {
      shelterId: body.shelterId,
      currency: body.currency,
      donations: {
        count: (donations.count as number) ?? 0,
        paidTotalCents: (donations.paidTotalCents as number) ?? 0,
        byStatus: Array.isArray(donations.byStatus)
          ? (donations.byStatus as FinancialsClientDonationBreakdown[])
          : [],
      },
      sponsorships: {
        activeCount: (sponsorships.activeCount as number) ?? 0,
        pausedCount: (sponsorships.pausedCount as number) ?? 0,
        cancelledCount: (sponsorships.cancelledCount as number) ?? 0,
        activeTotalCents: (sponsorships.activeTotalCents as number) ?? 0,
      },
    },
  };
};

export const createFinancialsClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateFinancialsClientInput): FinancialsClient => ({
  loadFinancials: async (shelterId: string) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const url = createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'financials');
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseFinancialsFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseFinancialsSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

// ─── Pet Status History Client ────────────────────────────────────────────────

export type PetStatusHistoryEvent = {
  id: string;
  petId: string;
  shelterId: string;
  actorUserId: string;
  fromStatus: string;
  toStatus: string;
  createdAt: string;
};

export type LoadPetStatusHistoryClientSuccess = {
  ok: true;
  status: 'ok';
  petId: string;
  events: PetStatusHistoryEvent[];
};

export type LoadPetStatusHistoryClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'pet_not_found'
  | 'pet_archive_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type LoadPetStatusHistoryClientFailure = {
  ok: false;
  status: LoadPetStatusHistoryClientFailureStatus;
  reasons: string[];
};

export type LoadPetStatusHistoryClientResult =
  | LoadPetStatusHistoryClientSuccess
  | LoadPetStatusHistoryClientFailure;

export type CreatePetStatusHistoryClientInput = {
  workerBaseUrl: string;
  petFeedPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: typeof globalThis.fetch;
};

export type PetStatusHistoryClient = {
  loadStatusHistory: (petId: string) => Promise<LoadPetStatusHistoryClientResult>;
};

const parsePetStatusHistoryFailureStatus = (
  body: Record<string, unknown> | null,
): LoadPetStatusHistoryClientFailureStatus => {
  const status = body?.status;
  if (status === 'unauthenticated') return 'unauthenticated';
  if (status === 'forbidden') return 'forbidden';
  if (status === 'pet_not_found') return 'pet_not_found';
  if (status === 'pet_archive_repository_not_configured') return 'pet_archive_repository_not_configured';
  if (status === 'auth_adapter_not_configured') return 'auth_adapter_not_configured';
  if (status === 'worker_response_invalid') return 'worker_response_invalid';
  return 'worker_request_failed';
};

const parsePetStatusHistorySuccess = (
  body: Record<string, unknown> | null,
): LoadPetStatusHistoryClientSuccess | null => {
  if (!body || body.status !== 'ok') return null;
  if (typeof body.petId !== 'string') return null;
  const rawEvents = Array.isArray(body.events) ? body.events : [];
  const events: PetStatusHistoryEvent[] = rawEvents
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e) => ({
      id: String(e.id ?? ''),
      petId: String(e.petId ?? ''),
      shelterId: String(e.shelterId ?? ''),
      actorUserId: String(e.actorUserId ?? ''),
      fromStatus: String(e.fromStatus ?? ''),
      toStatus: String(e.toStatus ?? ''),
      createdAt: String(e.createdAt ?? ''),
    }));
  return { ok: true, status: 'ok', petId: body.petId, events };
};

export const createPetStatusHistoryClient = ({
  workerBaseUrl,
  petFeedPath,
  getAccessToken,
  fetch,
}: CreatePetStatusHistoryClientInput): PetStatusHistoryClient => ({
  loadStatusHistory: async (petId: string) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const url = createWorkerSubUrl(workerBaseUrl, petFeedPath, petId, 'status-history');
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parsePetStatusHistoryFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parsePetStatusHistorySuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

// ─── Shelter Pet List Client ──────────────────────────────────────────────────

export type ShelterPetStatus =
  | 'draft'
  | 'published'
  | 'adoption_pending'
  | 'adopted'
  | 'not_available'
  | 'archived';

export type ShelterPetClientSummary = {
  petId: string;
  name: string | null;
  species: string | null;
  status: ShelterPetStatus;
  heroMediaId: string | null;
  locationLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShelterPetListQuery = {
  limit?: number;
  offset?: number;
};

export type ShelterPetListClientSuccess = {
  ok: true;
  status: 'ok';
  pets: ShelterPetClientSummary[];
  total: number;
};

export type ShelterPetListClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'shelter_pet_list_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ShelterPetListClientFailure = {
  ok: false;
  status: ShelterPetListClientFailureStatus;
  reasons: string[];
};

export type ShelterPetListClientResult = ShelterPetListClientSuccess | ShelterPetListClientFailure;

export type CreateShelterPetListClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: typeof globalThis.fetch;
};

export type ShelterPetListClient = {
  loadShelterPets: (
    shelterId: string,
    query?: ShelterPetListQuery,
  ) => Promise<ShelterPetListClientResult>;
};

const parseShelterPetListFailureStatus = (
  body: Record<string, unknown> | null,
): ShelterPetListClientFailureStatus => {
  const status = body?.status;
  if (status === 'unauthenticated') return 'unauthenticated';
  if (status === 'forbidden') return 'forbidden';
  if (status === 'shelter_pet_list_repository_not_configured') return 'shelter_pet_list_repository_not_configured';
  if (status === 'auth_adapter_not_configured') return 'auth_adapter_not_configured';
  if (status === 'worker_response_invalid') return 'worker_response_invalid';
  return 'worker_request_failed';
};

const parseShelterPetSummary = (raw: unknown): ShelterPetClientSummary | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.petId !== 'string') return null;
  if (typeof r.createdAt !== 'string') return null;
  if (typeof r.updatedAt !== 'string') return null;
  return {
    petId: r.petId,
    name: typeof r.name === 'string' ? r.name : null,
    species: typeof r.species === 'string' ? r.species : null,
    status: (r.status as ShelterPetStatus) ?? 'draft',
    heroMediaId: typeof r.heroMediaId === 'string' ? r.heroMediaId : null,
    locationLabel: typeof r.locationLabel === 'string' ? r.locationLabel : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
};

const parseShelterPetListSuccess = (
  body: Record<string, unknown> | null,
): ShelterPetListClientSuccess | null => {
  if (!body || body.status !== 'ok') return null;
  if (!Array.isArray(body.pets)) return null;
  if (typeof body.total !== 'number') return null;
  const pets = body.pets
    .map(parseShelterPetSummary)
    .filter((p): p is ShelterPetClientSummary => p !== null);
  return { ok: true, status: 'ok', pets, total: body.total };
};

export const createShelterPetListClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateShelterPetListClientInput): ShelterPetListClient => ({
  loadShelterPets: async (shelterId: string, query: ShelterPetListQuery = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const base = createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'pets');
    const params = new URLSearchParams();
    if (query.limit !== undefined) params.set('limit', String(query.limit));
    if (query.offset !== undefined) params.set('offset', String(query.offset));
    const url = params.size > 0 ? `${base}?${params.toString()}` : base;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseShelterPetListFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseShelterPetListSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

// ─── Shelter Registration ─────────────────────────────────────────────────────

export type ShelterRegistrationClientInput = {
  name: string;
  kind: string;
  city: string;
  publicEmail?: string | null;
  publicPhone?: string | null;
  description?: string | null;
  district?: string | null;
};

export type RegisterShelterClientSuccess = {
  ok: true;
  status: 'registered';
  shelterId: string;
};

export type RegisterShelterClientFailureStatus =
  | 'unauthenticated'
  | 'invalid_payload'
  | 'auth_adapter_not_configured'
  | 'shelter_registration_repository_not_configured'
  | 'worker_request_failed';

export type RegisterShelterClientFailure = {
  ok: false;
  status: RegisterShelterClientFailureStatus;
  reasons: string[];
};

export type RegisterShelterClientResult = RegisterShelterClientSuccess | RegisterShelterClientFailure;

export type CreateShelterRegistrationClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: typeof globalThis.fetch;
};

export type ShelterRegistrationClient = {
  registerShelter: (input: ShelterRegistrationClientInput) => Promise<RegisterShelterClientResult>;
};

const parseRegisterShelterFailureStatus = (
  body: Record<string, unknown> | null,
): RegisterShelterClientFailureStatus => {
  const status = body?.status;
  if (status === 'unauthenticated') return 'unauthenticated';
  if (status === 'invalid_payload') return 'invalid_payload';
  if (status === 'auth_adapter_not_configured') return 'auth_adapter_not_configured';
  if (status === 'shelter_registration_repository_not_configured')
    return 'shelter_registration_repository_not_configured';
  return 'worker_request_failed';
};

const parseRegisterShelterSuccess = (
  body: Record<string, unknown> | null,
): RegisterShelterClientSuccess | null => {
  if (!body || body.status !== 'created' || typeof body.shelterId !== 'string') return null;
  return { ok: true, status: 'registered', shelterId: body.shelterId };
};

export const createShelterRegistrationClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateShelterRegistrationClientInput): ShelterRegistrationClient => ({
  registerShelter: async (input: ShelterRegistrationClientInput) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(createWorkerUrl(workerBaseUrl, shelterPath), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: input.name,
          kind: input.kind,
          city: input.city,
          publicEmail: input.publicEmail ?? null,
          publicPhone: input.publicPhone ?? null,
          description: input.description ?? null,
          district: input.district ?? null,
        }),
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseRegisterShelterFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseRegisterShelterSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_request_failed', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

// ─── Shelter Update ───────────────────────────────────────────────────────────

export type ShelterUpdateClientInput = {
  name?: string;
  kind?: string;
  city?: string;
  district?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
  description?: string | null;
};

export type UpdateShelterClientSuccess = {
  ok: true;
  status: 'updated';
  shelterId: string;
};

export type UpdateShelterClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'invalid_payload'
  | 'shelter_not_found'
  | 'auth_adapter_not_configured'
  | 'shelter_update_repository_not_configured'
  | 'worker_request_failed';

export type UpdateShelterClientFailure = {
  ok: false;
  status: UpdateShelterClientFailureStatus;
  reasons: string[];
};

export type UpdateShelterClientResult = UpdateShelterClientSuccess | UpdateShelterClientFailure;

export type CreateShelterUpdateClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: typeof globalThis.fetch;
};

export type ShelterUpdateClient = {
  updateShelter: (
    shelterId: string,
    input: ShelterUpdateClientInput,
  ) => Promise<UpdateShelterClientResult>;
};

const parseUpdateShelterFailureStatus = (
  body: Record<string, unknown> | null,
): UpdateShelterClientFailureStatus => {
  const status = body?.status;
  if (status === 'unauthenticated') return 'unauthenticated';
  if (status === 'forbidden') return 'forbidden';
  if (status === 'invalid_payload') return 'invalid_payload';
  if (status === 'shelter_not_found') return 'shelter_not_found';
  if (status === 'auth_adapter_not_configured') return 'auth_adapter_not_configured';
  if (status === 'shelter_update_repository_not_configured')
    return 'shelter_update_repository_not_configured';
  return 'worker_request_failed';
};

const parseUpdateShelterSuccess = (
  body: Record<string, unknown> | null,
): UpdateShelterClientSuccess | null => {
  if (!body || body.status !== 'updated' || typeof body.shelterId !== 'string') return null;
  return { ok: true, status: 'updated', shelterId: body.shelterId };
};

export const createShelterUpdateClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateShelterUpdateClientInput): ShelterUpdateClient => ({
  updateShelter: async (shelterId: string, input: ShelterUpdateClientInput) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(`${createWorkerUrl(workerBaseUrl, shelterPath)}/${shelterId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseUpdateShelterFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseUpdateShelterSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_request_failed', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});
