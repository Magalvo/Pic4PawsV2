import { describe, expect, it, vi } from 'vitest';
import {
  createWebDonationReviewUi,
  webDonationReviewUiContent,
} from '../../apps/web/src/donation-review';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type {
  DonationStatusClient,
  DonationStatusClientResult,
  DonationStatusClientItem,
  DonationClientStatus,
  ReviewDonationClient,
  ReviewDonationClientResult,
} from '../../packages/client/src/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DONATION_ID = 'donation-001';
const SHELTER_ID = 'shelter-001';
const RECEIPT_MEDIA_ID = 'media-receipt-abc';

const makeDonation = (donationStatus: DonationClientStatus = 'pending_review'): DonationStatusClientItem => ({
  donationId: DONATION_ID,
  kind: 'one_time_donation',
  donationStatus,
  amountCents: 5000,
  currency: 'EUR',
  paymentMethod: 'bank_transfer',
  shelterId: SHELTER_ID,
  petId: null,
  receiptMediaId: RECEIPT_MEDIA_ID,
  createdAt: '2026-01-01T00:00:00.000Z',
});

const makeStatusClient = (result: DonationStatusClientResult): Pick<DonationStatusClient, 'loadDonationStatus'> => ({
  loadDonationStatus: vi.fn().mockResolvedValue(result),
});

const makeReviewClient = (result: ReviewDonationClientResult): Pick<ReviewDonationClient, 'reviewDonation'> => ({
  reviewDonation: vi.fn().mockResolvedValue(result),
});

const makeUi = (statusResult: DonationStatusClientResult, reviewResult: ReviewDonationClientResult) =>
  createWebDonationReviewUi({
    donationStatusClient: makeStatusClient(statusResult),
    reviewDonationClient: makeReviewClient(reviewResult),
  });

// ─── webDonationReviewUiContent ───────────────────────────────────────────────

describe('webDonationReviewUiContent', () => {
  it('has pt-PT locale and product-flow-ready status', () => {
    expect(webDonationReviewUiContent.locale).toBe('pt-PT');
    expect(webDonationReviewUiContent.status).toBe('product-flow-ready');
  });

  it('has all required states defined', () => {
    const stateNames = webDonationReviewUiContent.states.map((s) => s.state);
    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('approving');
    expect(stateNames).toContain('rejecting');
    expect(stateNames).toContain('approved');
    expect(stateNames).toContain('rejected');
    expect(stateNames).toContain('failed');
    expect(stateNames).toContain('forbidden');
    expect(stateNames).toContain('wrong_state');
  });

  it('does not expose credentials in content', () => {
    const content = JSON.stringify(webDonationReviewUiContent);
    expect(content).not.toContain('service-role');
    expect(content).not.toContain('bearer ');
  });
});

// ─── webFoundationContent ─────────────────────────────────────────────────────

describe('webFoundationContent — donationReview entry', () => {
  it('includes donationReview with product-flow-ready status', () => {
    expect(webFoundationContent.donationReview.status).toBe('product-flow-ready');
    expect(webFoundationContent.donationReview.title).toBeTruthy();
  });
});

// ─── loadDonation ─────────────────────────────────────────────────────────────

describe('createWebDonationReviewUi — loadDonation', () => {
  it('returns idle with donation when status is pending_review', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation('pending_review') },
      { ok: true, status: 'donation_approved', donationId: DONATION_ID },
    );
    const state = await ui.loadDonation(DONATION_ID);
    expect(state.state).toBe('idle');
    if (state.state === 'idle') {
      expect(state.donation.donationId).toBe(DONATION_ID);
      expect(state.donation.receiptMediaId).toBe(RECEIPT_MEDIA_ID);
      expect(state.title).toBeTruthy();
    }
  });

  it('returns wrong_state when donation is not in pending_review', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation('paid') },
      { ok: true, status: 'donation_approved', donationId: DONATION_ID },
    );
    const state = await ui.loadDonation(DONATION_ID);
    expect(state.state).toBe('wrong_state');
    if (state.state === 'wrong_state') {
      expect(state.donationId).toBe(DONATION_ID);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns forbidden state when load returns forbidden', async () => {
    const ui = makeUi(
      { ok: false, status: 'forbidden', reasons: ['forbidden'] },
      { ok: true, status: 'donation_approved', donationId: DONATION_ID },
    );
    const state = await ui.loadDonation(DONATION_ID);
    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed state on donation_not_found', async () => {
    const ui = makeUi(
      { ok: false, status: 'donation_not_found', reasons: ['donation_not_found'] },
      { ok: true, status: 'donation_approved', donationId: DONATION_ID },
    );
    const state = await ui.loadDonation(DONATION_ID);
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('donation_not_found');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed state on network error', async () => {
    const ui = makeUi(
      { ok: false, status: 'worker_request_failed', reasons: ['network_error'] },
      { ok: true, status: 'donation_approved', donationId: DONATION_ID },
    );
    const state = await ui.loadDonation(DONATION_ID);
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
    }
  });
});

