import type { ShelterKind, ShelterVerificationStatus } from './shelter-profile';

export type PublicShelterSummary = {
  id: string;
  name: string;
  slug: string;
  kind: ShelterKind;
  verificationStatus: ShelterVerificationStatus;
  city: string;
  district: string | null;
  countryCode: string;
  logoMediaId: string | null;
};

export type ShelterSearchQuery = {
  limit: number;
  offset: number;
  kind?: ShelterKind | null;
};

export type ShelterSearchResult = {
  shelters: PublicShelterSummary[];
  total: number;
};

export type ShelterSearchRepository = {
  searchShelters: (query: ShelterSearchQuery) => Promise<ShelterSearchResult>;
};

// ─── Query param parsers ──────────────────────────────────────────────────────

const KNOWN_KINDS: ShelterKind[] = ['shelter', 'sanctuary', 'association', 'foster_network'];

const parseKind = (value: string | null): ShelterKind | null => {
  if (!value) return null;
  return KNOWN_KINDS.includes(value as ShelterKind) ? (value as ShelterKind) : null;
};

const parseLimit = (value: string | null): number => {
  if (!value) return 20;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return 20;
  return Math.min(Math.max(parsed, 1), 50);
};

const parseOffset = (value: string | null): number => {
  if (!value) return 0;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

// ─── Handler ──────────────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

export const handleWorkerShelterSearchRequest = async ({
  request,
  shelterSearchRepository,
}: {
  request: Request;
  shelterSearchRepository?: ShelterSearchRepository;
}): Promise<Response> => {
  if (request.method !== 'GET') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET'] },
      { status: 405, headers: { Allow: 'GET' } },
    );
  }

  if (!shelterSearchRepository) {
    return jsonResponse(
      { status: 'shelter_search_repository_not_configured' },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const query: ShelterSearchQuery = {
    limit: parseLimit(url.searchParams.get('limit')),
    offset: parseOffset(url.searchParams.get('offset')),
    kind: parseKind(url.searchParams.get('kind')),
  };

  const result = await shelterSearchRepository.searchShelters(query);

  return jsonResponse({ status: 'ok', shelters: result.shelters, total: result.total });
};
