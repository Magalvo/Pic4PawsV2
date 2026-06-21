import {
  createWorkerUrl,
  createWorkerSubUrl,
  parseJsonResponse,
  parseReasons,
  sanitizeReasons,
  type MediaUploadClientFetch,
} from './_shared';

// ─── Shelter Profile types ────────────────────────────────────────────────────

export type ShelterKind = 'shelter' | 'sanctuary' | 'association' | 'foster_network';

export type ShelterVerificationStatus =
  | 'draft'
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'suspended';

export type ShelterProfileClientShelter = {
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

export type ShelterProfileClientSuccess = {
  ok: true;
  status: 'ok';
  shelter: ShelterProfileClientShelter;
};

export type ShelterProfileClientFailureStatus =
  | 'shelter_not_found'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ShelterProfileClientFailure = {
  ok: false;
  status: ShelterProfileClientFailureStatus;
  reasons: string[];
};

export type ShelterProfileClientResult =
  | ShelterProfileClientSuccess
  | ShelterProfileClientFailure;

export type CreateShelterProfileClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  fetch: MediaUploadClientFetch;
};

export type ShelterProfileClient = {
  loadProfile: (shelterId: string) => Promise<ShelterProfileClientResult>;
};

// ─── Shelter Search types ─────────────────────────────────────────────────────

export type ShelterSearchClientShelter = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  verificationStatus: string;
  city: string;
  district: string | null;
  countryCode: string;
  logoMediaId: string | null;
};

export type ShelterSearchClientQuery = {
  kind?: string | null;
  limit?: number | null;
  offset?: number | null;
};

export type ShelterSearchClientSuccess = {
  ok: true;
  status: 'ok';
  shelters: ShelterSearchClientShelter[];
  total: number;
};

export type ShelterSearchClientFailureStatus =
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ShelterSearchClientFailure = {
  ok: false;
  status: ShelterSearchClientFailureStatus;
  reasons: string[];
};

export type ShelterSearchClientResult =
  | ShelterSearchClientSuccess
  | ShelterSearchClientFailure;

export type CreateShelterSearchClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  fetch: MediaUploadClientFetch;
};

export type ShelterSearchClient = {
  searchShelters: (query: ShelterSearchClientQuery) => Promise<ShelterSearchClientResult>;
};

// ─── Shelter Member types ─────────────────────────────────────────────────────

export type ShelterMemberClientRole = 'shelter_owner' | 'shelter_member';

export type ShelterMemberClientSummary = {
  memberId: string;
  userId: string;
  role: ShelterMemberClientRole;
  joinedAt: string;
};

export type ShelterMemberLoadSuccess = {
  ok: true;
  status: 'ok';
  members: ShelterMemberClientSummary[];
  total: number;
};

export type ShelterMemberAddSuccess = {
  ok: true;
  status: 'ok';
  memberId: string;
  userId: string;
  role: ShelterMemberClientRole;
};

export type ShelterMemberRemoveSuccess = {
  ok: true;
  status: 'ok';
  memberId: string;
};

export type ShelterMemberClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'member_not_found'
  | 'member_already_exists'
  | 'shelter_member_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ShelterMemberClientFailure = {
  ok: false;
  status: ShelterMemberClientFailureStatus;
  reasons: string[];
};

export type ShelterMemberLoadResult = ShelterMemberLoadSuccess | ShelterMemberClientFailure;
export type ShelterMemberAddResult = ShelterMemberAddSuccess | ShelterMemberClientFailure;
export type ShelterMemberRemoveResult = ShelterMemberRemoveSuccess | ShelterMemberClientFailure;

export type ShelterMemberListQuery = {
  limit?: number | null;
  offset?: number | null;
};

export type CreateShelterMemberClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type ShelterMemberClient = {
  loadShelterMembers: (
    shelterId: string,
    query?: ShelterMemberListQuery,
  ) => Promise<ShelterMemberLoadResult>;
  addShelterMember: (
    shelterId: string,
    input: { userId: string; role: ShelterMemberClientRole },
  ) => Promise<ShelterMemberAddResult>;
  removeShelterMember: (
    shelterId: string,
    memberId: string,
  ) => Promise<ShelterMemberRemoveResult>;
};

