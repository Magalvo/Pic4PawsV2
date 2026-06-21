import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedActor } from '@pic4paws/domain';
import type { EnvironmentRecord } from '@pic4paws/config';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import {
  handleWorkerAdminPendingSheltersRequest,
  matchWorkerAdminPendingSheltersPath,
  type AdminPendingShelterSummary,
  type AdminPendingSheltersRepository,
} from '../../apps/workers/src/admin-pending-shelters';

const makeActor = (role: AuthenticatedActor['role'] = 'admin'): AuthenticatedActor => ({
  id: 'admin-1',
  authUserId: 'auth-admin-1',
  role,
  status: 'active',
  memberships: [],
});

const makeAuth = (actor: AuthenticatedActor | null = makeActor()) => async () => actor;

const makeShelter = (
  overrides: Partial<AdminPendingShelterSummary> = {},
): AdminPendingShelterSummary => ({
  id: 'shelter-a',
  name: 'Abrigo dos Amigos',
  slug: 'abrigo-dos-amigos',
  kind: 'shelter',
  verificationStatus: 'pending_review',
  city: 'Porto',
  district: 'Porto',
  countryCode: 'PT',
  publicEmail: 'contacto@abrigo.pt',
  publicPhone: '+351912345678',
  logoMediaId: null,
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-10T10:00:00.000Z',
  ...overrides,
});

const makeRepo = (
  result = { shelters: [makeShelter()], total: 1 },
): AdminPendingSheltersRepository => ({
  listPendingShelters: async () => result,
});

const baseRequest = (
  method = 'GET',
  token: string | null = 'valid-token',
  url = 'https://worker.test/shelters/pending-verification',
) =>
  new Request(url, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

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
  WORKER_MEDIA_UPLOAD_PATH: '/uploads/media',
  WORKER_PET_DRAFTS_PATH: '/pets/drafts',
  WORKER_PET_FEED_PATH: '/pets',
  WORKER_SHELTER_PATH: '/shelters',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

describe('matchWorkerAdminPendingSheltersPath', () => {
  it('matches /shelters/pending-verification exactly', () => {
    expect(matchWorkerAdminPendingSheltersPath('/shelters/pending-verification', '/shelters')).toBe(true);
  });

  it('does not match extra path segments', () => {
    expect(matchWorkerAdminPendingSheltersPath('/shelters/pending-verification/extra', '/shelters')).toBe(false);
  });

  it('does not match public shelter profile paths', () => {
    expect(matchWorkerAdminPendingSheltersPath('/shelters/shelter-a', '/shelters')).toBe(false);
  });
});

describe('handleWorkerAdminPendingSheltersRequest', () => {
  it('returns 405 for non-GET requests', async () => {
    const response = await handleWorkerAdminPendingSheltersRequest({
      request: baseRequest('POST'),
    });

    expect(response.status).toBe(405);
    expect(await response.json()).toMatchObject({
      status: 'method_not_allowed',
      allowedMethods: ['GET'],
    });
  });

  it('returns 401 when no bearer token is present', async () => {
    const response = await handleWorkerAdminPendingSheltersRequest({
      request: baseRequest('GET', null),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ status: 'unauthenticated' });
  });

  it('returns 501 when authenticator is not configured', async () => {
    const response = await handleWorkerAdminPendingSheltersRequest({
      request: baseRequest(),
    });

    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({ status: 'auth_adapter_not_configured' });
  });

  it('returns 401 when authenticator returns null', async () => {
    const response = await handleWorkerAdminPendingSheltersRequest({
      request: baseRequest(),
      authenticator: makeAuth(null),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ status: 'unauthenticated' });
  });

  it('returns 403 for non-admin actors', async () => {
    const response = await handleWorkerAdminPendingSheltersRequest({
      request: baseRequest(),
      authenticator: makeAuth(makeActor('shelter_owner')),
      adminPendingSheltersRepository: makeRepo(),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ status: 'forbidden' });
  });

  it('returns 501 when repository is not configured after admin authorization', async () => {
    const response = await handleWorkerAdminPendingSheltersRequest({
      request: baseRequest(),
      authenticator: makeAuth(makeActor('admin')),
    });

    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({
      status: 'admin_pending_shelters_repository_not_configured',
    });
  });

  it('returns pending shelters and passes parsed pagination to repository', async () => {
    const calls: Parameters<AdminPendingSheltersRepository['listPendingShelters']>[0][] = [];
    const shelter = makeShelter();

    const response = await handleWorkerAdminPendingSheltersRequest({
      request: baseRequest(
        'GET',
        'valid-token',
        'https://worker.test/shelters/pending-verification?limit=10&offset=5',
      ),
      authenticator: makeAuth(makeActor('admin')),
      adminPendingSheltersRepository: {
        listPendingShelters: async (query) => {
          calls.push(query);
          return { shelters: [shelter], total: 1 };
        },
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', shelters: [shelter], total: 1 });
    expect(calls).toEqual([{ limit: 10, offset: 5 }]);
  });

  it('defaults invalid pagination and clamps limit to 50', async () => {
    const calls: Parameters<AdminPendingSheltersRepository['listPendingShelters']>[0][] = [];

    await handleWorkerAdminPendingSheltersRequest({
      request: baseRequest(
        'GET',
        'valid-token',
        'https://worker.test/shelters/pending-verification?limit=999&offset=-2',
      ),
      authenticator: makeAuth(makeActor('admin')),
      adminPendingSheltersRepository: {
        listPendingShelters: async (query) => {
          calls.push(query);
          return { shelters: [], total: 0 };
        },
      },
    });

    expect(calls).toEqual([{ limit: 50, offset: 0 }]);
  });

  it('response body never contains credential markers', async () => {
    const response = await handleWorkerAdminPendingSheltersRequest({
      request: baseRequest(),
      authenticator: makeAuth(makeActor('admin')),
      adminPendingSheltersRepository: makeRepo(),
    });

    const serialized = JSON.stringify(await response.json());
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('Bearer ');
  });

  it('is routed by handleWorkerRequest before the public shelter profile route', async () => {
    const loadShelterProfile = vi.fn();
    const response = await handleWorkerRequest(
      baseRequest(),
      validEnv,
      {
        petDraftAuthenticator: makeAuth(makeActor('admin')),
        adminPendingSheltersRepository: makeRepo({ shelters: [], total: 0 }),
        shelterProfileRepository: { loadShelterProfile },
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', shelters: [], total: 0 });
    expect(loadShelterProfile).not.toHaveBeenCalled();
  });
});
