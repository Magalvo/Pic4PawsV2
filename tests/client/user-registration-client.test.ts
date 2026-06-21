import { describe, expect, it, vi } from 'vitest';
import { createUserRegistrationClient } from '../../packages/client/src/index';
import type { UserRegistrationClientInput } from '../../packages/client/src/index';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const makeFetchThrow = () => vi.fn().mockRejectedValue(new Error('Network error'));

const makeClient = (fetch: ReturnType<typeof vi.fn>) =>
  createUserRegistrationClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    usersPath: '/users',
    fetch: fetch as never,
  });

const validInput: UserRegistrationClientInput = {
  email: 'maria@exemplo.pt',
  password: 'senha-de-teste-valida',
  displayName: 'Maria Silva',
  gdprConsentVersion: 'v1',
};

describe('createUserRegistrationClient', () => {
  it('returns registered on 201 response', async () => {
    const result = await makeClient(makeFetch(201, { status: 'created' })).registerUser(validInput);

    expect(result.ok).toBe(true);
    expect(result.status).toBe('registered');
  });

  it('sends POST to {workerBaseUrl}{usersPath}/register', async () => {
    const fetch = makeFetch(201, { status: 'created' });
    await makeClient(fetch).registerUser(validInput);

    const calledUrl = fetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://workers.pic4paws.pt/users/register');

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    expect(calledInit.method).toBe('POST');
  });

  it('does not send an Authorization header (public endpoint)', async () => {
    const fetch = makeFetch(201, { status: 'created' });
    await makeClient(fetch).registerUser(validInput);

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('sends JSON body with all registration fields', async () => {
    const fetch = makeFetch(201, { status: 'created' });
    await makeClient(fetch).registerUser(validInput);

    const calledInit = fetch.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(calledInit.body as string) as Record<string, unknown>;
    expect(body.email).toBe('maria@exemplo.pt');
    expect(body.password).toBe('senha-de-teste-valida');
    expect(body.displayName).toBe('Maria Silva');
    expect(body.gdprConsentVersion).toBe('v1');
  });

  it('returns worker_response_invalid on 201 with unexpected body', async () => {
    const result = await makeClient(makeFetch(201, { status: 'unexpected' })).registerUser(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('worker_response_invalid');
  });

  it('returns email_already_registered on 409', async () => {
    const result = await makeClient(
      makeFetch(409, { status: 'email_already_registered' }),
    ).registerUser(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('email_already_registered');
  });

  it('returns invalid_payload on 400 and passes through reasons', async () => {
    const result = await makeClient(
      makeFetch(400, { status: 'invalid_payload', reasons: ['email_invalid', 'password_too_short'] }),
    ).registerUser(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('invalid_payload');
    if (!result.ok) {
      expect(result.reasons).toContain('email_invalid');
      expect(result.reasons).toContain('password_too_short');
    }
  });

  it('returns user_registration_repository_not_configured on 501', async () => {
    const result = await makeClient(
      makeFetch(501, { status: 'user_registration_repository_not_configured' }),
    ).registerUser(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('user_registration_repository_not_configured');
  });

  it('returns worker_request_failed on network error', async () => {
    const result = await makeClient(makeFetchThrow()).registerUser(validInput);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('worker_request_failed');
    if (!result.ok) expect(result.reasons).toContain('network_error');
  });

  it('sanitizes unsafe service-role patterns from failure reasons', async () => {
    const result = await makeClient(
      makeFetch(500, {
        status: 'worker_request_failed',
        reasons: ['error', 'service-role-key', 'bearer token-value'],
      }),
    ).registerUser(validInput);

    expect(result.ok).toBe(false);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