// ─── Financials types ─────────────────────────────────────────────────────────

export type FinancialsClientDonationBreakdown = {
  status: string;
  count: number;
  totalCents: number;
};

export type FinancialsClientSummary = {
  shelterId: string;
  currency: string;
  donations: {
    count: number;
    paidTotalCents: number;
    byStatus: FinancialsClientDonationBreakdown[];
  };
  sponsorships: {
    activeCount: number;
    pausedCount: number;
    cancelledCount: number;
    activeTotalCents: number;
  };
};

export type LoadFinancialsClientSuccess = {
  ok: true;
  status: 'ok';
  summary: FinancialsClientSummary;
};

export type LoadFinancialsClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'financials_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type LoadFinancialsClientFailure = {
  ok: false;
  status: LoadFinancialsClientFailureStatus;
  reasons: string[];
};

export type LoadFinancialsClientResult =
  | LoadFinancialsClientSuccess
  | LoadFinancialsClientFailure;

export type CreateFinancialsClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type FinancialsClient = {
  loadFinancials: (shelterId: string) => Promise<LoadFinancialsClientResult>;
};

// ─── Shelter Pet List types ───────────────────────────────────────────────────

export type ShelterPetStatus =
  | 'draft'
  | 'published'
  | 'adoption_pending'
  | 'adopted'
  | 'not_available'
  | 'archived';

export type ShelterPetClientSummary = {
  petId: string;
  name: string | null;
  species: string | null;
  status: ShelterPetStatus;
  heroMediaId: string | null;
  locationLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShelterPetListQuery = {
  limit?: number;
  offset?: number;
};

export type ShelterPetListClientSuccess = {
  ok: true;
  status: 'ok';
  pets: ShelterPetClientSummary[];
  total: number;
};

export type ShelterPetListClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'shelter_pet_list_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ShelterPetListClientFailure = {
  ok: false;
  status: ShelterPetListClientFailureStatus;
  reasons: string[];
};

export type ShelterPetListClientResult = ShelterPetListClientSuccess | ShelterPetListClientFailure;

export type CreateShelterPetListClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: typeof globalThis.fetch;
};

export type ShelterPetListClient = {
  loadShelterPets: (
    shelterId: string,
    query?: ShelterPetListQuery,
  ) => Promise<ShelterPetListClientResult>;
};

// ─── Shelter Registration types ───────────────────────────────────────────────

export type ShelterRegistrationClientInput = {
  name: string;
  kind: string;
  city: string;
  publicEmail?: string | null;
  publicPhone?: string | null;
  description?: string | null;
  district?: string | null;
};

export type RegisterShelterClientSuccess = {
  ok: true;
  status: 'registered';
  shelterId: string;
};

export type RegisterShelterClientFailureStatus =
  | 'unauthenticated'
  | 'invalid_payload'
  | 'auth_adapter_not_configured'
  | 'shelter_registration_repository_not_configured'
  | 'worker_request_failed';

export type RegisterShelterClientFailure = {
  ok: false;
  status: RegisterShelterClientFailureStatus;
  reasons: string[];
};

export type RegisterShelterClientResult = RegisterShelterClientSuccess | RegisterShelterClientFailure;

export type CreateShelterRegistrationClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: typeof globalThis.fetch;
};

export type ShelterRegistrationClient = {
  registerShelter: (input: ShelterRegistrationClientInput) => Promise<RegisterShelterClientResult>;
};

// ─── Shelter Update types ─────────────────────────────────────────────────────

export type ShelterUpdateClientInput = {
  name?: string;
  kind?: string;
  city?: string;
  district?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
  description?: string | null;
};

export type UpdateShelterClientSuccess = {
  ok: true;
  status: 'updated';
  shelterId: string;
};

export type UpdateShelterClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'invalid_payload'
  | 'shelter_not_found'
  | 'auth_adapter_not_configured'
  | 'shelter_update_repository_not_configured'
  | 'worker_request_failed';

