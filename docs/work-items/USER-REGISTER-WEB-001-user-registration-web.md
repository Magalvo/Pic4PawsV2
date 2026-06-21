# USER-REGISTER-WEB-001 — Web User Registration Boundary

## Goal

Add the Web boundary for the public adopter sign-up flow: a `createWebUserRegistrationUi` factory in `apps/web/src/user-register.ts` and a `/registar` page. Calls `createUserRegistrationClient` from `@pic4paws/client` (no auth token). On success, directs the user to `/entrar` to sign in.

## States

| State | Trigger |
|---|---|
| `idle` | Initial — form ready to fill |
| `registered` | Worker returns 201 / client returns `registered` |
| `failed` | Any client failure |

No new route guards or auth boundaries — this is a fully public page.

## Contract

```ts
type WebUserRegistrationUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

type WebUserRegistrationIdleState     = { state: 'idle'; title: string };
type WebUserRegistrationRegisteredState = { state: 'registered'; title: string; message: string };
type WebUserRegistrationFailedState   = {
  state: 'failed';
  title: string;
  message: string;
  status: RegisterUserClientFailureStatus;
  reasons: string[];
  canRetry: true;
};
type WebUserRegistrationState =
  | WebUserRegistrationIdleState
  | WebUserRegistrationRegisteredState
  | WebUserRegistrationFailedState;

export const createWebUserRegistrationUi: ({ userRegistrationClient }) => {
  getInitialState: () => WebUserRegistrationIdleState;
  registerUser: (input: UserRegistrationClientInput) => Promise<WebUserRegistrationRegisteredState | WebUserRegistrationFailedState>;
};
```

`gdprConsentVersion` is hardcoded as `'v1'` in the page — not a user-controlled value.

## Dependencies

- `USER-REGISTER-CLIENT-001` — `createUserRegistrationClient` (merged, PR #232)

## Affected files

- `docs/work-items/USER-REGISTER-WEB-001-user-registration-web.md` (this file)
- `apps/web/src/user-register.ts` (new)
- `apps/web/app/registar/page.tsx` (new)
- `apps/web/src/foundation.ts` (add `userRegistration` entry)
- `tests/web/user-registration-ui.test.ts` (new)

## Acceptance criteria

- `getInitialState()` returns `{ state: 'idle' }`
- `registerUser()` returns `registered` state on client success
- `registerUser()` returns `failed` with `email_already_registered` status and PT-PT copy on that failure
- `registerUser()` returns `failed` with `invalid_payload` status on validation errors
- `registerUser()` returns `failed` with generic copy on `worker_request_failed`
- `sanitizeReasons` strips `service-role` and `bearer` markers
- `webUserRegistrationUiContent` has `pt-PT` locale and `product-flow-ready` status
- Page at `/registar` renders a form with email, password, display name, and GDPR consent fields
