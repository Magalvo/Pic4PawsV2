# USER-REGISTER-CLIENT-001 — User Registration Client

## Goal

Add `@pic4paws/client` factory for the public `POST /users/register` worker route. Provides typed success/failure results consumed by the Web and Mobile registration pages. No auth token required — this is a public endpoint.

## States

No new state boundaries. This is a pure client-layer addition consumed by future Web and Mobile slices.

## Contract

```ts
type UserRegistrationClientInput = {
  email: string;
  password: string;
  displayName: string;
  gdprConsentVersion: string;
};

type RegisterUserClientSuccess = { ok: true; status: 'registered' };

type RegisterUserClientFailureStatus =
  | 'email_already_registered'
  | 'invalid_payload'
  | 'user_registration_repository_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

type RegisterUserClientFailure = {
  ok: false;
  status: RegisterUserClientFailureStatus;
  reasons: string[];
};

type RegisterUserClientResult = RegisterUserClientSuccess | RegisterUserClientFailure;

type CreateUserRegistrationClientInput = {
  workerBaseUrl: string;
  usersPath: `/${string}`;  // e.g. '/users' — factory appends '/register'
  fetch: typeof globalThis.fetch;
};

type UserRegistrationClient = {
  registerUser: (input: UserRegistrationClientInput) => Promise<RegisterUserClientResult>;
};

export const createUserRegistrationClient: (input: CreateUserRegistrationClientInput) => UserRegistrationClient;
```

### HTTP mapping

| Worker response | Client result |
|---|---|
| 201 `{ status: 'created' }` | `{ ok: true, status: 'registered' }` |
| 400 `{ status: 'invalid_payload', reasons }` | `{ ok: false, status: 'invalid_payload', reasons }` |
| 409 `{ status: 'email_already_registered' }` | `{ ok: false, status: 'email_already_registered', ... }` |
| 501 `{ status: 'user_registration_repository_not_configured' }` | `{ ok: false, status: 'user_registration_repository_not_configured', ... }` |
| network error | `{ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }` |

## Dependencies

- Worker route: `USER-REGISTER-WORKER-001` (merged, PR #229)
- DB migration: `USER-REGISTER-DB-001` (merged, PR #230)

## Affected files

- `packages/client/src/users.ts` (new)
- `packages/client/src/index.ts` (add `export * from './users'`)
- `tests/client/user-registration-client.test.ts` (new)

## Acceptance criteria

- `createUserRegistrationClient` returns `{ ok: true, status: 'registered' }` on 201
- Returns `email_already_registered` on 409
- Returns `invalid_payload` with sanitized reasons on 400
- Returns `user_registration_repository_not_configured` on 501 with that body status
- Returns `worker_request_failed` with `['network_error']` on fetch throw
- No auth header is sent (public endpoint)
- `sanitizeReasons` strips `service-role` and `bearer` markers from all failure reasons
