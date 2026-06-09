import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { AdoptionApplicationStatus } from './adoption-list';
import type { NotificationRepository } from './notification';

// ─── Repository types ─────────────────────────────────────────────────────────

export type AdoptionStatusRecord = {
  applicationId: string;
  shelterId: string;
  currentStatus: AdoptionApplicationStatus;
  applicantUserId: string;
};

export type UpdateAdoptionStatusInput = {
  applicationId: string;
  status: AdoptionApplicationStatus;
};

export type AdoptionStatusRepository = {
  getAdoptionForStatus: (applicationId: string) => Promise<AdoptionStatusRecord | null>;
  updateAdoptionStatus: (input: UpdateAdoptionStatusInput) => Promise<void>;
};

// ─── Path matcher ─────────────────────────────────────────────────────────────

/**
 * Extracts applicationId from `{adoptionsPath}/{applicationId}`.
 * Returns null for any non-matching path (exact path, too many segments, wrong prefix).
 *
 * Examples (adoptionsPath = '/adoptions'):
 *   /adoptions/abc-123         → 'abc-123'
 *   /adoptions                 → null  (no segment — that is the create endpoint)
 *   /adoptions/abc/extra       → null  (too many segments)
 *   /sponsorships/abc-123      → null  (wrong prefix)
 *   /adoptions/                → null  (empty segment)
 */
export const matchWorkerAdoptionStatusId = (
  pathname: string,
  adoptionsPath: string,
): string | null => {
  const prefix = adoptionsPath.endsWith('/') ? adoptionsPath : `${adoptionsPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);

  if (!rest || rest.includes('/')) return null;

  return rest;
};

// ─── Payload validation ───────────────────────────────────────────────────────

const SHELTER_MANAGE_STATUSES: AdoptionApplicationStatus[] = [
  'under_review',
  'more_info_requested',
  'approved',
  'rejected',
];

type ValidatedAdoptionStatusPayload = {
  status: AdoptionApplicationStatus;
};

type ValidateAdoptionStatusPayloadResult =
  | { valid: true; data: ValidatedAdoptionStatusPayload }
  | { valid: false; reasons: string[] };

export const validateAdoptionStatusPayload = (
  payload: unknown,
): ValidateAdoptionStatusPayloadResult => {
  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, reasons: ['payload_must_be_object'] };
  }

  const p = payload as Record<string, unknown>;
  const reasons: string[] = [];

  if (!SHELTER_MANAGE_STATUSES.includes(p['status'] as AdoptionApplicationStatus)) {
    reasons.push('status_invalid');
  }

  if (reasons.length > 0) {
    return { valid: false, reasons };
  }

  return {
    valid: true,
    data: { status: p['status'] as AdoptionApplicationStatus },
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

export type HandleWorkerAdoptionStatusRequestInput = {
  request: Request;
  applicationId: string;
  payload: unknown;
  adoptionStatusRepository?: AdoptionStatusRepository;
  authenticator?: WorkerPetDraftAuthenticator;
  notificationRepository?: NotificationRepository;
};

export const handleWorkerAdoptionStatusRequest = async ({
  request,
  applicationId,
  payload,
  adoptionStatusRepository,
  authenticator,
  notificationRepository,
}: HandleWorkerAdoptionStatusRequestInput): Promise<Response> => {
  // 1. Method check
  if (request.method !== 'PATCH') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['PATCH'] },
      { status: 405, headers: { Allow: 'PATCH' } },
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

  // 5. Repository configured
  if (!adoptionStatusRepository) {
    return jsonResponse(
      { status: 'adoption_status_repository_not_configured' },
      { status: 501 },
    );
  }

  // 6. Validate payload
  const validation = validateAdoptionStatusPayload(payload);
  if (!validation.valid) {
    return jsonResponse(
      { status: 'invalid_adoption_status', reasons: validation.reasons },
      { status: 400 },
    );
  }

  // 7. Look up adoption
  const adoption = await adoptionStatusRepository.getAdoptionForStatus(applicationId);
  if (!adoption) {
    return jsonResponse({ status: 'adoption_not_found' }, { status: 404 });
  }

  // 8. Access control: shelter membership only
  if (!canManageShelter(actor, adoption.shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  // 9. Update status
  await adoptionStatusRepository.updateAdoptionStatus({
    applicationId,
    status: validation.data.status,
  });

  // 10. Dispatch notification (fire-and-forget)
  if (notificationRepository) {
    notificationRepository
      .notifyAdoptionStatusChanged({
        applicantUserId: adoption.applicantUserId,
        applicationId,
        newStatus: validation.data.status,
      })
      .catch(() => undefined);
  }

  // 11. Success
  return jsonResponse(
    {
      status: 'ok',
      applicationId,
      newStatus: validation.data.status,
    },
    { status: 200 },
  );
};
