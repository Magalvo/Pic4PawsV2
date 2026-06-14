import type {
  PetLifecycleSpecies,
  PetLifecycleStatus,
  PublicPetMedicalStatus,
} from '@pic4paws/domain';

import {
  createWorkerUrl,
  createWorkerSubUrl,
  parseJsonResponse,
  parseReasons,
  sanitizeReasons,
  type MediaUploadClientFetch,
} from './_shared';

import type {
  MediaUploadClientFailureStatus,
  MediaUploadBinaryFailureStatus,
  MediaUploadFlowClient,
} from './media';

// ─── Pet Draft types ───────────────────────────────────────────────────────────

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

// ─── Pet Publish types ────────────────────────────────────────────────────────

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

// ─── Pet Media Attach types ───────────────────────────────────────────────────

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

// ─── Pet Media Upload+Attach Flow types ──────────────────────────────────────

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

// ─── Pet Draft Save Flow types ────────────────────────────────────────────────

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

// ─── Pet Feed types ───────────────────────────────────────────────────────────

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

// ─── Pet Profile types ────────────────────────────────────────────────────────

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

// ─── Pet Archive types ────────────────────────────────────────────────────────

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

// ─── Pet Status History types ─────────────────────────────────────────────────

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

// ─── Private helpers ──────────────────────────────────────────────────────────

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

// ─── Factory functions ────────────────────────────────────────────────────────

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
