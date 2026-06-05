import {
  canManageShelter,
  publishPetDraft,
  type AuthenticatedActor,
  type PetDraftRecord,
  type PetPublishBlockReason,
} from '@pic4paws/domain';
import {
  createPetDraftInsertContract,
  createPetDraftUpdateContract,
  type PetDraftInsertContract,
  type PetDraftPersistenceRejectionReason,
  type PetDraftUpdateContract,
} from '@pic4paws/database';
import type { EnvironmentConfig } from '@pic4paws/config';
import type { PetLifecycleSpecies, PetMediaAssetRecord } from '@pic4paws/domain';

export type WorkerPetDraftAuthenticatorInput = {
  request: Request;
  authorizationHeader: string;
  bearerToken: string;
};

export type WorkerPetDraftAuthenticator = (
  input: WorkerPetDraftAuthenticatorInput,
) => Promise<AuthenticatedActor | null>;

export type PetDraftRepository = {
  loadMediaAssets: (mediaIds: string[], shelterId: string) => Promise<PetMediaAssetRecord[]>;
  createDraft: (
    insert: PetDraftInsertContract,
    actor: AuthenticatedActor,
  ) => Promise<{ petId: string }>;
  updateDraft: (
    petId: string,
    update: PetDraftUpdateContract,
    actor: AuthenticatedActor,
  ) => Promise<{ petId: string }>;
};

export type ShelterVerificationStatus =
  | 'draft'
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'suspended';

export type PublishedPetDraftRecord = PetDraftRecord & {
  status: 'published';
  publishedAt: string;
};

export type PetPublishContext = {
  pet: PetDraftRecord;
  mediaAssets: PetMediaAssetRecord[];
  shelterVerificationStatus: ShelterVerificationStatus;
};

export type PetPublishRepository = {
  loadPublishContext: (petId: string) => Promise<PetPublishContext | null>;
  publishDraft: (
    petId: string,
    pet: PublishedPetDraftRecord,
    actor: AuthenticatedActor,
  ) => Promise<{ petId: string; publishedAt: string }>;
};

export type WorkerPetDraftDependencies = {
  petDraftAuthenticator?: WorkerPetDraftAuthenticator;
  petDraftRepository?: PetDraftRepository;
  petPublishRepository?: PetPublishRepository;
  now?: () => string;
};

export type WorkerPetDraftRouteMatch =
  | { matched: false }
  | { matched: true; operation: 'create'; petId: null }
  | { matched: true; operation: 'update'; petId: string }
  | { matched: true; operation: 'publish'; petId: string };

type ParsedPetDraftPayload = {
  petId: string;
  shelterId: string;
  name: string | null;
  species: PetLifecycleSpecies | null;
  locationLabel: string | null;
  shortDescription: string | null;
  mediaIds: string[];
  heroMediaId: string | null;
  medical: PetDraftRecord['medical'];
};

type ParsePetDraftPayloadResult =
  | { ok: true; payload: ParsedPetDraftPayload }
  | { ok: false; reasons: string[] };

export type HandleWorkerPetDraftRequestInput = {
  request: Request;
  config: EnvironmentConfig;
  payload: unknown;
  route: Extract<WorkerPetDraftRouteMatch, { matched: true }>;
  dependencies?: WorkerPetDraftDependencies;
};

