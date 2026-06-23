import { describe, expect, it, vi } from 'vitest';
import {
  createWebDonationReceiptUi,
  webDonationReceiptUiContent,
} from '../../apps/web/src/donation-receipt';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type {
  DonationStatusClient,
  DonationStatusClientResult,
  DonationStatusClientItem,
  DonationClientStatus,
  SubmitReceiptClient,
  SubmitReceiptClientResult,
  MediaUploadFlowClient,
  UploadMediaFlowResult,
} from '../../packages/client/src/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DONATION_ID = 'donation-001';
const MEDIA_ID = 'media-abc';

const makeDonation = (donationStatus: DonationClientStatus = 'pending_receipt'): DonationStatusClientItem => ({
  donationId: DONATION_ID,
  kind: 'one_time_donation',
  donationStatus,
  amountCents: 5000,
  currency: 'EUR',
  paymentMethod: 'bank_transfer',
  shelterId: 'shelter-001',
  petId: null,
  receiptMediaId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
});

const makeStatusClient = (result: DonationStatusClientResult): Pick<DonationStatusClient, 'loadDonationStatus'> => ({
  loadDonationStatus: vi.fn().mockResolvedValue(result),
});

const makeUploadSuccess = (): UploadMediaFlowResult => ({
  ok: true,
  status: 'uploaded',
  mediaId: MEDIA_ID,
  objectKey: `private/users/user-001/identity_document/${MEDIA_ID}.jpg`,
  responseStatus: 200,
  intent: {
    mediaId: MEDIA_ID,
    objectKey: `private/users/user-001/identity_document/${MEDIA_ID}.jpg`,
    contentType: 'image/jpeg',
    byteSize: 1024,
    visibility: 'private',
    mediaKind: 'image',
    ownerUserId: 'user-001',
    shelterId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
});

const makeUploadClient = (result: UploadMediaFlowResult): Pick<MediaUploadFlowClient, 'uploadMedia'> => ({
  uploadMedia: vi.fn().mockResolvedValue(result),
});

const makeSubmitClient = (result: SubmitReceiptClientResult): Pick<SubmitReceiptClient, 'submitReceipt'> => ({
  submitReceipt: vi.fn().mockResolvedValue(result),
});

const makeUi = (
  statusResult: DonationStatusClientResult,
  uploadResult: UploadMediaFlowResult,
  submitResult: SubmitReceiptClientResult,
) =>
  createWebDonationReceiptUi({
    donationStatusClient: makeStatusClient(statusResult),
    mediaUploadClient: makeUploadClient(uploadResult),
    submitReceiptClient: makeSubmitClient(submitResult),
  });

const makeFile = () => new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' });

// ─── webDonationReceiptUiContent ──────────────────────────────────────────────

describe('webDonationReceiptUiContent', () => {
  it('has pt-PT locale and product-flow-ready status', () => {
    expect(webDonationReceiptUiContent.locale).toBe('pt-PT');
    expect(webDonationReceiptUiContent.status).toBe('product-flow-ready');
  });

  it('has all required states defined', () => {
    const stateNames = webDonationReceiptUiContent.states.map((s) => s.state);
    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('uploading');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('submitted');
    expect(stateNames).toContain('failed');
    expect(stateNames).toContain('wrong_state');
    expect(stateNames).toContain('forbidden');
  });

  it('does not expose credentials in content', () => {
    const content = JSON.stringify(webDonationReceiptUiContent);
    expect(content).not.toContain('service-role');
    expect(content).not.toContain('bearer ');
  });
});

// ─── webFoundationContent ─────────────────────────────────────────────────────

describe('webFoundationContent — donationReceipt entry', () => {
  it('includes donationReceipt with product-flow-ready status', () => {
    expect(webFoundationContent.donationReceipt.status).toBe('product-flow-ready');
    expect(webFoundationContent.donationReceipt.title).toBeTruthy();
  });
});

// ─── loadDonationStatus ───────────────────────────────────────────────────────

describe('createWebDonationReceiptUi — loadDonationStatus', () => {
  it('returns idle with donation when status is pending_receipt', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation('pending_receipt') },
      makeUploadSuccess(),
      { ok: true, status: 'receipt_submitted', donationId: DONATION_ID },
    );
    const state = await ui.loadDonationStatus(DONATION_ID);
    expect(state.state).toBe('idle');
    if (state.state === 'idle') {
      expect(state.donation.donationId).toBe(DONATION_ID);
      expect(state.donation.donationStatus).toBe('pending_receipt');
      expect(state.title).toBeTruthy();
    }
  });

  it('returns wrong_state when donation is not in pending_receipt', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation('paid') },
      makeUploadSuccess(),
      { ok: true, status: 'receipt_submitted', donationId: DONATION_ID },
    );
    const state = await ui.loadDonationStatus(DONATION_ID);
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
      makeUploadSuccess(),
      { ok: true, status: 'receipt_submitted', donationId: DONATION_ID },
    );
    const state = await ui.loadDonationStatus(DONATION_ID);
    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed state on donation_not_found', async () => {
    const ui = makeUi(
      { ok: false, status: 'donation_not_found', reasons: ['donation_not_found'] },
      makeUploadSuccess(),
      { ok: true, status: 'receipt_submitted', donationId: DONATION_ID },
    );
    const state = await ui.loadDonationStatus(DONATION_ID);
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('donation_not_found');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed state on network error', async () => {
    const ui = makeUi(
      { ok: false, status: 'worker_request_failed', reasons: ['network_error'] },
      makeUploadSuccess(),
      { ok: true, status: 'receipt_submitted', donationId: DONATION_ID },
    );
    const state = await ui.loadDonationStatus(DONATION_ID);
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
      expect(state.title).toBeTruthy();
    }
  });
});

