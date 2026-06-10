import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { DonationStatus } from './donation-list';
import type { SponsorshipStatus } from './sponsorship-list';

export type { DonationStatus, SponsorshipStatus };

export type FinancialsDonationBreakdown = {
  status: DonationStatus;
  count: number;
  totalCents: number;
};

export type FinancialsSummary = {
  shelterId: string;
  currency: string;
  donations: {
    count: number;
    paidTotalCents: number;
    byStatus: FinancialsDonationBreakdown[];
  };
  sponsorships: {
    activeCount: number;
    pausedCount: number;
    cancelledCount: number;
    activeTotalCents: number;
  };
};

export type GetFinancialsResult = FinancialsSummary;

export type FinancialsRepository = {
  getFinancials: (shelterId: string) => Promise<GetFinancialsResult>;
};

// ─── Path matcher ─────────────────────────────────────────────────────────────

/**
 * Extracts shelterId from `{shelterPath}/{shelterId}/financials`.
 * Returns null for any non-matching path.
 *
 * Examples (shelterPath = '/shelters'):
 *   /shelters/abc123/financials        → 'abc123'
 *   /shelters/abc123                   → null  (no /financials suffix)
 *   /shelters/abc123/financials/extra  → null  (extra segment)
 *   /shelters/abc/def/financials       → null  (shelterId contains /)
 *   /shelters                          → null  (no segment)
 *   /other/abc123/financials           → null  (wrong prefix)
 */
export const matchWorkerFinancialsShelterId = (
  pathname: string,
  shelterPath: string,
): string | null => {
  const prefix = shelterPath.endsWith('/') ? shelterPath : `${shelterPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);
  const suffix = '/financials';

  if (!rest.endsWith(suffix)) return null;

  const shelterId = rest.slice(0, rest.length - suffix.length);

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

export type HandleWorkerFinancialsRequestInput = {
  request: Request;
  shelterId: string;
  financialsRepository?: FinancialsRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerFinancialsRequest = async ({
  request,
  shelterId,
  financialsRepository,
  authenticator,
}: HandleWorkerFinancialsRequestInput): Promise<Response> => {
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

  if (!financialsRepository) {
    return jsonResponse({ status: 'financials_repository_not_configured' }, { status: 501 });
  }

  const summary = await financialsRepository.getFinancials(shelterId);

  return jsonResponse(
    {
      status: 'ok',
      shelterId: summary.shelterId,
      currency: summary.currency,
      donations: summary.donations,
      sponsorships: summary.sponsorships,
    },
    { status: 200 },
  );
};
