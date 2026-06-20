import { canManageShelter, canVerifyShelter } from '@pic4paws/domain';
import type { ShelterVerificationStatus } from './shelter-profile';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';

export { type ShelterVerificationStatus } from './shelter-profile';

export type ShelterVerificationRepository = {
  loadVerificationStatus: (shelterId: string) => Promise<{ currentStatus: ShelterVerificationStatus } | null>;
  updateVerificationStatus: (
    shelterId: string,
    targetStatus: ShelterVerificationStatus,
    actorUserId: string,
  ) => Promise<{ shelterId: string } | null>;
};

// ─── Target status validation ─────────────────────────────────────────────────

type ShelterVerificationTargetStatus = Extract<
  ShelterVerificationStatus,
  'pending_review' | 'verified' | 'rejected' | 'suspended'
>;

const VALID_TARGET_STATUSES: ShelterVerificationTargetStatus[] = [
  'pending_review',
  'verified',
  'rejected',
  'suspended',
];

type ValidateTargetResult =
  | { valid: true; status: ShelterVerificationTargetStatus }
  | { valid: false; reasons: string[] };

const validateTargetStatus = (body: unknown): ValidateTargetResult => {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, reasons: ['invalid_body'] };
  }
  const status = (body as Record<string, unknown>).status;
  if (!VALID_TARGET_STATUSES.includes(status as ShelterVerificationTargetStatus)) {
    return { valid: false, reasons: ['status_invalid'] };
  }
  return { valid: true, status: status as ShelterVerificationTargetStatus };
};

// ─── Transition guard ─────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: [ShelterVerificationStatus, ShelterVerificationTargetStatus][] = [
  ['draft', 'pending_review'],
  ['rejected', 'pending_review'],
  ['pending_review', 'verified'],
  ['pending_review', 'rejected'],
  ['verified', 'suspended'],
  ['suspended', 'verified'],
];

const isAllowedTransition = (
  from: ShelterVerificationStatus,
  to: ShelterVerificationTargetStatus,
): boolean => ALLOWED_TRANSITIONS.some(([f, t]) => f === from && t === to);

// ─── Route matcher ────────────────────────────────────────────────────────────

export const matchWorkerShelterVerificationId = (
  pathname: string,
  shelterPath: string,
): string | null => {
  const prefix = shelterPath.endsWith('/') ? shelterPath : `${shelterPath}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  const parts = rest.split('/');
  const shelterId = parts[0];
  const segment = parts[1];
  if (parts.length === 2 && shelterId && shelterId.length > 0 && segment === 'verification') {
    return shelterId;
  }
  return null;
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

export type HandleWorkerShelterVerifyRequestInput = {
  request: Request;
  shelterId: string;
  payload: unknown;
  shelterVerificationRepository?: ShelterVerificationRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerShelterVerifyRequest = async ({
  request,
  shelterId,
  payload,
  shelterVerificationRepository,
  authenticator,
}: HandleWorkerShelterVerifyRequestInput): Promise<Response> => {
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

  const validation = validateTargetStatus(payload);
  if (!validation.valid) {
    return jsonResponse({ status: 'invalid_payload', reasons: validation.reasons }, { status: 400 });
  }

  const targetStatus = validation.status;

  if (targetStatus === 'pending_review') {
    if (!canManageShelter(actor, shelterId)) {
      return jsonResponse({ status: 'forbidden' }, { status: 403 });
    }
  } else {
    if (!canVerifyShelter(actor)) {
      return jsonResponse({ status: 'forbidden' }, { status: 403 });
    }
  }

  if (!shelterVerificationRepository) {
    return jsonResponse({ status: 'shelter_verification_repository_not_configured' }, { status: 501 });
  }

  const current = await shelterVerificationRepository.loadVerificationStatus(shelterId);
  if (!current) {
    return jsonResponse({ status: 'shelter_not_found' }, { status: 404 });
  }

  if (!isAllowedTransition(current.currentStatus, targetStatus)) {
    return jsonResponse(
      {
        status: 'invalid_transition',
        reasons: [`${current.currentStatus}_to_${targetStatus}_not_allowed`],
      },
      { status: 422 },
    );
  }

  const result = await shelterVerificationRepository.updateVerificationStatus(
    shelterId,
    targetStatus,
    actor.id,
  );

  if (!result) {
    return jsonResponse({ status: 'shelter_not_found' }, { status: 404 });
  }

  return jsonResponse(
    { status: 'updated', shelterId: result.shelterId, verificationStatus: targetStatus },
    { status: 200 },
  );
};
