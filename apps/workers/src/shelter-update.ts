import { canManageShelter } from '@pic4paws/domain';
import type { ShelterKind } from './shelter-profile';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';

export { type ShelterKind } from './shelter-profile';

const KNOWN_SHELTER_KINDS: ShelterKind[] = [
  'shelter',
  'sanctuary',
  'association',
  'foster_network',
];

export type ShelterUpdateInput = {
  name?: string;
  kind?: ShelterKind;
  city?: string;
  district?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type ShelterUpdateRepository = {
  updateShelter: (
    shelterId: string,
    input: ShelterUpdateInput,
    actorUserId: string,
  ) => Promise<{ shelterId: string } | null>;
};

// ─── Payload validation ───────────────────────────────────────────────────────

type ValidateShelterUpdateResult =
  | { valid: true; input: ShelterUpdateInput }
  | { valid: false; reasons: string[] };

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

const parseCoordinate = (
  value: unknown,
  min: number,
  max: number,
): { valid: true; value: number | null } | { valid: false } => {
  if (value === null) return { valid: true, value: null };
  if (typeof value === 'string' && value.trim().length === 0) {
    return { valid: true, value: null };
  }

  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : NaN;

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return { valid: false };
  }

  return { valid: true, value: parsed };
};

export const validateShelterUpdatePayload = (body: unknown): ValidateShelterUpdateResult => {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, reasons: ['invalid_body'] };
  }

  const b = body as Record<string, unknown>;
  const reasons: string[] = [];
  const input: ShelterUpdateInput = {};

  if ('name' in b) {
    if (!isNonEmptyString(b.name)) {
      reasons.push('name_invalid');
    } else {
      input.name = b.name.trim();
    }
  }

  if ('kind' in b) {
    if (!KNOWN_SHELTER_KINDS.includes(b.kind as ShelterKind)) {
      reasons.push('kind_invalid');
    } else {
      input.kind = b.kind as ShelterKind;
    }
  }

  if ('city' in b) {
    if (!isNonEmptyString(b.city)) {
      reasons.push('city_invalid');
    } else {
      input.city = (b.city as string).trim();
    }
  }

  if ('district' in b) {
    input.district = isNonEmptyString(b.district) ? (b.district as string).trim() : null;
  }

  if ('publicEmail' in b) {
    input.publicEmail = isNonEmptyString(b.publicEmail) ? (b.publicEmail as string).trim() : null;
  }

  if ('publicPhone' in b) {
    input.publicPhone = isNonEmptyString(b.publicPhone) ? (b.publicPhone as string).trim() : null;
  }

  if ('description' in b) {
    input.description = isNonEmptyString(b.description) ? (b.description as string).trim() : null;
  }

  if ('latitude' in b) {
    const latitude = parseCoordinate(b.latitude, -90, 90);
    if (!latitude.valid) {
      reasons.push('latitude_invalid');
    } else {
      input.latitude = latitude.value;
    }
  }

  if ('longitude' in b) {
    const longitude = parseCoordinate(b.longitude, -180, 180);
    if (!longitude.valid) {
      reasons.push('longitude_invalid');
    } else {
      input.longitude = longitude.value;
    }
  }

  if (reasons.length > 0) return { valid: false, reasons };

  if (Object.keys(input).length === 0) {
    return { valid: false, reasons: ['no_fields_provided'] };
  }

  return { valid: true, input };
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

export type HandleWorkerShelterUpdateRequestInput = {
  request: Request;
  shelterId: string;
  payload: unknown;
  shelterUpdateRepository?: ShelterUpdateRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerShelterUpdateRequest = async ({
  request,
  shelterId,
  payload,
  shelterUpdateRepository,
  authenticator,
}: HandleWorkerShelterUpdateRequestInput): Promise<Response> => {
  if (request.method !== 'PATCH') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['PATCH'] },
      { status: 405, headers: { Allow: 'PATCH' } },
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

  if (!canManageShelter(actor, shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  const validation = validateShelterUpdatePayload(payload);
  if (!validation.valid) {
    return jsonResponse({ status: 'invalid_payload', reasons: validation.reasons }, { status: 400 });
  }

  if (!shelterUpdateRepository) {
    return jsonResponse({ status: 'shelter_update_repository_not_configured' }, { status: 501 });
  }

  const result = await shelterUpdateRepository.updateShelter(shelterId, validation.input, actor.id);

  if (!result) {
    return jsonResponse({ status: 'shelter_not_found' }, { status: 404 });
  }

  return jsonResponse({ status: 'updated', shelterId: result.shelterId }, { status: 200 });
};
