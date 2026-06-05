import {
  createR2BucketContract,
  createR2UploadDryRun,
  type EnvironmentConfig,
} from '@pic4paws/config';
import {
  createMediaAssetInsertFromUploadIntent,
  type MediaAssetInsertContract,
  type MediaAssetInsertRejectionReason,
} from '@pic4paws/database';
import {
  canManageShelter,
  createMediaUploadContract,
  type AuthenticatedActor,
  type MediaUploadPurpose,
  type MediaVisibility,
} from '@pic4paws/domain';

export type WorkerMediaUploadPayload = {
  mediaId: string;
  purpose: MediaUploadPurpose;
  requestedVisibility: MediaVisibility;
  mimeType: string;
  byteSize: number;
  ownerUserId?: string | null;
  shelterId?: string | null;
  originalFilename?: string | null;
};

export type WorkerMediaUploadIntent = {
  status: 'upload_signer_not_configured' | 'upload_ready';
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
};

export type MediaUploadSignerInput = {
  bucketName: string;
  objectKey: string;
  contentType: string;
  byteSize: number;
  visibility: MediaVisibility;
  expiresInSeconds: number;
};

export type MediaUploadSignerResult = {
  signedUrl: string;
  expiresAt: string;
};

export type MediaUploadSigner = (
  input: MediaUploadSignerInput,
) => Promise<MediaUploadSignerResult>;

export type MediaAssetRepository = {
  saveMediaAsset: (
    insert: MediaAssetInsertContract,
    actor: AuthenticatedActor,
  ) => Promise<{ mediaAssetId: string }>;
};

export type WorkerMediaUploadIntentInput = {
  payload: unknown;
  config: EnvironmentConfig;
  now: string;
  signer?: MediaUploadSigner;
  expiresInSeconds?: number;
};

export type WorkerMediaUploadIntentResult =
  | { ok: true; intent: WorkerMediaUploadIntent }
  | {
      ok: false;
      status: 'invalid_upload_request' | 'upload_signer_failed';
      reasons: string[];
    };

export type PersistWorkerMediaUploadIntentInput = {
  intent: WorkerMediaUploadIntent;
  actor: AuthenticatedActor;
  repository: MediaAssetRepository;
};

export type PersistWorkerMediaUploadIntentResult =
  | { ok: true; mediaAssetId: string }
  | {
      ok: false;
      status: 'invalid_media_asset_persistence' | 'media_asset_persistence_failed';
      reasons: Array<MediaAssetInsertRejectionReason | 'media_asset_repository_unavailable'>;
    };

const mediaUploadPurposes: MediaUploadPurpose[] = [
  'pet_public_image',
  'shelter_public_image',
  'adoption_document',
  'identity_document',
  'medical_record',
];

