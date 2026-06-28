import {
  createWorkerUrl,
  createWorkerSubUrl,
  parseJsonResponse,
  parseReasons,
  sanitizeReasons,
  type MediaUploadClientFetch,
} from './_shared';

// ─── Donation Client types ────────────────────────────────────────────────────

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
  mbWayPhone?: string | null;
  petId?: string | null;
  publicMessage?: string | null;
  anonymous?: boolean;
  donorDisplayName?: string | null;
  donorEmail?: string | null;
};

export type DonationClientPaymentReference =
  | { method: 'mb_way'; phone: string; expiresAt: string | null }
  | { method: 'multibanco'; entity: string; reference: string; expiresAt: string | null }
  | { method: 'bank_transfer'; iban: string };

export type DonationClientSuccess =
  | {
      ok: true;
      status: 'donation_created';
      donationId: string;
      tier: 'manual';
      amountCents: number;
      currency: string;
      kind: DonationClientKind;
      shelterId: string;
      createdAt: string;
      iban: string | null;
      mbWayPhone: string | null;
    }
  | {
      ok: true;
      status: 'donation_created';
      donationId: string;
      tier: 'automated';
      provider: 'eupago' | 'ifthenpay';
      reference: DonationClientPaymentReference;
    };

export type DonationClientFailureStatus =
  | 'unauthenticated'
  | 'invalid_donation'
  | 'donation_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'payment_reference_failed'
  | 'provider_credentials_unavailable'
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

// ─── Donation List types ──────────────────────────────────────────────────────

export type DonationClientStatus =
  | 'created'
  | 'pending_payment'
  | 'pending_receipt'
  | 'pending_review'
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

// ─── Donation Status types ────────────────────────────────────────────────────

export type DonationStatusClientItem = {
  donationId: string;
  kind: DonationClientKind;
  donationStatus: DonationClientStatus;
  amountCents: number;
  currency: string;
  paymentMethod: DonationClientPaymentMethod;
  shelterId: string;
  petId: string | null;
  receiptMediaId: string | null;
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

// ─── Private helpers ──────────────────────────────────────────────────────────

const parsePaymentReference = (raw: unknown): DonationClientPaymentReference | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.method === 'multibanco') {
    if (typeof r.entity !== 'string' || typeof r.reference !== 'string') return null;
    return { method: 'multibanco', entity: r.entity, reference: r.reference, expiresAt: typeof r.expiresAt === 'string' ? r.expiresAt : null };
  }
  if (r.method === 'mb_way') {
    if (typeof r.phone !== 'string') return null;
    return { method: 'mb_way', phone: r.phone, expiresAt: typeof r.expiresAt === 'string' ? r.expiresAt : null };
  }
  if (r.method === 'bank_transfer') {
    if (typeof r.iban !== 'string') return null;
    return { method: 'bank_transfer', iban: r.iban };
  }
  return null;
};

const parseDonationSuccess = (
  body: Record<string, unknown> | null,
): DonationClientSuccess | null => {
  if (!body || body.status !== 'donation_created' || typeof body.donationId !== 'string') {
    return null;
  }

  if (body.tier === 'automated') {
    if (typeof body.provider !== 'string') return null;
    const reference = parsePaymentReference(body.reference);
    if (!reference) return null;
    return {
      ok: true,
      status: 'donation_created',
      donationId: body.donationId,
      tier: 'automated',
      provider: body.provider as 'eupago' | 'ifthenpay',
      reference,
    };
  }

  if (
    typeof body.amountCents !== 'number' ||
    typeof body.currency !== 'string' ||
    typeof body.kind !== 'string' ||
    typeof body.shelterId !== 'string' ||
    typeof body.createdAt !== 'string' ||
    typeof body.tier !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'donation_created',
    donationId: body.donationId,
    tier: 'manual',
    amountCents: body.amountCents,
    currency: body.currency,
    kind: body.kind as DonationClientKind,
    shelterId: body.shelterId,
    createdAt: body.createdAt,
    iban: typeof body.iban === 'string' ? body.iban : null,
    mbWayPhone: typeof body.mbWayPhone === 'string' ? body.mbWayPhone : null,
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
    status === 'auth_adapter_not_configured' ||
    status === 'payment_reference_failed' ||
    status === 'provider_credentials_unavailable'
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
  mbWayPhone: input.mbWayPhone ?? null,
  petId: input.petId ?? null,
  publicMessage: input.publicMessage ?? null,
  anonymous: input.anonymous ?? false,
  donorDisplayName: input.donorDisplayName ?? null,
  donorEmail: input.donorEmail ?? null,
  dataProcessingAccepted: input.dataProcessingAccepted,
});

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
      receiptMediaId: typeof d.receiptMediaId === 'string' ? d.receiptMediaId : null,
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