export type UpdateShelterClientFailure = {
  ok: false;
  status: UpdateShelterClientFailureStatus;
  reasons: string[];
};

export type UpdateShelterClientResult = UpdateShelterClientSuccess | UpdateShelterClientFailure;

export type CreateShelterUpdateClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: typeof globalThis.fetch;
};

export type ShelterUpdateClient = {
  updateShelter: (
    shelterId: string,
    input: ShelterUpdateClientInput,
  ) => Promise<UpdateShelterClientResult>;
};

// ─── Shelter Deletion types ───────────────────────────────────────────────────

export type DeleteShelterClientSuccess = {
  ok: true;
  status: 'deleted';
  shelterId: string;
};

export type DeleteShelterClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'shelter_not_found'
  | 'auth_adapter_not_configured'
  | 'shelter_deletion_repository_not_configured'
  | 'worker_request_failed';

export type DeleteShelterClientFailure = {
  ok: false;
  status: DeleteShelterClientFailureStatus;
  reasons: string[];
};

export type DeleteShelterClientResult = DeleteShelterClientSuccess | DeleteShelterClientFailure;

export type CreateShelterDeletionClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: typeof globalThis.fetch;
};

export type ShelterDeletionClient = {
  deleteShelter: (shelterId: string) => Promise<DeleteShelterClientResult>;
};

// ─── Shelter Verification types ───────────────────────────────────────────────

export type ShelterVerificationTargetStatus =
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'suspended';

export type UpdateVerificationClientSuccess = {
  ok: true;
  status: 'updated';
  shelterId: string;
  verificationStatus: ShelterVerificationTargetStatus;
};

export type UpdateVerificationClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'invalid_payload'
  | 'shelter_not_found'
  | 'invalid_transition'
  | 'shelter_verification_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type UpdateVerificationClientFailure = {
  ok: false;
  status: UpdateVerificationClientFailureStatus;
  reasons: string[];
};

export type UpdateVerificationClientResult =
  | UpdateVerificationClientSuccess
  | UpdateVerificationClientFailure;

export type CreateShelterVerificationClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: typeof globalThis.fetch;
};

export type ShelterVerificationClient = {
  updateVerificationStatus: (
    shelterId: string,
    targetStatus: ShelterVerificationTargetStatus,
  ) => Promise<UpdateVerificationClientResult>;
};

// ─── Private helpers ──────────────────────────────────────────────────────────

const parseShelterProfileSuccess = (
  body: Record<string, unknown> | null,
): ShelterProfileClientSuccess | null => {
  if (!body || body.status !== 'ok' || typeof body.shelter !== 'object' || body.shelter === null) {
    return null;
  }

  const shelter = body.shelter as Record<string, unknown>;

  if (
    typeof shelter.id !== 'string' ||
    typeof shelter.name !== 'string' ||
    typeof shelter.slug !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    shelter: shelter as ShelterProfileClientShelter,
  };
};

const parseShelterSearchSuccess = (
  body: Record<string, unknown> | null,
): ShelterSearchClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.shelters) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    shelters: body.shelters as ShelterSearchClientShelter[],
    total: body.total,
  };
};

const parseShelterMemberLoadSuccess = (
  body: Record<string, unknown> | null,
): ShelterMemberLoadSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.members) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  const members: ShelterMemberClientSummary[] = [];

  for (const m of body.members) {
    if (!m || typeof m !== 'object') return null;

    const member = m as Record<string, unknown>;

    if (
      typeof member.memberId !== 'string' ||
      typeof member.userId !== 'string' ||
      typeof member.role !== 'string' ||
      typeof member.joinedAt !== 'string'
    ) {
      return null;
    }

    members.push({
      memberId: member.memberId,
      userId: member.userId,
      role: member.role as ShelterMemberClientRole,
      joinedAt: member.joinedAt,
    });
  }

  return { ok: true, status: 'ok', members, total: body.total };
};

const parseShelterMemberAddSuccess = (
  body: Record<string, unknown> | null,
): ShelterMemberAddSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    typeof body.memberId !== 'string' ||
    typeof body.userId !== 'string' ||
    typeof body.role !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    memberId: body.memberId,
    userId: body.userId,
    role: body.role as ShelterMemberClientRole,
  };
};

