import type { PetLifecycleSpecies } from '@pic4paws/domain';

export type PublishedPetSummary = {
  id: string;
  shelterId: string;
  name: string | null;
  species: PetLifecycleSpecies | null;
  locationLabel: string | null;
  shortDescription: string | null;
  heroMediaId: string | null;
  mediaIds: string[];
  publishedAt: string;
};

export type PetFeedQuery = {
  species?: PetLifecycleSpecies | null;
  limit: number;
  offset: number;
};

export type PetFeedResult = {
  pets: PublishedPetSummary[];
  total: number;
};

export type PetFeedRepository = {
  loadPublishedPets: (query: PetFeedQuery) => Promise<PetFeedResult>;
};

const KNOWN_SPECIES: PetLifecycleSpecies[] = [
  'dog', 'cat', 'horse', 'donkey', 'guinea_pig', 'rabbit', 'bird', 'other',
];

const parseSpecies = (value: string | null): PetLifecycleSpecies | null => {
  if (!value) return null;
  return KNOWN_SPECIES.includes(value as PetLifecycleSpecies)
    ? (value as PetLifecycleSpecies)
    : null;
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

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

export const handleWorkerPetFeedRequest = async ({
  request,
  petFeedRepository,
}: {
  request: Request;
  petFeedRepository?: PetFeedRepository;
}): Promise<Response> => {
  if (request.method !== 'GET') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET'] },
      { status: 405, headers: { Allow: 'GET' } },
    );
  }

  if (!petFeedRepository) {
    return jsonResponse({ status: 'pet_feed_repository_not_configured' }, { status: 501 });
  }

  const url = new URL(request.url);
  const query: PetFeedQuery = {
    species: parseSpecies(url.searchParams.get('species')),
    limit: parseLimit(url.searchParams.get('limit')),
    offset: parseOffset(url.searchParams.get('offset')),
  };

  const result = await petFeedRepository.loadPublishedPets(query);

  return jsonResponse({ status: 'ok', pets: result.pets, total: result.total });
};
