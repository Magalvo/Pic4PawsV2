import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator, PetDraftRepository } from './pet-drafts';

export type HandleWorkerPetDraftLoadRequestInput = {
  request: Request;
  petId: string;
  petDraftRepository?: PetDraftRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

export const handleWorkerPetDraftLoadRequest = async ({
  request,
  petId,
  petDraftRepository,
  authenticator,
}: HandleWorkerPetDraftLoadRequestInput): Promise<Response> => {
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

  if (!petDraftRepository) {
    return jsonResponse({ status: 'pet_draft_repository_not_configured' }, { status: 501 });
  }

  const draft = await petDraftRepository.loadDraft(petId);

  if (!draft) {
    return jsonResponse({ status: 'pet_draft_not_found' }, { status: 404 });
  }

  if (!canManageShelter(actor, draft.shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  return jsonResponse({
    status: 'ok',
    draft: {
      petId: draft.id,
      shelterId: draft.shelterId,
      status: draft.status,
      name: draft.name ?? null,
      species: draft.species ?? null,
      locationLabel: draft.locationLabel ?? null,
      shortDescription: draft.shortDescription ?? null,
      mediaIds: draft.mediaIds,
      heroMediaId: draft.heroMediaId ?? null,
      medical: draft.medical,
      publishedAt: draft.publishedAt ?? null,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    },
  });
};
