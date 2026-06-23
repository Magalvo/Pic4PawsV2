export type MediaUploadPurpose =
  | 'pet_public_image'
  | 'shelter_public_image'
  | 'adoption_document'
  | 'identity_document'
  | 'medical_record'
  | 'donation_receipt';

export type MediaVisibility = 'public' | 'private';

export type MediaKind = 'image' | 'document' | 'unknown';

export type SupportedMediaMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'application/pdf';

export type MediaUploadRequest = {
  id: string;
  purpose: MediaUploadPurpose;
  requestedVisibility: MediaVisibility;
  mimeType: string;
  byteSize: number;
  ownerUserId?: string | null;
  shelterId?: string | null;
  originalFilename?: string | null;
};

export type MediaUploadRejectionReason =
  | 'unsupported_mime_type'
  | 'invalid_byte_size'
  | 'missing_owner_or_shelter_scope';

export type MediaUploadPolicyEvaluation = {
  allowed: boolean;
  visibility: MediaVisibility;
  mediaKind: MediaKind;
  reasons: MediaUploadRejectionReason[];
};

export type BuildMediaObjectKeyInput = {
  mediaId: string;
  shelterId?: string | null;
  ownerUserId?: string | null;
  visibility: MediaVisibility;
  purpose: MediaUploadPurpose;
  mimeType: string;
};

export type MediaUploadContract = {
  mediaId: string;
  objectKey: string;
  visibility: MediaVisibility;
  mediaKind: Exclude<MediaKind, 'unknown'>;
  mimeType: SupportedMediaMimeType;
  byteSize: number;
  ownerUserId: string | null;
  shelterId: string | null;
  createdAt: string;
};

export type CreateMediaUploadContractInput = {
  request: MediaUploadRequest;
  now: string;
};

export type CreateMediaUploadContractResult =
  | { ok: true; contract: MediaUploadContract }
  | { ok: false; reasons: MediaUploadRejectionReason[] };

const publicPurposes: MediaUploadPurpose[] = ['pet_public_image', 'shelter_public_image'];
const supportedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
const supportedDocumentMimeTypes = ['application/pdf'] as const;
const mimeExtensions: Record<SupportedMediaMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const isSupportedMimeType = (mimeType: string): mimeType is SupportedMediaMimeType =>
  [...supportedImageMimeTypes, ...supportedDocumentMimeTypes].includes(
    mimeType as SupportedMediaMimeType,
  );

const mediaKindForMimeType = (mimeType: string): MediaKind => {
  if ((supportedImageMimeTypes as readonly string[]).includes(mimeType)) {
    return 'image';
  }

  if ((supportedDocumentMimeTypes as readonly string[]).includes(mimeType)) {
    return 'document';
  }

  return 'unknown';
};

const visibilityForPurpose = (purpose: MediaUploadPurpose): MediaVisibility =>
  publicPurposes.includes(purpose) ? 'public' : 'private';

const hasScope = (request: MediaUploadRequest): boolean =>
  Boolean(request.ownerUserId?.trim() || request.shelterId?.trim());

export const evaluateMediaUploadRequest = (
  request: MediaUploadRequest,
): MediaUploadPolicyEvaluation => {
  const reasons: MediaUploadRejectionReason[] = [];
  const visibility = visibilityForPurpose(request.purpose);
  const mediaKind = mediaKindForMimeType(request.mimeType);

  if (!isSupportedMimeType(request.mimeType)) {
    reasons.push('unsupported_mime_type');
  }

  if (!Number.isInteger(request.byteSize) || request.byteSize <= 0) {
    reasons.push('invalid_byte_size');
  }

  if (!hasScope(request)) {
    reasons.push('missing_owner_or_shelter_scope');
  }

  if (publicPurposes.includes(request.purpose) && mediaKind !== 'image') {
    reasons.push('unsupported_mime_type');
  }

  return {
    allowed: reasons.length === 0,
    visibility,
    mediaKind,
    reasons: [...new Set(reasons)],
  };
};

export const buildMediaObjectKey = ({
  mediaId,
  shelterId,
  ownerUserId,
  visibility,
  purpose,
  mimeType,
}: BuildMediaObjectKeyInput): string => {
  if (!isSupportedMimeType(mimeType)) {
    throw new Error(`Unsupported media MIME type: ${mimeType}`);
  }

  const scope = shelterId ? `shelters/${shelterId}` : `users/${ownerUserId ?? 'unknown'}`;

  return `${visibility}/${scope}/${purpose}/${mediaId}.${mimeExtensions[mimeType]}`;
};

export const createMediaUploadContract = ({
  request,
  now,
}: CreateMediaUploadContractInput): CreateMediaUploadContractResult => {
  const evaluation = evaluateMediaUploadRequest(request);

  if (!evaluation.allowed || !isSupportedMimeType(request.mimeType) || evaluation.mediaKind === 'unknown') {
    return { ok: false, reasons: evaluation.reasons };
  }

  return {
    ok: true,
    contract: {
      mediaId: request.id,
      objectKey: buildMediaObjectKey({
        mediaId: request.id,
        shelterId: request.shelterId ?? null,
        ownerUserId: request.ownerUserId ?? null,
        visibility: evaluation.visibility,
        purpose: request.purpose,
        mimeType: request.mimeType,
      }),
      visibility: evaluation.visibility,
      mediaKind: evaluation.mediaKind,
      mimeType: request.mimeType,
      byteSize: request.byteSize,
      ownerUserId: request.ownerUserId ?? null,
      shelterId: request.shelterId ?? null,
      createdAt: now,
    },
  };
};
