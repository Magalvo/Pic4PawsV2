import { describe, expect, it, vi } from 'vitest';
import { createPetStatusHistoryClient } from '../../packages/client/src/index';
import type {
  PetStatusHistoryClient,
  PetStatusHistoryEvent,
} from '../../packages/client/src/index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WORKER_BASE = 'https://worker.test';
const PET_FEED_PATH = '/pets' as const;

const makeEvent = (overrides?: Partial<PetStatusHistoryEvent>): PetStatusHistoryEvent => ({
  id: 'event-001',
  petId: 'pet-001',
  shelterId: 'shelter-001',
  actorUserId: 'actor-001',
  fromStatus: 'published',
  toStatus: 'archived',
  createdAt: '2026-06-10T10:00:00Z',
  ...overrides,
});

const makeSuccessResponse = (petId: string, events: PetStatusHistoryEvent[]) =>
  new Response(
    JSON.stringify({ status: 'ok', petId, events }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );

const makeErrorResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const makeClient = (
  fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  token: string | null = 'access-token',
): PetStatusHistoryClient =>
  createPetStatusHistoryClient({
    workerBaseUrl: WORKER_BASE,
    petFeedPath: PET_FEED_PATH,
    getAccessToken: vi.fn().mockResolvedValue(token),
    fetch: fetchImpl as never,
  });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createPetStatusHistoryClient — unauthenticated', () => {
  it('returns unauthenticated when no access token', async () => {
    const client = makeClient(vi.fn(), null);
    const result = await client.loadStatusHistory('pet-001');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns unauthenticated when access token is empty string', async () => {
    const client = makeClient(vi.fn(), '');
    const result = await client.loadStatusHistory('pet-001');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });
});

describe('createPetStatusHistoryClient — network errors', () => {
  it('returns worker_request_failed on network error', async () => {
    const client = makeClient(() => Promise.reject(new Error('network down')));
    const result = await client.loadStatusHistory('pet-001');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('worker_request_failed');
  });
});

describe('createPetStatusHistoryClient — error responses', () => {
  it('returns unauthenticated on 401', async () => {
    const client = makeClient(() =>
      Promise.resolve(makeErrorResponse(401, { status: 'unauthenticated' })),
    );
    const result = await client.loadStatusHistory('pet-001');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns forbidden on 403', async () => {
    const client = makeClient(() =>
      Promise.resolve(makeErrorResponse(403, { status: 'forbidden' })),
    );
    const result = await client.loadStatusHistory('pet-001');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('forbidden');
  });

  it('returns pet_not_found on 404', async () => {
    const client = makeClient(() =>
      Promise.resolve(makeErrorResponse(404, { status: 'pet_not_found' })),
    );
    const result = await client.loadStatusHistory('pet-001');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('pet_not_found');
  });

  it('returns pet_archive_repository_not_configured on 501', async () => {
    const client = makeClient(() =>
      Promise.resolve(
        makeErrorResponse(501, { status: 'pet_archive_repository_not_configured' }),
      ),
    );
    const result = await client.loadStatusHistory('pet-001');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('pet_archive_repository_not_configured');
  });

  it('returns worker_request_failed on unexpected error status', async () => {
    const client = makeClient(() =>
      Promise.resolve(makeErrorResponse(500, { status: 'internal_error' })),
    );
    const result = await client.loadStatusHistory('pet-001');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('worker_request_failed');
  });
});

describe('createPetStatusHistoryClient — success', () => {
  it('returns ok with petId and events on 200', async () => {
    const events = [makeEvent()];
    const client = makeClient(() => Promise.resolve(makeSuccessResponse('pet-001', events)));
    const result = await client.loadStatusHistory('pet-001');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.petId).toBe('pet-001');
      expect(result.events).toHaveLength(1);
    }
  });

  it('returns empty events array when no history', async () => {
    const client = makeClient(() => Promise.resolve(makeSuccessResponse('pet-001', [])));
    const result = await client.loadStatusHistory('pet-001');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.events).toHaveLength(0);
  });

  it('returns event with correct shape', async () => {
    const event = makeEvent();
    const client = makeClient(() => Promise.resolve(makeSuccessResponse('pet-001', [event])));
    const result = await client.loadStatusHistory('pet-001');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const e = result.events[0];
      expect(e.fromStatus).toBe('published');
      expect(e.toStatus).toBe('archived');
      expect(e.actorUserId).toBe('actor-001');
      expect(e.createdAt).toBe('2026-06-10T10:00:00Z');
    }
  });

  it('calls the correct URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeSuccessResponse('pet-abc', []));
    const client = makeClient(fetchMock);
    await client.loadStatusHistory('pet-abc');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/pets/pet-abc/status-history'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('does not leak credentials in result', async () => {
    const client = makeClient(() => Promise.resolve(makeSuccessResponse('pet-001', [makeEvent()])));
    const result = await client.loadStatusHistory('pet-001');
    expect(JSON.stringify(result)).not.toContain('service-role');
    expect(JSON.stringify(result)).not.toContain('bearer ');
  });
});
