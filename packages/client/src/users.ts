import { createWorkerSubUrl, parseJsonResponse, parseReasons, sanitizeReasons, type MediaUploadClientFetch } from './_shared';

// ─── User Registration types ──────────────────────────────────────────────────

export type UserRegistrationClientInput = {
  email: string;
  password: string;
  displayName: string;
  gdprConsentVersion: string;
};

export type RegisterUserClientSuccess = {
  ok: true;
  status: 'registered';
};

export type RegisterUserClientFailureStatus =
  | 'email_already_registered'
  | 'invalid_payload'
  | 'user_registration_repository_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type RegisterUserClientFailure = {
  ok: false;
  status: RegisterUserClientFailureStatus;
  reasons: string[];
};

export type RegisterUserClientResult = RegisterUserClientSuccess | RegisterUserClientFailure;

export type CreateUserRegistrationClientInput = {
  workerBaseUrl: string;
  usersPath: `/${string}`;
  fetch: MediaUploadClientFetch;
};

export type UserRegistrationClient = {
  registerUser: (input: UserRegistrationClientInput) => Promise<RegisterUserClientResult>;
};

// ─── Private helpers ──────────────────────────────────────────────────────────

const parseRegisterUserFailureStatus = (
  body: Record<string, unknown> | null,
): RegisterUserClientFailureStatus => {
  const status = body?.status;
  if (status === 'email_already_registered') return 'email_already_registered';
  if (status === 'invalid_payload') return 'invalid_payload';
  if (status === 'user_registration_repository_not_configured')
    return 'user_registration_repository_not_configured';
  return 'worker_request_failed';
};

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createUserRegistrationClient = ({
  workerBaseUrl,
  usersPath,
  fetch,
}: CreateUserRegistrationClientInput): UserRegistrationClient => ({
  registerUser: async (input) => {
    let response: Response;

    try {
      response = await fetch(createWorkerSubUrl(workerBaseUrl, usersPath, 'register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          displayName: input.displayName,
          gdprConsentVersion: input.gdprConsentVersion,
        }),
      });
    } catch {
      return { ok: false, status: 'worker_request_failed', reasons: ['network_error'] };
    }

    const body = await parseJsonResponse(response);

    if (response.status === 201) {
      if (body?.status !== 'created') {
        return { ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] };
      }
      return { ok: true, status: 'registered' };
    }

    const status = parseRegisterUserFailureStatus(body);
    const reasons = Array.isArray(body?.reasons) ? parseReasons(body) : [status];
    return { ok: false, status, reasons: sanitizeReasons(reasons, status) };
  },
});
