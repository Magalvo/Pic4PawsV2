import { canManageShelter } from '@pic4paws/domain';
import type { PetLifecycleSpecies } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';

export type ShelterPetStatus =
  | 'draft'
  | 'published'
  | 'adoption_pending'
  | 'adopted'
  | 'not_available'
  | 'archived';

export type ShelterPetSummary = {
  petId: string;
  name: string | null;
  species: PetLifecycleSpecies | null;
  status: ShelterPetStatus;
  heroMediaId: string | null;
  locationLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListShelterPetsQuery = {
  shelterId: string;
  limit?: number;
  offset?: number;
};

export type ListShelterPetsResult = {
  pets: ShelterPetSummary[];
  total: number;
};

export type ShelterPetListRepository = {
  listPets: (query: ListShelterPetsQuery) => Promise<ListShelterPetsResult>;
};

// ─── Path matcher ─────────────────────────────────────────────────────────────

/**
 * Extracts shelterId from `{shelterPath}/{shelterId}/pets`.
 * Returns null for any non-matching path.
 *
 * Examples (shelterPath = '/shelters'):
 *   /shelters/abc123/pets            → 'abc123'
 *   /shelters/abc123                 → null  (no /pets suffix)
 *   /shelters/abc123/pets/extra      → null  (extra segment after /pets)
 *   /shelters/abc/def/pets           → null  (shelterId contains /)
 *   /shelters                        → null  (no segment)
 *   /other/abc123/pets               → null  (wrong prefix)
 */
export const matchWorkerShelterPetsShelterId = (
  pathname: string,
  shelterPath: string,
): string | null => {
  const prefix = shelterPath.endsWith('/') ? shelterPath : `${shelterPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);
  const suffix = '/pets';

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

export type HandleWorkerShelterPetListRequestInput = {
  request: Request;
  shelterId: string;
  shelterPetListRepository?: ShelterPetListRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerShelterPetListRequest = async ({
  request,
  shelterId,
  shelterPetListRepository,
  authenticator,
}: HandleWorkerShelterPetListRequestInput): Promise<Response> => {
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

  if (!shelterPetListRepository) {
    return jsonResponse({ status: 'shelter_pet_list_repository_not_configured' }, { status: 501 });
  }

  const url = new URL(request.url);
  const limit = parseLimitParam(url.searchParams.get('limit'));
  const offset = parseOffsetParam(url.searchParams.get('offset'));

  const result = await shelterPetListRepository.listPets({ shelterId, limit, offset });

  return jsonResponse(
    { status: 'ok', pets: result.pets, total: result.total },
    { status: 200 },
  );
};