const speciesValues: PetLifecycleSpecies[] = [
  'dog',
  'cat',
  'horse',
  'donkey',
  'guinea_pig',
  'rabbit',
  'bird',
  'other',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNullableString = (value: unknown): value is string | null | undefined =>
  value === undefined || value === null || typeof value === 'string';

const parseOptionalText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const parseAuthorizationBearer = (request: Request): string | null => {
  const authorizationHeader = request.headers.get('Authorization');

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  const bearerToken = authorizationHeader.slice('Bearer '.length).trim();

  return bearerToken.length > 0 ? bearerToken : null;
};

const parsePetDraftPayload = (
  payload: unknown,
  routePetId: string | null,
): ParsePetDraftPayloadResult => {
  if (!isRecord(payload)) {
    return { ok: false, reasons: ['invalid_payload_shape'] };
  }

  const reasons: string[] = [];

  if (typeof payload.petId !== 'string' || payload.petId.trim().length === 0) {
    reasons.push('invalid_pet_id');
  }

  if (
    typeof payload.petId === 'string' &&
    routePetId !== null &&
    payload.petId.trim() !== routePetId
  ) {
    reasons.push('pet_id_path_mismatch');
  }

  if (typeof payload.shelterId !== 'string' || payload.shelterId.trim().length === 0) {
    reasons.push('invalid_shelter_id');
  }

  if (!isNullableString(payload.name)) {
    reasons.push('invalid_name');
  }

  if (
    payload.species !== undefined &&
    payload.species !== null &&
    !speciesValues.includes(payload.species as PetLifecycleSpecies)
  ) {
    reasons.push('invalid_species');
  }

  if (!isNullableString(payload.locationLabel)) {
    reasons.push('invalid_location_label');
  }

  if (!isNullableString(payload.shortDescription)) {
    reasons.push('invalid_short_description');
  }

  if (
    !Array.isArray(payload.mediaIds) ||
    !payload.mediaIds.every((mediaId) => typeof mediaId === 'string' && mediaId.trim().length > 0)
  ) {
    reasons.push('invalid_media_ids');
  }

  if (!isNullableString(payload.heroMediaId)) {
    reasons.push('invalid_hero_media_id');
  }

  if (!isRecord(payload.medical)) {
    reasons.push('invalid_medical');
  }

  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  return {
    ok: true,
    payload: {
      petId: (payload.petId as string).trim(),
      shelterId: (payload.shelterId as string).trim(),
      name: parseOptionalText(payload.name),
      species: (payload.species as PetLifecycleSpecies | null | undefined) ?? null,
      locationLabel: parseOptionalText(payload.locationLabel),
      shortDescription: parseOptionalText(payload.shortDescription),
      mediaIds: [...(payload.mediaIds as string[])],
      heroMediaId: parseOptionalText(payload.heroMediaId),
      medical: payload.medical as PetDraftRecord['medical'],
    },
  };
};

const toPetDraftRecord = (payload: ParsedPetDraftPayload): PetDraftRecord => ({
  id: payload.petId,
  shelterId: payload.shelterId,
  status: 'draft',
  name: payload.name,
  species: payload.species,
  locationLabel: payload.locationLabel,
  shortDescription: payload.shortDescription,
  mediaIds: payload.mediaIds,
  heroMediaId: payload.heroMediaId,
  medical: payload.medical,
  publishedAt: null,
});

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

export const matchWorkerPetDraftRoute = (
  pathname: string,
  config: EnvironmentConfig,
): WorkerPetDraftRouteMatch => {
  const basePath = config.workers.petDraftsPath;

  if (pathname === basePath) {
    return { matched: true, operation: 'create', petId: null };
  }

  if (pathname.startsWith(`${basePath}/`)) {
    const pathParts = pathname.slice(basePath.length + 1).split('/');

    if (pathParts.length === 2 && pathParts[0] && pathParts[1] === 'publish') {
      return { matched: true, operation: 'publish', petId: pathParts[0] };
    }

    if (pathParts.length === 1 && pathParts[0]) {
      return { matched: true, operation: 'update', petId: pathParts[0] };
    }
  }

  return { matched: false };
};

const invalidDraftResponse = (reasons: Array<string | PetDraftPersistenceRejectionReason>): Response =>
  jsonResponse(
    {
      status: 'invalid_pet_draft',
      reasons,
    },
    { status: 400 },
  );

const rejectedPublishResponse = (reasons: PetPublishBlockReason[]): Response =>
  jsonResponse(
    {
      status: 'pet_publish_rejected',
      reasons,
    },
    { status: 400 },
  );

const authenticatePetDraftActor = async (
  request: Request,
  dependencies: WorkerPetDraftDependencies,
): Promise<
  | { ok: true; actor: AuthenticatedActor }
  | { ok: false; response: Response }
> => {
  const bearerToken = parseAuthorizationBearer(request);

  if (!bearerToken) {
    return { ok: false, response: jsonResponse({ status: 'unauthenticated' }, { status: 401 }) };
  }

  if (!dependencies.petDraftAuthenticator) {
    return {
      ok: false,
      response: jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 }),
    };
  }

  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await dependencies.petDraftAuthenticator({
    request,
    authorizationHeader,
    bearerToken,
  });

  if (!actor) {
    return { ok: false, response: jsonResponse({ status: 'unauthenticated' }, { status: 401 }) };
  }

  return { ok: true, actor };
};

