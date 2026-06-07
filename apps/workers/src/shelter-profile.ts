export type ShelterKind = 'shelter' | 'sanctuary' | 'association' | 'foster_network';

export type ShelterVerificationStatus =
  | 'draft'
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'suspended';

export type PublicShelterProfile = {
  id: string;
  name: string;
  slug: string;
  kind: ShelterKind;
  verificationStatus: ShelterVerificationStatus;
  publicEmail: string | null;
  publicPhone: string | null;
  city: string;
  district: string | null;
  countryCode: string;
  description: string | null;
  logoMediaId: string | null;
  coverMediaId: string | null;
};

export type ShelterProfileQuery = { shelterId: string };

export type ShelterProfileRepository = {
  loadShelterProfile: (query: ShelterProfileQuery) => Promise<PublicShelterProfile | null>;
};

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

/**
 * Returns the shelterId segment from a URL pathname of the form `{shelterPath}/{shelterId}`,
 * or null if the path does not match that exact single-segment pattern.
 *
 * Examples (shelterPath = '/shelters'):
 *   /shelters/abc123           → 'abc123'
 *   /shelters/abc123/extra     → null  (too many segments)
 *   /shelters                  → null  (no segment)
 *   /other/abc123              → null  (wrong prefix)
 */
export const matchWorkerShelterProfileId = (
  pathname: string,
  shelterPath: string,
): string | null => {
  const prefix = shelterPath.endsWith('/') ? shelterPath : `${shelterPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);

  if (!rest || rest.includes('/')) return null;

  return rest;
};

export const handleWorkerShelterProfileRequest = async ({
  request,
  shelterId,
  shelterProfileRepository,
}: {
  request: Request;
  shelterId: string;
  shelterProfileRepository?: ShelterProfileRepository;
}): Promise<Response> => {
  if (request.method !== 'GET') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET'] },
      { status: 405, headers: { Allow: 'GET' } },
    );
  }

  if (!shelterProfileRepository) {
    return jsonResponse({ status: 'shelter_profile_repository_not_configured' }, { status: 501 });
  }

  const shelter = await shelterProfileRepository.loadShelterProfile({ shelterId });

  if (!shelter) {
    return jsonResponse({ status: 'shelter_not_found' }, { status: 404 });
  }

  return jsonResponse({ status: 'ok', shelter });
};
