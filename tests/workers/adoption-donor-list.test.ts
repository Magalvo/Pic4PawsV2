import { describe, expect, it, vi } from 'vitest';
import { handleWorkerAdoptionDonorListRequest } from '../../apps/workers/src/adoption-donor-list';
import type {
  AdoptionDonorListRepository,
  AdoptionDonorListSummary,
} from '../../apps/workers/src/adoption-donor-list';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeRequest = (method: string, url: string, token?: string): Request => {
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new Request(url, { method, headers });
};

const makeAuthenticator = (actor: unknown) => vi.fn().mockResolvedValue(actor);

const makeActor = () => ({
  id: 'user-001',
  authUserId: 'auth-001',
  role: 'adopter' as const,
  status: 'active' as const,
  memberships: [],
});

const makeApplication = (
  overrides: Partial<AdoptionDonorListSummary> = {},
): AdoptionDonorListSummary => ({
  applicationId: 'app-001',
  petId: 'pet-001',
  shelterId: 'shelter-001',
  status: 'submitted',
  submittedAt: '2026-01-01T12:00:00Z',
  ...overrides,
});

const makeRepo = (
  overrides: Partial<AdoptionDonorListRepository> = {},
): AdoptionDonorListRepository => ({
  listDonorAdoptions: vi.fn().mockResolvedValue({
    applications: [makeApplication()],
    total: 1,
  }),
  ...overrides,
});

// ─── handleWorkerAdoptionDonorListRequest ────────────────────────────────────

describe('handleWorkerAdoptionDonorListRequest', () => {
  it('returns 200 with applications for authenticated donor', async () => {
    const request = makeRequest('GET', 'https://worker.test/adoptions', 'valid-token');
    const response = await handleWorkerAdoptionDonorListRequest({
      request,
      adoptionDonorListRepository: makeRepo(),
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.applications).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('returns 200 with empty list when donor has no applications', async () => {
    const repo = makeRepo({
      listDonorAdoptions: vi.fn().mockResolvedValue({ applications: [], total: 0 }),
    });
    const request = makeRequest('GET', 'https://worker.test/adoptions', 'valid-token');
    const response = await handleWorkerAdoptionDonorListRequest({
      request,
      adoptionDonorListRepository: repo,
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.applications).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it('returns 401 when no bearer token', async () => {
    const request = makeRequest('GET', 'https://worker.test/adoptions');
    const response = await handleWorkerAdoptionDonorListRequest({
      request,
      adoptionDonorListRepository: makeRepo(),
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when no auth adapter', async () => {
    const request = makeRequest('GET', 'https://worker.test/adoptions', 'valid-token');
    const response = await handleWorkerAdoptionDonorListRequest({
      request,
      adoptionDonorListRepository: makeRepo(),
    });

    expect(response.status).toBe(501);
    const body = await response.json();
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when authenticator rejects token', async () => {
    const request = makeRequest('GET', 'https://worker.test/adoptions', 'bad-token');
    const response = await handleWorkerAdoptionDonorListRequest({
      request,
      adoptionDonorListRepository: makeRepo(),
      authenticator: makeAuthenticator(null),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when no repository', async () => {
    const request = makeRequest('GET', 'https://worker.test/adoptions', 'valid-token');
    const response = await handleWorkerAdoptionDonorListRequest({
      request,
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(response.status).toBe(501);
    const body = await response.json();
    expect(body.status).toBe('adoption_donor_list_repository_not_configured');
  });

  it('passes actor.id as donorUserId to repository', async () => {
    const repo = makeRepo();
    const request = makeRequest('GET', 'https://worker.test/adoptions', 'valid-token');
    await handleWorkerAdoptionDonorListRequest({
      request,
      adoptionDonorListRepository: repo,
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(repo.listDonorAdoptions).toHaveBeenCalledWith(
      expect.objectContaining({ donorUserId: 'user-001' }),
    );
  });

  it('response does not include applicantUserId', async () => {
    const request = makeRequest('GET', 'https://worker.test/adoptions', 'valid-token');
    const response = await handleWorkerAdoptionDonorListRequest({
      request,
      adoptionDonorListRepository: makeRepo(),
      authenticator: makeAuthenticator(makeActor()),
    });

    const body = await response.json();
    const app = body.applications[0];
    expect(app).not.toHaveProperty('applicantUserId');
  });
});
