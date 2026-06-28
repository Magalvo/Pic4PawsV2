import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { PaymentReferenceFactory } from './payment-reference-factory';

export type DonationKind = 'one_time_donation' | 'monthly_sponsorship';

export type DonationPaymentMethod =
  | 'mb_way'
  | 'multibanco'
  | 'card'
  | 'bank_transfer'
  | 'unknown';

export type DonationProvider = 'eupago' | 'ifthenpay' | 'stripe';

export type CreateDonationInput = {
  donorUserId: string;
  shelterId: string;
  petId: string | null;
  kind: DonationKind;
  amountCents: number;
  paymentMethod: DonationPaymentMethod;
  provider: DonationProvider;
  initialStatus: 'pending_receipt' | 'pending_payment';
  anonymous: boolean;
  donorDisplayName: string | null;
  donorEmail: string | null;
  publicMessage: string | null;
  createdAt: string;
};

export type CreateDonationResult = {
  donationId: string;
  createdAt: string;
};

export type DonationEligibilityQuery = {
  shelterId: string;
  petId: string | null;
};

export type DonationPaymentConfig = {
  tier: 'manual' | 'automated';
  activeProvider: 'eupago' | 'ifthenpay' | null;
  iban: string | null;
  mbWayPhone: string | null;
};

export type DonationEligibilityContext = {
  shelter: {
    id: string;
    verificationStatus: 'draft' | 'pending_review' | 'verified' | 'rejected' | 'suspended';
    paymentAccountStatus: 'not_configured' | 'pending' | 'active' | 'disabled';
  } | null;
  paymentConfig: DonationPaymentConfig | null;
  pet: {
    id: string;
    shelterId: string;
  } | null;
};

export type DonationEligibilityRejectionReason =
  | 'shelter_not_found'
  | 'shelter_not_verified'
  | 'payment_account_not_active'
  | 'payment_config_not_found'
  | 'pet_not_found'
  | 'pet_not_in_shelter'
  | 'payment_method_not_supported';

export type DonationRepository = {
  getDonationEligibilityContext: (
    query: DonationEligibilityQuery,
  ) => Promise<DonationEligibilityContext>;
  createDonation: (input: CreateDonationInput) => Promise<CreateDonationResult>;
  setProviderPaymentId?: (donationId: string, providerPaymentId: string) => Promise<void>;
  failDonation?: (donationId: string) => Promise<void>;
};

// ─── Payload validation ───────────────────────────────────────────────────────

type ValidatedDonationPayload = {
  shelterId: string;
  amountCents: number;
  kind: DonationKind;
  paymentMethod: DonationPaymentMethod;
  petId: string | null;
  publicMessage: string | null;
  anonymous: boolean;
  donorDisplayName: string | null;
  donorEmail: string | null;
  dataProcessingAccepted: true;
};

type ValidateDonationPayloadResult =
  | { valid: true; data: ValidatedDonationPayload }
  | { valid: false; reasons: string[] };

const DONATION_KINDS: DonationKind[] = ['one_time_donation', 'monthly_sponsorship'];

const PAYMENT_METHODS: DonationPaymentMethod[] = [
  'mb_way',
  'multibanco',
  'card',
  'bank_transfer',
  'unknown',
];