const parseShelterMemberRemoveSuccess = (
  body: Record<string, unknown> | null,
): ShelterMemberRemoveSuccess | null => {
  if (!body || body.status !== 'ok' || typeof body.memberId !== 'string') {
    return null;
  }

  return { ok: true, status: 'ok', memberId: body.memberId };
};

const parseShelterMemberClientFailureStatus = (
  body: Record<string, unknown> | null,
): ShelterMemberClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'member_not_found' ||
    status === 'member_already_exists' ||
    status === 'shelter_member_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parseFinancialsFailureStatus = (
  body: Record<string, unknown> | null,
): LoadFinancialsClientFailureStatus => {
  const status = body?.status;
  if (status === 'forbidden') return 'forbidden';
  if (
    status === 'unauthenticated' ||
    status === 'financials_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }
  return 'worker_request_failed';
};

const parseFinancialsSuccess = (
  body: Record<string, unknown> | null,
): LoadFinancialsClientSuccess | null => {
  if (!body || body.status !== 'ok') return null;
  if (typeof body.shelterId !== 'string') return null;
  if (typeof body.currency !== 'string') return null;

  const donations = body.donations as Record<string, unknown> | undefined;
  const sponsorships = body.sponsorships as Record<string, unknown> | undefined;
  if (!donations || !sponsorships) return null;

  return {
    ok: true,
    status: 'ok',
    summary: {
      shelterId: body.shelterId,
      currency: body.currency,
      donations: {
        count: (donations.count as number) ?? 0,
        paidTotalCents: (donations.paidTotalCents as number) ?? 0,
        byStatus: Array.isArray(donations.byStatus)
          ? (donations.byStatus as FinancialsClientDonationBreakdown[])
          : [],
      },
      sponsorships: {
        activeCount: (sponsorships.activeCount as number) ?? 0,
        pausedCount: (sponsorships.pausedCount as number) ?? 0,
        cancelledCount: (sponsorships.cancelledCount as number) ?? 0,
        activeTotalCents: (sponsorships.activeTotalCents as number) ?? 0,
      },
    },
  };
};

const parseShelterPetListFailureStatus = (
  body: Record<string, unknown> | null,
): ShelterPetListClientFailureStatus => {
  const status = body?.status;
  if (status === 'unauthenticated') return 'unauthenticated';
  if (status === 'forbidden') return 'forbidden';
  if (status === 'shelter_pet_list_repository_not_configured') return 'shelter_pet_list_repository_not_configured';
  if (status === 'auth_adapter_not_configured') return 'auth_adapter_not_configured';
  if (status === 'worker_response_invalid') return 'worker_response_invalid';
  return 'worker_request_failed';
};

const parseShelterPetSummary = (raw: unknown): ShelterPetClientSummary | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.petId !== 'string') return null;
  if (typeof r.createdAt !== 'string') return null;
  if (typeof r.updatedAt !== 'string') return null;
  return {
    petId: r.petId,
    name: typeof r.name === 'string' ? r.name : null,
    species: typeof r.species === 'string' ? r.species : null,
    status: (r.status as ShelterPetStatus) ?? 'draft',
    heroMediaId: typeof r.heroMediaId === 'string' ? r.heroMediaId : null,
    locationLabel: typeof r.locationLabel === 'string' ? r.locationLabel : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
};

const parseShelterPetListSuccess = (
  body: Record<string, unknown> | null,
): ShelterPetListClientSuccess | null => {
  if (!body || body.status !== 'ok') return null;
  if (!Array.isArray(body.pets)) return null;
  if (typeof body.total !== 'number') return null;
  const pets = body.pets
    .map(parseShelterPetSummary)
    .filter((p): p is ShelterPetClientSummary => p !== null);
  return { ok: true, status: 'ok', pets, total: body.total };
};

