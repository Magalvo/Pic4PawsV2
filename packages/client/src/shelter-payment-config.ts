import {
  createWorkerSubUrl,
  parseJsonResponse,
  parseReasons,
  sanitizeReasons,
  type MediaUploadClientFetch,
} from './_shared';

// ─── Save types ───────────────────────────────────────────────────────────────

export type ShelterPaymentConfigClientInput = {
  iban: string;
  mbWayPhone?: string | null;
};

export type ShelterPaymentConfigClientSuccess = {
  ok: true;
  status: 'payment_config_saved';
  tier: 'manual';
  iban: string;
  mbWayPhone: string | null;
};

export type ShelterPaymentConfigClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'invalid_config'
  | 'payment_config_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ShelterPaymentConfigClientFailure = {
  ok: false;
  status: ShelterPaymentConfigClientFailureStatus;
  reasons: string[];
};

export type ShelterPaymentConfigClientResult =
  | ShelterPaymentConfigClientSuccess
  | ShelterPaymentConfigClientFailure;

export type CreateSavePaymentConfigClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type SavePaymentConfigClient = {
  savePaymentConfig: (
    shelterId: string,
    input: ShelterPaymentConfigClientInput,
  ) => Promise<ShelterPaymentConfigClientResult>;
};

// ─── Load types ───────────────────────────────────────────────────────────────

export type LoadPaymentConfigClientSuccess = {
  ok: true;
  status: 'ok';
  configured: boolean;
  tier: 'manual' | 'automated' | null;
  iban: string | null;
  mbWayPhone: string | null;
};

export type LoadPaymentConfigClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'payment_config_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type LoadPaymentConfigClientFailure = {
  ok: false;
  status: LoadPaymentConfigClientFailureStatus;
  reasons: string[];
};

export type LoadPaymentConfigClientResult =
  | LoadPaymentConfigClientSuccess
  | LoadPaymentConfigClientFailure;

export type CreateLoadPaymentConfigClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type LoadPaymentConfigClient = {
  loadPaymentConfig: (shelterId: string) => Promise<LoadPaymentConfigClientResult>;
};

// ─── Private helpers ──────────────────────────────────────────────────────────

const parseSaveSuccess = (
  body: Record<string, unknown> | null,
): ShelterPaymentConfigClientSuccess | null => {
  if (
    !body ||
    body.status !== 'payment_config_saved' ||
    body.tier !== 'manual' ||
    typeof body.iban !== 'string'
  ) {
    return null;
  }
  return {
    ok: true,
    status: 'payment_config_saved',
    tier: 'manual',
    iban: body.iban,
    mbWayPhone: typeof body.mbWayPhone === 'string' ? body.mbWayPhone : null,
  };
};

const parseSaveFailureStatus = (
  body: Record<string, unknown> | null,
): ShelterPaymentConfigClientFailureStatus => {
  const status = body?.status;
  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'invalid_config' ||
    status === 'payment_config_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }
  return 'worker_request_failed';
};

const parseLoadSuccess = (
  body: Record<string, unknown> | null,
): LoadPaymentConfigClientSuccess | null => {
  if (!body || body.status !== 'ok' || typeof body.configured !== 'boolean') {
    return null;
  }
  if (!body.configured) {
    return { ok: true, status: 'ok', configured: false, tier: null, iban: null, mbWayPhone: null };
  }
  return {
    ok: true,
    status: 'ok',
    configured: true,
    tier: (body.tier as 'manual' | 'automated') ?? null,
    iban: typeof body.iban === 'string' ? body.iban : null,
    mbWayPhone: typeof body.mbWayPhone === 'string' ? body.mbWayPhone : null,
  };
};

const parseLoadFailureStatus = (
  body: Record<string, unknown> | null,
): LoadPaymentConfigClientFailureStatus => {
  const status = body?.status;
  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'payment_config_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }
  return 'worker_request_failed';
};

// ─── Factories ────────────────────────────────────────────────────────────────

export const createSavePaymentConfigClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateSavePaymentConfigClientInput): SavePaymentConfigClient => ({
  savePaymentConfig: async (shelterId, input) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'payment-config'),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            iban: input.iban,
            mbWayPhone: input.mbWayPhone ?? null,
          }),
        },
      );
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseSaveFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseSaveSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

export const createLoadPaymentConfigClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateLoadPaymentConfigClientInput): LoadPaymentConfigClient => ({
  loadPaymentConfig: async (shelterId) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'payment-config'),
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseLoadFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseLoadSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});
