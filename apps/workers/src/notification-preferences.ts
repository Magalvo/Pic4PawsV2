import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { NotificationType } from './notification';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationPreference = {
  type: NotificationType;
  enabled: boolean;
};

export type GetNotificationPreferencesResult = {
  preferences: NotificationPreference[];
};

export type NotificationPreferencesRepository = {
  getPreferences: (userId: string) => Promise<GetNotificationPreferencesResult>;
  updatePreferences: (
    userId: string,
    preferences: NotificationPreference[],
  ) => Promise<GetNotificationPreferencesResult>;
};

// ─── Path matcher ─────────────────────────────────────────────────────────────

export const matchWorkerNotificationPreferencesPath = (
  pathname: string,
  notificationsPath: string,
): boolean => pathname === `${notificationsPath}/preferences`;

// ─── Handlers ─────────────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

export type HandleWorkerNotificationPreferencesRequestInput = {
  request: Request;
  notificationPreferencesRepository?: NotificationPreferencesRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerNotificationPreferencesRequest = async ({
  request,
  notificationPreferencesRepository,
  authenticator,
}: HandleWorkerNotificationPreferencesRequestInput): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'PATCH') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET', 'PATCH'] },
      { status: 405, headers: { Allow: 'GET, PATCH' } },
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

  if (!notificationPreferencesRepository) {
    return jsonResponse(
      { status: 'notification_preferences_repository_not_configured' },
      { status: 501 },
    );
  }

  if (request.method === 'GET') {
    const result = await notificationPreferencesRepository.getPreferences(actor.id);
    return jsonResponse({ status: 'ok', preferences: result.preferences }, { status: 200 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ status: 'invalid_body' }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !Array.isArray((body as Record<string, unknown>).preferences)
  ) {
    return jsonResponse({ status: 'invalid_body' }, { status: 400 });
  }

  const preferences = (body as { preferences: NotificationPreference[] }).preferences;
  const result = await notificationPreferencesRepository.updatePreferences(actor.id, preferences);
  return jsonResponse({ status: 'ok', preferences: result.preferences }, { status: 200 });
};
