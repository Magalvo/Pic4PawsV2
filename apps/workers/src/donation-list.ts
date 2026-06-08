import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { DonationKind, DonationPaymentMethod } from './donation';

export type DonationStatus =
  | 'created'
  | 'pending_payment'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type DonationListSummary = {
  donationId: string;
  kind: DonationKind;
  status: DonationStatus;
  amountCents: number;
  currency: string;
  paymentMethod: DonationPaymentMethod;
  anonymous: boolean;
  donorDisplayName: string | null;
  publicMessage: string | null;
  createdAt: string;
};

export type ListDonationsQuery = {
  shelterId: string;
  limit?: number;
  offset?: number;
};

export type ListDonationsResult = {
  donations: DonationListSummary[];
  total: number;
};

export type DonationListRepository = {
  listDonations: (query: ListDonationsQuery) => Promise<ListDonationsResult>;
};

// ─── Path matcher ─────────────────────────────────────────────────────────────

/**
 * Extracts shelterId from `{shelterPath}/{shelterId}/donations`.
 * Returns null for any non-matching path.
 *
 * Examples (shelterPath = '/shelters'):
 *   /shelters/abc123/donations        → 'abc123'
 *   /shelters/abc123                  → null  (no /donations suffix)
 *   /shelters/abc123/donations/extra  → null  (extra segment)
 *   /shelters/abc/def/donations       → null  (shelterId contains /)
 *   /shelters                         → null  (no segment)
 *   /other/abc123/donations           → null  (wrong prefix)
 */
export const matchWorkerDonationListShelterId = (
  pathname: string,
  shelterPath: string,
): string | null => {
  const prefix = shelterPath.endsWith('/') ? shelterPath : `${shelterPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);
  const donationSuffix = '/donations';

  if (!rest.endsWith(donationSuffix)) return null;

  const shelterId = rest.slice(0, rest.length - donationSuffix.length);

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

export type HandleWorkerDonationListRequestInput = {
  request: Request;
  shelterId: string;
  donationListRepository?: DonationListRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerDonationListRequest = async ({
  request,
  shelterId,
  donationListRepository,
  authenticator,
}: HandleWorkerDonationListRequestInput): Promise<Response> => {
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
  if (!donationListRepository) {
    return jsonResponse({ status: 'donation_list_repository_not_configured' }, { status: 501 });
  }

  // 7. Parse pagination
  const url = new URL(request.url);
  const limit = parseLimitParam(url.searchParams.get('limit'));
  const offset = parseOffsetParam(url.searchParams.get('offset'));

  // 8. List donations
  const result = await donationListRepository.listDonations({ shelterId, limit, offset });

  return jsonResponse(
    { status: 'ok', donations: result.donations, total: result.total },
    { status: 200 },
  );
};
