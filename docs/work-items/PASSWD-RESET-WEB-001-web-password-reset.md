---
id: PASSWD-RESET-WEB-001
title: Web password reset flow
status: done
---

# Work-Item: PASSWD-RESET-WEB-001 — Web Password Reset Flow

## Goal

Add a password reset flow to the web app. Users can request a password reset email
from `/recuperar-palavra-passe` and confirm a new password at
`/recuperar-palavra-passe/confirmar` (the link target from the Supabase reset email).

No Worker route is required — the flow uses Supabase Auth SDK directly from the
browser client (`resetPasswordForEmail`, `exchangeCodeForSession`, `updateUser`).

## States

### Request page (`/recuperar-palavra-passe`)

- `idle` — email form ready
- `submitting` — request in flight
- `email_sent` — request accepted (message does not confirm whether the email exists)
- `failed` — network or configuration error

### Confirm page (`/recuperar-palavra-passe/confirmar`)

- `idle` — code exchanged successfully, new-password form ready
- `updating` — password update in flight
- `updated` — password changed, prompt user to sign in
- `invalid_link` — `?code` param missing, already used, or expired
- `failed` — update error (e.g. password too short)

## Contract

### `SupabaseBrowserAuthClientLike` additions

```ts
resetPasswordForEmail: (
  email: string,
  options: { redirectTo: string },
) => Promise<{ error: { message: string } | null }>;

exchangeCodeForSession: (
  code: string,
) => Promise<{
  data: { session: { access_token: string } | null } | null;
  error: { message: string } | null;
}>;

updateUser: (
  attrs: { password: string },
) => Promise<{ error: { message: string } | null }>;
```

### `createWebAuthUi` additions

```ts
requestPasswordReset: (
  email: string,
  redirectTo: string,
) => Promise<WebPasswordResetRequestViewModel>;

exchangeResetCode: (
  code: string,
) => Promise<WebPasswordConfirmViewModel>;

updatePassword: (
  newPassword: string,
) => Promise<WebPasswordConfirmViewModel>;
```

### Middleware public routes

`/recuperar-palavra-passe` and `/recuperar-palavra-passe/confirmar` must be
added to `isPublicRoute` — both pages are accessible without authentication.

## Affected Files

- `docs/work-items/PASSWD-RESET-WEB-001-web-password-reset.md`
- `apps/web/src/auth.ts` — extend client interface and `createWebAuthUi`
- `apps/web/middleware.ts` — add two public routes
- `apps/web/app/recuperar-palavra-passe/page.tsx` — request form
- `apps/web/app/recuperar-palavra-passe/confirmar/page.tsx` — confirm form
- `tests/web/password-reset.test.ts` — new boundary tests
- `tests/web/middleware.test.ts` — two new public route tests

## Completion Notes

- `SupabaseBrowserAuthClientLike` extended with `resetPasswordForEmail`, `exchangeCodeForSession`, `updateUser`
- `createWebAuthUi` extended with `requestPasswordReset`, `exchangeResetCode`, `updatePassword`
- Existing `tests/web/auth-page.test.ts` mocks updated with `noopPasswordResetMethods` stub spread
- Middleware: two new entries (`/recuperar-palavra-passe`, `/recuperar-palavra-passe/confirmar`)
- Pages follow the same `'use client'` + `useState` + thin-wrapper pattern as `entrar/page.tsx`
- Confirm page uses `useEffect` on mount to call `exchangeResetCode(code)` before showing the form; code comes from `?code=` query param (Supabase PKCE flow)
- 1977 tests passing; typecheck ✅ lint ✅ test ✅ build ✅
