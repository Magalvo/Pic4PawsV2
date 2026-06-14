import { describe, expect, it, vi } from 'vitest';
import {
  handleWorkerNotificationListRequest,
  handleWorkerNotificationReadRequest,
  matchWorkerNotificationsPath,
  matchWorkerNotificationReadId,
} from '../../apps/workers/src/notification';
import type {
  NotificationRepository,
  NotificationRecord,
} from '../../apps/workers/src/notification';

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

const makeNotificationRecord = (
  overrides: Partial<NotificationRecord> = {},
): NotificationRecord => ({
  notificationId: 'notif-001',
  userId: 'user-001',
  type: 'adoption_status_changed',
  payload: { applicationId: 'app-001', newStatus: 'approved' },
  readAt: null,
  createdAt: '2026-01-01T12:00:00Z',
  ...overrides,
});

const makeRepo = (overrides: Partial<NotificationRepository> = {}): NotificationRepository => ({
  listNotifications: vi.fn().mockResolvedValue({
    notifications: [makeNotificationRecord()],
    total: 1,
    unreadCount: 1,
  }),
  markNotificationRead: vi.fn().mockResolvedValue(true),
  notifyAdoptionStatusChanged: vi.fn().mockResolvedValue(undefined),
  notifyNewAdoptionApplication: vi.fn().mockResolvedValue(undefined),
  notifyDonationPaid: vi.fn().mockResolvedValue(undefined),
  notifySponsorshipStatusChanged: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

// ─── matchWorkerNotificationsPath ────────────────────────────────────────────

describe('matchWorkerNotificationsPath', () => {
  it('returns true for exact notifications path', () => {
    expect(matchWorkerNotificationsPath('/notifications', '/notifications')).toBe(true);
  });

  it('returns false for sub-path', () => {
    expect(matchWorkerNotificationsPath('/notifications/abc', '/notifications')).toBe(false);
  });

  it('returns false for different path', () => {
    expect(matchWorkerNotificationsPath('/adoptions', '/notifications')).toBe(false);
  });
});

// ─── matchWorkerNotificationReadId ───────────────────────────────────────────

describe('matchWorkerNotificationReadId', () => {
  it('extracts id from /notifications/:id/read', () => {
    expect(matchWorkerNotificationReadId('/notifications/abc-123/read', '/notifications')).toBe(
      'abc-123',
    );
  });

  it('returns null for exact notifications path', () => {
    expect(matchWorkerNotificationReadId('/notifications', '/notifications')).toBeNull();
  });

  it('returns null for /notifications/:id (no /read suffix)', () => {
    expect(matchWorkerNotificationReadId('/notifications/abc-123', '/notifications')).toBeNull();
  });

  it('returns null for wrong prefix', () => {
    expect(matchWorkerNotificationReadId('/adoptions/abc-123/read', '/notifications')).toBeNull();
  });

  it('returns null for too many segments', () => {
    expect(
      matchWorkerNotificationReadId('/notifications/abc-123/read/extra', '/notifications'),
    ).toBeNull();
  });
});

// ─── handleWorkerNotificationListRequest ─────────────────────────────────────

describe('handleWorkerNotificationListRequest', () => {
  it('returns 200 with notifications on success', async () => {
    const request = makeRequest('GET', 'http://localhost/notifications', 'token');
    const response = await handleWorkerNotificationListRequest({
      request,
      notificationRepository: makeRepo(),
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      status: string;
      notifications: NotificationRecord[];
      total: number;
      unreadCount: number;
    };
    expect(body.status).toBe('ok');
    expect(Array.isArray(body.notifications)).toBe(true);
    expect(typeof body.total).toBe('number');
    expect(typeof body.unreadCount).toBe('number');
  });

  it('returns 401 when no bearer token', async () => {
    const request = new Request('http://localhost/notifications', { method: 'GET' });
    const response = await handleWorkerNotificationListRequest({
      request,
      notificationRepository: makeRepo(),
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when no authenticator', async () => {
    const request = makeRequest('GET', 'http://localhost/notifications', 'token');
    const response = await handleWorkerNotificationListRequest({
      request,
      notificationRepository: makeRepo(),
    });

    expect(response.status).toBe(501);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe('auth_adapter_not_configured');
  });

  it('returns 401 when authenticator returns null', async () => {
    const request = makeRequest('GET', 'http://localhost/notifications', 'token');
    const response = await handleWorkerNotificationListRequest({
      request,
      notificationRepository: makeRepo(),
      authenticator: makeAuthenticator(null),
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when no repository', async () => {
    const request = makeRequest('GET', 'http://localhost/notifications', 'token');
    const response = await handleWorkerNotificationListRequest({
      request,
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(response.status).toBe(501);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe('notification_repository_not_configured');
  });
});

// ─── handleWorkerNotificationReadRequest ─────────────────────────────────────

describe('handleWorkerNotificationReadRequest', () => {
  it('returns 200 on successful mark-read', async () => {
    const request = makeRequest(
      'PATCH',
      'http://localhost/notifications/notif-001/read',
      'token',
    );
    const response = await handleWorkerNotificationReadRequest({
      request,
      notificationId: 'notif-001',
      notificationRepository: makeRepo(),
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; notificationId: string };
    expect(body.status).toBe('notification_marked_read');
    expect(body.notificationId).toBe('notif-001');
  });

  it('returns 404 when notification not found', async () => {
    const request = makeRequest(
      'PATCH',
      'http://localhost/notifications/notif-999/read',
      'token',
    );
    const response = await handleWorkerNotificationReadRequest({
      request,
      notificationId: 'notif-999',
      notificationRepository: makeRepo({ markNotificationRead: vi.fn().mockResolvedValue(false) }),
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(response.status).toBe(404);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe('notification_not_found');
  });

  it('returns 401 when no bearer token', async () => {
    const request = new Request('http://localhost/notifications/notif-001/read', {
      method: 'PATCH',
    });
    const response = await handleWorkerNotificationReadRequest({
      request,
      notificationId: 'notif-001',
      notificationRepository: makeRepo(),
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe('unauthenticated');
  });

  it('returns 501 when no repository', async () => {
    const request = makeRequest(
      'PATCH',
      'http://localhost/notifications/notif-001/read',
      'token',
    );
    const response = await handleWorkerNotificationReadRequest({
      request,
      notificationId: 'notif-001',
      authenticator: makeAuthenticator(makeActor()),
    });

    expect(response.status).toBe(501);
    const body = (await response.json()) as { status: string };
    expect(body.status).toBe('notification_repository_not_configured');
  });
});

// ─── Dispatch side-effects ────────────────────────────────────────────────────

describe('dispatch side-effects', () => {
  it('adoptionStatus handler calls notifyAdoptionStatusChanged after update', async () => {
    const { handleWorkerAdoptionStatusRequest } = await import(
      '../../apps/workers/src/adoption-status'
    );
    const notifRepo = makeRepo();
    const adoptionStatusRepo = {
      getAdoptionForStatus: vi.fn().mockResolvedValue({
        applicationId: 'app-001',
        shelterId: 'shelter-001',
        currentStatus: 'submitted',
        applicantUserId: 'user-applicant',
      }),
      updateAdoptionStatus: vi.fn().mockResolvedValue(undefined),
    };
    const actor = {
      id: 'shelter-user',
      authUserId: 'auth-shelter',
      role: 'shelter_owner' as const,
      status: 'active' as const,
      memberships: [
        {
          id: 'mem-001',
          userId: 'shelter-user',
          shelterId: 'shelter-001',
          role: 'shelter_owner' as const,
          deletedAt: null,
        },
      ],
    };
    const request = new Request('http://localhost/adoptions/app-001', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer tok' },
    });

    await handleWorkerAdoptionStatusRequest({
      request,
      applicationId: 'app-001',
      payload: { status: 'approved' },
      adoptionStatusRepository: adoptionStatusRepo,
      authenticator: vi.fn().mockResolvedValue(actor),
      notificationRepository: notifRepo,
    });

    await vi.waitFor(() => {
      expect(notifRepo.notifyAdoptionStatusChanged).toHaveBeenCalledWith({
        applicantUserId: 'user-applicant',
        applicationId: 'app-001',
        newStatus: 'approved',
      });
    });
  });

  it('adoption handler calls notifyNewAdoptionApplication after create', async () => {
    const { handleWorkerAdoptionRequest } = await import('../../apps/workers/src/adoption');
    const notifRepo = makeRepo();
    const adoptionRepo = {
      loadPetForApplication: vi.fn().mockResolvedValue({ petId: 'pet-001', shelterId: 'shelter-001' }),
      createApplication: vi.fn().mockResolvedValue({
        applicationId: 'app-new',
        submittedAt: '2026-01-01T00:00:00Z',
      }),
    };
    const actor = {
      id: 'adopter-user',
      authUserId: 'auth-adopter',
      role: 'adopter' as const,
      status: 'active' as const,
      memberships: [],
    };
    const payload = {
      petId: 'pet-001',
      applicantFullName: 'João Silva',
      applicantEmail: 'joao@example.com',
      applicantPhoneNumber: '912345678',
      applicantCity: 'Lisboa',
      applicantDistrict: null,
      applicantPostalCode: null,
      housingType: 'apartment',
      hasOutdoorSpace: false,
      hasChildren: false,
      hasOtherAnimals: false,
      otherAnimalsDescription: null,
      previousPetExperience: 'tive um cão',
      dailyRoutine: 'trabalho em casa',
      adoptionMotivation: 'quero companhia',
      veterinarianContact: null,
      dataProcessingAccepted: true,
      shelterContactAccepted: true,
      consentVersion: '1.0',
      consentAcceptedAt: '2026-01-01T00:00:00Z',
    };
    const request = new Request('http://localhost/adoptions', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    await handleWorkerAdoptionRequest({
      request,
      payload,
      adoptionRepository: adoptionRepo,
      authenticator: vi.fn().mockResolvedValue(actor),
      notificationRepository: notifRepo,
      now: '2026-01-01T00:00:00Z',
    });

    await vi.waitFor(() => {
      expect(notifRepo.notifyNewAdoptionApplication).toHaveBeenCalledWith({
        shelterId: 'shelter-001',
        applicationId: 'app-new',
        petId: 'pet-001',
        applicantName: 'João Silva',
      });
    });
  });

  it('paymentWebhook handler calls notifyDonationPaid after update', async () => {
    const { handleWorkerPaymentWebhookRequest } = await import(
      '../../apps/workers/src/payment-webhook'
    );
    const notifRepo = makeRepo();
    const webhookRepo = {
      processVerifiedWebhookEvent: vi.fn().mockResolvedValue({
        alreadyProcessed: false,
        donationFound: true,
        previousStatus: 'pending_payment',
        newStatus: 'paid',
        processedAt: '2026-01-01T00:00:00Z',
        financialTimestamp: '2026-01-01T00:00:00Z',
        rawProviderEventIds: ['evt-001'],
      }),
    };
    const verifier = vi.fn().mockReturnValue({
      providerEventId: 'evt-001',
      providerPaymentId: 'pay-001',
      newStatus: 'paid',
      payload: {},
    });
    const request = new Request('http://localhost/webhooks/payments', {
      method: 'POST',
      headers: { 'x-eupago-signature': 'sig' },
    });

    await handleWorkerPaymentWebhookRequest({
      request,
      rawBody: '{}',
      provider: 'eupago',
      webhookSecret: 'secret',
      paymentWebhookVerifier: verifier,
      paymentWebhookRepository: webhookRepo,
      notificationRepository: notifRepo,
      now: '2026-01-01T00:00:00Z',
    });

    await vi.waitFor(() => {
      expect(notifRepo.notifyDonationPaid).toHaveBeenCalledWith({
        providerPaymentId: 'pay-001',
        provider: 'eupago',
      });
    });
  });

  it('sponsorshipManage handler calls notifySponsorshipStatusChanged after update', async () => {
    const { handleWorkerSponsorshipManageRequest } = await import(
      '../../apps/workers/src/sponsorship-manage'
    );
    const notifRepo = makeRepo();
    const sponsorshipRepo = {
      getSponsorshipForManage: vi.fn().mockResolvedValue({
        sponsorshipId: 'spon-001',
        shelterId: 'shelter-001',
        donorUserId: 'donor-user',
        currentStatus: 'active',
      }),
      updateSponsorshipStatus: vi.fn().mockResolvedValue(undefined),
    };
    const actor = {
      id: 'shelter-user',
      authUserId: 'auth-shelter',
      role: 'shelter_owner' as const,
      status: 'active' as const,
      memberships: [
        {
          id: 'mem-001',
          userId: 'shelter-user',
          shelterId: 'shelter-001',
          role: 'shelter_owner' as const,
          deletedAt: null,
        },
      ],
    };
    const request = new Request('http://localhost/sponsorships/spon-001', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer tok' },
    });

    await handleWorkerSponsorshipManageRequest({
      request,
      sponsorshipId: 'spon-001',
      payload: { status: 'cancelled' },
      sponsorshipManageRepository: sponsorshipRepo,
      authenticator: vi.fn().mockResolvedValue(actor),
      notificationRepository: notifRepo,
    });

    await vi.waitFor(() => {
      expect(notifRepo.notifySponsorshipStatusChanged).toHaveBeenCalledWith({
        donorUserId: 'donor-user',
        sponsorshipId: 'spon-001',
        newStatus: 'cancelled',
      });
    });
  });
});
