import {
  createWorkerUrl,
  createWorkerSubUrl,
  parseJsonResponse,
  parseReasons,
  sanitizeReasons,
  type MediaUploadClientFetch,
} from './_shared';

// ─── Notification Client types ────────────────────────────────────────────────

export type NotificationClientType =
  | 'adoption_status_changed'
  | 'new_adoption_application'
  | 'donation_paid'
  | 'sponsorship_status_changed';

export type NotificationSummary = {
  notificationId: string;
  type: NotificationClientType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type ListNotificationsClientSuccess = {
  ok: true;
  status: 'ok';
  notifications: NotificationSummary[];
  total: number;
  unreadCount: number;
};

export type ListNotificationsClientFailureStatus =
  | 'unauthenticated'
  | 'notification_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type ListNotificationsClientFailure = {
  ok: false;
  status: ListNotificationsClientFailureStatus;
  reasons: string[];
};

export type ListNotificationsClientResult =
  | ListNotificationsClientSuccess
  | ListNotificationsClientFailure;

export type MarkNotificationReadClientSuccess = {
  ok: true;
  status: 'notification_marked_read';
  notificationId: string;
};

export type MarkNotificationReadClientFailureStatus =
  | 'unauthenticated'
  | 'notification_not_found'
  | 'notification_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type MarkNotificationReadClientFailure = {
  ok: false;
  status: MarkNotificationReadClientFailureStatus;
  reasons: string[];
};

export type MarkNotificationReadClientResult =
  | MarkNotificationReadClientSuccess
  | MarkNotificationReadClientFailure;

export type ListNotificationsClientQuery = {
  limit?: number;
  offset?: number;
};

export type CreateNotificationClientInput = {
  workerBaseUrl: string;
  notificationsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type NotificationClient = {
  listNotifications: (
    query?: ListNotificationsClientQuery,
  ) => Promise<ListNotificationsClientResult>;
  markNotificationRead: (
    notificationId: string,
  ) => Promise<MarkNotificationReadClientResult>;
};

// ─── Notification Preferences types ──────────────────────────────────────────

export type NotificationPreferenceItem = {
  type: NotificationClientType;
  enabled: boolean;
};

export type LoadNotificationPreferencesClientSuccess = {
  ok: true;
  status: 'ok';
  preferences: NotificationPreferenceItem[];
};

export type LoadNotificationPreferencesClientFailureStatus =
  | 'unauthenticated'
  | 'notification_preferences_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type LoadNotificationPreferencesClientFailure = {
  ok: false;
  status: LoadNotificationPreferencesClientFailureStatus;
  reasons: string[];
};

export type LoadNotificationPreferencesClientResult =
  | LoadNotificationPreferencesClientSuccess
  | LoadNotificationPreferencesClientFailure;

export type UpdateNotificationPreferencesClientSuccess = {
  ok: true;
  status: 'ok';
  preferences: NotificationPreferenceItem[];
};

export type UpdateNotificationPreferencesClientFailureStatus =
  | 'unauthenticated'
  | 'invalid_body'
  | 'notification_preferences_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type UpdateNotificationPreferencesClientFailure = {
  ok: false;
  status: UpdateNotificationPreferencesClientFailureStatus;
  reasons: string[];
};

export type UpdateNotificationPreferencesClientResult =
  | UpdateNotificationPreferencesClientSuccess
  | UpdateNotificationPreferencesClientFailure;

