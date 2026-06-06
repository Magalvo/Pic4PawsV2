import type { MediaUploadPurpose, MediaVisibility } from '@pic4paws/domain';

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
