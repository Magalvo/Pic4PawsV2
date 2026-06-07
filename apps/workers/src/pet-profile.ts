import type { PetLifecycleSpecies, PublicPetMedicalStatus } from '@pic4paws/domain';

export type PublishedPetProfile = {
  id: string;
  shelterId: string;
  name: string | null;
  species: PetLifecycleSpecies | null;
  locationLabel: string | null;
  shortDescription: string | null;
  heroMediaId: string | null;
  mediaIds: string[];
  publishedAt: string;
  medical: PublicPetMedicalStatus;
};

export type PetProfileQuery = { petId: string };

export type PetProfileRepository = {
  loadPublishedPet: (query: PetProfileQuery) => Promise<PublishedPetProfile | null>;
};

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

/**
 * Returns the petId segment from a URL pathname of the form `{petFeedPath}/{petId}`,
 * or null if the path does not match that exact single-segment pattern.
 *
 * Examples (petFeedPath = '/pets'):
 *   /pets/abc123           → 'abc123'
 *   /pets/abc123/extra     → null  (too many segments)
 *   /pets                  → null  (no segment — that is the feed)
 *   /other/abc123          → null  (wrong prefix)
 */
export const matchWorkerPetProfileId = (
  pathname: string,
  petFeedPath: string,
): string | null => {
  const prefix = petFeedPath.endsWith('/') ? petFeedPath : `${petFeedPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);

  if (!rest || rest.includes('/')) return null;

  return rest;
};

export const handleWorkerPetProfileRequest = async ({
  request,
  petId,
  petProfileRepository,
}: {
  request: Request;
  petId: string;
  petProfileRepository?: PetProfileRepository;
}): Promise<Response> => {
  if (request.method !== 'GET') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET'] },
      { status: 405, headers: { Allow: 'GET' } },
    );
  }

  if (!petProfileRepository) {
    return jsonResponse({ status: 'pet_profile_repository_not_configured' }, { status: 501 });
  }

  const pet = await petProfileRepository.loadPublishedPet({ petId });

  if (!pet) {
    return jsonResponse({ status: 'pet_not_found' }, { status: 404 });
  }

  return jsonResponse({ status: 'ok', pet });
};
