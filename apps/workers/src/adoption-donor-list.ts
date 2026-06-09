import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { AdoptionApplicationStatus } from './adoption-list';

export type AdoptionDonorListSummary = {
  applicationId: string;
  petId: string;
  shelterId: string;
  status: AdoptionApplicationStatus;
  submittedAt: string | null;
};

export type ListDonorAdoptionsQuery = {
  donorUserId: string;
  limit?: number;
  offset?: number;
};

export type ListDonorAdoptionsResult = {
  applications: AdoptionDonorListSummary[];
  total: number;
};

export type AdoptionDonorListRepository = {
  listDonorAdoptions: (query: ListDonorAdoptionsQuery) => Promise<ListDonorAdoptionsResult>;
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

export type HandleWorkerAdoptionDonorListRequestInput = {
  request: Request;
  adoptionDonorListRepository?: AdoptionDonorListRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerAdoptionDonorListRequest = async ({
  request,
  adoptionDonorListRepository,
  authenticator,
}: HandleWorkerAdoptionDonorListRequestInput): Promise<Response> => {
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
  if (!adoptionDonorListRepository) {
    return jsonResponse(
      { status: 'adoption_donor_list_repository_not_configured' },
      { status: 501 },
    );
  }

  // 5. Parse pagination
  const url = new URL(request.url);
  const limit = parseLimitParam(url.searchParams.get('limit'));
  const offset = parseOffsetParam(url.searchParams.get('offset'));

  // 6. List donor's own adoptions
  const result = await adoptionDonorListRepository.listDonorAdoptions({
    donorUserId: actor.id,
    limit,
    offset,
  });

  return jsonResponse(
    { status: 'ok', applications: result.applications, total: result.total },
    { status: 200 },
  );
};
