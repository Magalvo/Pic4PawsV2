// Shared utilities and types used across multiple domain client modules.

// ─── Shared fetch type ────────────────────────────────────────────────────────

export type MediaUploadClientFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

// ─── URL helpers ──────────────────────────────────────────────────────────────

export const createWorkerUrl = (workerBaseUrl: string, mediaUploadPath: `/${string}`): string => {
  const normalizedBaseUrl = workerBaseUrl.endsWith('/') ? workerBaseUrl : `${workerBaseUrl}/`;

  return new URL(mediaUploadPath.slice(1), normalizedBaseUrl).toString();
};

export const createWorkerSubUrl = (
  workerBaseUrl: string,
  basePath: `/${string}`,
  ...pathParts: string[]
): string => {
  const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const encodedPathParts = pathParts.map((part) => encodeURIComponent(part));

  return createWorkerUrl(workerBaseUrl, `${normalizedBasePath}/${encodedPathParts.join('/')}` as `/${string}`);
};

// ─── JSON / response helpers ──────────────────────────────────────────────────

export const parseJsonResponse = async (response: Response): Promise<Record<string, unknown> | null> => {
  try {
    const parsed = await response.json();

    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

export const parseReasons = (body: Record<string, unknown> | null): string[] => {
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

export const sanitizeReasons = (reasons: string[], fallback: string): string[] => {
  const safeReasons = reasons.filter((reason) => {
    const normalizedReason = reason.toLowerCase();

    return !unsafeClientReasonMarkers.some((marker) => normalizedReason.includes(marker));
  });

  return safeReasons.length > 0 ? safeReasons : [fallback];
};
