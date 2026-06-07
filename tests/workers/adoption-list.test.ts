import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type { AdoptionListRepository, AdoptionListSummary } from '../../apps/workers/src/index';
import type { WorkerPetDraftAuthenticator } from '../../apps/workers/src/index';
import type { AuthenticatedActor } from '@pic4paws/domain';
import type { EnvironmentRecord } from '@pic4paws/config';

const validEnv: EnvironmentRecord = {
  APP_ENV: 'production',
  PUBLIC_APP_ORIGIN: 'https://pic4paws.pt',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account',
  R2_PUBLIC_BUCKET: 'pic4paws-public',
  R2_PRIVATE_BUCKET: 'pic4paws-private',
  R2_ACCESS_KEY_ID: 'r2-access-key',
  R2_SECRET_ACCESS_KEY: 'r2-secret-key',
  WORKER_PAYMENT_WEBHOOK_PATH: '/webhooks/payments',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const shelterMemberActor: AuthenticatedActor = {
  id: 'user-shelter-1',
  authUserId: 'auth-shelter-1',
  role: 'shelter_member',
  status: 'active',
  memberships: [
    {
      id: 'membership-1',
      userId: 'user-shelter-1',
      shelterId: 'shelter-a',
      role: 'shelter_member',
      deletedAt: null,
    },
  ],
};

const adopterActor: AuthenticatedActor = {
  id: 'user-adopter-1',
  authUserId: 'auth-adopter-1',
  role: 'adopter',
  status: 'active',
  memberships: [],
};

const fakeMemberAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(shelterMemberActor);
const fakeAdopterAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(adopterActor);

const sampleApplications: AdoptionListSummary[] = [
  {
    applicationId: 'app-001',
    petId: 'pet-pub-1',
    applicantUserId: 'user-adopter-1',
    applicantFullName: 'Maria Silva',
    applicantEmail: 'maria@example.pt',
    applicantCity: 'Lisboa',
    status: 'submitted',
    submittedAt: '2026-06-07T10:00:00.000Z',
  },
];

const makeAdoptionListRepo = (
  applications: AdoptionListSummary[] = sampleApplications,
  total = 1,
): AdoptionListRepository => ({
  listApplications: vi.fn().mockResolvedValue({ applications, total }),
});

const makeListRequest = (shelterId = 'shelter-a', params?: Record<string, string>) => {
  const url = new URL(`https://workers.pic4paws.pt/shelters/${shelterId}/adoptions`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return new Request(url.toString(), {
    method: 'GET',
    headers: { Authorization: 'Bearer valid-token' },
  });
};

describe('GET /shelters/:shelterId/adoptions — adoption list', () => {
  it('returns 200 with ok status for authorized shelter member', async () => {
    const repo = makeAdoptionListRepo();
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      adoptionListRepository: repo,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('response includes applications array and total count', async () => {
    const repo = makeAdoptionListRepo();
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      adoptionListRepository: repo,
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(Array.isArray(body.applications)).toBe(true);
    expect(body.total).toBe(1);
    const apps = body.applications as AdoptionListSummary[];
    expect(apps[0]?.applicationId).toBe('app-001');
    expect(apps[0]?.applicantFullName).toBe('Maria Silva');
  });

  it('returns 401 when Authorization header is absent', async () => {
    const request = new Request('https://workers.pic4paws.pt/shelters/shelter-a/adoptions', {
      method: 'GET',
    });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      adoptionListRepository: makeAdoptionListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 401 when authenticator returns null', async () => {
    const nullAuth: WorkerPetDraftAuthenticator = vi.fn().mockResolvedValue(null);
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: nullAuth,
      adoptionListRepository: makeAdoptionListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 403 when actor has no membership for the shelter', async () => {
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeAdopterAuth,
      adoptionListRepository: makeAdoptionListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.status).toBe('forbidden');
  });

  it('returns 501 when adoptionListRepository is not injected', async () => {
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
    });
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('adoption_list_repository_not_configured');
  });

  it('returns 405 for POST /shelters/:shelterId/adoptions', async () => {
    const request = new Request('https://workers.pic4paws.pt/shelters/shelter-a/adoptions', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    });

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      adoptionListRepository: makeAdoptionListRepo(),
    });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.status).toBe('method_not_allowed');
  });

  it('returns empty applications and zero total when none exist', async () => {
    const repo = makeAdoptionListRepo([], 0);
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      adoptionListRepository: repo,
    });
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body.applications).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('passes limit and offset query params to the repository', async () => {
    const repo = makeAdoptionListRepo();
    const request = makeListRequest('shelter-a', { limit: '10', offset: '20' });

    await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      adoptionListRepository: repo,
    });

    expect(vi.mocked(repo.listApplications)).toHaveBeenCalledWith(
      expect.objectContaining({ shelterId: 'shelter-a', limit: 10, offset: 20 }),
    );
  });

  it('response body never contains credential markers', async () => {
    const repo = makeAdoptionListRepo();
    const request = makeListRequest();

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: fakeMemberAuth,
      adoptionListRepository: repo,
    });
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });
});
