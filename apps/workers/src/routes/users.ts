import type { WorkerRequestDependencies } from '../dependencies';
import { handleWorkerUserRegisterRequest } from '../user-register';
import { parseJsonBody, type WorkerParsedConfig } from './shared';

const USER_REGISTER_PATH = '/users/register';

export const handle = async (
  request: Request,
  _config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);

  if (url.pathname !== USER_REGISTER_PATH) {
    return null;
  }

  const payload = await parseJsonBody(request);

  return handleWorkerUserRegisterRequest({
    request,
    payload,
    userRegistrationRepository: dependencies.userRegistrationRepository,
    now: dependencies.now,
  });
};
