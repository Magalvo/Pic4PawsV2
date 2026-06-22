import {
  handleWorkerNotificationListRequest,
  handleWorkerNotificationReadRequest,
  matchWorkerNotificationsPath,
  matchWorkerNotificationReadId,
} from '../notification';
import {
  handleWorkerNotificationPreferencesRequest,
  matchWorkerNotificationPreferencesPath,
} from '../notification-preferences';
import {
  handleWorkerPushTokenRequest,
  matchWorkerPushTokenPath,
} from '../push-token';
import type { WorkerRequestDependencies } from '../dependencies';
import type { WorkerParsedConfig } from './shared';

export const handle = async (
  request: Request,
  config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);

  const notificationReadId = matchWorkerNotificationReadId(
    url.pathname,
    config.workers.notificationsPath,
  );

  if (notificationReadId !== null) {
    return handleWorkerNotificationReadRequest({
      request,
      notificationId: notificationReadId,
      notificationRepository: dependencies.notificationRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  if (matchWorkerNotificationPreferencesPath(url.pathname, config.workers.notificationsPath)) {
    return handleWorkerNotificationPreferencesRequest({
      request,
      notificationPreferencesRepository: dependencies.notificationPreferencesRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  if (matchWorkerPushTokenPath(url.pathname, config.workers.notificationsPath)) {
    return handleWorkerPushTokenRequest({
      request,
      pushTokenRepository: dependencies.pushTokenRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  if (matchWorkerNotificationsPath(url.pathname, config.workers.notificationsPath)) {
    return handleWorkerNotificationListRequest({
      request,
      notificationRepository: dependencies.notificationRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  return null;
};