const parseRegisterShelterFailureStatus = (
  body: Record<string, unknown> | null,
): RegisterShelterClientFailureStatus => {
  const status = body?.status;
  if (status === 'unauthenticated') return 'unauthenticated';
  if (status === 'invalid_payload') return 'invalid_payload';
  if (status === 'auth_adapter_not_configured') return 'auth_adapter_not_configured';
  if (status === 'shelter_registration_repository_not_configured')
    return 'shelter_registration_repository_not_configured';
  return 'worker_request_failed';
};

const parseRegisterShelterSuccess = (
  body: Record<string, unknown> | null,
): RegisterShelterClientSuccess | null => {
  if (!body || body.status !== 'created' || typeof body.shelterId !== 'string') return null;
  return { ok: true, status: 'registered', shelterId: body.shelterId };
};

const parseUpdateShelterFailureStatus = (
  body: Record<string, unknown> | null,
): UpdateShelterClientFailureStatus => {
  const status = body?.status;
  if (status === 'unauthenticated') return 'unauthenticated';
  if (status === 'forbidden') return 'forbidden';
  if (status === 'invalid_payload') return 'invalid_payload';
  if (status === 'shelter_not_found') return 'shelter_not_found';
  if (status === 'auth_adapter_not_configured') return 'auth_adapter_not_configured';
  if (status === 'shelter_update_repository_not_configured')
    return 'shelter_update_repository_not_configured';
  return 'worker_request_failed';
};

const parseUpdateShelterSuccess = (
  body: Record<string, unknown> | null,
): UpdateShelterClientSuccess | null => {
  if (!body || body.status !== 'updated' || typeof body.shelterId !== 'string') return null;
  return { ok: true, status: 'updated', shelterId: body.shelterId };
};

const parseDeleteShelterFailureStatus = (
  body: Record<string, unknown> | null,
): DeleteShelterClientFailureStatus => {
  const status = body?.status;
  if (status === 'unauthenticated') return 'unauthenticated';
  if (status === 'forbidden') return 'forbidden';
  if (status === 'shelter_not_found') return 'shelter_not_found';
  if (status === 'auth_adapter_not_configured') return 'auth_adapter_not_configured';
  if (status === 'shelter_deletion_repository_not_configured')
    return 'shelter_deletion_repository_not_configured';
  return 'worker_request_failed';
};

const parseDeleteShelterSuccess = (
  body: Record<string, unknown> | null,
): DeleteShelterClientSuccess | null => {
  if (!body || body.status !== 'deleted' || typeof body.shelterId !== 'string') return null;
  return { ok: true, status: 'deleted', shelterId: body.shelterId };
};

// ─── Factory functions ────────────────────────────────────────────────────────

export const createShelterProfileClient = ({
  workerBaseUrl,
  shelterPath,
  fetch,
}: CreateShelterProfileClientInput): ShelterProfileClient => ({
  loadProfile: async (shelterId) => {
    let response: Response;

    try {
      response = await fetch(createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId));
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (response.status === 404) {
      return { ok: false, status: 'shelter_not_found', reasons: ['shelter_not_found'] };
    }

    if (!response.ok) {
      const reasons = Array.isArray(body?.reasons)
        ? parseReasons(body)
        : ['worker_request_failed'];

      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: sanitizeReasons(reasons, 'worker_request_failed'),
      };
    }

    const success = parseShelterProfileSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

export const createShelterSearchClient = ({
  workerBaseUrl,
  shelterPath,
  fetch,
}: CreateShelterSearchClientInput): ShelterSearchClient => ({
  searchShelters: async (query) => {
    const base = createWorkerUrl(workerBaseUrl, shelterPath);
    const url = new URL(base);

    if (query.kind != null) url.searchParams.set('kind', query.kind);
    if (query.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString());
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const reasons = Array.isArray(body?.reasons)
        ? parseReasons(body)
        : ['worker_request_failed'];

      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: sanitizeReasons(reasons, 'worker_request_failed'),
      };
    }

    const success = parseShelterSearchSuccess(body);

    if (!success) {
      return {
        ok: false,
        status: 'worker_response_invalid',
        reasons: ['invalid_worker_response'],
      };
    }

    return success;
  },
});

