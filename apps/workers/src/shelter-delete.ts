import { canDeleteShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';

export type ShelterDeletionRepository = {
  deleteShelter: (shelterId: string, actorUserId: string) => Promise<{ shelterId: string } | null>;
};

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

export type HandleWorkerShelterDeleteRequestInput = {
  request: Request;
  shelterId: string;
  shelterDeletionRepository?: ShelterDeletionRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerShelterDeleteRequest = async ({
  request,
  shelterId,
  shelterDeletionRepository,
  authenticator,
}: HandleWorkerShelterDeleteRequestInput): Promise<Response> => {
  if (request.method !== 'DELETE') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['DELETE'] },
      { status: 405, headers: { Allow: 'DELETE' } },
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

  if (!canDeleteShelter(actor, shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  if (!shelterDeletionRepository) {
    return jsonResponse({ status: 'shelter_deletion_repository_not_configured' }, { status: 501 });
  }

  const result = await shelterDeletionRepository.deleteShelter(shelterId, actor.id);

  if (!result) {
    return jsonResponse({ status: 'shelter_not_found' }, { status: 404 });
  }

  return jsonResponse({ status: 'deleted', shelterId: result.shelterId }, { status: 200 });
};
