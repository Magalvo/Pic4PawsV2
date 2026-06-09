import type { WorkerPetDraftAuthenticator } from './pet-drafts';

// ─── Repository types ─────────────────────────────────────────────────────────

export type NotificationType =
  | 'adoption_status_changed'
  | 'new_adoption_application'
  | 'donation_paid'
  | 'sponsorship_status_changed';

export type NotificationRecord = {
  notificationId: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type ListNotificationsQuery = {
  limit: number;
  offset: number;
};

export type ListNotificationsResult = {
  notifications: NotificationRecord[];
  total: number;
  unreadCount: number;
};

export type NotificationRepository = {
  listNotifications: (userId: string, query: ListNotificationsQuery) => Promise<ListNotificationsResult>;
  markNotificationRead: (notificationId: string, userId: string) => Promise<boolean>;
  notifyAdoptionStatusChanged: (input: {
    applicantUserId: string;
    applicationId: string;
    newStatus: string;
  }) => Promise<void>;
  notifyNewAdoptionApplication: (input: {
    shelterId: string;
    applicationId: string;
    petId: string;
    applicantName: string;
  }) => Promise<void>;
  notifyDonationPaid: (input: {
    providerPaymentId: string;
    provider: string;
  }) => Promise<void>;
  notifySponsorshipStatusChanged: (input: {
    donorUserId: string;
    sponsorshipId: string;
    newStatus: string;
  }) => Promise<void>;
};

// ─── Path matchers ────────────────────────────────────────────────────────────

export const matchWorkerNotificationsPath = (
  pathname: string,
  notificationsPath: string,
): boolean => pathname === notificationsPath;

/**
 * Extracts notificationId from `{notificationsPath}/{notificationId}/read`.
 * Returns null for any non-matching shape.
 *
 * Examples (notificationsPath = '/notifications'):
 *   /notifications/abc-123/read      → 'abc-123'
 *   /notifications                   → null
 *   /notifications/abc-123           → null  (no /read suffix)
 *   /notifications/abc-123/read/x    → null  (extra segment)
 *   /adoptions/abc-123/read          → null  (wrong prefix)
 */
export const matchWorkerNotificationReadId = (
  pathname: string,
  notificationsPath: string,
): string | null => {
  const prefix = notificationsPath.endsWith('/') ? notificationsPath : `${notificationsPath}/`;

  if (!pathname.startsWith(prefix)) return null;

  const rest = pathname.slice(prefix.length);
  const parts = rest.split('/');

  if (parts.length !== 2 || parts[1] !== 'read' || !parts[0]) return null;

  return parts[0];
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export type HandleWorkerNotificationListRequestInput = {
  request: Request;
  notificationRepository?: NotificationRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerNotificationListRequest = async ({
  request,
  notificationRepository,
  authenticator,
}: HandleWorkerNotificationListRequestInput): Promise<Response> => {
  if (request.method !== 'GET') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET'] },
      { status: 405, headers: { Allow: 'GET' } },
    );
  }

  const bearerToken = extractBearerToken(request);
  if (!bearerToken) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  if (!authenticator) {
    return jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 });
  }

  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await authenticator({ request, authorizationHeader, bearerToken });
  if (!actor) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  if (!notificationRepository) {
    return jsonResponse({ status: 'notification_repository_not_configured' }, { status: 501 });
  }

  const url = new URL(request.url);
  const rawLimit = parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
  const rawOffset = parseInt(url.searchParams.get('offset') ?? '0', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

  const result = await notificationRepository.listNotifications(actor.id, { limit, offset });

  return jsonResponse(
    {
      status: 'ok',
      notifications: result.notifications,
      total: result.total,
      unreadCount: result.unreadCount,
    },
    { status: 200 },
  );
};

export type HandleWorkerNotificationReadRequestInput = {
  request: Request;
  notificationId: string;
  notificationRepository?: NotificationRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerNotificationReadRequest = async ({
  request,
  notificationId,
  notificationRepository,
  authenticator,
}: HandleWorkerNotificationReadRequestInput): Promise<Response> => {
  if (request.method !== 'PATCH') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['PATCH'] },
      { status: 405, headers: { Allow: 'PATCH' } },
    );
  }

  const bearerToken = extractBearerToken(request);
  if (!bearerToken) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  if (!authenticator) {
    return jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 });
  }

  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await authenticator({ request, authorizationHeader, bearerToken });
  if (!actor) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  if (!notificationRepository) {
    return jsonResponse({ status: 'notification_repository_not_configured' }, { status: 501 });
  }

  const found = await notificationRepository.markNotificationRead(notificationId, actor.id);

  if (!found) {
    return jsonResponse({ status: 'notification_not_found' }, { status: 404 });
  }

  return jsonResponse({ status: 'notification_marked_read', notificationId }, { status: 200 });
};
