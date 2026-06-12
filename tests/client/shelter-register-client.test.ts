import { describe, expect, it, vi } from 'vitest';
import { createShelterRegistrationClient } from '../../packages/client/src/index';
import type {
  ShelterRegistrationClientInput,
} from '../../packages/client/src/index';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const makeFetchThrow = () =>
  vi.fn().mockRejectedValue(new Error('Network error'));

const validToken = 'valid-access-token';

const makeClient = (
  fetch: ReturnType<typeof vi.fn>,
  getAccessToken: () => Promise<string | null> = () => Promise.resolve(validToken),
) =>
  createShelterRegistrationClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    shelterPath: '/shelters',
    getAccessToken,
    fetch: fetch as never,
  });

const validInput: ShelterRegistrationClientInput = {
  name: 'Canil de Lisboa',
  kind: 'shelter',
  city: 'Lisboa',
};

const successBody = {
  status: 'created',
  shelterId: 'shelter-abc',
};

describe('createShelterRegistrationClient', () => {
  it('returns registered with shelterId on 201 response', async () => {
    const fetch = makeFetch(201, successBody);
    const result = await makeClient(fetch).registerShelter(validInput);

    expect(result.ok).toBe(true);
    expect(result.status).toBe('registered');
    if (result.ok) expect(result.shelterId).toBe('shelter-abc');
  });

  it('sends POST to {workerBaseUrl}{shelterPath}', async () => {
    const fetch = makeFetch(201, successBody);
    await makeClient(fetch).registerShelter(validInput);

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://workers.pic4paws.pt/shelters');

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    expect(calledInit.method).toBe('POST');
  });

  it('sends Authorization Bearer header', async () => {
    const fetch = makeFetch(201, successBody);
    await makeClient(fetch).registerShelter(validInput);

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${validToken}`);
  });

  it('sends JSON body with registration fields', async () => {
    const fetch = makeFetch(201, successBody);
    await makeClient(fetch).registerShelter({
      ...validInput,
      publicEmail: 'info@canil.pt',
      district: 'Lisboa',
    });

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(calledInit.body as string) as Record<string, unknown>;
    expect(body.name).toBe('Canil de Lisboa');
    expect(body.kind).toBe('shelter');
    expect(body.city).toBe('Lisboa');
    expect(body.publicEmail).toBe('info@canil.pt');
    expect(body.district).toBe('Lisboa');
  });

  it('returns unauthenticated when getAccessToken returns null', async () => {
    const fetch = makeFetch(201, successBody);
    const result = await makeClient(fetch, () => Promise.resolve(null)).registerShelter(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns unauthenticated on 401 response', async () => {
    const fetch = makeFetch(401, { status: 'unauthenticated' });
    const result = await makeClient(fetch).registerShelter(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('unauthenticated');
  });

  it('returns invalid_payload on 400 response', async () => {
    const fetch = makeFetch(400, { status: 'invalid_payload', reasons: ['name_required'] });
    const result = await makeClient(fetch).registerShelter(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('invalid_payload');
  });

  it('returns auth_adapter_not_configured on 501 with that status', async () => {
    const fetch = makeFetch(501, { status: 'auth_adapter_not_configured' });
    const result = await makeClient(fetch).registerShelter(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('auth_adapter_not_configured');
  });

  it('returns shelter_registration_repository_not_configured on 501 with that status', async () => {
    const fetch = makeFetch(501, { status: 'shelter_registration_repository_not_configured' });
    const result = await makeClient(fetch).registerShelter(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('shelter_registration_repository_not_configured');
  });

  it('returns worker_request_failed on network error', async () => {
    const result = await makeClient(makeFetchThrow()).registerShelter(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('worker_request_failed');
    if (!result.ok) expect(result.reasons).toContain('network_error');
  });

  it('sanitizes unsafe service-role patterns from failure reasons', async () => {
    const fetch = makeFetch(500, {
      status: 'worker_request_failed',
      reasons: ['error', 'service-role-key', 'bearer token-value'],
    });
    const result = await makeClient(fetch).registerShelter(validInput);

    expect(result.ok).toBe(false);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
