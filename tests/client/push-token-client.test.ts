import { describe, expect, it, vi } from 'vitest';
import { createPushTokenClient } from '../../packages/client/src/index';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const makeClient = (fetch: ReturnType<typeof vi.fn>, token: string | null = 'device-token') =>
  createPushTokenClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    notificationsPath: '/notifications',
    getAccessToken: async () => token,
    fetch: fetch as never,
  });

// ─── registerToken ────────────────────────────────────────────────────────────

describe('PushTokenClient — registerToken', () => {
  it('returns ok push_token_registered on 200', async () => {
    const fetch = makeFetch(200, { status: 'push_token_registered' });

    const result = await makeClient(fetch).registerToken('ExponentPushToken[abc]', 'expo');

    expect(result).toMatchObject({ ok: true, status: 'push_token_registered' });
  });

  it('sends POST to /notifications/push-token', async () => {
    const fetch = makeFetch(200, { status: 'push_token_registered' });

    await makeClient(fetch).registerToken('ExponentPushToken[abc]', 'expo');

    const url = fetch.mock.calls[0][0] as string;
    expect(new URL(url).pathname).toBe('/notifications/push-token');
    expect(fetch.mock.calls[0][1]?.method).toBe('POST');
  });

  it('includes Authorization header and JSON body', async () => {
    const fetch = makeFetch(200, { status: 'push_token_registered' });

    await makeClient(fetch).registerToken('tok-ios', 'ios');

    const call = fetch.mock.calls[0][1] as RequestInit;
    expect((call.headers as Record<string, string>)?.Authorization).toBe('Bearer device-token');
    expect(JSON.parse(call.body as string)).toEqual({ token: 'tok-ios', platform: 'ios' });
  });

  it('sends correct platform for android', async () => {
    const fetch = makeFetch(200, { status: 'push_token_registered' });

    await makeClient(fetch).registerToken('android-tok', 'android');

    const body = JSON.parse(fetch.mock.calls[0][1]?.body as string);
    expect(body.platform).toBe('android');
  });

  it('returns unauthenticated when getAccessToken returns null', async () => {
    const fetch = makeFetch(200, { status: 'push_token_registered' });

    const result = await makeClient(fetch, null).registerToken('tok', 'expo');

    expect(result).toMatchObject({ ok: false, status: 'unauthenticated' });
  });

  it('returns worker_request_failed on network error', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));

    const result = await makeClient(fetch).registerToken('tok', 'expo');

    expect(result).toMatchObject({ ok: false, status: 'worker_request_failed', reasons: ['network_error'] });
  });

  it('returns invalid_payload on 400 with invalid_payload status', async () => {
    const fetch = makeFetch(400, { status: 'invalid_payload', reasons: ['platform_invalid'] });

    const result = await makeClient(fetch).registerToken('tok', 'expo');

    expect(result).toMatchObject({ ok: false, status: 'invalid_payload' });
  });

  it('returns push_token_repository_not_configured on 501', async () => {
    const fetch = makeFetch(501, { status: 'push_token_repository_not_configured' });

    const result = await makeClient(fetch).registerToken('tok', 'expo');

    expect(result).toMatchObject({ ok: false, status: 'push_token_repository_not_configured' });
  });

  it('returns worker_response_invalid on malformed 200', async () => {
    const fetch = makeFetch(200, { status: 'something_unexpected' });

    const result = await makeClient(fetch).registerToken('tok', 'expo');

    expect(result).toMatchObject({ ok: false, status: 'worker_response_invalid' });
  });

  it('strips credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, { status: 'error', reasons: ['bearer abc123', 'service-role-key'] });

    const result = await makeClient(fetch).registerToken('tok', 'expo');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('bearer abc123');
    expect(serialized).not.toContain('service-role-key');
  });
});

// ─── unregisterToken ──────────────────────────────────────────────────────────

describe('PushTokenClient — unregisterToken', () => {
  it('returns ok push_token_removed on 200', async () => {
    const fetch = makeFetch(200, { status: 'push_token_removed' });

    const result = await makeClient(fetch).unregisterToken('ExponentPushToken[abc]');

    expect(result).toMatchObject({ ok: true, status: 'push_token_removed' });
  });

  it('sends DELETE to /notifications/push-token', async () => {
    const fetch = makeFetch(200, { status: 'push_token_removed' });

    await makeClient(fetch).unregisterToken('ExponentPushToken[abc]');

    const url = fetch.mock.calls[0][0] as string;
    expect(new URL(url).pathname).toBe('/notifications/push-token');
    expect(fetch.mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('includes Authorization header and JSON body with token only', async () => {
    const fetch = makeFetch(200, { status: 'push_token_removed' });

    await makeClient(fetch).unregisterToken('my-token');

    const call = fetch.mock.calls[0][1] as RequestInit;
    expect((call.headers as Record<string, string>)?.Authorization).toBe('Bearer device-token');
    expect(JSON.parse(call.body as string)).toEqual({ token: 'my-token' });
  });

  it('returns push_token_not_found on 404', async () => {
    const fetch = makeFetch(404, { status: 'push_token_not_found' });

    const result = await makeClient(fetch).unregisterToken('unknown-tok');

    expect(result).toMatchObject({ ok: false, status: 'push_token_not_found' });
  });

  it('returns unauthenticated when getAccessToken returns null', async () => {
    const fetch = makeFetch(200, { status: 'push_token_removed' });

    const result = await makeClient(fetch, null).unregisterToken('tok');

    expect(result).toMatchObject({ ok: false, status: 'unauthenticated' });
  });

  it('returns worker_request_failed on network error', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));

    const result = await makeClient(fetch).unregisterToken('tok');

    expect(result).toMatchObject({ ok: false, status: 'worker_request_failed', reasons: ['network_error'] });
  });

  it('returns push_token_repository_not_configured on 501', async () => {
    const fetch = makeFetch(501, { status: 'push_token_repository_not_configured' });

    const result = await makeClient(fetch).unregisterToken('tok');

    expect(result).toMatchObject({ ok: false, status: 'push_token_repository_not_configured' });
  });

  it('returns worker_response_invalid on malformed 200', async () => {
    const fetch = makeFetch(200, { status: 'wrong_status' });

    const result = await makeClient(fetch).unregisterToken('tok');

    expect(result).toMatchObject({ ok: false, status: 'worker_response_invalid' });
  });

  it('strips credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, { status: 'error', reasons: ['service-role-key', 'bearer tok'] });

    const result = await makeClient(fetch).unregisterToken('tok');
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-key');
    expect(serialized).not.toContain('bearer tok');
  });
});
