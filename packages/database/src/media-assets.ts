import type { MediaKind, MediaVisibility } from '@pic4paws/domain';

export type PersistableMediaUploadIntent = {
  status: 'upload_ready' | 'upload_signer_not_configured';
  mediaId: string;
  bucketName: string;
  objectKey: string;
  contentType: string;
  byteSize: number;
  visibility: MediaVisibility;
  mediaKind: Exclude<MediaKind, 'unknown'>;
  ownerUserId: string | null;
  shelterId: string | null;
  signedUrl: string | null;
  expiresAt?: string;
  dryRunOnly: boolean;
  createdAt: string;
};

export type MediaAssetInsertContract = {
  id: string;
  ownerUserId: string | null;
  shelterId: string | null;
  r2ObjectKey: string;
  mimeType: string;
  visibility: MediaVisibility;
  width: number | null;
  height: number | null;
  derivativeMetadata: {
    byteSize: number;
    bucketName: string;
    mediaKind: Exclude<MediaKind, 'unknown'>;
    uploadStatus: 'signed';
    signedUrlPersisted: false;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
};

export type MediaAssetInsertRejectionReason =
  | 'upload_not_signed'
  | 'missing_owner_or_shelter_scope';

export type CreateMediaAssetInsertResult =
  | { ok: true; insert: MediaAssetInsertContract }
  | { ok: false; reasons: MediaAssetInsertRejectionReason[] };

const hasScope = (intent: PersistableMediaUploadIntent): boolean =>
  Boolean(intent.ownerUserId?.trim() || intent.shelterId?.trim());

export const createMediaAssetInsertFromUploadIntent = (
  intent: PersistableMediaUploadIntent,
): CreateMediaAssetInsertResult => {
  const reasons: MediaAssetInsertRejectionReason[] = [];

  if (intent.status !== 'upload_ready' || intent.dryRunOnly) {
    reasons.push('upload_not_signed');
  }

  if (!hasScope(intent)) {
    reasons.push('missing_owner_or_shelter_scope');
  }

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  return {
    ok: true,
    insert: {
      id: intent.mediaId,
      ownerUserId: intent.ownerUserId,
      shelterId: intent.shelterId,
      r2ObjectKey: intent.objectKey,
      mimeType: intent.contentType,
      visibility: intent.visibility,
      width: null,
      height: null,
      derivativeMetadata: {
        byteSize: intent.byteSize,
        bucketName: intent.bucketName,
        mediaKind: intent.mediaKind,
        uploadStatus: 'signed',
        signedUrlPersisted: false,
      },
      createdAt: intent.createdAt,
      updatedAt: intent.createdAt,
      deletedAt: null,
    },
  };
};
