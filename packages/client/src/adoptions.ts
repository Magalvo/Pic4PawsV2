import {
  createWorkerUrl,
  createWorkerSubUrl,
  parseJsonResponse,
  parseReasons,
  sanitizeReasons,
  type MediaUploadClientFetch,
} from './_shared';

// ─── Adoption Application types ───────────────────────────────────────────────

export type HousingType = 'apartment' | 'house' | 'farm' | 'other';

export type AdoptionApplicationClientInput = {
  petId: string;
  applicantFullName: string;
  applicantEmail: string;
  applicantPhoneNumber: string;
  applicantCity: string;
  applicantDistrict?: string | null;
  applicantPostalCode?: string | null;
  housingType: HousingType;
  hasOutdoorSpace: boolean;
  hasChildren: boolean;
  hasOtherAnimals: boolean;
  otherAnimalsDescription?: string | null;
  previousPetExperience: string;
  dailyRoutine: string;
  adoptionMotivation: string;
  veterinarianContact?: string | null;
  dataProcessingAccepted: true;
  shelterContactAccepted: boolean;
  consentVersion: string;
  consentAcceptedAt: string;
};

export type AdoptionApplicationClientSuccess = {
  ok: true;
  status: 'adoption_application_submitted';
  applicationId: string;
  petId: string;
  shelterId: string;
  submittedAt: string;
};

export type AdoptionApplicationClientFailureStatus =
  | 'unauthenticated'
  | 'pet_not_found'
  | 'invalid_adoption_application'
  | 'adoption_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type AdoptionApplicationClientFailure = {
  ok: false;
  status: AdoptionApplicationClientFailureStatus;
  reasons: string[];
};

export type AdoptionApplicationClientResult =
  | AdoptionApplicationClientSuccess
  | AdoptionApplicationClientFailure;

export type CreateAdoptionApplicationClientInput = {
  workerBaseUrl: string;
  adoptionsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type AdoptionApplicationClient = {
  submitApplication: (
    input: AdoptionApplicationClientInput,
  ) => Promise<AdoptionApplicationClientResult>;
};

// ─── Adoption List types ──────────────────────────────────────────────────────

export type AdoptionApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_info_requested'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'expired';

export type AdoptionListApplication = {
  applicationId: string;
  petId: string;
  applicantUserId: string;
  applicantFullName: string;
  applicantEmail: string;
  applicantCity: string;
  status: AdoptionApplicationStatus;
  submittedAt: string | null;
};

export type AdoptionListQuery = {
  limit?: number | null;
  offset?: number | null;
};

export type AdoptionListClientSuccess = {
  ok: true;
  status: 'ok';
  applications: AdoptionListApplication[];
  total: number;
};

export type AdoptionListClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'adoption_list_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type AdoptionListClientFailure = {
  ok: false;
  status: AdoptionListClientFailureStatus;
  reasons: string[];
};

export type AdoptionListClientResult = AdoptionListClientSuccess | AdoptionListClientFailure;

export type CreateAdoptionListClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type AdoptionListClient = {
  loadApplications: (
    shelterId: string,
    query?: AdoptionListQuery,
  ) => Promise<AdoptionListClientResult>;
};

// ─── Adoption Status types ────────────────────────────────────────────────────

export type AdoptionStatusShelterManageStatus =
  | 'under_review'
  | 'more_info_requested'
  | 'approved'
  | 'rejected';

export type AdoptionStatusClientSuccess = {
  ok: true;
  status: 'ok';
  applicationId: string;
  newStatus: AdoptionStatusShelterManageStatus;
};

export type AdoptionStatusClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'adoption_not_found'
  | 'invalid_adoption_status'
  | 'adoption_status_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type AdoptionStatusClientFailure = {
  ok: false;
  status: AdoptionStatusClientFailureStatus;
  reasons: string[];
};

export type AdoptionStatusClientResult =
  | AdoptionStatusClientSuccess
  | AdoptionStatusClientFailure;

