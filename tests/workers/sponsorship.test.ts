import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type {
  SponsorshipRepository,
  CreateSponsorshipResult,
} from '../../apps/workers/src/index';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/index';
import type { AuthenticatedActor } from '@pic4paws/domain';
import type { EnvironmentRecord } from '@pic4paws/config';

const validEnv: EnvironmentRecord = {
  APP_ENV: 'production',
  PUBLIC_APP_ORIGIN: 'https://pic4paws.pt',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account',
  R2_PUBLIC_BUCKET: 'pic4paws-public',
  R2_PRIVATE_BUCKET: 'pic4paws-private',
  R2_ACCESS_KEY_ID: 'r2-access-key',
  R2_SECRET_ACCESS_KEY: 'r2-secret-key',
  WORKER_PAYMENT_WEBHOOK_PATH: '/webhooks/payments',
  WORKER_ADOPTIONS_PATH: '/adoptions',
  WORKER_DONATIONS_PATH: '/donations',
  WORKER_SPONSORSHIPS_PATH: '/sponsorships',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const fakeActor: AuthenticatedActor = {
  id: 'user-donor-1',
  authUserId: 'auth-donor-1',
  role: 'adopter',
  status: 'active',
  memberships: [],
};

const fakeAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(fakeActor);

const sponsorshipResult: CreateSponsorshipResult = {
  sponsorshipId: 'sponsorship-001',
  createdAt: '2026-06-08T10:00:00.000Z',
};

const validPayload = {
  shelterId: 'shelter-a',
  amountCents: 1000,
  paymentMethod: 'mb_way',
  recurringInterval: 'monthly',
  petId: null,
  dataProcessingAccepted: true,
};

const makeSponsorshipRepo = (
  result: CreateSponsorshipResult = sponsorshipResult,
): SponsorshipRepository => ({
  createSponsorship: vi.fn().mockResolvedValue(result),
});

const makeSponsorshipRequest = (body: unknown = validPayload) =>
  new Request('https://workers.pic4paws.pt/sponsorships', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer valid-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

describe('POST /sponsorships — recurring sponsorship initiation', () => {
  it('returns 201 with sponsorship_created on valid authenticated request', async () => {
    const response = await handleWorkerRequest(
      makeSponsorshipRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        sponsorshipRepository: makeSponsorshipRepo(),
        now: () => '2026-06-08T10:00:00.000Z',
      },
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.status).toBe('sponsorship_created');
  });

  it('response includes sponsorshipId, amountCents, currency, recurringInterval, shelterId, createdAt', async () => {
    const response = await handleWorkerRequest(
      makeSponsorshipRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        sponsorshipRepository: makeSponsorshipRepo(),
        now: () => '2026-06-08T10:00:00.000Z',
      },
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(body.sponsorshipId).toBeTruthy();
    expect(body.amountCents).toBe(1000);
    expect(body.currency).toBe('EUR');
    expect(body.recurringInterval).toBe('monthly');
    expect(body.shelterId).toBe('shelter-a');
    expect(body.createdAt).toBeTruthy();
  });

  it('returns 401 when Authorization header is absent', async () => {
    const request = new Request('https://workers.pic4paws.pt/sponsorships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      sponsorshipRepository: makeSponsorshipRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 401 when authenticator returns null', async () => {
    const nullAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(null);

    const response = await handleWorkerRequest(
      makeSponsorshipRequest(),
      validEnv,
      {
        petDraftAuthenticator: nullAuth,
        sponsorshipRepository: makeSponsorshipRepo(),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 400 with invalid_sponsorship when shelterId is missing', async () => {
    const { shelterId, ...payloadWithoutShelterId } = validPayload;
    void shelterId;

    const response = await handleWorkerRequest(
      makeSponsorshipRequest(payloadWithoutShelterId),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        sponsorshipRepository: makeSponsorshipRepo(),
      },
    );
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(400);
    expect(body.status).toBe('invalid_sponsorship');
    expect(body.reasons).toContain('shelter_id_required');
  });

  it('returns 400 when amountCents is below minimum (100)', async () => {
    const response = await handleWorkerRequest(
      makeSponsorshipRequest({ ...validPayload, amountCents: 50 }),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        sponsorshipRepository: makeSponsorshipRepo(),
      },
    );
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(400);
    expect(body.reasons).toContain('amount_cents_must_be_at_least_100');
  });

  it('returns 400 when dataProcessingAccepted is false (GDPR gate)', async () => {
    const response = await handleWorkerRequest(
      makeSponsorshipRequest({ ...validPayload, dataProcessingAccepted: false }),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        sponsorshipRepository: makeSponsorshipRepo(),
      },
    );
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(400);
    expect(body.reasons).toContain('data_processing_consent_required');
  });

  it('returns 400 when recurringInterval is invalid', async () => {
    const response = await handleWorkerRequest(
      makeSponsorshipRequest({ ...validPayload, recurringInterval: 'weekly' }),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        sponsorshipRepository: makeSponsorshipRepo(),
      },
    );
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(400);
    expect(body.reasons).toContain('recurring_interval_invalid');
  });

  it('returns 501 when sponsorshipRepository is not injected', async () => {
    const response = await handleWorkerRequest(
      makeSponsorshipRequest(),
      validEnv,
      { petDraftAuthenticator: fakeAuth },
    );
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('sponsorship_repository_not_configured');
  });

  it('GET /sponsorships routes to donor list handler (not create), returns 501 without donor list repo', async () => {
    const request = new Request('https://workers.pic4paws.pt/sponsorships', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      sponsorshipRepository: makeSponsorshipRepo(),
      // no sponsorshipDonorListRepository
    });
    const body = await response.json();

    // GET /sponsorships is now the donor list endpoint — 501 when repo not configured
    expect(response.status).toBe(501);
    expect(body.status).toBe('sponsorship_donor_list_repository_not_configured');
  });

  it('response body never contains credential markers', async () => {
    const response = await handleWorkerRequest(
      makeSponsorshipRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        sponsorshipRepository: makeSponsorshipRepo(),
        now: () => '2026-06-08T10:00:00.000Z',
      },
    );
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });
});
