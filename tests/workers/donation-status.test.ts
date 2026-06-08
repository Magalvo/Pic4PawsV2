import { describe, expect, it, vi } from 'vitest';
import {
  handleWorkerDonationStatusRequest,
  matchWorkerDonationStatusId,
  type DonationStatusRecord,
  type DonationStatusRepository,
} from '../../apps/workers/src/donation-status';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/pet-drafts';

const makeActor = (id = 'user-donor-1') => ({ id, role: 'user' as const });

const makeAuthenticator = (actorId: string | null): WorkerPetDraftAuthenticator =>
  vi.fn().mockResolvedValue(actorId ? makeActor(actorId) : null);

const makeRequest = (method = 'GET') =>
  new Request('https://worker.example.com/donations/donation-abc', {
    method,
    headers: { Authorization: 'Bearer test-token' },
  });

const sampleRecord: DonationStatusRecord = {
  donationId: 'donation-abc',
  donorUserId: 'user-donor-1',
  shelterId: 'shelter-001',
  petId: null,
  kind: 'one_time_donation',
  donationStatus: 'paid',
  amountCents: 1000,
  currency: 'EUR',
  paymentMethod: 'mb_way',
  createdAt: '2026-06-08T12:00:00.000Z',
};

const makeRepository = (record: DonationStatusRecord | null): DonationStatusRepository => ({
  getDonationStatus: vi.fn().mockResolvedValue(record),
});

describe('matchWorkerDonationStatusId', () => {
  it('returns donationId for /donations/:id', () => {
    expect(matchWorkerDonationStatusId('/donations/abc-123', '/donations')).toBe('abc-123');
  });

  it('returns null for exact donations path', () => {
    expect(matchWorkerDonationStatusId('/donations', '/donations')).toBeNull();
  });

  it('returns null for too many segments', () => {
    expect(matchWorkerDonationStatusId('/donations/abc/extra', '/donations')).toBeNull();
  });

  it('returns null for unrelated path', () => {
    expect(matchWorkerDonationStatusId('/pets/abc-123', '/donations')).toBeNull();
  });
});

describe('handleWorkerDonationStatusRequest', () => {
  it('returns 405 for non-GET requests', async () => {
    const response = await handleWorkerDonationStatusRequest({
      request: makeRequest('POST'),
      donationId: 'donation-abc',
    });

    expect(response.status).toBe(405);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns 401 when no bearer token', async () => {
    const response = await handleWorkerDonationStatusRequest({
      request: new Request('https://worker.example.com/donations/donation-abc'),
      donationId: 'donation-abc',
    });

    expect(response.status).toBe(401);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when no authenticator configured', async () => {
    const response = await handleWorkerDonationStatusRequest({
      request: makeRequest(),
      donationId: 'donation-abc',
    });

    expect(response.status).toBe(501);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when authenticator returns null actor', async () => {
    const response = await handleWorkerDonationStatusRequest({
      request: makeRequest(),
      donationId: 'donation-abc',
      authenticator: makeAuthenticator(null),
    });

    expect(response.status).toBe(401);
  });

  it('returns 501 when no repository configured', async () => {
    const response = await handleWorkerDonationStatusRequest({
      request: makeRequest(),
      donationId: 'donation-abc',
      authenticator: makeAuthenticator('user-donor-1'),
    });

    expect(response.status).toBe(501);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('donation_status_repository_not_configured');
  });

  it('returns 404 when donation not found', async () => {
    const response = await handleWorkerDonationStatusRequest({
      request: makeRequest(),
      donationId: 'donation-abc',
      authenticator: makeAuthenticator('user-donor-1'),
      donationStatusRepository: makeRepository(null),
    });

    expect(response.status).toBe(404);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('donation_not_found');
  });

  it('returns 403 when actor is not the donor', async () => {
    const response = await handleWorkerDonationStatusRequest({
      request: makeRequest(),
      donationId: 'donation-abc',
      authenticator: makeAuthenticator('user-other'),
      donationStatusRepository: makeRepository(sampleRecord),
    });

    expect(response.status).toBe(403);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('forbidden');
  });

  it('returns 200 with donation status for the donor', async () => {
    const response = await handleWorkerDonationStatusRequest({
      request: makeRequest(),
      donationId: 'donation-abc',
      authenticator: makeAuthenticator('user-donor-1'),
      donationStatusRepository: makeRepository(sampleRecord),
    });

    expect(response.status).toBe(200);
    const body = await response.json() as {
      status: string;
      donation: { donationId: string; donationStatus: string };
    };
    expect(body.status).toBe('ok');
    expect(body.donation.donationId).toBe('donation-abc');
    expect(body.donation.donationStatus).toBe('paid');
  });

  it('response does not expose donorUserId', async () => {
    const response = await handleWorkerDonationStatusRequest({
      request: makeRequest(),
      donationId: 'donation-abc',
      authenticator: makeAuthenticator('user-donor-1'),
      donationStatusRepository: makeRepository(sampleRecord),
    });

    const text = await response.text();
    expect(text).not.toContain('donorUserId');
    expect(text).not.toContain('donor_user_id');
  });
});