export const handleWorkerPetDraftRequest = async ({
  request,
  payload,
  route,
  dependencies = {},
}: HandleWorkerPetDraftRequestInput): Promise<Response> => {
  if (route.operation === 'create' && request.method !== 'POST') {
    return jsonResponse(
      {
        status: 'method_not_allowed',
        allowedMethods: ['POST'],
      },
      {
        status: 405,
        headers: { Allow: 'POST' },
      },
    );
  }

  if (route.operation === 'update' && request.method !== 'PATCH') {
    return jsonResponse(
      {
        status: 'method_not_allowed',
        allowedMethods: ['PATCH'],
      },
      {
        status: 405,
        headers: { Allow: 'PATCH' },
      },
    );
  }

  if (route.operation === 'publish' && request.method !== 'POST') {
    return jsonResponse(
      {
        status: 'method_not_allowed',
        allowedMethods: ['POST'],
      },
      {
        status: 405,
        headers: { Allow: 'POST' },
      },
    );
  }

  if (route.operation === 'publish') {
    const authenticated = await authenticatePetDraftActor(request, dependencies);

    if (!authenticated.ok) {
      return authenticated.response;
    }

    if (!dependencies.petPublishRepository) {
      return jsonResponse({ status: 'pet_publish_repository_not_configured' }, { status: 501 });
    }

    const context = await dependencies.petPublishRepository.loadPublishContext(route.petId);

    if (!context) {
      return jsonResponse({ status: 'pet_draft_not_found' }, { status: 404 });
    }

    const publishResult = publishPetDraft({
      actor: authenticated.actor,
      pet: context.pet,
      mediaAssets: context.mediaAssets,
      shelterVerificationStatus: context.shelterVerificationStatus,
      now: dependencies.now?.() ?? new Date().toISOString(),
    });

    if (!publishResult.ok) {
      return rejectedPublishResponse(publishResult.reasons);
    }

    const persisted = await dependencies.petPublishRepository.publishDraft(
      route.petId,
      publishResult.pet,
      authenticated.actor,
    );

    return jsonResponse({
      status: 'pet_published',
      petId: persisted.petId,
      publishedAt: persisted.publishedAt,
    });
  }

  const parsedPayload = parsePetDraftPayload(payload, route.petId);

  if (!parsedPayload.ok) {
    return invalidDraftResponse(parsedPayload.reasons);
  }

  const authenticated = await authenticatePetDraftActor(request, dependencies);

  if (!authenticated.ok) {
    return authenticated.response;
  }

  if (!canManageShelter(authenticated.actor, parsedPayload.payload.shelterId)) {
    return jsonResponse(
      {
        status: 'actor_not_authorized',
        reasons: ['actor_not_authorized'],
      },
      { status: 403 },
    );
  }

  if (!dependencies.petDraftRepository) {
    return jsonResponse({ status: 'pet_draft_repository_not_configured' }, { status: 501 });
  }

  const pet = toPetDraftRecord(parsedPayload.payload);
  const mediaAssets = await dependencies.petDraftRepository.loadMediaAssets(
    pet.mediaIds,
    pet.shelterId,
  );
  const now = dependencies.now?.() ?? new Date().toISOString();

  if (route.operation === 'create') {
    const contract = createPetDraftInsertContract({ pet, mediaAssets, now });

    if (!contract.ok) {
      return invalidDraftResponse(contract.reasons);
    }

    const result = await dependencies.petDraftRepository.createDraft(
      contract.insert,
      authenticated.actor,
    );

    return jsonResponse(
      {
        status: 'pet_draft_created',
        petId: result.petId,
      },
      { status: 201 },
    );
  }

  const contract = createPetDraftUpdateContract({ pet, mediaAssets, now });

  if (!contract.ok) {
    return invalidDraftResponse(contract.reasons);
  }

  const result = await dependencies.petDraftRepository.updateDraft(
    route.petId,
    contract.update,
    authenticated.actor,
  );

  return jsonResponse({
    status: 'pet_draft_updated',
    petId: result.petId,
  });
};
