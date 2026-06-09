import { describe, expect, it, vi } from 'vitest';
import { handleWorkerRequest } from '../../apps/workers/src/index';
import type {
  NotificationPreferencesRepository,
  NotificationPreference,
} from '../../apps/workers/src/index';
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
  WORKER_MEDIA_UPLOAD_PATH: '/uploads/media',
  WORKER_PET_DRAFTS_PATH: '/pets/drafts',
  WORKER_PET_FEED_PATH: '/pets',
  WORKER_SHELTER_PATH: '/shelters',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const authedRequest = (method: string, url: string, body?: unknown) =>
  new Request(url, {
    method,
    headers: {
      Authorization: 'Bearer user-token',
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

const allEnabledPreferences: NotificationPreference[] = [
  { type: 'adoption_status_changed', enabled: true },
  { type: 'new_adoption_application', enabled: true },
  { type: 'donation_paid', enabled: true },
  { type: 'sponsorship_status_changed', enabled: true },
];

const makeRepo = (
  preferences: NotificationPreference[] = allEnabledPreferences,
): NotificationPreferencesRepository => ({
  getPreferences: vi.fn().mockResolvedValue({ preferences }),
  updatePreferences: vi.fn().mockResolvedValue({ preferences }),
});

const makeAuthenticator = () =>
  vi.fn().mockResolvedValue({ id: 'user-1', email: 'user@example.com' });

describe('GET /notifications/preferences', () => {
  it('returns 200 with all 4 preferences', async () => {
    const repo = makeRepo();
    const request = authedRequest('GET', 'https://workers.pic4paws.pt/notifications/preferences');

    const response = await handleWorkerRequest(request, validEnv, {
      notificationPreferencesRepository: repo,
      petDraftAuthenticator: makeAuthenticator(),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(Array.isArray(body.preferences)).toBe(true);
    expect(body.preferences).toHaveLength(4);
  });

  it('passes userId from auth token to repository', async () => {
    const repo = makeRepo();
    const authenticator = makeAuthenticator();
    const request = authedRequest('GET', 'https://workers.pic4paws.pt/notifications/preferences');

    await handleWorkerRequest(request, validEnv, {
      notificationPreferencesRepository: repo,
      petDraftAuthenticator: authenticator,
    });

    expect(repo.getPreferences).toHaveBeenCalledWith('user-1');
  });

  it('returns 401 when no bearer token', async () => {
    const repo = makeRepo();
    const request = new Request('https://workers.pic4paws.pt/notifications/preferences');

    const response = await handleWorkerRequest(request, validEnv, {
      notificationPreferencesRepository: repo,
      petDraftAuthenticator: makeAuthenticator(),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when notificationPreferencesRepository not injected', async () => {
    const request = authedRequest('GET', 'https://workers.pic4paws.pt/notifications/preferences');

    const response = await handleWorkerRequest(request, validEnv, {
      petDraftAuthenticator: makeAuthenticator(),
    });
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(body.status).toBe('notification_preferences_repository_not_configured');
  });

  it('does not route /notifications/preferences to the notification list handler', async () => {
    const repo = makeRepo();
    const notifRepo = { listNotifications: vi.fn(), markNotificationRead: vi.fn(), notifyAdoptionStatusChanged: vi.fn(), notifyNewAdoptionApplication: vi.fn(), notifyDonationPaid: vi.fn(), notifySponsorshipStatusChanged: vi.fn() };
    const request = authedRequest('GET', 'https://workers.pic4paws.pt/notifications/preferences');

    await handleWorkerRequest(request, validEnv, {
      notificationPreferencesRepository: repo,
      notificationRepository: notifRepo,
      petDraftAuthenticator: makeAuthenticator(),
    });

    expect(notifRepo.listNotifications).not.toHaveBeenCalled();
  });
});

describe('PATCH /notifications/preferences', () => {
  it('returns 200 with updated preferences', async () => {
    const updated: NotificationPreference[] = [
      { type: 'adoption_status_changed', enabled: false },
      { type: 'new_adoption_application', enabled: true },
      { type: 'donation_paid', enabled: true },
      { type: 'sponsorship_status_changed', enabled: true },
    ];
    const repo = makeRepo(updated);
    const request = authedRequest(
      'PATCH',
      'https://workers.pic4paws.pt/notifications/preferences',
      { preferences: updated },
    );

    const response = await handleWorkerRequest(request, validEnv, {
      notificationPreferencesRepository: repo,
      petDraftAuthenticator: makeAuthenticator(),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.preferences).toEqual(updated);
  });

  it('passes userId and preferences to repository', async () => {
    const repo = makeRepo();
    const prefs: NotificationPreference[] = [
      { type: 'donation_paid', enabled: false },
      { type: 'adoption_status_changed', enabled: true },
      { type: 'new_adoption_application', enabled: true },
      { type: 'sponsorship_status_changed', enabled: true },
    ];
    const request = authedRequest(
      'PATCH',
      'https://workers.pic4paws.pt/notifications/preferences',
      { preferences: prefs },
    );

    await handleWorkerRequest(request, validEnv, {
      notificationPreferencesRepository: repo,
      petDraftAuthenticator: makeAuthenticator(),
    });

    expect(repo.updatePreferences).toHaveBeenCalledWith('user-1', prefs);
  });

  it('returns 400 when body is missing preferences field', async () => {
    const repo = makeRepo();
    const request = authedRequest(
      'PATCH',
      'https://workers.pic4paws.pt/notifications/preferences',
      { wrong: 'field' },
    );

    const response = await handleWorkerRequest(request, validEnv, {
      notificationPreferencesRepository: repo,
      petDraftAuthenticator: makeAuthenticator(),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe('invalid_body');
  });

  it('returns 405 for DELETE /notifications/preferences', async () => {
    const repo = makeRepo();
    const request = authedRequest(
      'DELETE',
      'https://workers.pic4paws.pt/notifications/preferences',
    );

    const response = await handleWorkerRequest(request, validEnv, {
      notificationPreferencesRepository: repo,
      petDraftAuthenticator: makeAuthenticator(),
    });
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.allowedMethods).toEqual(['GET', 'PATCH']);
  });

  it('response body never contains credential markers', async () => {
    const repo = makeRepo();
    const request = authedRequest('GET', 'https://workers.pic4paws.pt/notifications/preferences');

    const response = await handleWorkerRequest(request, validEnv, {
      notificationPreferencesRepository: repo,
      petDraftAuthenticator: makeAuthenticator(),
    });
    const serialized = JSON.stringify(await response.json());

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2-access-key');
  });
});