const PAYMENT_METHODS_BY_PROVIDER: Record<DonationProvider, DonationPaymentMethod[]> = {
  eupago: ['mb_way', 'multibanco', 'card'],
  ifthenpay: ['mb_way', 'multibanco', 'card'],
  stripe: ['card'],
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

export const validateDonationPayload = (payload: unknown): ValidateDonationPayloadResult => {
  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, reasons: ['payload_must_be_object'] };
  }

  const p = payload as Record<string, unknown>;
  const reasons: string[] = [];

  if (!isNonEmptyString(p['shelterId'])) reasons.push('shelter_id_required');
  if (!isPositiveInteger(p['amountCents'])) {
    reasons.push('amount_cents_must_be_integer');
  } else if ((p['amountCents'] as number) < 100) {
    reasons.push('amount_cents_must_be_at_least_100');
  }
  if (!DONATION_KINDS.includes(p['kind'] as DonationKind)) reasons.push('kind_invalid');
  if (!PAYMENT_METHODS.includes(p['paymentMethod'] as DonationPaymentMethod))
    reasons.push('payment_method_invalid');
  if (p['dataProcessingAccepted'] !== true) reasons.push('data_processing_consent_required');

  // Optional nullable fields — only validate if present and wrong type
  if (!isNullableString(p['petId'])) reasons.push('pet_id_invalid');
  if (!isNullableString(p['publicMessage'])) reasons.push('public_message_invalid');
  if (!isNullableString(p['donorDisplayName'])) reasons.push('donor_display_name_invalid');
  if (!isNullableString(p['donorEmail'])) reasons.push('donor_email_invalid');

  // anonymous defaults to false if not provided
  const anonymous = p['anonymous'] === undefined ? false : p['anonymous'];
  if (!isBoolean(anonymous)) reasons.push('anonymous_must_be_boolean');

  if (reasons.length > 0) {
    return { valid: false, reasons };
  }

  return {
    valid: true,
    data: {
      shelterId: p['shelterId'] as string,
      amountCents: p['amountCents'] as number,
      kind: p['kind'] as DonationKind,
      paymentMethod: p['paymentMethod'] as DonationPaymentMethod,
      petId: (p['petId'] as string | null) ?? null,
      publicMessage: (p['publicMessage'] as string | null) ?? null,
      anonymous: (anonymous as boolean),
      donorDisplayName: (p['donorDisplayName'] as string | null) ?? null,
      donorEmail: (p['donorEmail'] as string | null) ?? null,
      dataProcessingAccepted: true,
    },
  };
};

export const validateDonationEligibility = (
  context: DonationEligibilityContext,
  donation: Pick<ValidatedDonationPayload, 'shelterId' | 'petId' | 'paymentMethod'>,
  provider: DonationProvider,
): DonationEligibilityRejectionReason[] => {
  const reasons: DonationEligibilityRejectionReason[] = [];

  if (!context.shelter) {
    reasons.push('shelter_not_found');
  } else {
    if (context.shelter.verificationStatus !== 'verified') {
      reasons.push('shelter_not_verified');
    }

    if (context.shelter.paymentAccountStatus !== 'active') {
      reasons.push('payment_account_not_active');
    } else if (!context.paymentConfig) {
      // Shelter is active but has no payment config row — data inconsistency guard
      reasons.push('payment_config_not_found');
    }
  }

  if (donation.petId) {
    if (!context.pet) {
      reasons.push('pet_not_found');
    } else if (context.pet.shelterId !== donation.shelterId) {
      reasons.push('pet_not_in_shelter');
    }
  }

  if (!PAYMENT_METHODS_BY_PROVIDER[provider].includes(donation.paymentMethod)) {
    reasons.push('payment_method_not_supported');
  }

  return reasons;
};

// ─── Handler ──────────────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

export type HandleWorkerDonationRequestInput = {
  request: Request;
  payload: unknown;
  donationRepository?: DonationRepository;
  authenticator?: WorkerPetDraftAuthenticator;
  provider: DonationProvider;
  paymentReferenceFactory?: PaymentReferenceFactory;
  now: () => string;
};

