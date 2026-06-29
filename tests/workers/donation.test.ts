import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type {
  DonationRepository,
  CreateDonationResult,
  PaymentReferenceFactory,
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

const donationResult: CreateDonationResult = {
  donationId: 'donation-001',
  createdAt: '2026-06-08T10:00:00.000Z',
};

const validPayload = {
  shelterId: 'shelter-a',
  amountCents: 1000,
  kind: 'one_time_donation',
  paymentMethod: 'multibanco',
  petId: null,
  publicMessage: null,
  anonymous: false,
  donorDisplayName: 'João Silva',
  donorEmail: 'joao@example.pt',
  dataProcessingAccepted: true,
};

const VALID_IBAN = 'PT50000201231234567890154';

const makeDonationRepo = (
  result: CreateDonationResult = donationResult,
): DonationRepository => ({
  getDonationEligibilityContext: vi.fn().mockResolvedValue({
    shelter: {
      id: 'shelter-a',
      verificationStatus: 'verified',
      paymentAccountStatus: 'active',
    },
    paymentConfig: { tier: 'manual', activeProvider: null, iban: VALID_IBAN, mbWayPhone: null },
    pet: null,
  }),
  createDonation: vi.fn().mockResolvedValue(result),
  setProviderPaymentId: vi.fn().mockResolvedValue(undefined),
  failDonation: vi.fn().mockResolvedValue(undefined),
});

const makeDonationRequest = (body: unknown = validPayload) =>
  new Request('https://workers.pic4paws.pt/donations', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer valid-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

describe('POST /donations — donation initiation', () => {
  it('returns 201 with donation_created on valid authenticated request', async () => {
    const response = await handleWorkerRequest(
      makeDonationRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        donationRepository: makeDonationRepo(),
        now: () => '2026-06-08T10:00:00.000Z',
      },
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.status).toBe('donation_created');
  });

  it('response includes donationId, amountCents, currency, kind, shelterId, createdAt', async () => {
    const response = await handleWorkerRequest(
      makeDonationRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        donationRepository: makeDonationRepo(),
        now: () => '2026-06-08T10:00:00.000Z',
      },
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(body.donationId).toBeTruthy();
    expect(body.amountCents).toBe(1000);
    expect(body.currency).toBe('EUR');
    expect(body.kind).toBe('one_time_donation');
    expect(body.shelterId).toBe('shelter-a');
    expect(body.createdAt).toBeTruthy();
  });

  it('returns 401 when Authorization header is absent', async () => {
    const request = new Request('https://workers.pic4paws.pt/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      donationRepository: makeDonationRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 401 when authenticator returns null', async () => {
    const nullAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(null);

    const response = await handleWorkerRequest(
      makeDonationRequest(),
      validEnv,
      {
        petDraftAuthenticator: nullAuth,
        donationRepository: makeDonationRepo(),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 400 with invalid_donation when shelterId is missing', async () => {
    const { shelterId, ...payloadWithoutShelterId } = validPayload;
    void shelterId;

    const response = await handleWorkerRequest(
      makeDonationRequest(payloadWithoutShelterId),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        donationRepository: makeDonationRepo(),
      },
    );
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(400);
    expect(body.status).toBe('invalid_donation');
    expect(body.reasons).toContain('shelter_id_required');
  });

  it('returns 400 when amountCents is below minimum (100)', async () => {
    const response = await handleWorkerRequest(
      makeDonationRequest({ ...validPayload, amountCents: 50 }),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        donationRepository: makeDonationRepo(),
      },
    );
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(400);
    expect(body.reasons).toContain('amount_cents_must_be_at_least_100');
  });

  it('returns 400 when dataProcessingAccepted is false (GDPR gate)', async () => {
    const response = await handleWorkerRequest(
      makeDonationRequest({ ...validPayload, dataProcessingAccepted: false }),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        donationRepository: makeDonationRepo(),
      },
    );
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(400);
    expect(body.reasons).toContain('data_processing_consent_required');
  });

  it('returns 501 when donationRepository is not injected', async () => {
    const response = await handleWorkerRequest(
      makeDonationRequest(),
      validEnv,
      { petDraftAuthenticator: fakeAuth },
    );
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('donation_repository_not_configured');
  });

  it('rejects donation intents for shelters that are not verified before insert', async () => {
    const donationRepository: DonationRepository = {
      getDonationEligibilityContext: vi.fn().mockResolvedValue({
        shelter: {
          id: 'shelter-a',
          verificationStatus: 'pending_review',
          paymentAccountStatus: 'active',
        },
        paymentConfig: { tier: 'manual', activeProvider: null, iban: VALID_IBAN, mbWayPhone: null },
        pet: null,
      }),
      createDonation: vi.fn(),
      setProviderPaymentId: vi.fn().mockResolvedValue(undefined),
      failDonation: vi.fn().mockResolvedValue(undefined),
    };

    const response = await handleWorkerRequest(makeDonationRequest(), validEnv, {
      petDraftAuthenticator: fakeAuth,
      donationRepository,
    });
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(409);
    expect(body).toEqual({
      status: 'donation_not_eligible',
      reasons: ['shelter_not_verified'],
    });
    expect(donationRepository.createDonation).not.toHaveBeenCalled();
  });

  it('rejects donation intents when the selected pet does not belong to the shelter', async () => {
    const donationRepository: DonationRepository = {
      getDonationEligibilityContext: vi.fn().mockResolvedValue({
        shelter: {
          id: 'shelter-a',
          verificationStatus: 'verified',
          paymentAccountStatus: 'active',
        },
        paymentConfig: { tier: 'manual', activeProvider: null, iban: VALID_IBAN, mbWayPhone: null },
        pet: { id: 'pet-1', shelterId: 'shelter-b' },
      }),
      createDonation: vi.fn(),
      setProviderPaymentId: vi.fn().mockResolvedValue(undefined),
      failDonation: vi.fn().mockResolvedValue(undefined),
    };

    const response = await handleWorkerRequest(
      makeDonationRequest({ ...validPayload, petId: 'pet-1' }),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        donationRepository,
      },
    );
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(409);
    expect(body.reasons).toContain('pet_not_in_shelter');
    expect(donationRepository.createDonation).not.toHaveBeenCalled();
  });

  it('rejects payment methods unsupported by the configured provider', async () => {
    const donationRepository = makeDonationRepo();

    const response = await handleWorkerRequest(
      makeDonationRequest({ ...validPayload, paymentMethod: 'bank_transfer' }),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        donationRepository,
      },
    );
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(409);
    expect(body.reasons).toContain('payment_method_not_supported');
    expect(donationRepository.createDonation).not.toHaveBeenCalled();
  });

  it('derives donorUserId from the authenticated actor instead of the payload', async () => {
    const donationRepository = makeDonationRepo();

    await handleWorkerRequest(
      makeDonationRequest({ ...validPayload, donorUserId: 'attacker-user-id' }),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        donationRepository,
        now: () => '2026-06-08T10:00:00.000Z',
      },
    );

    expect(donationRepository.createDonation).toHaveBeenCalledWith(
      expect.objectContaining({ donorUserId: 'user-donor-1' }),
    );
  });

  it('returns 405 for GET /donations', async () => {
    const request = new Request('https://workers.pic4paws.pt/donations', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAuth,
      donationRepository: makeDonationRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.status).toBe('method_not_allowed');
  });

  it('response body never contains credential markers', async () => {
    const response = await handleWorkerRequest(
      makeDonationRequest(),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        donationRepository: makeDonationRepo(),
        now: () => '2026-06-08T10:00:00.000Z',
      },
    );
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });

  it('201 response includes tier, iban, and mbWayPhone for manual-tier shelter', async () => {
    const phone = '+351912345678';
    const donationRepository: DonationRepository = {
      getDonationEligibilityContext: vi.fn().mockResolvedValue({
        shelter: { id: 'shelter-a', verificationStatus: 'verified', paymentAccountStatus: 'active' },
        paymentConfig: { tier: 'manual', iban: VALID_IBAN, mbWayPhone: phone },
        pet: null,
      }),
      createDonation: vi.fn().mockResolvedValue(donationResult),
      setProviderPaymentId: vi.fn().mockResolvedValue(undefined),
      failDonation: vi.fn().mockResolvedValue(undefined),
    };

    const response = await handleWorkerRequest(makeDonationRequest(), validEnv, {
      petDraftAuthenticator: fakeAuth,
      donationRepository,
      now: () => '2026-06-08T10:00:00.000Z',
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(body.tier).toBe('manual');
    expect(body.iban).toBe(VALID_IBAN);
    expect(body.mbWayPhone).toBe(phone);
  });

  it('createDonation is called with initialStatus pending_receipt for manual tier', async () => {
    const donationRepository = makeDonationRepo();

    await handleWorkerRequest(makeDonationRequest(), validEnv, {
      petDraftAuthenticator: fakeAuth,
      donationRepository,
      now: () => '2026-06-08T10:00:00.000Z',
    });

    expect(donationRepository.createDonation).toHaveBeenCalledWith(
      expect.objectContaining({ initialStatus: 'pending_receipt' }),
    );
  });

  it('returns 409 with payment_config_not_found when shelter is active but has no config', async () => {
    const donationRepository: DonationRepository = {
      getDonationEligibilityContext: vi.fn().mockResolvedValue({
        shelter: { id: 'shelter-a', verificationStatus: 'verified', paymentAccountStatus: 'active' },
        paymentConfig: null,
        pet: null,
      }),
      createDonation: vi.fn(),
      setProviderPaymentId: vi.fn().mockResolvedValue(undefined),
      failDonation: vi.fn().mockResolvedValue(undefined),
    };

    const response = await handleWorkerRequest(makeDonationRequest(), validEnv, {
      petDraftAuthenticator: fakeAuth,
      donationRepository,
    });
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(409);
    expect(body.reasons).toContain('payment_config_not_found');
    expect(donationRepository.createDonation).not.toHaveBeenCalled();
  });

  it('automated tier + no factory → 503 provider_credentials_unavailable', async () => {
    const donationRepository: DonationRepository = {
      getDonationEligibilityContext: vi.fn().mockResolvedValue({
        shelter: { id: 'shelter-a', verificationStatus: 'verified', paymentAccountStatus: 'active' },
        paymentConfig: { tier: 'automated', activeProvider: 'eupago', iban: null, mbWayPhone: null },
        pet: null,
      }),
      createDonation: vi.fn(),
      setProviderPaymentId: vi.fn().mockResolvedValue(undefined),
      failDonation: vi.fn().mockResolvedValue(undefined),
    };

    const response = await handleWorkerRequest(makeDonationRequest(), validEnv, {
      petDraftAuthenticator: fakeAuth,
      donationRepository,
      // no paymentReferenceFactory
    });
    const body = (await response.json()) as { status: string };

    expect(response.status).toBe(503);
    expect(body.status).toBe('provider_credentials_unavailable');
    expect(donationRepository.createDonation).not.toHaveBeenCalled();
  });

  it('automated tier + factory ok:true → 201 donation_created with reference', async () => {
    const donationRepository: DonationRepository = {
      getDonationEligibilityContext: vi.fn().mockResolvedValue({
        shelter: { id: 'shelter-a', verificationStatus: 'verified', paymentAccountStatus: 'active' },
        paymentConfig: { tier: 'automated', activeProvider: 'eupago', iban: null, mbWayPhone: null },
        pet: null,
      }),
      createDonation: vi.fn().mockResolvedValue(donationResult),
      setProviderPaymentId: vi.fn().mockResolvedValue(undefined),
      failDonation: vi.fn().mockResolvedValue(undefined),
    };

    const factory: PaymentReferenceFactory = {
      createReference: vi.fn().mockResolvedValue({
        ok: true,
        providerPaymentId: 'txn-eupago-999',
        reference: { method: 'multibanco', entity: '10611', reference: '123456789', expiresAt: null },
      }),
    };

    const response = await handleWorkerRequest(makeDonationRequest(), validEnv, {
      petDraftAuthenticator: fakeAuth,
      donationRepository,
      paymentReferenceFactory: factory,
      now: () => '2026-06-28T10:00:00.000Z',
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(body.status).toBe('donation_created');
    expect(body.tier).toBe('automated');
    expect(body.provider).toBe('eupago');
    expect((body.reference as Record<string, unknown>).method).toBe('multibanco');
    expect(donationRepository.createDonation).toHaveBeenCalledWith(
      expect.objectContaining({ initialStatus: 'pending_payment', provider: 'eupago' }),
    );
    expect(donationRepository.setProviderPaymentId).toHaveBeenCalledWith(
      donationResult.donationId,
      'txn-eupago-999',
    );
  });

  it('automated tier + factory ok:false → 502 payment_reference_failed', async () => {
    const failDonation = vi.fn().mockResolvedValue(undefined);
    const donationRepository: DonationRepository = {
      getDonationEligibilityContext: vi.fn().mockResolvedValue({
        shelter: { id: 'shelter-a', verificationStatus: 'verified', paymentAccountStatus: 'active' },
        paymentConfig: { tier: 'automated', activeProvider: 'eupago', iban: null, mbWayPhone: null },
        pet: null,
      }),
      createDonation: vi.fn().mockResolvedValue(donationResult),
      setProviderPaymentId: vi.fn().mockResolvedValue(undefined),
      failDonation,
    };

    const factory: PaymentReferenceFactory = {
      createReference: vi.fn().mockResolvedValue({ ok: false, reason: 'psp_error' }),
    };

    const response = await handleWorkerRequest(makeDonationRequest(), validEnv, {
      petDraftAuthenticator: fakeAuth,
      donationRepository,
      paymentReferenceFactory: factory,
      now: () => '2026-06-28T10:00:00.000Z',
    });
    const body = (await response.json()) as { status: string };

    expect(response.status).toBe(502);
    expect(body.status).toBe('payment_reference_failed');
    expect(failDonation).toHaveBeenCalledWith(donationResult.donationId);
  });

  it('automated tier + factory ok:true + no setProviderPaymentId → 502 payment_reference_failed', async () => {
    const failDonation = vi.fn().mockResolvedValue(undefined);
    // Cast to bypass the interface requirement and verify runtime catch-block behaviour
    // when setProviderPaymentId is missing (e.g. from a JS caller without type guarantees).
    const donationRepository = {
      getDonationEligibilityContext: vi.fn().mockResolvedValue({
        shelter: { id: 'shelter-a', verificationStatus: 'verified', paymentAccountStatus: 'active' },
        paymentConfig: { tier: 'automated', activeProvider: 'eupago', iban: null, mbWayPhone: null },
        pet: null,
      }),
      createDonation: vi.fn().mockResolvedValue(donationResult),
      failDonation,
      // setProviderPaymentId intentionally absent
    } as unknown as DonationRepository;
    const factory: PaymentReferenceFactory = {
      createReference: vi.fn().mockResolvedValue({
        ok: true,
        providerPaymentId: 'txn-eupago-999',
        reference: { method: 'multibanco', entity: '10611', reference: '123456789', expiresAt: null },
      }),
    };

    const response = await handleWorkerRequest(makeDonationRequest(), validEnv, {
      petDraftAuthenticator: fakeAuth,
      donationRepository,
      paymentReferenceFactory: factory,
      now: () => '2026-06-28T10:00:00.000Z',
    });
    const body = (await response.json()) as { status: string };

    expect(response.status).toBe(502);
    expect(body.status).toBe('payment_reference_failed');
    expect(failDonation).toHaveBeenCalledWith(donationResult.donationId);
  });

  it('automated tier + factory ok:true + setProviderPaymentId throws → 502 payment_reference_failed', async () => {
    const failDonation = vi.fn().mockResolvedValue(undefined);
    const donationRepository: DonationRepository = {
      getDonationEligibilityContext: vi.fn().mockResolvedValue({
        shelter: { id: 'shelter-a', verificationStatus: 'verified', paymentAccountStatus: 'active' },
        paymentConfig: { tier: 'automated', activeProvider: 'eupago', iban: null, mbWayPhone: null },
        pet: null,
      }),
      createDonation: vi.fn().mockResolvedValue(donationResult),
      setProviderPaymentId: vi.fn().mockRejectedValue(new Error('DB write failed')),
      failDonation,
    };
    const factory: PaymentReferenceFactory = {
      createReference: vi.fn().mockResolvedValue({
        ok: true,
        providerPaymentId: 'txn-eupago-999',
        reference: { method: 'multibanco', entity: '10611', reference: '123456789', expiresAt: null },
      }),
    };

    const response = await handleWorkerRequest(makeDonationRequest(), validEnv, {
      petDraftAuthenticator: fakeAuth,
      donationRepository,
      paymentReferenceFactory: factory,
      now: () => '2026-06-28T10:00:00.000Z',
    });
    const body = (await response.json()) as { status: string };

    expect(response.status).toBe(502);
    expect(body.status).toBe('payment_reference_failed');
    expect(failDonation).toHaveBeenCalledWith(donationResult.donationId);
  });

  it('automated tier + mb_way without mbWayPhone → 400 mb_way_phone_required', async () => {
    const donationRepository: DonationRepository = {
      getDonationEligibilityContext: vi.fn().mockResolvedValue({
        shelter: { id: 'shelter-a', verificationStatus: 'verified', paymentAccountStatus: 'active' },
        paymentConfig: { tier: 'automated', activeProvider: 'eupago', iban: null, mbWayPhone: null },
        pet: null,
      }),
      createDonation: vi.fn().mockResolvedValue(donationResult),
      setProviderPaymentId: vi.fn().mockResolvedValue(undefined),
      failDonation: vi.fn().mockResolvedValue(undefined),
    };
    const factory: PaymentReferenceFactory = { createReference: vi.fn() };

    const response = await handleWorkerRequest(
      makeDonationRequest({ ...validPayload, paymentMethod: 'mb_way' }),
      validEnv,
      { petDraftAuthenticator: fakeAuth, donationRepository, paymentReferenceFactory: factory },
    );
    const body = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(400);
    expect(body.reasons).toContain('mb_way_phone_required');
    expect(factory.createReference).not.toHaveBeenCalled();
  });

  it('automated tier + mb_way with mbWayPhone + factory ok:true → 201 with mb_way reference', async () => {
    const donationRepository: DonationRepository = {
      getDonationEligibilityContext: vi.fn().mockResolvedValue({
        shelter: { id: 'shelter-a', verificationStatus: 'verified', paymentAccountStatus: 'active' },
        paymentConfig: { tier: 'automated', activeProvider: 'eupago', iban: null, mbWayPhone: null },
        pet: null,
      }),
      createDonation: vi.fn().mockResolvedValue(donationResult),
      setProviderPaymentId: vi.fn().mockResolvedValue(undefined),
      failDonation: vi.fn().mockResolvedValue(undefined),
    };
    const factory: PaymentReferenceFactory = {
      createReference: vi.fn().mockResolvedValue({
        ok: true,
        providerPaymentId: 'txn-mbway-001',
        reference: { method: 'mb_way', phone: '+351910000001', expiresAt: null },
      }),
    };

    const response = await handleWorkerRequest(
      makeDonationRequest({ ...validPayload, paymentMethod: 'mb_way', mbWayPhone: '+351910000001' }),
      validEnv,
      {
        petDraftAuthenticator: fakeAuth,
        donationRepository,
        paymentReferenceFactory: factory,
        now: () => '2026-06-28T10:00:00.000Z',
      },
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(body.tier).toBe('automated');
    expect((body.reference as Record<string, unknown>).method).toBe('mb_way');
    expect(factory.createReference).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: 'mb_way', mbWayPhone: '+351910000001' }),
    );
  });
});
