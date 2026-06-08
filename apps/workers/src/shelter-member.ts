import { canManageShelter } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShelterMemberRole = 'shelter_owner' | 'shelter_member';

export type ShelterMemberSummary = {
  memberId: string;
  userId: string;
  role: ShelterMemberRole;
  joinedAt: string;
};

export type ListShelterMembersQuery = {
  shelterId: string;
  limit?: number;
  offset?: number;
};

export type ListShelterMembersResult = {
  members: ShelterMemberSummary[];
  total: number;
};

export type AddShelterMemberInput = {
  shelterId: string;
  userId: string;
  role: ShelterMemberRole;
  addedByUserId: string;
  now: string;
};

export type AddShelterMemberResult = {
  memberId: string;
  userId: string;
  role: ShelterMemberRole;
};

export type RemoveShelterMemberInput = {
  shelterId: string;
  memberId: string;
};

export type ShelterMemberRepository = {
  listMembers: (query: ListShelterMembersQuery) => Promise<ListShelterMembersResult>;
  addMember: (input: AddShelterMemberInput) => Promise<AddShelterMemberResult | null>;
  removeMember: (input: RemoveShelterMemberInput) => Promise<{ memberId: string } | null>;
};

// ─── Path matchers ────────────────────────────────────────────────────────────

/**
 * Extracts shelterId from `{shelterPath}/{shelterId}/members`.
 * Returns null for any non-matching path.
 *
 * Examples (shelterPath = '/shelters'):
 *   /shelters/abc/members         → 'abc'
 *   /shelters/abc                 → null  (no /members suffix)
 *   /shelters/abc/members/m-1    → null  (extra segment)
 *   /shelters                     → null  (no segment)
 */
export const matchWorkerShelterMemberShelterId = (
  pathname: string,
  shelterPath: string,
): string | null => {
  const prefix = shelterPath.endsWith('/') ? shelterPath : `${shelterPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);
  const membersSuffix = '/members';

  if (!rest.endsWith(membersSuffix)) return null;

  const shelterId = rest.slice(0, rest.length - membersSuffix.length);

  if (!shelterId || shelterId.includes('/')) return null;

  return shelterId;
};

/**
 * Extracts shelterId and memberId from `{shelterPath}/{shelterId}/members/{memberId}`.
 * Returns null for any non-matching path.
 *
 * Examples (shelterPath = '/shelters'):
 *   /shelters/abc/members/m-1    → { shelterId: 'abc', memberId: 'm-1' }
 *   /shelters/abc/members        → null  (no memberId)
 *   /shelters/abc/members/m/x   → null  (extra segment)
 */
export const matchWorkerShelterMemberRemoveIds = (
  pathname: string,
  shelterPath: string,
): { shelterId: string; memberId: string } | null => {
  const prefix = shelterPath.endsWith('/') ? shelterPath : `${shelterPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);
  // rest should be: :shelterId/members/:memberId
  const parts = rest.split('/');

  if (parts.length !== 3 || parts[1] !== 'members') return null;

  const shelterId = parts[0];
  const memberId = parts[2];

  if (!shelterId || !memberId) return null;

  return { shelterId, memberId };
};

// ─── Payload validation ───────────────────────────────────────────────────────

const SHELTER_MEMBER_ROLES: readonly ShelterMemberRole[] = ['shelter_owner', 'shelter_member'];

export const validateAddShelterMemberPayload = (
  payload: unknown,
): { userId: string; role: ShelterMemberRole } | null => {
  if (!payload || typeof payload !== 'object') return null;

  const p = payload as Record<string, unknown>;

  if (typeof p.userId !== 'string' || !p.userId.trim()) return null;

  if (!SHELTER_MEMBER_ROLES.includes(p.role as ShelterMemberRole)) return null;

  return { userId: p.userId.trim(), role: p.role as ShelterMemberRole };
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

// ─── Handler: GET + POST /shelters/:shelterId/members ─────────────────────────

export type HandleWorkerShelterMemberRequestInput = {
  request: Request;
  shelterId: string;
  shelterMemberRepository?: ShelterMemberRepository;
  authenticator?: WorkerPetDraftAuthenticator;
  now: string;
};

export const handleWorkerShelterMemberRequest = async ({
  request,
  shelterId,
  shelterMemberRepository,
  authenticator,
  now,
}: HandleWorkerShelterMemberRequestInput): Promise<Response> => {
  // 1. Method check
  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET', 'POST'] },
      { status: 405, headers: { Allow: 'GET, POST' } },
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

  // 5. Access control: must be shelter manager
  if (!canManageShelter(actor, shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  // 6. Repository check
  if (!shelterMemberRepository) {
    return jsonResponse({ status: 'shelter_member_repository_not_configured' }, { status: 501 });
  }

  if (request.method === 'GET') {
    // 7. Parse pagination
    const url = new URL(request.url);
    const limit = parseLimitParam(url.searchParams.get('limit'));
    const offset = parseOffsetParam(url.searchParams.get('offset'));

    // 8. List members
    const result = await shelterMemberRepository.listMembers({ shelterId, limit, offset });

    return jsonResponse(
      { status: 'ok', members: result.members, total: result.total },
      { status: 200 },
    );
  }

  // POST: add member
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonResponse({ status: 'invalid_json' }, { status: 400 });
  }

  const validated = validateAddShelterMemberPayload(rawBody);
  if (!validated) {
    return jsonResponse(
      { status: 'invalid_payload', reasons: ['invalid_payload'] },
      { status: 400 },
    );
  }

  const result = await shelterMemberRepository.addMember({
    shelterId,
    userId: validated.userId,
    role: validated.role,
    addedByUserId: actor.id,
    now,
  });

  if (!result) {
    return jsonResponse(
      { status: 'member_already_exists', reasons: ['member_already_exists'] },
      { status: 409 },
    );
  }

  return jsonResponse(
    { status: 'ok', memberId: result.memberId, userId: result.userId, role: result.role },
    { status: 201 },
  );
};

// ─── Handler: DELETE /shelters/:shelterId/members/:memberId ───────────────────

export type HandleWorkerShelterMemberRemoveRequestInput = {
  request: Request;
  shelterId: string;
  memberId: string;
  shelterMemberRepository?: ShelterMemberRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerShelterMemberRemoveRequest = async ({
  request,
  shelterId,
  memberId,
  shelterMemberRepository,
  authenticator,
}: HandleWorkerShelterMemberRemoveRequestInput): Promise<Response> => {
  // 1. Method check
  if (request.method !== 'DELETE') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['DELETE'] },
      { status: 405, headers: { Allow: 'DELETE' } },
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

  // 5. Access control: must be shelter manager
  if (!canManageShelter(actor, shelterId)) {
    return jsonResponse({ status: 'forbidden' }, { status: 403 });
  }

  // 6. Repository check
  if (!shelterMemberRepository) {
    return jsonResponse({ status: 'shelter_member_repository_not_configured' }, { status: 501 });
  }

  // 7. Remove member
  const result = await shelterMemberRepository.removeMember({ shelterId, memberId });

  if (!result) {
    return jsonResponse(
      { status: 'member_not_found', reasons: ['member_not_found'] },
      { status: 404 },
    );
  }

  return jsonResponse({ status: 'ok', memberId: result.memberId }, { status: 200 });
};
