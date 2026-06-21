# USER-REGISTER-MOBILE-001 — Mobile User Registration Boundary

## Goal

Add the Mobile boundary for the public adopter sign-up flow: a `createMobileUserRegistrationUi` factory in `apps/mobile/src/user-register.ts` and a `(auth)/registar` screen. Calls `createUserRegistrationClient` from `@pic4paws/client` (no auth token). On success, navigates to `/(auth)/entrar` so the user can sign in.

## States

| State | Trigger |
|---|---|
| `idle` | Initial — form ready to fill |
| `registered` | Client returns `registered` |
| `failed` | Any client failure |

Fully public screen — lives inside `(auth)` group alongside `entrar.tsx`.

## Contract

```ts
type MobileUserRegistrationUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

type MobileUserRegistrationIdleState     = { state: 'idle'; title: string };
type MobileUserRegistrationRegisteredState = { state: 'registered'; title: string; message: string };
type MobileUserRegistrationFailedState   = {
  state: 'failed';
  title: string;
  message: string;
  status: RegisterUserClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export const createMobileUserRegistrationUi: ({ userRegistrationClient }) => {
  getInitialState: () => MobileUserRegistrationIdleState;
  registerUser: (input: UserRegistrationClientInput) => Promise<MobileUserRegistrationRegisteredState | MobileUserRegistrationFailedState>;
};
```

`gdprConsentVersion` is hardcoded as `'v1'` in the screen.

## Dependencies

- `USER-REGISTER-CLIENT-001` — `createUserRegistrationClient` (merged, PR #232)

## Affected files

- `docs/work-items/USER-REGISTER-MOBILE-001-user-registration-mobile.md` (this file)
- `apps/mobile/src/user-register.ts` (new)
- `apps/mobile/app/(auth)/registar.tsx` (new)
- `apps/mobile/src/foundation.ts` (add `userRegistration` entry)
- `tests/mobile/user-registration-ui.test.ts` (new)

## Acceptance criteria

- `getInitialState()` returns `{ state: 'idle' }`
- `registerUser()` returns `registered` state on client success
- `registerUser()` returns `failed` with `email_already_registered` status and PT-PT copy
- `registerUser()` returns `failed` with `invalid_payload` status on validation errors
- `registerUser()` returns `failed` with generic copy on `worker_request_failed`
- `sanitizeReasons` strips `service-role` and `bearer` markers
- `mobileUserRegistrationUiContent` has `pt-PT` locale and `product-flow-ready` status
- Screen renders fields for email, password, nome a apresentar, and GDPR consent