export type CreateNotificationPreferencesClientInput = {
  workerBaseUrl: string;
  notificationsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type NotificationPreferencesClient = {
  loadPreferences: () => Promise<LoadNotificationPreferencesClientResult>;
  updatePreferences: (
    preferences: NotificationPreferenceItem[],
  ) => Promise<UpdateNotificationPreferencesClientResult>;
};

// ─── Private helpers ──────────────────────────────────────────────────────────

const parseListNotificationsSuccess = (
  body: Record<string, unknown> | null,
): ListNotificationsClientSuccess | null => {
  if (
    !body ||
    body.status !== 'ok' ||
    !Array.isArray(body.notifications) ||
    typeof body.total !== 'number' ||
    typeof body.unreadCount !== 'number'
  ) {
    return null;
  }

  return {
    ok: true,
    status: 'ok',
    notifications: body.notifications as NotificationSummary[],
    total: body.total,
    unreadCount: body.unreadCount,
  };
};

const parseListNotificationsFailureStatus = (
  body: Record<string, unknown> | null,
): ListNotificationsClientFailureStatus => {
  const status = body?.status;

  if (
    status === 'unauthenticated' ||
    status === 'notification_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parseMarkNotificationReadFailureStatus = (
  body: Record<string, unknown> | null,
  responseStatus: number,
): MarkNotificationReadClientFailureStatus => {
  const status = body?.status;

  if (responseStatus === 404 || status === 'notification_not_found') {
    return 'notification_not_found';
  }

  if (
    status === 'unauthenticated' ||
    status === 'notification_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }

  return 'worker_request_failed';
};

const parsePreferencesSuccess = (
  body: Record<string, unknown> | null,
): LoadNotificationPreferencesClientSuccess | null => {
  if (!body || body.status !== 'ok' || !Array.isArray(body.preferences)) return null;
  return { ok: true, status: 'ok', preferences: body.preferences as NotificationPreferenceItem[] };
};

const parseLoadPreferencesFailureStatus = (
  body: Record<string, unknown> | null,
): LoadNotificationPreferencesClientFailureStatus => {
  const status = body?.status;
  if (
    status === 'unauthenticated' ||
    status === 'notification_preferences_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }
  return 'worker_request_failed';
};

const parseUpdatePreferencesFailureStatus = (
  body: Record<string, unknown> | null,
): UpdateNotificationPreferencesClientFailureStatus => {
  const status = body?.status;
  if (status === 'invalid_body') return 'invalid_body';
  if (
    status === 'unauthenticated' ||
    status === 'notification_preferences_repository_not_configured' ||
    status === 'auth_adapter_not_configured'
  ) {
    return status;
  }
  return 'worker_request_failed';
};

// ─── Factory functions ────────────────────────────────────────────────────────

export const createNotificationClient = ({
  workerBaseUrl,
  notificationsPath,
  getAccessToken,
  fetch,
}: CreateNotificationClientInput): NotificationClient => ({
  listNotifications: async (query = {}) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const base = createWorkerUrl(workerBaseUrl, notificationsPath);
    const url = new URL(base);

    if (query.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query.offset != null) url.searchParams.set('offset', String(query.offset));

    let response: Response;

    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseListNotificationsFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parseListNotificationsSuccess(body);

    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },

  markNotificationRead: async (notificationId: string) => {
    const accessToken = await getAccessToken();

    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    let response: Response;

    try {
      response = await fetch(
        createWorkerSubUrl(workerBaseUrl, notificationsPath, notificationId, 'read'),
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseMarkNotificationReadFailureStatus(body, response.status);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];

      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    if (
      !body ||
      body.status !== 'notification_marked_read' ||
      typeof body.notificationId !== 'string'
    ) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return { ok: true, status: 'notification_marked_read', notificationId: body.notificationId };
  },
});

export const createNotificationPreferencesClient = ({
  workerBaseUrl,
  notificationsPath,
  getAccessToken,
  fetch,
}: CreateNotificationPreferencesClientInput): NotificationPreferencesClient => ({
  loadPreferences: async () => {
    const accessToken = await getAccessToken();
    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const url = createWorkerSubUrl(workerBaseUrl, notificationsPath, 'preferences');
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseLoadPreferencesFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];
      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parsePreferencesSuccess(body);
    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success;
  },

  updatePreferences: async (preferences: NotificationPreferenceItem[]) => {
    const accessToken = await getAccessToken();
    if (!accessToken?.trim()) {
      return { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] };
    }

    const url = createWorkerSubUrl(workerBaseUrl, notificationsPath, 'preferences');
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (!response.ok) {
      const failureStatus = parseUpdatePreferencesFailureStatus(body);
      const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [failureStatus];
      return { ok: false, status: failureStatus, reasons: sanitizeReasons(reasons, failureStatus) };
    }

    const success = parsePreferencesSuccess(body);
    if (!success) {
      return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
    }

    return success as UpdateNotificationPreferencesClientSuccess;
  },
});
