import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PetArchiveRecord = {
  petId: string;
  shelterId: string;
  lifecycleStatus: string;
};

export type PetLifecycleEventInput = {
  petId: string;
  shelterId: string;
  actorUserId: string;
  fromStatus: string;
  toStatus: string;
  now: string;
};

export type PetArchiveRepository = {
  getPetForArchive: (petId: string) => Promise<PetArchiveRecord | null>;
  archivePet: (input: { petId: string; now: string }) => Promise<{ petId: string } | null>;
  republishPet: (input: { petId: string; now: string }) => Promise<{ petId: string } | null>;
  recordLifecycleEvent: (input: PetLifecycleEventInput) => Promise<void>;
};

export type HandleWorkerPetArchiveRequestInput = {
  request: Request;
  petId: string;
  payload: unknown;
  petArchiveRepository?: PetArchiveRepository;
  authenticator?: WorkerPetDraftAuthenticator;
  now: string;
};

// ─── Path matcher ─────────────────────────────────────────────────────────────

/**
 * Returns the petId segment from a URL pathname of the form
 * `{petFeedPath}/{petId}/status`, or null if the path does not match.
 *
 * Examples (petFeedPath = '/pets'):
 *   /pets/abc123/status           → 'abc123'
 *   /pets/abc123                  → null  (no /status suffix)
 *   /pets/abc123/other            → null  (wrong suffix)
 *   /pets                         → null  (no petId)
 *   /pets/abc123/status/extra     → null  (too many segments)
 *   /animals/abc123/status        → null  (wrong prefix)
 */
export const matchWorkerPetArchiveId = (
  pathname: string,
  petFeedPath: string,
): string | null => {
  const prefix = petFeedPath.endsWith('/') ? petFeedPath : `${petFeedPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);
  const parts = rest.split('/');

  if (parts.length !== 2 || !parts[0] || parts[1] !== 'status') return null;

  return parts[0];
};

// ─── Payload validation ───────────────────────────────────────────────────────

export const validatePetArchivePayload = (
  payload: unknown,
): 'archived' | 'published' | null => {
  if (!payload || typeof payload !== 'object') return null;

  const p = payload as Record<string, unknown>;

  if (p.status === 'archived') return 'archived';
  if (p.status === 'published') return 'published';

  return null;
};

// ─── Handler ──────────────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

export const handleWorkerPetArchiveRequest = async ({
  request,
  petId,
  payload,
  petArchiveRepository,
  authenticator,
  now,
}: HandleWorkerPetArchiveRequestInput): Promise<Response> => {
  if (request.method !== 'PATCH') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['PATCH'] },
      { status: 405, headers: { Allow: 'PATCH' } },
    );
  }

  if (!petArchiveRepository) {
    return jsonResponse(
      { status: 'pet_archive_repository_not_configured' },
      { status: 501 },
    );
  }

  if (!authenticator) {
    return jsonResponse(
      { status: 'auth_adapter_not_configured' },
      { status: 501 },
    );
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;

  if (!bearerToken) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  const actor = await authenticator({
    request,
    authorizationHeader: authHeader,
    bearerToken,
  });

  if (!actor) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  const targetStatus = validatePetArchivePayload(payload);

  if (!targetStatus) {
    return jsonResponse(
      { status: 'invalid_payload', reasons: ['status_must_be_archived_or_published'] },
      { status: 400 },
    );
  }

  const pet = await petArchiveRepository.getPetForArchive(petId);

  if (!pet) {
    return jsonResponse({ status: 'pet_not_found' }, { status: 404 });
  }

  if (!canManageShelter(actor, pet.shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  if (targetStatus === 'published') {
    const result = await petArchiveRepository.republishPet({ petId, now });

    if (!result) {
      return jsonResponse({ status: 'pet_not_archived' }, { status: 409 });
    }

    await petArchiveRepository.recordLifecycleEvent({
      petId,
      shelterId: pet.shelterId,
      actorUserId: actor.id,
      fromStatus: pet.lifecycleStatus,
      toStatus: 'published',
      now,
    });

    return jsonResponse({ status: 'ok', petId: result.petId }, { status: 200 });
  }

  const result = await petArchiveRepository.archivePet({ petId, now });

  if (!result) {
    return jsonResponse({ status: 'pet_already_archived' }, { status: 409 });
  }

  await petArchiveRepository.recordLifecycleEvent({
    petId,
    shelterId: pet.shelterId,
    actorUserId: actor.id,
    fromStatus: pet.lifecycleStatus,
    toStatus: 'archived',
    now,
  });

  return jsonResponse({ status: 'ok', petId: result.petId }, { status: 200 });
};