export type CreateAdoptionStatusClientInput = {
  workerBaseUrl: string;
  adoptionsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type AdoptionStatusClient = {
  manageAdoptionStatus: (
    applicationId: string,
    status: AdoptionStatusShelterManageStatus,
  ) => Promise<AdoptionStatusClientResult>;
};

// ─── Adoption View types ──────────────────────────────────────────────────────

export type AdoptionViewClientApplication = {
  applicationId: string;
  applicationStatus: AdoptionApplicationStatus;
  shelterId: string;
  petId: string | null;
};

export type AdoptionViewClientSuccess = {
  ok: true;
  status: 'ok';
  application: AdoptionViewClientApplication;
};

export type AdoptionViewClientFailureStatus =
  | 'unauthenticated'
  | 'forbidden'
  | 'adoption_not_found'
  | 'adoption_view_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type AdoptionViewClientFailure = {
  ok: false;
  status: AdoptionViewClientFailureStatus;
  reasons: string[];
};

export type AdoptionViewClientResult =
  | AdoptionViewClientSuccess
  | AdoptionViewClientFailure;

export type CreateAdoptionViewClientInput = {
  workerBaseUrl: string;
  adoptionsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type AdoptionViewClient = {
  loadAdoptionView: (applicationId: string) => Promise<AdoptionViewClientResult>;
};

// ─── Adoption Donor List types ────────────────────────────────────────────────

export type AdoptionDonorListItem = {
  applicationId: string;
  petId: string;
  shelterId: string;
  status: AdoptionApplicationStatus;
  submittedAt: string | null;
};

export type AdoptionDonorListQuery = {
  limit?: number | null;
  offset?: number | null;
};

export type AdoptionDonorListClientSuccess = {
  ok: true;
  status: 'ok';
  applications: AdoptionDonorListItem[];
  total: number;
};

export type AdoptionDonorListClientFailureStatus =
  | 'unauthenticated'
  | 'adoption_donor_list_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type AdoptionDonorListClientFailure = {
  ok: false;
  status: AdoptionDonorListClientFailureStatus;
  reasons: string[];
};

export type AdoptionDonorListClientResult =
  | AdoptionDonorListClientSuccess
  | AdoptionDonorListClientFailure;

export type CreateAdoptionDonorListClientInput = {
  workerBaseUrl: string;
  adoptionsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type AdoptionDonorListClient = {
  loadDonorAdoptions: (query?: AdoptionDonorListQuery) => Promise<AdoptionDonorListClientResult>;
};

// ─── Private helpers ──────────────────────────────────────────────────────────

const parseAdoptionSuccess = (
  body: Record<string, unknown> | null,
): AdoptionApplicationClientSuccess | null => {
  if (
    body?.status !== 'adoption_application_submitted' ||
    typeof body.applicationId !== 'string' ||
    typeof body.petId !== 'string' ||
    typeof body.shelterId !== 'string' ||
    typeof body.submittedAt !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'adoption_application_submitted',
    applicationId: body.applicationId,
    petId: body.petId,
    shelterId: body.shelterId,
    submittedAt: body.submittedAt,
  };
};

const parseAdoptionFailureStatus = (
  body: Record<string, unknown> | null,
): AdoptionApplicationClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'pet_not_found' ||
    status === 'invalid_adoption_application' ||
    status === 'adoption_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const buildAdoptionPayload = (input: AdoptionApplicationClientInput): Record<string, unknown> => ({
  petId: input.petId,
  applicantFullName: input.applicantFullName,
  applicantEmail: input.applicantEmail,
  applicantPhoneNumber: input.applicantPhoneNumber,
  applicantCity: input.applicantCity,
  applicantDistrict: input.applicantDistrict ?? null,
  applicantPostalCode: input.applicantPostalCode ?? null,
  housingType: input.housingType,
  hasOutdoorSpace: input.hasOutdoorSpace,
  hasChildren: input.hasChildren,
  hasOtherAnimals: input.hasOtherAnimals,
  otherAnimalsDescription: input.otherAnimalsDescription ?? null,
  previousPetExperience: input.previousPetExperience,
  dailyRoutine: input.dailyRoutine,
  adoptionMotivation: input.adoptionMotivation,
  veterinarianContact: input.veterinarianContact ?? null,
  dataProcessingAccepted: input.dataProcessingAccepted,
  shelterContactAccepted: input.shelterContactAccepted,
  consentVersion: input.consentVersion,
  consentAcceptedAt: input.consentAcceptedAt,
});

const parseAdoptionListSuccess = (
  body: Record<string, unknown> | null,
): AdoptionListClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.applications) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    applications: body.applications as AdoptionListApplication[],
    total: body.total,
  };
};

