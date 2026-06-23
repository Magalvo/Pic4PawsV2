import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { NotificationRepository } from './notification';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DonationForAction = {
  donationId: string;
  donorUserId: string;
  shelterId: string;
  status: string;
  providerPaymentId: string;
  provider: string;
};

export type ApproveInput = {
  reviewedByUserId: string;
  reviewedAt: string;
  paidAt: string;
};

export type RejectInput = {
  reviewedByUserId: string;
  reviewedAt: string;
};

export type DonationManualRepository = {
  getDonationForAction: (donationId: string) => Promise<DonationForAction | null>;
  verifyMediaOwnership: (mediaId: string, ownerUserId: string) => Promise<boolean>;
  submitReceipt: (donationId: string, receiptMediaId: string) => Promise<void>;
  approveDonation: (donationId: string, input: ApproveInput) => Promise<void>;
  rejectDonation: (donationId: string, input: RejectInput) => Promise<void>;
};

// ─── Validation ───────────────────────────────────────────────────────────────

type ReceiptValidationResult =
  | { valid: true; receiptMediaId: string }
  | { valid: false; reasons: string[] };

type ReviewValidationResult =
  | { valid: true; decision: 'approved' | 'rejected' }
  | { valid: false; reasons: string[] };

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

export const validateReceiptPayload = (body: unknown): ReceiptValidationResult => {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, reasons: ['invalid_body'] };
  }
  const b = body as Record<string, unknown>;
  if (!isNonEmptyString(b.receiptMediaId)) {
    return { valid: false, reasons: ['receipt_media_id_required'] };
  }
  return { valid: true, receiptMediaId: b.receiptMediaId.trim() };
};

export const validateReviewPayload = (body: unknown): ReviewValidationResult => {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, reasons: ['invalid_body'] };
  }
  const b = body as Record<string, unknown>;
  if (b.decision !== 'approved' && b.decision !== 'rejected') {
    return { valid: false, reasons: ['decision_invalid'] };
  }
  return { valid: true, decision: b.decision };
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

// ─── PATCH /donations/:id/receipt ─────────────────────────────────────────────

export type HandleSubmitReceiptRequestInput = {
  request: Request;
  donationId: string;
  payload: unknown;
  repository?: DonationManualRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleSubmitReceiptRequest = async ({
  request,
  donationId,
  payload,
  repository,
  authenticator,
}: HandleSubmitReceiptRequestInput): Promise<Response> => {
  if (request.method !== 'PATCH') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['PATCH'] },
      { status: 405, headers: { Allow: 'PATCH' } },
    );
  }

  const bearerToken = extractBearerToken(request);
  if (!bearerToken) return jsonResponse({ status: 'unauthenticated' }, { status: 401 });

  if (!authenticator) {
    return jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 });
  }

  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await authenticator({ request, authorizationHeader, bearerToken });
  if (!actor) return jsonResponse({ status: 'unauthenticated' }, { status: 401 });

  if (!repository) {
    return jsonResponse({ status: 'donation_manual_repository_not_configured' }, { status: 501 });
  }

  const donation = await repository.getDonationForAction(donationId);
  if (!donation) return jsonResponse({ status: 'donation_not_found' }, { status: 404 });

  // Donor-only action — identity derived from actor, never from payload
  if (actor.id !== donation.donorUserId) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  if (donation.status !== 'pending_receipt') {
    return jsonResponse({ status: 'donation_wrong_state' }, { status: 409 });
  }

  const validation = validateReceiptPayload(payload);
  if (!validation.valid) {
    return jsonResponse({ status: 'invalid_receipt', reasons: validation.reasons }, { status: 400 });
  }

  const mediaOk = await repository.verifyMediaOwnership(validation.receiptMediaId, actor.id);
  if (!mediaOk) return jsonResponse({ status: 'receipt_media_not_found' }, { status: 404 });

  await repository.submitReceipt(donationId, validation.receiptMediaId);

  return jsonResponse({ status: 'receipt_submitted', donationId }, { status: 200 });
};

// ─── PATCH /donations/:id/review ──────────────────────────────────────────────

export type HandleReviewDonationRequestInput = {
  request: Request;
  donationId: string;
  payload: unknown;
  repository?: DonationManualRepository;
  authenticator?: WorkerPetDraftAuthenticator;
  notificationRepository?: NotificationRepository;
  now: string;
};

export const handleReviewDonationRequest = async ({
  request,
  donationId,
  payload,
  repository,
  authenticator,
  notificationRepository,
  now,
}: HandleReviewDonationRequestInput): Promise<Response> => {
  if (request.method !== 'PATCH') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['PATCH'] },
      { status: 405, headers: { Allow: 'PATCH' } },
    );
  }

  const bearerToken = extractBearerToken(request);
  if (!bearerToken) return jsonResponse({ status: 'unauthenticated' }, { status: 401 });

  if (!authenticator) {
    return jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 });
  }

  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await authenticator({ request, authorizationHeader, bearerToken });
  if (!actor) return jsonResponse({ status: 'unauthenticated' }, { status: 401 });

  if (!repository) {
    return jsonResponse({ status: 'donation_manual_repository_not_configured' }, { status: 501 });
  }

  const donation = await repository.getDonationForAction(donationId);
  if (!donation) return jsonResponse({ status: 'donation_not_found' }, { status: 404 });

  // Shelter membership check — uses canManageShelter, never raw shelterId from URL
  if (!canManageShelter(actor, donation.shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  if (donation.status !== 'pending_review') {
    return jsonResponse({ status: 'donation_wrong_state' }, { status: 409 });
  }

  const validation = validateReviewPayload(payload);
  if (!validation.valid) {
    return jsonResponse({ status: 'invalid_review', reasons: validation.reasons }, { status: 400 });
  }

  if (validation.decision === 'approved') {
    await repository.approveDonation(donationId, {
      reviewedByUserId: actor.id,
      reviewedAt: now,
      paidAt: now,
    });

    // Fire-and-forget — failure must not roll back the review transition
    if (notificationRepository) {
      notificationRepository
        .notifyDonationPaid({
          providerPaymentId: donation.providerPaymentId,
          provider: donation.provider,
        })
        .catch(() => undefined);
    }

    return jsonResponse({ status: 'donation_approved', donationId }, { status: 200 });
  }

  await repository.rejectDonation(donationId, {
    reviewedByUserId: actor.id,
    reviewedAt: now,
  });

  return jsonResponse({ status: 'donation_rejected', donationId }, { status: 200 });
};

// ─── Path matchers ────────────────────────────────────────────────────────────

export const matchWorkerDonationReceiptId = (
  pathname: string,
  donationsPath: string,
): string | null => {
  const prefix = donationsPath.endsWith('/') ? donationsPath : `${donationsPath}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  const parts = rest.split('/');
  if (parts.length === 2 && parts[0] && parts[1] === 'receipt') return parts[0];
  return null;
};

export const matchWorkerDonationReviewId = (
  pathname: string,
  donationsPath: string,
): string | null => {
  const prefix = donationsPath.endsWith('/') ? donationsPath : `${donationsPath}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  const parts = rest.split('/');
  if (parts.length === 2 && parts[0] && parts[1] === 'review') return parts[0];
  return null;
};