// ─── Factory functions ────────────────────────────────────────────────────────

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

// ─── Submit Receipt types ─────────────────────────────────────────────────────

export type SubmitReceiptClientInput = {
  receiptMediaId: string;
};

export type SubmitReceiptClientSuccess = {
  ok: true;
  status: 'receipt_submitted';
  donationId: string;
};

export type SubmitReceiptClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'donation_not_found'
  | 'donation_wrong_state'
  | 'receipt_media_not_found'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type SubmitReceiptClientFailure = {
  ok: false;
  status: SubmitReceiptClientFailureStatus;
  reasons: string[];
};

export type SubmitReceiptClientResult = SubmitReceiptClientSuccess | SubmitReceiptClientFailure;

export type CreateSubmitReceiptClientInput = {
  workerBaseUrl: string;
  donationsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type SubmitReceiptClient = {
  submitReceipt: (
    donationId: string,
    input: SubmitReceiptClientInput,
  ) => Promise<SubmitReceiptClientResult>;
};

// ─── Review Donation types ────────────────────────────────────────────────────

export type ReviewDonationClientInput = {
  decision: 'approved' | 'rejected';
};

export type ReviewDonationClientSuccess = {
  ok: true;
  status: 'donation_approved' | 'donation_rejected';
  donationId: string;
};

export type ReviewDonationClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'donation_not_found'
  | 'donation_wrong_state'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ReviewDonationClientFailure = {
  ok: false;
  status: ReviewDonationClientFailureStatus;
  reasons: string[];
};

export type ReviewDonationClientResult = ReviewDonationClientSuccess | ReviewDonationClientFailure;

export type CreateReviewDonationClientInput = {
  workerBaseUrl: string;
  donationsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type ReviewDonationClient = {
  reviewDonation: (
    donationId: string,
    input: ReviewDonationClientInput,
  ) => Promise<ReviewDonationClientResult>;
};

// ─── Private helpers (manual flow) ───────────────────────────────────────────

const parseSubmitReceiptSuccess = (
  body: Record<string, unknown> | null,
): SubmitReceiptClientSuccess | null => {
  if (!body || body.status !== 'receipt_submitted' || typeof body.donationId !== 'string') {
    return null;
  }
  return { ok: true, status: 'receipt_submitted', donationId: body.donationId };
};

const parseSubmitReceiptFailureStatus = (
  body: Record<string, unknown> | null,
): SubmitReceiptClientFailureStatus => {
  const status = body?.status;
  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'donation_not_found' ||
    status === 'donation_wrong_state' ||
    status === 'receipt_media_not_found'
  ) {
    return status;
  }
  return 'worker_request_failed';
};

const parseReviewDonationSuccess = (
  body: Record<string, unknown> | null,
): ReviewDonationClientSuccess | null => {
  if (
    !body ||
    (body.status !== 'donation_approved' && body.status !== 'donation_rejected') ||
    typeof body.donationId !== 'string'
  ) {
    return null;
  }
  return {
    ok: true,
    status: body.status as 'donation_approved' | 'donation_rejected',
    donationId: body.donationId,
  };
};

const parseReviewDonationFailureStatus = (
  body: Record<string, unknown> | null,
): ReviewDonationClientFailureStatus => {
  const status = body?.status;
  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'donation_not_found' ||
    status === 'donation_wrong_state'
  ) {
    return status;
  }
  return 'worker_request_failed';
};

// ─── Factory functions (manual flow) ─────────────────────────────────────────

export const createSubmitReceiptClient = ({
  workerBaseUrl,
  donationsPath,
  getAccessToken,
  fetch,
}: CreateSubmitReceiptClientInput): SubmitReceiptClient => ({
  submitReceipt: async (donationId, input) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, donationsPath, donationId, 'receipt'),
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ receiptMediaId: input.receiptMediaId }),
        },
      );
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseSubmitReceiptFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseSubmitReceiptSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

export const createReviewDonationClient = ({
  workerBaseUrl,
  donationsPath,
  getAccessToken,
  fetch,
}: CreateReviewDonationClientInput): ReviewDonationClient => ({
  reviewDonation: async (donationId, input) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, donationsPath, donationId, 'review'),
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ decision: input.decision }),
        },
      );
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseReviewDonationFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseReviewDonationSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});
