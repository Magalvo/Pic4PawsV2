---
id: PASSWD-RESET-MOBILE-001
title: Mobile password reset screen
status: done
---

# Work-Item: PASSWD-RESET-MOBILE-001 — Mobile Password Reset Screen

## Goal

Add a password reset request screen to the mobile app at
`(auth)/recuperar-palavra-passe`. The user enters their email; the app calls
Supabase `resetPasswordForEmail` with a `redirectTo` pointing to the web
confirmation page (`/recuperar-palavra-passe/confirmar`). The confirmation
step is completed on the web (no deep-link handling required on mobile).

## States

- `idle` — email form ready
- `submitting` — request in flight
- `email_sent` — request accepted (message is GDPR-safe, does not confirm email existence)
- `failed` — network or configuration error

## Contract

### `SupabaseMobileAuthClientLike` addition

```ts
resetPasswordForEmail: (
  email: string,
  options: { redirectTo: string },
) => Promise<{ error: { message: string } | null }>;
```

### `createMobileAuthUi` addition

```ts
requestPasswordReset: (
  email: string,
  redirectTo: string,
) => Promise<MobilePasswordResetRequestViewModel>;
```

### `redirectTo` convention

The screen constructs the URL as
`${process.env.EXPO_PUBLIC_WEB_BASE_URL ?? 'https://pic4paws.pt'}/recuperar-palavra-passe/confirmar`
and passes it to `requestPasswordReset`. The auth boundary receives it as a
parameter and forwards it to Supabase — the boundary has no opinion on the URL.

## Affected Files

- `docs/work-items/PASSWD-RESET-MOBILE-001-mobile-password-reset.md`
- `apps/mobile/src/auth.ts` — extend client interface and `createMobileAuthUi`
- `apps/mobile/app/(auth)/recuperar-palavra-passe.tsx` — new screen
- `tests/mobile/auth-screen.test.ts` — update mocks for extended interface
- `tests/mobile/password-reset.test.ts` — new boundary tests

## Completion Notes

- `SupabaseMobileAuthClientLike` extended with `resetPasswordForEmail`
- `createMobileAuthUi` extended with `requestPasswordReset`
- Existing `tests/mobile/auth-screen.test.ts` mocks updated with noop `resetPasswordForEmail`
- Screen uses `mobileSupabaseClient` singleton (not creating a new client inline)
- `redirectTo` built from `EXPO_PUBLIC_WEB_BASE_URL ?? 'https://pic4paws.pt'` env var
- Confirm step deliberately omitted on mobile — user completes via web link in email
- 1970 tests passing (1968 base + 2 new); typecheck ✅ lint ✅ test ✅ build ✅
