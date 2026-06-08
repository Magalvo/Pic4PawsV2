import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { DonationPaymentMethod, DonationProvider } from './donation';

export type SponsorshipRecurringInterval = 'monthly' | 'quarterly' | 'annual';

export type CreateSponsorshipInput = {
  donorUserId: string;
  shelterId: string;
  petId: string | null;
  amountCents: number;
  currency: string;
  paymentMethod: DonationPaymentMethod;
  recurringInterval: SponsorshipRecurringInterval;
  provider: DonationProvider;
  createdAt: string;
};

export type CreateSponsorshipResult = {
  sponsorshipId: string;
  createdAt: string;
};

export type SponsorshipRepository = {
  createSponsorship: (input: CreateSponsorshipInput) => Promise<CreateSponsorshipResult>;
};

// ─── Payload validation ───────────────────────────────────────────────────────

type ValidatedSponsorshipPayload = {
  shelterId: string;
  amountCents: number;
  paymentMethod: DonationPaymentMethod;
  recurringInterval: SponsorshipRecurringInterval;
  petId: string | null;
  dataProcessingAccepted: true;
};

type ValidateSponsorshipPayloadResult =
  | { valid: true; data: ValidatedSponsorshipPayload }
  | { valid: false; reasons: string[] };

const PAYMENT_METHODS: DonationPaymentMethod[] = [
  'mb_way',
  'multibanco',
  'card',
  'bank_transfer',
  'unknown',
];

const RECURRING_INTERVALS: SponsorshipRecurringInterval[] = [
  'monthly',
  'quarterly',
  'annual',
];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

export const validateSponsorshipPayload = (
  payload: unknown,
): ValidateSponsorshipPayloadResult => {
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
  if (!PAYMENT_METHODS.includes(p['paymentMethod'] as DonationPaymentMethod))
    reasons.push('payment_method_invalid');
  if (!RECURRING_INTERVALS.includes(p['recurringInterval'] as SponsorshipRecurringInterval))
    reasons.push('recurring_interval_invalid');
  if (p['dataProcessingAccepted'] !== true) reasons.push('data_processing_consent_required');

  // Optional nullable field — only validate if present and wrong type
  if (!isNullableString(p['petId'])) reasons.push('pet_id_invalid');

  if (reasons.length > 0) {
    return { valid: false, reasons };
  }

  return {
    valid: true,
    data: {
      shelterId: p['shelterId'] as string,
      amountCents: p['amountCents'] as number,
      paymentMethod: p['paymentMethod'] as DonationPaymentMethod,
      recurringInterval: p['recurringInterval'] as SponsorshipRecurringInterval,
      petId: (p['petId'] as string | null) ?? null,
      dataProcessingAccepted: true,
    },
  };
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

export type HandleWorkerSponsorshipRequestInput = {
  request: Request;
  payload: unknown;
  sponsorshipRepository?: SponsorshipRepository;
  authenticator?: WorkerPetDraftAuthenticator;
  provider: DonationProvider;
  now: string;
};

export const handleWorkerSponsorshipRequest = async ({
  request,
  payload,
  sponsorshipRepository,
  authenticator,
  provider,
  now,
}: HandleWorkerSponsorshipRequestInput): Promise<Response> => {
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
  const validation = validateSponsorshipPayload(payload);
  if (!validation.valid) {
    return jsonResponse(
      { status: 'invalid_sponsorship', reasons: validation.reasons },
      { status: 400 },
    );
  }

  // 6. Repository check
  if (!sponsorshipRepository) {
    return jsonResponse({ status: 'sponsorship_repository_not_configured' }, { status: 501 });
  }

  // 7. Create sponsorship
  const result = await sponsorshipRepository.createSponsorship({
    donorUserId: actor.id,
    shelterId: validation.data.shelterId,
    petId: validation.data.petId,
    amountCents: validation.data.amountCents,
    currency: 'EUR',
    paymentMethod: validation.data.paymentMethod,
    recurringInterval: validation.data.recurringInterval,
    provider,
    createdAt: now,
  });

  return jsonResponse(
    {
      status: 'sponsorship_created',
      sponsorshipId: result.sponsorshipId,
      amountCents: validation.data.amountCents,
      currency: 'EUR',
      recurringInterval: validation.data.recurringInterval,
      shelterId: validation.data.shelterId,
      createdAt: result.createdAt,
    },
    { status: 201 },
  );
};
