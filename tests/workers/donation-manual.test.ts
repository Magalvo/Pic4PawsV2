import { describe, expect, it, vi } from 'vitest';
import {
  handleSubmitReceiptRequest,
  handleReviewDonationRequest,
  validateReceiptPayload,
  validateReviewPayload,
} from '../../apps/workers/src/donation-manual';
import type { DonationManualRepository, DonationForAction } from '../../apps/workers/src/donation-manual';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/pet-drafts';
import type { NotificationRepository } from '../../apps/workers/src/notification';
import type { AuthenticatedActor } from '@pic4paws/domain';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DONATION_ID = 'donation-abc';
const DONOR_ID = 'user-donor-1';
const SHELTER_ID = 'shelter-aaa';
const MEDIA_ID = 'media-001';

const makeDonor = (): AuthenticatedActor => ({
  id: DONOR_ID,
  authUserId: 'auth-donor-1',
  role: 'adopter',
  status: 'active',
  memberships: [],
});

const makeShelterMember = (): AuthenticatedActor => ({
  id: 'user-member-1',
  authUserId: 'auth-member-1',
  role: 'shelter_owner',
  status: 'active',
  memberships: [
    { id: 'mem-001', userId: 'user-member-1', shelterId: SHELTER_ID, role: 'shelter_owner', deletedAt: null },
  ],
});

const makeAuth = (actor: AuthenticatedActor | null): WorkerPetDraftAuthenticator =>
  vi.fn().mockResolvedValue(actor);

const makePendingReceiptDonation = () => ({
  donationId: DONATION_ID,
  donorUserId: DONOR_ID,
  shelterId: SHELTER_ID,
  status: 'pending_receipt' as const,
  providerPaymentId: 'prov-001',
  provider: 'eupago',
});

const makePendingReviewDonation = () => ({
  donationId: DONATION_ID,
  donorUserId: DONOR_ID,
  shelterId: SHELTER_ID,
  status: 'pending_review' as const,
  providerPaymentId: 'prov-001',
  provider: 'eupago',
});

const makeReceiptRepo = (
  donation: DonationForAction | null = makePendingReceiptDonation(),
  mediaOk = true,
): DonationManualRepository => ({
  getDonationForAction: vi.fn().mockResolvedValue(donation),
  verifyMediaOwnership: vi.fn().mockResolvedValue(mediaOk),
  submitReceipt: vi.fn().mockResolvedValue(undefined),
  approveDonation: vi.fn().mockResolvedValue(undefined),
  rejectDonation: vi.fn().mockResolvedValue(undefined),
});

const makeReviewRepo = (
  donation: DonationForAction | null = makePendingReviewDonation(),
): DonationManualRepository => ({
  getDonationForAction: vi.fn().mockResolvedValue(donation),
  verifyMediaOwnership: vi.fn().mockResolvedValue(true),
  submitReceipt: vi.fn().mockResolvedValue(undefined),
  approveDonation: vi.fn().mockResolvedValue(undefined),
  rejectDonation: vi.fn().mockResolvedValue(undefined),
});

const makeNotificationRepo = (): NotificationRepository => ({
  listNotifications: vi.fn().mockResolvedValue({ notifications: [], total: 0 }),
  markNotificationRead: vi.fn().mockResolvedValue(true),
  notifyNewAdoptionApplication: vi.fn().mockResolvedValue(undefined),
  notifyAdoptionStatusChanged: vi.fn().mockResolvedValue(undefined),
  notifyDonationPaid: vi.fn().mockResolvedValue(undefined),
  notifySponsorshipStatusChanged: vi.fn().mockResolvedValue(undefined),
});

const patchReceiptRequest = (withToken = true) =>
  new Request(`https://worker.test/donations/${DONATION_ID}/receipt`, {
    method: 'PATCH',
    headers: withToken ? { Authorization: 'Bearer tok' } : {},
  });

const patchReviewRequest = (withToken = true) =>
  new Request(`https://worker.test/donations/${DONATION_ID}/review`, {
    method: 'PATCH',
    headers: withToken ? { Authorization: 'Bearer tok' } : {},
  });

// ─── validateReceiptPayload ────────────────────────────────────────────────────

describe('validateReceiptPayload', () => {
  it('returns valid for non-empty receiptMediaId', () => {
    const r = validateReceiptPayload({ receiptMediaId: MEDIA_ID });
    expect(r.valid).toBe(true);
  });

  it('rejects missing receiptMediaId', () => {
    const r = validateReceiptPayload({});
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reasons).toContain('receipt_media_id_required');
  });

  it('rejects empty string receiptMediaId', () => {
    const r = validateReceiptPayload({ receiptMediaId: '  ' });
    expect(r.valid).toBe(false);
  });

  it('rejects non-object body', () => {
    const r = validateReceiptPayload(null);
    expect(r.valid).toBe(false);
  });
});

// ─── validateReviewPayload ────────────────────────────────────────────────────

