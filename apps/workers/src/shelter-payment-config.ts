import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShelterPaymentConfigInput = {
  iban: string;
  mbWayPhone: string | null;
};

export type ShelterPaymentConfigRecord = {
  tier: 'manual';
  iban: string | null;
  mbWayPhone: string | null;
};

export type ShelterPaymentConfigRepository = {
  getPaymentConfig: (shelterId: string) => Promise<ShelterPaymentConfigRecord | null>;
  savePaymentConfig: (shelterId: string, input: ShelterPaymentConfigInput) => Promise<void>;
};

// ─── Validation ───────────────────────────────────────────────────────────────

type ValidatePaymentConfigResult =
  | { valid: true; input: ShelterPaymentConfigInput }
  | { valid: false; reasons: string[] };

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

export const validatePaymentConfigPayload = (body: unknown): ValidatePaymentConfigResult => {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, reasons: ['invalid_body'] };
  }

  const b = body as Record<string, unknown>;
  const reasons: string[] = [];

  if (!isNonEmptyString(b.iban)) {
    reasons.push('iban_required');
  }

  if (reasons.length > 0) return { valid: false, reasons };

  const iban = (b.iban as string).trim().toUpperCase();
  const mbWayPhone =
    typeof b.mbWayPhone === 'string' && b.mbWayPhone.trim().length > 0
      ? b.mbWayPhone.trim()
      : null;

  return { valid: true, input: { iban, mbWayPhone } };
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

// ─── GET handler ──────────────────────────────────────────────────────────────

export type HandleGetPaymentConfigRequestInput = {
  request: Request;
  shelterId: string;
  repository?: ShelterPaymentConfigRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleGetPaymentConfigRequest = async ({
  request,
  shelterId,
  repository,
  authenticator,
}: HandleGetPaymentConfigRequestInput): Promise<Response> => {
  if (request.method !== 'GET') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET'] },
      { status: 405, headers: { Allow: 'GET' } },
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

  if (!repository) {
    return jsonResponse({ status: 'payment_config_repository_not_configured' }, { status: 501 });
  }

  const record = await repository.getPaymentConfig(shelterId);

  if (!record) {
    return jsonResponse({ status: 'ok', configured: false }, { status: 200 });
  }

  return jsonResponse(
    { status: 'ok', configured: true, tier: record.tier, iban: record.iban, mbWayPhone: record.mbWayPhone },
    { status: 200 },
  );
};

// ─── POST handler ─────────────────────────────────────────────────────────────

export type HandleSavePaymentConfigRequestInput = {
  request: Request;
  payload: unknown;
  shelterId: string;
  repository?: ShelterPaymentConfigRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleSavePaymentConfigRequest = async ({
  request,
  payload,
  shelterId,
  repository,
  authenticator,
}: HandleSavePaymentConfigRequestInput): Promise<Response> => {
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

  if (!canManageShelter(actor, shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  const validation = validatePaymentConfigPayload(payload);
  if (!validation.valid) {
    return jsonResponse({ status: 'invalid_config', reasons: validation.reasons }, { status: 400 });
  }

  if (!repository) {
    return jsonResponse({ status: 'payment_config_repository_not_configured' }, { status: 501 });
  }

  await repository.savePaymentConfig(shelterId, validation.input);

  return jsonResponse(
    {
      status: 'payment_config_saved',
      tier: 'manual',
      iban: validation.input.iban,
      mbWayPhone: validation.input.mbWayPhone,
    },
    { status: 200 },
  );
};

// ─── Path matcher ─────────────────────────────────────────────────────────────

export const matchWorkerShelterPaymentConfigId = (
  pathname: string,
  shelterPath: string,
): string | null => {
  const prefix = shelterPath.endsWith('/') ? shelterPath : `${shelterPath}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  const parts = rest.split('/');
  if (parts.length === 2 && parts[0] && parts[1] === 'payment-config') {
    return parts[0];
  }
  return null;
};
