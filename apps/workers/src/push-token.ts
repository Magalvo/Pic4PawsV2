import type { WorkerPetDraftAuthenticator } from './pet-drafts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PushTokenPlatform = 'ios' | 'android' | 'expo';

export const PUSH_TOKEN_PLATFORMS: readonly PushTokenPlatform[] = ['ios', 'android', 'expo'];

export type PushTokenRepository = {
  upsertPushToken: (userId: string, token: string, platform: PushTokenPlatform) => Promise<void>;
  deletePushToken: (userId: string, token: string) => Promise<boolean>;
};

// ─── Path matcher ─────────────────────────────────────────────────────────────

export const matchWorkerPushTokenPath = (
  pathname: string,
  notificationsPath: string,
): boolean => pathname === `${notificationsPath}/push-token`;

// ─── Handler ──────────────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

export type HandleWorkerPushTokenRequestInput = {
  request: Request;
  pushTokenRepository?: PushTokenRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerPushTokenRequest = async ({
  request,
  pushTokenRepository,
  authenticator,
}: HandleWorkerPushTokenRequestInput): Promise<Response> => {
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['POST', 'DELETE'] },
      { status: 405, headers: { Allow: 'POST, DELETE' } },
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

  if (!pushTokenRepository) {
    return jsonResponse({ status: 'push_token_repository_not_configured' }, { status: 501 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ status: 'invalid_body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ status: 'invalid_body' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const token = typeof raw.token === 'string' ? raw.token.trim() : null;

  if (!token) {
    return jsonResponse(
      { status: 'invalid_payload', reasons: ['token_required'] },
      { status: 400 },
    );
  }

  if (request.method === 'DELETE') {
    const removed = await pushTokenRepository.deletePushToken(actor.id, token);
    if (!removed) {
      return jsonResponse({ status: 'push_token_not_found' }, { status: 404 });
    }
    return jsonResponse({ status: 'push_token_removed' }, { status: 200 });
  }

  // POST
  const platform = raw.platform;
  if (!PUSH_TOKEN_PLATFORMS.includes(platform as PushTokenPlatform)) {
    return jsonResponse(
      { status: 'invalid_payload', reasons: ['platform_invalid'] },
      { status: 400 },
    );
  }

  await pushTokenRepository.upsertPushToken(actor.id, token, platform as PushTokenPlatform);
  return jsonResponse({ status: 'push_token_registered' }, { status: 200 });
};