describe('validateReviewPayload', () => {
  it('returns valid for approved', () => {
    const r = validateReviewPayload({ decision: 'approved' });
    expect(r.valid).toBe(true);
  });

  it('returns valid for rejected', () => {
    const r = validateReviewPayload({ decision: 'rejected' });
    expect(r.valid).toBe(true);
  });

  it('rejects unknown decision', () => {
    const r = validateReviewPayload({ decision: 'maybe' });
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reasons).toContain('decision_invalid');
  });

  it('rejects missing decision', () => {
    const r = validateReviewPayload({});
    expect(r.valid).toBe(false);
  });
});

// ─── handleSubmitReceiptRequest ───────────────────────────────────────────────

describe('handleSubmitReceiptRequest', () => {
  it('returns 405 for non-PATCH method', async () => {
    const res = await handleSubmitReceiptRequest({
      request: new Request(`https://worker.test/donations/${DONATION_ID}/receipt`, { method: 'GET' }),
      donationId: DONATION_ID,
      payload: { receiptMediaId: MEDIA_ID },
      repository: makeReceiptRepo(),
      authenticator: makeAuth(makeDonor()),
    });
    expect(res.status).toBe(405);
  });

  it('returns 401 when no bearer token', async () => {
    const res = await handleSubmitReceiptRequest({
      request: patchReceiptRequest(false),
      donationId: DONATION_ID,
      payload: { receiptMediaId: MEDIA_ID },
      repository: makeReceiptRepo(),
      authenticator: makeAuth(makeDonor()),
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 when auth returns null', async () => {
    const res = await handleSubmitReceiptRequest({
      request: patchReceiptRequest(),
      donationId: DONATION_ID,
      payload: { receiptMediaId: MEDIA_ID },
      repository: makeReceiptRepo(),
      authenticator: makeAuth(null),
    });
    expect(res.status).toBe(401);
  });

  it('returns 501 when no authenticator', async () => {
    const res = await handleSubmitReceiptRequest({
      request: patchReceiptRequest(),
      donationId: DONATION_ID,
      payload: { receiptMediaId: MEDIA_ID },
      repository: makeReceiptRepo(),
    });
    expect(res.status).toBe(501);
  });

  it('returns 404 when donation not found', async () => {
    const repo = makeReceiptRepo();
    (repo.getDonationForAction as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await handleSubmitReceiptRequest({
      request: patchReceiptRequest(),
      donationId: DONATION_ID,
      payload: { receiptMediaId: MEDIA_ID },
      repository: repo,
      authenticator: makeAuth(makeDonor()),
    });
    expect(res.status).toBe(404);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('donation_not_found');
  });

  it('returns 403 when actor is not the donor', async () => {
    const res = await handleSubmitReceiptRequest({
      request: patchReceiptRequest(),
      donationId: DONATION_ID,
      payload: { receiptMediaId: MEDIA_ID },
      repository: makeReceiptRepo(),
      authenticator: makeAuth(makeShelterMember()),
    });
    expect(res.status).toBe(403);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('forbidden');
  });

  it('returns 409 when donation is not in pending_receipt state', async () => {
    const repo = makeReceiptRepo(makePendingReviewDonation());
    const res = await handleSubmitReceiptRequest({
      request: patchReceiptRequest(),
      donationId: DONATION_ID,
      payload: { receiptMediaId: MEDIA_ID },
      repository: repo,
      authenticator: makeAuth(makeDonor()),
    });
    expect(res.status).toBe(409);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('donation_wrong_state');
  });

  it('returns 400 when receiptMediaId is missing', async () => {
    const res = await handleSubmitReceiptRequest({
      request: patchReceiptRequest(),
      donationId: DONATION_ID,
      payload: {},
      repository: makeReceiptRepo(),
      authenticator: makeAuth(makeDonor()),
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 when media does not belong to actor', async () => {
    const repo = makeReceiptRepo(makePendingReceiptDonation(), false);
    const res = await handleSubmitReceiptRequest({
      request: patchReceiptRequest(),
      donationId: DONATION_ID,
      payload: { receiptMediaId: MEDIA_ID },
      repository: repo,
      authenticator: makeAuth(makeDonor()),
    });
    expect(res.status).toBe(404);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('receipt_media_not_found');
  });

  it('returns 200 receipt_submitted on success', async () => {
    const repo = makeReceiptRepo();
    const res = await handleSubmitReceiptRequest({
      request: patchReceiptRequest(),
      donationId: DONATION_ID,
      payload: { receiptMediaId: MEDIA_ID },
      repository: repo,
      authenticator: makeAuth(makeDonor()),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; donationId: string };
    expect(body.status).toBe('receipt_submitted');
    expect(body.donationId).toBe(DONATION_ID);
    expect(repo.submitReceipt).toHaveBeenCalledWith(DONATION_ID, MEDIA_ID);
  });
});

// ─── handleReviewDonationRequest ─────────────────────────────────────────────

describe('handleReviewDonationRequest', () => {
  it('returns 405 for non-PATCH method', async () => {
    const res = await handleReviewDonationRequest({
      request: new Request(`https://worker.test/donations/${DONATION_ID}/review`, { method: 'GET' }),
      donationId: DONATION_ID,
      payload: { decision: 'approved' },
      repository: makeReviewRepo(),
      authenticator: makeAuth(makeShelterMember()),
      now: '2026-06-23T10:00:00.000Z',
    });
    expect(res.status).toBe(405);
  });

  it('returns 401 when no bearer token', async () => {
    const res = await handleReviewDonationRequest({
      request: patchReviewRequest(false),
      donationId: DONATION_ID,
      payload: { decision: 'approved' },
      repository: makeReviewRepo(),
      authenticator: makeAuth(makeShelterMember()),
      now: '2026-06-23T10:00:00.000Z',
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 when actor is not a member of the shelter', async () => {
    const res = await handleReviewDonationRequest({
      request: patchReviewRequest(),
      donationId: DONATION_ID,
      payload: { decision: 'approved' },
      repository: makeReviewRepo(),
      authenticator: makeAuth(makeDonor()),
      now: '2026-06-23T10:00:00.000Z',
    });
    expect(res.status).toBe(403);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('forbidden');
  });

  it('returns 404 when donation not found', async () => {
    const repo = makeReviewRepo();
    (repo.getDonationForAction as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await handleReviewDonationRequest({
      request: patchReviewRequest(),
      donationId: DONATION_ID,
      payload: { decision: 'approved' },
      repository: repo,
      authenticator: makeAuth(makeShelterMember()),
      now: '2026-06-23T10:00:00.000Z',
    });
    expect(res.status).toBe(404);
  });

  it('returns 409 when donation is not in pending_review state', async () => {
    const repo = makeReviewRepo({ ...makePendingReceiptDonation(), status: 'pending_receipt' });
    const res = await handleReviewDonationRequest({
      request: patchReviewRequest(),
      donationId: DONATION_ID,
      payload: { decision: 'approved' },
      repository: repo,
      authenticator: makeAuth(makeShelterMember()),
      now: '2026-06-23T10:00:00.000Z',
    });
    expect(res.status).toBe(409);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('donation_wrong_state');
  });

  it('returns 400 when decision is invalid', async () => {
    const res = await handleReviewDonationRequest({
      request: patchReviewRequest(),
      donationId: DONATION_ID,
      payload: { decision: 'maybe' },
      repository: makeReviewRepo(),
      authenticator: makeAuth(makeShelterMember()),
      now: '2026-06-23T10:00:00.000Z',
    });
    expect(res.status).toBe(400);
  });

  it('returns 200 donation_approved and calls approveDonation on approved decision', async () => {
    const repo = makeReviewRepo();
    const now = '2026-06-23T10:00:00.000Z';
    const res = await handleReviewDonationRequest({
      request: patchReviewRequest(),
      donationId: DONATION_ID,
      payload: { decision: 'approved' },
      repository: repo,
      authenticator: makeAuth(makeShelterMember()),
      now,
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; donationId: string };
    expect(body.status).toBe('donation_approved');
    expect(body.donationId).toBe(DONATION_ID);
    expect(repo.approveDonation).toHaveBeenCalledWith(DONATION_ID, {
      reviewedByUserId: 'user-member-1',
      reviewedAt: now,
      paidAt: now,
    });
    expect(repo.rejectDonation).not.toHaveBeenCalled();
  });

  it('fires notifyDonationPaid fire-and-forget on approved decision', async () => {
    const repo = makeReviewRepo();
    const notificationRepo = makeNotificationRepo();
    await handleReviewDonationRequest({
      request: patchReviewRequest(),
      donationId: DONATION_ID,
      payload: { decision: 'approved' },
      repository: repo,
      authenticator: makeAuth(makeShelterMember()),
      notificationRepository: notificationRepo,
      now: '2026-06-23T10:00:00.000Z',
    });
    // fire-and-forget — called but not awaited
    expect(notificationRepo.notifyDonationPaid).toHaveBeenCalled();
  });

  it('returns 200 donation_rejected and calls rejectDonation on rejected decision', async () => {
    const repo = makeReviewRepo();
    const now = '2026-06-23T10:00:00.000Z';
    const res = await handleReviewDonationRequest({
      request: patchReviewRequest(),
      donationId: DONATION_ID,
      payload: { decision: 'rejected' },
      repository: repo,
      authenticator: makeAuth(makeShelterMember()),
      now,
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; donationId: string };
    expect(body.status).toBe('donation_rejected');
    expect(repo.rejectDonation).toHaveBeenCalledWith(DONATION_ID, {
      reviewedByUserId: 'user-member-1',
      reviewedAt: now,
    });
    expect(repo.approveDonation).not.toHaveBeenCalled();
  });

  it('does not fire notification on rejected decision', async () => {
    const repo = makeReviewRepo();
    const notificationRepo = makeNotificationRepo();
    await handleReviewDonationRequest({
      request: patchReviewRequest(),
      donationId: DONATION_ID,
      payload: { decision: 'rejected' },
      repository: repo,
      authenticator: makeAuth(makeShelterMember()),
      notificationRepository: notificationRepo,
      now: '2026-06-23T10:00:00.000Z',
    });
    expect(notificationRepo.notifyDonationPaid).not.toHaveBeenCalled();
  });
});
