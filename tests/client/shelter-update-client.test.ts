import { describe, expect, it, vi } from 'vitest';
import { createShelterUpdateClient } from '../../packages/client/src/index';
import type { ShelterUpdateClientInput } from '../../packages/client/src/index';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const makeFetchThrow = () => vi.fn().mockRejectedValue(new Error('Network error'));

const validToken = 'valid-access-token';

const makeClient = (
  fetch: ReturnType<typeof vi.fn>,
  getAccessToken: () => Promise<string | null> = () => Promise.resolve(validToken),
) =>
  createShelterUpdateClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    shelterPath: '/shelters',
    getAccessToken,
    fetch: fetch as never,
  });

const validInput: ShelterUpdateClientInput = { name: 'Canil Atualizado' };
const successBody = { status: 'updated', shelterId: 'shelter-abc' };

describe('createShelterUpdateClient', () => {
  it('returns updated with shelterId on 200 response', async () => {
    const fetch = makeFetch(200, successBody);
    const result = await makeClient(fetch).updateShelter('shelter-abc', validInput);

    expect(result.ok).toBe(true);
    expect(result.status).toBe('updated');
    if (result.ok) expect(result.shelterId).toBe('shelter-abc');
  });

  it('sends PATCH to {workerBaseUrl}{shelterPath}/{shelterId}', async () => {
    const fetch = makeFetch(200, successBody);
    await makeClient(fetch).updateShelter('shelter-abc', validInput);

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://workers.pic4paws.pt/shelters/shelter-abc');

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    expect(calledInit.method).toBe('PATCH');
  });

  it('sends Authorization Bearer header', async () => {
    const fetch = makeFetch(200, successBody);
    await makeClient(fetch).updateShelter('shelter-abc', validInput);

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${validToken}`);
  });

  it('sends the input as JSON body', async () => {
    const fetch = makeFetch(200, successBody);
    await makeClient(fetch).updateShelter('shelter-abc', {
      name: 'Nome',
      city: 'Lisboa',
      description: null,
    });

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(calledInit.body as string) as Record<string, unknown>;
    expect(body.name).toBe('Nome');
    expect(body.city).toBe('Lisboa');
    expect(body.description).toBeNull();
  });

  it('returns unauthenticated when getAccessToken returns null', async () => {
    const fetch = makeFetch(200, successBody);
    const result = await makeClient(fetch, () => Promise.resolve(null)).updateShelter('shelter-abc', validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns unauthenticated on 401', async () => {
    const fetch = makeFetch(401, { status: 'unauthenticated' });
    const result = await makeClient(fetch).updateShelter('shelter-abc', validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns forbidden on 403', async () => {
    const fetch = makeFetch(403, { status: 'forbidden' });
    const result = await makeClient(fetch).updateShelter('shelter-abc', validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('forbidden');
  });

  it('returns invalid_payload on 400', async () => {
    const fetch = makeFetch(400, { status: 'invalid_payload', reasons: ['no_fields_provided'] });
    const result = await makeClient(fetch).updateShelter('shelter-abc', validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('invalid_payload');
  });

  it('returns shelter_not_found on 404', async () => {
    const fetch = makeFetch(404, { status: 'shelter_not_found' });
    const result = await makeClient(fetch).updateShelter('shelter-abc', validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('shelter_not_found');
  });

  it('returns shelter_update_repository_not_configured on 501 with that status', async () => {
    const fetch = makeFetch(501, { status: 'shelter_update_repository_not_configured' });
    const result = await makeClient(fetch).updateShelter('shelter-abc', validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('shelter_update_repository_not_configured');
  });

  it('returns worker_request_failed on network error', async () => {
    const result = await makeClient(makeFetchThrow()).updateShelter('shelter-abc', validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('worker_request_failed');
    if (!result.ok) expect(result.reasons).toContain('network_error');
  });

  it('sanitizes service-role and bearer patterns from failure reasons', async () => {
    const fetch = makeFetch(500, {
      status: 'worker_request_failed',
      reasons: ['error', 'service-role-key', 'bearer token-value'],
    });
    const result = await makeClient(fetch).updateShelter('shelter-abc', validInput);

    expect(result.ok).toBe(false);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