export const createShelterMemberClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateShelterMemberClientInput): ShelterMemberClient => ({
  loadShelterMembers: async (shelterId, query = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const base = createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'members');
    const url = new URL(base);

    if (query?.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query?.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseShelterMemberClientFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parseShelterMemberLoadSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },

  addShelterMember: async (shelterId, input) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'members'),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        },
      );
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseShelterMemberClientFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parseShelterMemberAddSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },

  removeShelterMember: async (shelterId, memberId) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'members', memberId),
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseShelterMemberClientFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parseShelterMemberRemoveSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

export const createFinancialsClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateFinancialsClientInput): FinancialsClient => ({
  loadFinancials: async (shelterId: string) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const url = createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'financials');
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseFinancialsFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseFinancialsSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

export const createShelterPetListClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateShelterPetListClientInput): ShelterPetListClient => ({
  loadShelterPets: async (shelterId: string, query: ShelterPetListQuery = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const base = createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'pets');
    const params = new URLSearchParams();
    if (query.limit !== undefined) params.set('limit', String(query.limit));
    if (query.offset !== undefined) params.set('offset', String(query.offset));
    const url = params.size > 0 ? `${base}?${params.toString()}` : base;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseShelterPetListFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseShelterPetListSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

export const createShelterRegistrationClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateShelterRegistrationClientInput): ShelterRegistrationClient => ({
  registerShelter: async (input: ShelterRegistrationClientInput) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(createWorkerUrl(workerBaseUrl, shelterPath), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: input.name,
          kind: input.kind,
          city: input.city,
          publicEmail: input.publicEmail ?? null,
          publicPhone: input.publicPhone ?? null,
          description: input.description ?? null,
          district: input.district ?? null,
        }),
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseRegisterShelterFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseRegisterShelterSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_request_failed', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

export const createShelterUpdateClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateShelterUpdateClientInput): ShelterUpdateClient => ({
  updateShelter: async (shelterId: string, input: ShelterUpdateClientInput) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(`${createWorkerUrl(workerBaseUrl, shelterPath)}/${shelterId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseUpdateShelterFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseUpdateShelterSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_request_failed', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

const parseVerificationFailureStatus = (
  body: Record<string, unknown> | null,
): UpdateVerificationClientFailureStatus => {
  const status = body?.status;
  if (status === 'unauthenticated') return 'unauthenticated';
  if (status === 'forbidden') return 'forbidden';
  if (status === 'invalid_payload') return 'invalid_payload';
  if (status === 'shelter_not_found') return 'shelter_not_found';
  if (status === 'invalid_transition') return 'invalid_transition';
  if (status === 'shelter_verification_repository_not_configured')
    return 'shelter_verification_repository_not_configured';
  if (status === 'auth_adapter_not_configured') return 'auth_adapter_not_configured';
  return 'worker_request_failed';
};

const parseUpdateVerificationSuccess = (
  body: Record<string, unknown> | null,
): UpdateVerificationClientSuccess | null => {
  if (
    !body ||
    body.status !== 'updated' ||
    typeof body.shelterId !== 'string' ||
    typeof body.verificationStatus !== 'string'
  ) {
    return null;
  }
  return {
    ok: true,
    status: 'updated',
    shelterId: body.shelterId,
    verificationStatus: body.verificationStatus as ShelterVerificationTargetStatus,
  };
};


export const createShelterVerificationClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateShelterVerificationClientInput): ShelterVerificationClient => ({
  updateVerificationStatus: async (shelterId, targetStatus) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(
        `${createWorkerUrl(workerBaseUrl, shelterPath)}/${shelterId}/verification`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: targetStatus }),
        },
      );
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseVerificationFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseUpdateVerificationSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});

export const createShelterDeletionClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateShelterDeletionClientInput): ShelterDeletionClient => ({
  deleteShelter: async (shelterId: string) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(`${createWorkerUrl(workerBaseUrl, shelterPath)}/${shelterId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseDeleteShelterFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
      return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
    }

    const success = parseDeleteShelterSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_request_failed', reasons: ['invalid_worker_response'] };
    }

    return success;
  },
});
