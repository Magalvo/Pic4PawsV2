import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { AdoptionApplicationStatus } from './adoption-list';

// ─── Repository types ─────────────────────────────────────────────────────────

export type AdoptionViewRecord = {
  applicationId: string;
  shelterId: string;
  /** Used for access control — omitted from the response. */
  applicantUserId: string;
  petId: string | null;
  applicationStatus: AdoptionApplicationStatus;
};

export type AdoptionViewRepository = {
  getAdoptionView: (applicationId: string) => Promise<AdoptionViewRecord | null>;
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

export type HandleWorkerAdoptionViewRequestInput = {
  request: Request;
  applicationId: string;
  adoptionViewRepository?: AdoptionViewRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerAdoptionViewRequest = async ({
  request,
  applicationId,
  adoptionViewRepository,
  authenticator,
}: HandleWorkerAdoptionViewRequestInput): Promise<Response> => {
  // 1. Method check
  if (request.method !== 'GET') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET'] },
      { status: 405, headers: { Allow: 'GET' } },
    );
  }

  // 2. Bearer token
  const bearerToken = extractBearerToken(request);
  if (!bearerToken) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  // 3. Authenticator configured
  if (!authenticator) {
    return jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 });
  }

  // 4. Authenticate
  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await authenticator({ request, authorizationHeader, bearerToken });
  if (!actor) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  // 5. Repository configured
  if (!adoptionViewRepository) {
    return jsonResponse(
      { status: 'adoption_view_repository_not_configured' },
      { status: 501 },
    );
  }

  // 6. Load adoption
  const record = await adoptionViewRepository.getAdoptionView(applicationId);
  if (!record) {
    return jsonResponse({ status: 'adoption_not_found' }, { status: 404 });
  }

  // 7. Access control — applicant OR shelter member
  const isApplicant = actor.id === record.applicantUserId;
  const isShelterMember = canManageShelter(actor, record.shelterId);
  if (!isApplicant && !isShelterMember) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  // 8. Success — omit applicantUserId from the response
  return jsonResponse(
    {
      status: 'ok',
      applicationId: record.applicationId,
      applicationStatus: record.applicationStatus,
      shelterId: record.shelterId,
      petId: record.petId,
    },
    { status: 200 },
  );
};
