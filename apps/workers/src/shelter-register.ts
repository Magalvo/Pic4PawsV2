import type { ShelterKind } from './shelter-profile';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';

export { type ShelterKind } from './shelter-profile';

export const KNOWN_SHELTER_KINDS: ShelterKind[] = [
  'shelter',
  'sanctuary',
  'association',
  'foster_network',
];

export type ShelterRegistrationInput = {
  name: string;
  kind: ShelterKind;
  city: string;
  publicEmail: string | null;
  publicPhone: string | null;
  description: string | null;
  district: string | null;
};

export type ShelterRegistrationRepository = {
  registerShelter: (
    input: ShelterRegistrationInput,
    actorUserId: string,
  ) => Promise<{ shelterId: string }>;
};

// ─── Payload validation ───────────────────────────────────────────────────────

type ValidateShelterPayloadResult =
  | { valid: true; input: ShelterRegistrationInput }
  | { valid: false; reasons: string[] };

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

export const validateShelterRegistrationPayload = (
  body: unknown,
): ValidateShelterPayloadResult => {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, reasons: ['invalid_body'] };
  }

  const b = body as Record<string, unknown>;
  const reasons: string[] = [];

  if (!isNonEmptyString(b.name)) reasons.push('name_required');
  if (!isNonEmptyString(b.city)) reasons.push('city_required');
  if (!KNOWN_SHELTER_KINDS.includes(b.kind as ShelterKind)) reasons.push('kind_invalid');

  if (reasons.length > 0) return { valid: false, reasons };

  return {
    valid: true,
    input: {
      name: (b.name as string).trim(),
      kind: b.kind as ShelterKind,
      city: (b.city as string).trim(),
      publicEmail: isNonEmptyString(b.publicEmail) ? b.publicEmail.trim() : null,
      publicPhone: isNonEmptyString(b.publicPhone) ? b.publicPhone.trim() : null,
      description: isNonEmptyString(b.description) ? b.description.trim() : null,
      district: isNonEmptyString(b.district) ? b.district.trim() : null,
    },
  };
};

// ─── Handler ─────────────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

export type HandleWorkerShelterRegistrationRequestInput = {
  request: Request;
  payload: unknown;
  shelterRegistrationRepository?: ShelterRegistrationRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerShelterRegistrationRequest = async ({
  request,
  payload,
  shelterRegistrationRepository,
  authenticator,
}: HandleWorkerShelterRegistrationRequestInput): Promise<Response> => {
  if (request.method !== 'POST') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['POST'] },
      { status: 405, headers: { Allow: 'POST' } },
    );
  }

  const bearerToken = extractBearerToken(request);
  if (!bearerToken) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  if (!authenticator) {
    return jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 });
  }

  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await authenticator({ request, authorizationHeader, bearerToken });
  if (!actor) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  const validation = validateShelterRegistrationPayload(payload);
  if (!validation.valid) {
    return jsonResponse({ status: 'invalid_payload', reasons: validation.reasons }, { status: 400 });
  }

  if (!shelterRegistrationRepository) {
    return jsonResponse(
      { status: 'shelter_registration_repository_not_configured' },
      { status: 501 },
    );
  }

  const result = await shelterRegistrationRepository.registerShelter(
    validation.input,
    actor.id,
  );

  return jsonResponse({ status: 'created', shelterId: result.shelterId }, { status: 201 });
};
