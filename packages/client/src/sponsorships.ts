import {
  createWorkerUrl,
  createWorkerSubUrl,
  parseJsonResponse,
  parseReasons,
  sanitizeReasons,
  type MediaUploadClientFetch,
} from './_shared';

import type { DonationClientPaymentMethod } from './donations';

// ─── Sponsorship Client types ─────────────────────────────────────────────────

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

// ─── Sponsorship List types ───────────────────────────────────────────────────

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

// ─── Sponsorship Manage types ─────────────────────────────────────────────────

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

// ─── Sponsorship Donor List types ─────────────────────────────────────────────

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

// ─── Private helpers ──────────────────────────────────────────────────────────

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

// ─── Factory functions ────────────────────────────────────────────────────────

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
