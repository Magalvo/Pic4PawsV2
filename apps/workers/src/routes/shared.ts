import type { parseEnvironmentConfig } from '@pic4paws/config';
import type { WorkerRequestDependencies } from '../dependencies';

export type WorkerParsedConfig = Extract<
  ReturnType<typeof parseEnvironmentConfig>,
  { ok: true }
>['config'];

export const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

export const parseJsonBody = async (request: Request): Promise<unknown | null> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

export const parseAuthorizationBearer = (request: Request): string | null => {
  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader?.startsWith('Bearer ')) return null;
  const bearerToken = authorizationHeader.slice('Bearer '.length).trim();
  return bearerToken.length > 0 ? bearerToken : null;
};

export const authenticateWorkerActor = async (
  request: Request,
  dependencies: WorkerRequestDependencies,
) => {
  const bearerToken = parseAuthorizationBearer(request);
  if (!bearerToken) {
    return { ok: false as const, response: jsonResponse({ status: 'unauthenticated' }, { status: 401 }) };
  }
  if (!dependencies.petDraftAuthenticator) {
    return { ok: false as const, response: jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 }) };
  }
  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await dependencies.petDraftAuthenticator({ request, authorizationHeader, bearerToken });
  if (!actor) {
    return { ok: false as const, response: jsonResponse({ status: 'unauthenticated' }, { status: 401 }) };
  }
  return { ok: true as const, actor };
};
