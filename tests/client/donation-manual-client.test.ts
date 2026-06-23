import { describe, expect, it, vi } from 'vitest';
import {
  createSubmitReceiptClient,
  createReviewDonationClient,
} from '../../packages/client/src/index';
import type {
  SubmitReceiptClientSuccess,
  ReviewDonationClientSuccess,
} from '../../packages/client/src/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WORKER_URL = 'https://workers.pic4paws.pt';
const DONATIONS_PATH = '/donations';
const DONATION_ID = 'donation-abc';
const MEDIA_ID = 'media-001';
const VALID_TOKEN = 'valid-access-token';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const makeReceiptClient = (
  fetch: ReturnType<typeof vi.fn>,
  getAccessToken: () => Promise<string | null> = () => Promise.resolve(VALID_TOKEN),
) =>
  createSubmitReceiptClient({
    workerBaseUrl: WORKER_URL,
    donationsPath: DONATIONS_PATH,
    getAccessToken,
    fetch: fetch as never,
  });

const makeReviewClient = (
  fetch: ReturnType<typeof vi.fn>,
  getAccessToken: () => Promise<string | null> = () => Promise.resolve(VALID_TOKEN),
) =>
  createReviewDonationClient({
    workerBaseUrl: WORKER_URL,
    donationsPath: DONATIONS_PATH,
    getAccessToken,
    fetch: fetch as never,
  });

// ─── createSubmitReceiptClient ────────────────────────────────────────────────

describe('createSubmitReceiptClient.submitReceipt', () => {
  it('returns unauthenticated when access token is null', async () => {
    const fetch = makeFetch(401, { status: 'unauthenticated' });
    const result = await makeReceiptClient(fetch, () => Promise.resolve(null)).submitReceipt(
      DONATION_ID,
      { receiptMediaId: MEDIA_ID },
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns donation_not_found on 404', async () => {
    const fetch = makeFetch(404, { status: 'donation_not_found' });
    const result = await makeReceiptClient(fetch).submitReceipt(DONATION_ID, { receiptMediaId: MEDIA_ID });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('donation_not_found');
  });

  it('returns donation_wrong_state on 409', async () => {
    const fetch = makeFetch(409, { status: 'donation_wrong_state' });
    const result = await makeReceiptClient(fetch).submitReceipt(DONATION_ID, { receiptMediaId: MEDIA_ID });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('donation_wrong_state');
  });

  it('returns receipt_media_not_found on media 404', async () => {
    const fetch = makeFetch(404, { status: 'receipt_media_not_found' });
    const result = await makeReceiptClient(fetch).submitReceipt(DONATION_ID, { receiptMediaId: MEDIA_ID });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('receipt_media_not_found');
  });

  it('returns receipt_submitted on success', async () => {
    const fetch = makeFetch(200, { status: 'receipt_submitted', donationId: DONATION_ID });
    const result = await makeReceiptClient(fetch).submitReceipt(DONATION_ID, { receiptMediaId: MEDIA_ID });
    expect(result.ok).toBe(true);
    const success = result as SubmitReceiptClientSuccess;
    expect(success.status).toBe('receipt_submitted');
    expect(success.donationId).toBe(DONATION_ID);
  });

  it('constructs URL as {workerBaseUrl}/donations/{donationId}/receipt', async () => {
    const fetch = makeFetch(200, { status: 'receipt_submitted', donationId: DONATION_ID });
    await makeReceiptClient(fetch).submitReceipt(DONATION_ID, { receiptMediaId: MEDIA_ID });
    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe(`${WORKER_URL}/donations/${DONATION_ID}/receipt`);
  });

  it('sends PATCH with Authorization header and receiptMediaId in body', async () => {
    const fetch = makeFetch(200, { status: 'receipt_submitted', donationId: DONATION_ID });
    await makeReceiptClient(fetch).submitReceipt(DONATION_ID, { receiptMediaId: MEDIA_ID });
    const [, opts] = fetch.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe('PATCH');
    expect((opts.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${VALID_TOKEN}`);
    const body = JSON.parse(opts.body as string) as Record<string, unknown>;
    expect(body.receiptMediaId).toBe(MEDIA_ID);
  });

  it('returns worker_request_failed on network error', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network'));
    const result = await makeReceiptClient(fetch as never).submitReceipt(DONATION_ID, { receiptMediaId: MEDIA_ID });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('worker_request_failed');
  });
});

// ─── createReviewDonationClient ───────────────────────────────────────────────

describe('createReviewDonationClient.reviewDonation', () => {
  it('returns unauthenticated when access token is null', async () => {
    const fetch = makeFetch(401, { status: 'unauthenticated' });
    const result = await makeReviewClient(fetch, () => Promise.resolve(null)).reviewDonation(
      DONATION_ID,
      { decision: 'approved' },
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns forbidden on 403', async () => {
    const fetch = makeFetch(403, { status: 'forbidden' });
    const result = await makeReviewClient(fetch).reviewDonation(DONATION_ID, { decision: 'approved' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('forbidden');
  });

  it('returns donation_wrong_state on 409', async () => {
    const fetch = makeFetch(409, { status: 'donation_wrong_state' });
    const result = await makeReviewClient(fetch).reviewDonation(DONATION_ID, { decision: 'approved' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('donation_wrong_state');
  });

  it('returns donation_approved on approve success', async () => {
    const fetch = makeFetch(200, { status: 'donation_approved', donationId: DONATION_ID });
    const result = await makeReviewClient(fetch).reviewDonation(DONATION_ID, { decision: 'approved' });
    expect(result.ok).toBe(true);
    const success = result as ReviewDonationClientSuccess;
    expect(success.status).toBe('donation_approved');
    expect(success.donationId).toBe(DONATION_ID);
  });

  it('returns donation_rejected on reject success', async () => {
    const fetch = makeFetch(200, { status: 'donation_rejected', donationId: DONATION_ID });
    const result = await makeReviewClient(fetch).reviewDonation(DONATION_ID, { decision: 'rejected' });
    expect(result.ok).toBe(true);
    const success = result as ReviewDonationClientSuccess;
    expect(success.status).toBe('donation_rejected');
    expect(success.donationId).toBe(DONATION_ID);
  });

  it('constructs URL as {workerBaseUrl}/donations/{donationId}/review', async () => {
    const fetch = makeFetch(200, { status: 'donation_approved', donationId: DONATION_ID });
    await makeReviewClient(fetch).reviewDonation(DONATION_ID, { decision: 'approved' });
    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe(`${WORKER_URL}/donations/${DONATION_ID}/review`);
  });

  it('sends PATCH with Authorization header and decision in body', async () => {
    const fetch = makeFetch(200, { status: 'donation_approved', donationId: DONATION_ID });
    await makeReviewClient(fetch).reviewDonation(DONATION_ID, { decision: 'approved' });
    const [, opts] = fetch.mock.calls[0] as [string, RequestInit];
    expect(opts.method).toBe('PATCH');
    expect((opts.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${VALID_TOKEN}`);
    const body = JSON.parse(opts.body as string) as Record<string, unknown>;
    expect(body.decision).toBe('approved');
  });

  it('returns worker_request_failed on network error', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network'));
    const result = await makeReviewClient(fetch as never).reviewDonation(DONATION_ID, { decision: 'rejected' });
    expect(result.ok).toBe(false);
    expect(result.status).toBe('worker_request_failed');
  });
});
