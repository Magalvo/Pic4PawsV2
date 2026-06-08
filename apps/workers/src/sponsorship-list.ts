import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { DonationPaymentMethod } from './donation';
import type { SponsorshipRecurringInterval } from './sponsorship';

export type SponsorshipStatus = 'active' | 'cancelled' | 'paused';

export type SponsorshipListSummary = {
  sponsorshipId: string;
  amountCents: number;
  currency: string;
  paymentMethod: DonationPaymentMethod;
  recurringInterval: SponsorshipRecurringInterval;
  status: SponsorshipStatus;
  petId: string | null;
  createdAt: string;
};

export type ListSponsorshipsQuery = {
  shelterId: string;
  limit?: number;
  offset?: number;
};

export type ListSponsorshipsResult = {
  sponsorships: SponsorshipListSummary[];
  total: number;
};

export type SponsorshipListRepository = {
  listSponsorships: (query: ListSponsorshipsQuery) => Promise<ListSponsorshipsResult>;
};

// ─── Path matcher ─────────────────────────────────────────────────────────────

/**
 * Extracts shelterId from `{shelterPath}/{shelterId}/sponsorships`.
 * Returns null for any non-matching path.
 *
 * Examples (shelterPath = '/shelters'):
 *   /shelters/abc123/sponsorships        → 'abc123'
 *   /shelters/abc123                     → null  (no /sponsorships suffix)
 *   /shelters/abc123/sponsorships/extra  → null  (extra segment)
 *   /shelters/abc/def/sponsorships       → null  (shelterId contains /)
 *   /shelters                            → null  (no segment)
 *   /other/abc123/sponsorships           → null  (wrong prefix)
 */
export const matchWorkerSponsorshipListShelterId = (
  pathname: string,
  shelterPath: string,
): string | null => {
  const prefix = shelterPath.endsWith('/') ? shelterPath : `${shelterPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);
  const sponsorshipSuffix = '/sponsorships';

  if (!rest.endsWith(sponsorshipSuffix)) return null;

  const shelterId = rest.slice(0, rest.length - sponsorshipSuffix.length);

  if (!shelterId || shelterId.includes('/')) return null;

  return shelterId;
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

const parseLimitParam = (raw: string | null): number => {
  if (raw === null) return 20;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed < 1) return 20;
  return Math.min(parsed, 100);
};

const parseOffsetParam = (raw: string | null): number => {
  if (raw === null) return 0;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

export type HandleWorkerSponsorshipListRequestInput = {
  request: Request;
  shelterId: string;
  sponsorshipListRepository?: SponsorshipListRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerSponsorshipListRequest = async ({
  request,
  shelterId,
  sponsorshipListRepository,
  authenticator,
}: HandleWorkerSponsorshipListRequestInput): Promise<Response> => {
  // 1. Method check
  if (request.method !== 'GET') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET'] },
      { status: 405, headers: { Allow: 'GET' } },
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

  // 5. Access control: actor must be shelter member/owner or admin
  if (!canManageShelter(actor, shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  // 6. Repository check
  if (!sponsorshipListRepository) {
    return jsonResponse(
      { status: 'sponsorship_list_repository_not_configured' },
      { status: 501 },
    );
  }

  // 7. Parse pagination
  const url = new URL(request.url);
  const limit = parseLimitParam(url.searchParams.get('limit'));
  const offset = parseOffsetParam(url.searchParams.get('offset'));

  // 8. List sponsorships
  const result = await sponsorshipListRepository.listSponsorships({ shelterId, limit, offset });

  return jsonResponse(
    { status: 'ok', sponsorships: result.sponsorships, total: result.total },
    { status: 200 },
  );
};
