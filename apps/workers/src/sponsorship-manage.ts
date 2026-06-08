import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { SponsorshipStatus } from './sponsorship-list';

// ─── Repository types ─────────────────────────────────────────────────────────

export type GetSponsorshipForManageResult = {
  sponsorshipId: string;
  shelterId: string;
  donorUserId: string;
  currentStatus: SponsorshipStatus;
};

export type UpdateSponsorshipStatusInput = {
  sponsorshipId: string;
  status: SponsorshipStatus;
};

export type SponsorshipManageRepository = {
  getSponsorshipForManage: (
    sponsorshipId: string,
  ) => Promise<GetSponsorshipForManageResult | null>;
  updateSponsorshipStatus: (input: UpdateSponsorshipStatusInput) => Promise<void>;
};

// ─── Path matcher ─────────────────────────────────────────────────────────────

/**
 * Extracts sponsorshipId from `{sponsorshipsPath}/{sponsorshipId}`.
 * Returns null for any non-matching path (exact path, too many segments, wrong prefix).
 *
 * Examples (sponsorshipsPath = '/sponsorships'):
 *   /sponsorships/abc-123         → 'abc-123'
 *   /sponsorships                 → null  (no segment — that is the create endpoint)
 *   /sponsorships/abc/extra       → null  (too many segments)
 *   /donations/abc-123            → null  (wrong prefix)
 *   /sponsorships/                → null  (empty segment)
 */
export const matchWorkerSponsorshipManageId = (
  pathname: string,
  sponsorshipsPath: string,
): string | null => {
  const prefix = sponsorshipsPath.endsWith('/') ? sponsorshipsPath : `${sponsorshipsPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);

  if (!rest || rest.includes('/')) return null;

  return rest;
};

// ─── Payload validation ───────────────────────────────────────────────────────

const MANAGE_STATUSES: SponsorshipStatus[] = ['active', 'cancelled', 'paused'];

type ValidatedManagePayload = {
  status: SponsorshipStatus;
};

type ValidateManagePayloadResult =
  | { valid: true; data: ValidatedManagePayload }
  | { valid: false; reasons: string[] };

export const validateSponsorshipManagePayload = (
  payload: unknown,
): ValidateManagePayloadResult => {
  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, reasons: ['payload_must_be_object'] };
  }

  const p = payload as Record<string, unknown>;
  const reasons: string[] = [];

  if (!MANAGE_STATUSES.includes(p['status'] as SponsorshipStatus)) {
    reasons.push('status_invalid');
  }

  if (reasons.length > 0) {
    return { valid: false, reasons };
  }

  return {
    valid: true,
    data: { status: p['status'] as SponsorshipStatus },
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

export type HandleWorkerSponsorshipManageRequestInput = {
  request: Request;
  sponsorshipId: string;
  payload: unknown;
  sponsorshipManageRepository?: SponsorshipManageRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerSponsorshipManageRequest = async ({
  request,
  sponsorshipId,
  payload,
  sponsorshipManageRepository,
  authenticator,
}: HandleWorkerSponsorshipManageRequestInput): Promise<Response> => {
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
  if (!sponsorshipManageRepository) {
    return jsonResponse(
      { status: 'sponsorship_manage_repository_not_configured' },
      { status: 501 },
    );
  }

  // 6. Validate payload
  const validation = validateSponsorshipManagePayload(payload);
  if (!validation.valid) {
    return jsonResponse(
      { status: 'invalid_sponsorship_manage', reasons: validation.reasons },
      { status: 400 },
    );
  }

  // 7. Look up sponsorship
  const sponsorship = await sponsorshipManageRepository.getSponsorshipForManage(sponsorshipId);
  if (!sponsorship) {
    return jsonResponse({ status: 'sponsorship_not_found' }, { status: 404 });
  }

  // 8. Access control: shelter manager OR original donor
  const isShelterManager = canManageShelter(actor, sponsorship.shelterId);
  const isDonor = actor.id === sponsorship.donorUserId;

  if (!isShelterManager && !isDonor) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  // 9. Update status
  await sponsorshipManageRepository.updateSponsorshipStatus({
    sponsorshipId,
    status: validation.data.status,
  });

  // 10. Success
  return jsonResponse(
    {
      status: 'ok',
      sponsorshipId,
      newStatus: validation.data.status,
    },
    { status: 200 },
  );
};
