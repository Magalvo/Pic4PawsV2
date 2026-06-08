import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { SponsorshipListSummary } from './sponsorship-list';

export type ListDonorSponsorshipsQuery = {
  donorUserId: string;
  limit?: number;
  offset?: number;
};

export type ListDonorSponsorshipsResult = {
  sponsorships: SponsorshipListSummary[];
  total: number;
};

export type SponsorshipDonorListRepository = {
  listDonorSponsorships: (query: ListDonorSponsorshipsQuery) => Promise<ListDonorSponsorshipsResult>;
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

export type HandleWorkerSponsorshipDonorListRequestInput = {
  request: Request;
  sponsorshipDonorListRepository?: SponsorshipDonorListRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerSponsorshipDonorListRequest = async ({
  request,
  sponsorshipDonorListRepository,
  authenticator,
}: HandleWorkerSponsorshipDonorListRequestInput): Promise<Response> => {
  // 1. Bearer token
  const bearerToken = extractBearerToken(request);
  if (!bearerToken) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  // 2. Authenticator configured
  if (!authenticator) {
    return jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 });
  }

  // 3. Authenticate
  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await authenticator({ request, authorizationHeader, bearerToken });
  if (!actor) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  // 4. Repository configured
  if (!sponsorshipDonorListRepository) {
    return jsonResponse(
      { status: 'sponsorship_donor_list_repository_not_configured' },
      { status: 501 },
    );
  }

  // 5. Parse pagination
  const url = new URL(request.url);
  const limit = parseLimitParam(url.searchParams.get('limit'));
  const offset = parseOffsetParam(url.searchParams.get('offset'));

  // 6. List donor's own sponsorships
  const result = await sponsorshipDonorListRepository.listDonorSponsorships({
    donorUserId: actor.id,
    limit,
    offset,
  });

  return jsonResponse(
    { status: 'ok', sponsorships: result.sponsorships, total: result.total },
    { status: 200 },
  );
};
