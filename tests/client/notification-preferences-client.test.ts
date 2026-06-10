import { describe, expect, it, vi } from 'vitest';
import { createNotificationPreferencesClient } from '../../packages/client/src/index';
import type { NotificationPreferenceItem } from '../../packages/client/src/index';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const allPreferences: NotificationPreferenceItem[] = [
  { type: 'adoption_status_changed', enabled: true },
  { type: 'new_adoption_application', enabled: true },
  { type: 'donation_paid', enabled: true },
  { type: 'sponsorship_status_changed', enabled: true },
];

const makeClient = (fetch: ReturnType<typeof vi.fn>, token: string | null = 'user-token') =>
  createNotificationPreferencesClient({
    workerBaseUrl: 'https://workers.pic4paws.pt',
    notificationsPath: '/notifications',
    getAccessToken: async () => token,
    fetch: fetch as never,
  });

describe('NotificationPreferencesClient — loadPreferences', () => {
  it('returns ok with all 4 preferences on 200 GET', async () => {
    const fetch = makeFetch(200, { status: 'ok', preferences: allPreferences });

    const result = await makeClient(fetch).loadPreferences();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.preferences).toHaveLength(4);
      expect(result.status).toBe('ok');
    }
  });

  it('sends GET to /notifications/preferences', async () => {
    const fetch = makeFetch(200, { status: 'ok', preferences: allPreferences });

    await makeClient(fetch).loadPreferences();

    const url = fetch.mock.calls[0][0] as string;
    expect(new URL(url).pathname).toBe('/notifications/preferences');
    expect(fetch.mock.calls[0][1]?.method).toBe('GET');
  });

  it('includes Authorization header', async () => {
    const fetch = makeFetch(200, { status: 'ok', preferences: allPreferences });

    await makeClient(fetch).loadPreferences();

    expect(fetch.mock.calls[0][1]?.headers?.Authorization).toBe('Bearer user-token');
  });

  it('returns unauthenticated when getAccessToken returns null', async () => {
    const fetch = makeFetch(200, { status: 'ok', preferences: allPreferences });

    const result = await makeClient(fetch, null).loadPreferences();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('returns worker_request_failed on network error', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('network failure'));

    const result = await makeClient(fetch).loadPreferences();

    expect(result).toMatchObject({ ok: false, status: 'worker_request_failed', reasons: ['network_error'] });
  });

  it('returns worker_response_invalid on malformed 200', async () => {
    const fetch = makeFetch(200, { status: 'ok', notPreferences: true });

    const result = await makeClient(fetch).loadPreferences();

    expect(result).toMatchObject({ ok: false, status: 'worker_response_invalid' });
  });
});

describe('NotificationPreferencesClient — updatePreferences', () => {
  it('returns ok with updated preferences on 200 PATCH', async () => {
    const updated: NotificationPreferenceItem[] = [
      { type: 'adoption_status_changed', enabled: false },
      { type: 'new_adoption_application', enabled: true },
      { type: 'donation_paid', enabled: true },
      { type: 'sponsorship_status_changed', enabled: true },
    ];
    const fetch = makeFetch(200, { status: 'ok', preferences: updated });

    const result = await makeClient(fetch).updatePreferences(updated);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.preferences[0].enabled).toBe(false);
    }
  });

  it('sends PATCH to /notifications/preferences with preferences in body', async () => {
    const fetch = makeFetch(200, { status: 'ok', preferences: allPreferences });

    await makeClient(fetch).updatePreferences(allPreferences);

    const url = fetch.mock.calls[0][0] as string;
    expect(new URL(url).pathname).toBe('/notifications/preferences');
    expect(fetch.mock.calls[0][1]?.method).toBe('PATCH');
    const sentBody = JSON.parse(fetch.mock.calls[0][1]?.body as string);
    expect(sentBody.preferences).toEqual(allPreferences);
  });

  it('returns unauthenticated when getAccessToken returns null', async () => {
    const fetch = makeFetch(200, { status: 'ok', preferences: allPreferences });

    const result = await makeClient(fetch, null).updatePreferences(allPreferences);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe('unauthenticated');
  });

  it('strips credential markers from failure reasons', async () => {
    const fetch = makeFetch(500, { status: 'error', reasons: ['service-role-secret', 'bearer abc'] });

    const result = await makeClient(fetch).updatePreferences(allPreferences);
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc');
  });
});