// ─── uploadAndSubmit ──────────────────────────────────────────────────────────

describe('createWebDonationReceiptUi — uploadAndSubmit', () => {
  it('returns submitted on upload and submit success', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation('pending_receipt') },
      makeUploadSuccess(),
      { ok: true, status: 'receipt_submitted', donationId: DONATION_ID },
    );
    const state = await ui.uploadAndSubmit(DONATION_ID, makeFile());
    expect(state.state).toBe('submitted');
    if (state.state === 'submitted') {
      expect(state.donationId).toBe(DONATION_ID);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed when media upload (intent phase) fails', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation('pending_receipt') },
      { ok: false, phase: 'intent', status: 'invalid_upload_request', reasons: ['invalid_upload_request'] },
      { ok: true, status: 'receipt_submitted', donationId: DONATION_ID },
    );
    const state = await ui.uploadAndSubmit(DONATION_ID, makeFile());
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
      expect(state.title).toBeTruthy();
    }
  });

  it('returns failed when media upload (binary phase) fails', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation('pending_receipt') },
      {
        ok: false,
        phase: 'binary_upload',
        status: 'signed_upload_failed',
        reasons: ['upload_rejected'],
        responseStatus: 403,
        mediaId: MEDIA_ID,
        objectKey: `private/users/user-001/identity_document/${MEDIA_ID}.jpg`,
      },
      { ok: true, status: 'receipt_submitted', donationId: DONATION_ID },
    );
    const state = await ui.uploadAndSubmit(DONATION_ID, makeFile());
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns wrong_state when submit returns donation_wrong_state', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation('pending_receipt') },
      makeUploadSuccess(),
      { ok: false, status: 'donation_wrong_state', reasons: ['donation_wrong_state'] },
    );
    const state = await ui.uploadAndSubmit(DONATION_ID, makeFile());
    expect(state.state).toBe('wrong_state');
    if (state.state === 'wrong_state') {
      expect(state.donationId).toBe(DONATION_ID);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns forbidden when submit returns forbidden', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation('pending_receipt') },
      makeUploadSuccess(),
      { ok: false, status: 'forbidden', reasons: ['forbidden'] },
    );
    const state = await ui.uploadAndSubmit(DONATION_ID, makeFile());
    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed when submit returns network error', async () => {
    const ui = makeUi(
      { ok: true, status: 'ok', donation: makeDonation('pending_receipt') },
      makeUploadSuccess(),
      { ok: false, status: 'worker_request_failed', reasons: ['network_error'] },
    );
    const state = await ui.uploadAndSubmit(DONATION_ID, makeFile());
    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
      expect(state.status).toBe('worker_request_failed');
    }
  });

  it('passes receipt mediaId from upload to submit', async () => {
    const submitClient = makeSubmitClient({ ok: true, status: 'receipt_submitted', donationId: DONATION_ID });
    const ui = createWebDonationReceiptUi({
      donationStatusClient: makeStatusClient({ ok: true, status: 'ok', donation: makeDonation() }),
      mediaUploadClient: makeUploadClient(makeUploadSuccess()),
      submitReceiptClient: submitClient,
    });
    await ui.uploadAndSubmit(DONATION_ID, makeFile());
    expect(submitClient.submitReceipt).toHaveBeenCalledWith(
      DONATION_ID,
      expect.objectContaining({ receiptMediaId: MEDIA_ID }),
    );
  });
});