const parseAdoptionListFailureStatus = (
  body: Record<string, unknown> | null,
): AdoptionListClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'adoption_list_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parseAdoptionStatusSuccess = (
  body: Record<string, unknown> | null,
): AdoptionStatusClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    typeof body.applicationId !== 'string' ||
    typeof body.newStatus !== 'string'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    applicationId: body.applicationId,
    newStatus: body.newStatus as AdoptionStatusShelterManageStatus,
  };
};

const parseAdoptionStatusFailureStatus = (
  body: Record<string, unknown> | null,
): AdoptionStatusClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'adoption_not_found' ||
    status === 'invalid_adoption_status' ||
    status === 'adoption_status_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parseAdoptionViewSuccess = (
  body: Record<string, unknown> | null,
): AdoptionViewClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    typeof body.applicationId !== 'string' ||
    typeof body.applicationStatus !== 'string' ||
    typeof body.shelterId !== 'string' ||
    (body.petId !== null && typeof body.petId !== 'string')
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    application: {
      applicationId: body.applicationId,
      applicationStatus: body.applicationStatus as AdoptionApplicationStatus,
      shelterId: body.shelterId,
      petId: typeof body.petId === 'string' ? body.petId : null,
    },
  };
};

const parseAdoptionViewFailureStatus = (
  body: Record<string, unknown> | null,
): AdoptionViewClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'forbidden' ||
    status === 'adoption_not_found' ||
    status === 'adoption_view_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parseAdoptionDonorListSuccess = (
  body: Record<string, unknown> | null,
): AdoptionDonorListClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.applications) ||
    typeof body.total !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    applications: body.applications as AdoptionDonorListItem[],
    total: body.total,
  };
};

const parseAdoptionDonorListFailureStatus = (
  body: Record<string, unknown> | null,
): AdoptionDonorListClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'adoption_donor_list_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

// ─── Factory functions ────────────────────────────────────────────────────────

export const createAdoptionApplicationClient = ({
  workerBaseUrl,
  adoptionsPath,
  getAccessToken,
  fetch,
}: CreateAdoptionApplicationClientInput): AdoptionApplicationClient => ({
  submitApplication: async (input) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(createWorkerUrl(workerBaseUrl, adoptionsPath), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildAdoptionPayload(input)),
      });
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseAdoptionFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseAdoptionSuccess(body);

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

export const createAdoptionListClient = ({
  workerBaseUrl,
  shelterPath,
  getAccessToken,
  fetch,
}: CreateAdoptionListClientInput): AdoptionListClient => ({
  loadApplications: async (shelterId, query = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    const base = createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId, 'adoptions');
    const url = new URL(base);

    if (query?.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query?.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseAdoptionListFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseAdoptionListSuccess(body);

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

export const createAdoptionStatusClient = ({
  workerBaseUrl,
  adoptionsPath,
  getAccessToken,
  fetch,
}: CreateAdoptionStatusClientInput): AdoptionStatusClient => ({
  manageAdoptionStatus: async (applicationId, status) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, adoptionsPath, applicationId),
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        },
      );
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseAdoptionStatusFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return {
        ok: false,
        status: failureStatus,
        reasons: sanitizeReasons(reasons, failureStatus),
      };
    }

    const success = parseAdoptionStatusSuccess(body);

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

export const createAdoptionViewClient = ({
  workerBaseUrl,
  adoptionsPath,
  getAccessToken,
  fetch,
}: CreateAdoptionViewClientInput): AdoptionViewClient => ({
  loadAdoptionView: async (applicationId) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, adoptionsPath, applicationId),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseAdoptionViewFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return {
        ok: false,
        status: failureStatus,
        reasons: sanitizeReasons(reasons, failureStatus),
      };
    }

    const success = parseAdoptionViewSuccess(body);

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

export const createAdoptionDonorListClient = ({
  workerBaseUrl,
  adoptionsPath,
  getAccessToken,
  fetch,
}: CreateAdoptionDonorListClientInput): AdoptionDonorListClient => ({
  loadDonorAdoptions: async (query = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return {
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      };
    }

    const base = createWorkerUrl(workerBaseUrl, adoptionsPath);
    const url = new URL(base);

    if (query?.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query?.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      return {
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const status = parseAdoptionDonorListFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];

      return {
        ok: false,
        status,
        reasons: sanitizeReasons(reasons, status),
      };
    }

    const success = parseAdoptionDonorListSuccess(body);

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
