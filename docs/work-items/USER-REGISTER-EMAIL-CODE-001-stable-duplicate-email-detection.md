---
id: USER-REGISTER-EMAIL-CODE-001
title: Replace string-sniff duplicate-email detection with stable GoTrue error code
status: done
---

# Work-Item: USER-REGISTER-EMAIL-CODE-001 — Stable Duplicate Email Detection

## Context & Problem

`apps/workers/src/user-register-supabase.ts:isEmailAlreadyRegistered` detects a
duplicate-email error by substring-matching the Admin API error message
("already registered", "already been registered"). This is fragile: any Supabase
upgrade, localisation change, or message rewording silently breaks duplicate-email
detection, causing valid registrations to throw a 500 instead of returning a 409.

P2-2 from audit `docs/audits/2026-06-21-sdd-audit-prs-225-234.md` — deferred
until the SDK provided a stable error code. `@supabase/auth-js` v2.107.0
(already installed) surfaces `AuthApiError.code === 'user_already_exists'` for
this case.

## Goal

Replace the substring-match with a check on `error.code === 'user_already_exists'`.
Remove the `isEmailAlreadyRegistered` helper entirely.

## States

No new ViewModel states. The repository contract (`email_already_registered`) is
unchanged — only the detection mechanism changes.

## Contract

- `AdminCreateUserResult.error` type gains `code?: string`.
- `isEmailAlreadyRegistered(message)` is deleted.
- Detection becomes: `createResult.error.code === 'user_already_exists'`.
- A message containing "already registered" but no matching code must NOT be
  detected as a duplicate — it is a genuine unknown error and must throw.

## Acceptance Criteria

- [x] `AdminCreateUserResult.error` type has `code?: string`
- [x] `isEmailAlreadyRegistered` function is deleted
- [x] Detection uses `error.code === 'user_already_exists'` exclusively
- [x] Tests updated: mocks that expect `email_already_registered` supply `code: 'user_already_exists'`
- [x] Test added: message containing "already registered" without `code` throws instead of returning `email_already_registered`
- [x] `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` pass

## Non-Goals

- Do not change the `UserRegistrationRepository` interface or its result type.
- Do not change any other error-handling path in `user-register-supabase.ts`.

## Affected Files

- `docs/work-items/USER-REGISTER-EMAIL-CODE-001-stable-duplicate-email-detection.md`
- `apps/workers/src/user-register-supabase.ts`
- `tests/workers/user-register.test.ts`