const mediaVisibilities: MediaVisibility[] = ['public', 'private'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNullableString = (value: unknown): value is string | null | undefined =>
  value === undefined || value === null || typeof value === 'string';

export const canPersistMediaUploadIntentForActor = (
  actor: AuthenticatedActor,
  intent: WorkerMediaUploadIntent,
): boolean => {
  if (intent.shelterId) {
    return canManageShelter(actor, intent.shelterId);
  }

  if (intent.ownerUserId) {
    return actor.role === 'admin' || actor.id === intent.ownerUserId;
  }

  return false;
};

const parseWorkerMediaUploadPayload = (
  payload: unknown,
): WorkerMediaUploadPayload | { reasons: string[] } => {
  if (!isRecord(payload)) {
    return { reasons: ['invalid_payload_shape'] };
  }

  const reasons: string[] = [];

  if (typeof payload.mediaId !== 'string' || payload.mediaId.trim().length === 0) {
    reasons.push('invalid_media_id');
  }

  if (!mediaUploadPurposes.includes(payload.purpose as MediaUploadPurpose)) {
    reasons.push('invalid_purpose');
  }

  if (!mediaVisibilities.includes(payload.requestedVisibility as MediaVisibility)) {
    reasons.push('invalid_requested_visibility');
  }

  if (typeof payload.mimeType !== 'string') {
    reasons.push('invalid_mime_type');
  }

  if (!Number.isInteger(payload.byteSize)) {
    reasons.push('invalid_byte_size');
  }

  if (!isNullableString(payload.ownerUserId)) {
    reasons.push('invalid_owner_user_id');
  }

  if (!isNullableString(payload.shelterId)) {
    reasons.push('invalid_shelter_id');
  }

  if (!isNullableString(payload.originalFilename)) {
    reasons.push('invalid_original_filename');
  }

  if (reasons.length > 0) {
    return { reasons };
  }

  return {
    mediaId: payload.mediaId as string,
    purpose: payload.purpose as MediaUploadPurpose,
    requestedVisibility: payload.requestedVisibility as MediaVisibility,
    mimeType: payload.mimeType as string,
    byteSize: payload.byteSize as number,
    ownerUserId: payload.ownerUserId as string | null | undefined,
    shelterId: payload.shelterId as string | null | undefined,
    originalFilename: payload.originalFilename as string | null | undefined,
  };
};

export const createWorkerMediaUploadIntent = async ({
  payload,
  config,
  now,
  signer,
  expiresInSeconds = 900,
}: WorkerMediaUploadIntentInput): Promise<WorkerMediaUploadIntentResult> => {
  const parsedPayload = parseWorkerMediaUploadPayload(payload);

  if ('reasons' in parsedPayload) {
    return {
      ok: false,
      status: 'invalid_upload_request',
      reasons: parsedPayload.reasons,
    };
  }

  const mediaResult = createMediaUploadContract({
    request: {
      id: parsedPayload.mediaId,
      purpose: parsedPayload.purpose,
      requestedVisibility: parsedPayload.requestedVisibility,
      mimeType: parsedPayload.mimeType,
      byteSize: parsedPayload.byteSize,
      ownerUserId: parsedPayload.ownerUserId,
      shelterId: parsedPayload.shelterId,
      originalFilename: parsedPayload.originalFilename,
    },
    now,
  });

  if (!mediaResult.ok) {
    return {
      ok: false,
      status: 'invalid_upload_request',
      reasons: mediaResult.reasons,
    };
  }

  const dryRun = createR2UploadDryRun({
    buckets: createR2BucketContract(config),
    media: mediaResult.contract,
  });

  if (signer) {
    try {
      const signedUpload = await signer({
        bucketName: dryRun.bucketName,
        objectKey: dryRun.objectKey,
        contentType: dryRun.contentType,
        byteSize: dryRun.byteSize,
        visibility: dryRun.visibility,
        expiresInSeconds,
      });

      return {
        ok: true,
        intent: {
          status: 'upload_ready',
          mediaId: mediaResult.contract.mediaId,
          bucketName: dryRun.bucketName,
          objectKey: dryRun.objectKey,
          contentType: dryRun.contentType,
          byteSize: dryRun.byteSize,
          visibility: dryRun.visibility,
          mediaKind: mediaResult.contract.mediaKind,
          ownerUserId: mediaResult.contract.ownerUserId,
          shelterId: mediaResult.contract.shelterId,
          signedUrl: signedUpload.signedUrl,
          expiresAt: signedUpload.expiresAt,
          dryRunOnly: false,
          createdAt: mediaResult.contract.createdAt,
        },
      };
    } catch {
      return {
        ok: false,
        status: 'upload_signer_failed',
        reasons: ['signer_unavailable'],
      };
    }
  }

  return {
    ok: true,
    intent: {
      status: 'upload_signer_not_configured',
      mediaId: mediaResult.contract.mediaId,
      bucketName: dryRun.bucketName,
      objectKey: dryRun.objectKey,
      contentType: dryRun.contentType,
      byteSize: dryRun.byteSize,
      visibility: dryRun.visibility,
      mediaKind: mediaResult.contract.mediaKind,
      ownerUserId: mediaResult.contract.ownerUserId,
      shelterId: mediaResult.contract.shelterId,
      signedUrl: dryRun.signedUrl,
      dryRunOnly: dryRun.dryRunOnly,
      createdAt: mediaResult.contract.createdAt,
    },
  };
};

export const persistWorkerMediaUploadIntent = async ({
  intent,
  actor,
  repository,
}: PersistWorkerMediaUploadIntentInput): Promise<PersistWorkerMediaUploadIntentResult> => {
  const insertResult = createMediaAssetInsertFromUploadIntent(intent);

  if (!insertResult.ok) {
    return {
      ok: false,
      status: 'invalid_media_asset_persistence',
      reasons: insertResult.reasons,
    };
  }

  try {
    const result = await repository.saveMediaAsset(insertResult.insert, actor);

    return {
      ok: true,
      mediaAssetId: result.mediaAssetId,
    };
  } catch {
    return {
      ok: false,
      status: 'media_asset_persistence_failed',
      reasons: ['media_asset_repository_unavailable'],
    };
  }
};