export const handleWorkerDonationRequest = async ({
  request,
  payload,
  donationRepository,
  authenticator,
  provider,
  paymentReferenceFactory,
  now,
}: HandleWorkerDonationRequestInput): Promise<Response> => {
  // 1. Method check
  if (request.method !== 'POST') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['POST'] },
      { status: 405, headers: { Allow: 'POST' } },
    );
  }

  // 2. Bearer token
  const bearerToken = extractBearerToken(request);
  if (!bearerToken) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  // 3. Authenticator configured
  if (!authenticator) {
    return jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 });
  }

  // 4. Authenticate
  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await authenticator({ request, authorizationHeader, bearerToken });
  if (!actor) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  // 5. Validate payload
  const validation = validateDonationPayload(payload);
  if (!validation.valid) {
    return jsonResponse(
      { status: 'invalid_donation', reasons: validation.reasons },
      { status: 400 },
    );
  }

  // 6. Repository check
  if (!donationRepository) {
    return jsonResponse({ status: 'donation_repository_not_configured' }, { status: 501 });
  }

  // 7. Server-side eligibility check
  let eligibilityContext: DonationEligibilityContext;
  try {
    eligibilityContext = await donationRepository.getDonationEligibilityContext({
      shelterId: validation.data.shelterId,
      petId: validation.data.petId,
    });
  } catch {
    return jsonResponse(
      {
        status: 'donation_eligibility_failed',
        reasons: ['donation_eligibility_repository_unavailable'],
      },
      { status: 502 },
    );
  }

  const eligibilityReasons = validateDonationEligibility(
    eligibilityContext,
    validation.data,
    provider,
  );

  if (eligibilityReasons.length > 0) {
    return jsonResponse(
      { status: 'donation_not_eligible', reasons: eligibilityReasons },
      { status: 409 },
    );
  }

  // 8. Derive tier and create donation
  // paymentConfig is guaranteed non-null here (payment_config_not_found would have rejected)
  const paymentConfig = eligibilityContext.paymentConfig!;

  if (paymentConfig.tier === 'automated') {
    const activeProvider = paymentConfig.activeProvider;

    if (!paymentReferenceFactory || !activeProvider) {
      return jsonResponse(
        { status: 'provider_credentials_unavailable' },
        { status: 503 },
      );
    }

    // Create the donation row first (status: pending_payment)
    const donationResult = await donationRepository.createDonation({
      donorUserId: actor.id,
      shelterId: validation.data.shelterId,
      petId: validation.data.petId,
      kind: validation.data.kind,
      amountCents: validation.data.amountCents,
      paymentMethod: validation.data.paymentMethod,
      provider: activeProvider,
      initialStatus: 'pending_payment',
      anonymous: validation.data.anonymous,
      donorDisplayName: validation.data.donorDisplayName,
      donorEmail: validation.data.donorEmail,
      publicMessage: validation.data.publicMessage,
      createdAt: now(),
    });

    const refResult = await paymentReferenceFactory.createReference({
      donationId: donationResult.donationId,
      amountCents: validation.data.amountCents,
      currency: 'EUR',
      shelterId: validation.data.shelterId,
      orderId: donationResult.donationId,
    });

    if (!refResult.ok) {
      await donationRepository.failDonation?.(donationResult.donationId).catch(() => {});
      return jsonResponse({ status: 'payment_reference_failed' }, { status: 502 });
    }

    await donationRepository
      .setProviderPaymentId?.(donationResult.donationId, refResult.providerPaymentId)
      .catch(async () => {
        await donationRepository.failDonation?.(donationResult.donationId).catch(() => {});
      });

    return jsonResponse(
      {
        status: 'donation_created',
        donationId: donationResult.donationId,
        tier: 'automated',
        provider: activeProvider,
        reference: refResult.reference,
      },
      { status: 201 },
    );
  }

  // Manual tier
  const result = await donationRepository.createDonation({
    donorUserId: actor.id,
    shelterId: validation.data.shelterId,
    petId: validation.data.petId,
    kind: validation.data.kind,
    amountCents: validation.data.amountCents,
    paymentMethod: validation.data.paymentMethod,
    provider,
    initialStatus: 'pending_receipt',
    anonymous: validation.data.anonymous,
    donorDisplayName: validation.data.donorDisplayName,
    donorEmail: validation.data.donorEmail,
    publicMessage: validation.data.publicMessage,
    createdAt: now(),
  });

  return jsonResponse(
    {
      status: 'donation_created',
      donationId: result.donationId,
      amountCents: validation.data.amountCents,
      currency: 'EUR',
      kind: validation.data.kind,
      shelterId: validation.data.shelterId,
      createdAt: result.createdAt,
      tier: paymentConfig.tier,
      iban: paymentConfig.iban,
      mbWayPhone: paymentConfig.mbWayPhone,
    },
    { status: 201 },
  );
};