// ─── approveDonation ──────────────────────────────────────────────────────────

describe('createWebDonationReviewUi — approveDonation', () => {
  it('returns approved on success', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation() },
      { ok: true, status: 'donation_approved', donationId: DONATION_ID },
    );
    const state = await ui.approveDonation(DONATION_ID);
    expect(state.state).toBe('approved');
    if (state.state === 'approved') {
      expect(state.donationId).toBe(DONATION_ID);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns forbidden when review returns forbidden', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation() },
      { ok: false, status: 'forbidden', reasons: ['forbidden'] },
    );
    const state = await ui.approveDonation(DONATION_ID);
    expect(state.state).toBe('forbidden');
  });

  it('returns wrong_state when review returns donation_wrong_state', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation() },
      { ok: false, status: 'donation_wrong_state', reasons: ['donation_wrong_state'] },
    );
    const state = await ui.approveDonation(DONATION_ID);
    expect(state.state).toBe('wrong_state');
    if (state.state === 'wrong_state') {
      expect(state.donationId).toBe(DONATION_ID);
    }
  });

  it('returns failed on network error', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation() },
      { ok: false, status: 'worker_request_failed', reasons: ['network_error'] },
    );
    const state = await ui.approveDonation(DONATION_ID);
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
    }
  });

  it('calls reviewDonation with approved decision', async () => {
    const reviewClient = makeReviewClient({ ok: true, status: 'donation_approved', donationId: DONATION_ID });
    const ui = createWebDonationReviewUi({
      donationStatusClient: makeStatusClient({ ok: true, status: 'ok', donation: makeDonation() }),
      reviewDonationClient: reviewClient,
    });
    await ui.approveDonation(DONATION_ID);
    expect(reviewClient.reviewDonation).toHaveBeenCalledWith(DONATION_ID, { decision: 'approved' });
  });
});

// ─── rejectDonation ───────────────────────────────────────────────────────────

describe('createWebDonationReviewUi — rejectDonation', () => {
  it('returns rejected on success', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation() },
      { ok: true, status: 'donation_rejected', donationId: DONATION_ID },
    );
    const state = await ui.rejectDonation(DONATION_ID);
    expect(state.state).toBe('rejected');
    if (state.state === 'rejected') {
      expect(state.donationId).toBe(DONATION_ID);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns forbidden when review returns forbidden', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation() },
      { ok: false, status: 'forbidden', reasons: ['forbidden'] },
    );
    const state = await ui.rejectDonation(DONATION_ID);
    expect(state.state).toBe('forbidden');
  });

  it('returns wrong_state when review returns donation_wrong_state', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation() },
      { ok: false, status: 'donation_wrong_state', reasons: ['donation_wrong_state'] },
    );
    const state = await ui.rejectDonation(DONATION_ID);
    expect(state.state).toBe('wrong_state');
    if (state.state === 'wrong_state') {
      expect(state.donationId).toBe(DONATION_ID);
    }
  });

  it('returns failed on network error', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation() },
      { ok: false, status: 'worker_request_failed', reasons: ['network_error'] },
    );
    const state = await ui.rejectDonation(DONATION_ID);
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
    }
  });

  it('calls reviewDonation with rejected decision', async () => {
    const reviewClient = makeReviewClient({ ok: true, status: 'donation_rejected', donationId: DONATION_ID });
    const ui = createWebDonationReviewUi({
      donationStatusClient: makeStatusClient({ ok: true, status: 'ok', donation: makeDonation() }),
      reviewDonationClient: reviewClient,
    });
    await ui.rejectDonation(DONATION_ID);
    expect(reviewClient.reviewDonation).toHaveBeenCalledWith(DONATION_ID, { decision: 'rejected' });
  });
});
