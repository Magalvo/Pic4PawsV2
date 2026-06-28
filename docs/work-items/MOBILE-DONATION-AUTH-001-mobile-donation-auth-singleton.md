---
id: MOBILE-DONATION-AUTH-001
title: Fix mobile donation screen to use shared authenticated Supabase singleton
status: done
depends-on: EUPAGO-DONATION-CLIENT-001
pr: 287
merged: 2026-06-28
---

# Work-Item: MOBILE-DONATION-AUTH-001 — Mobile Donation Auth Singleton

## 1. Context & Problem

`apps/mobile/app/abrigos/[shelterId]/doar.tsx` creates a fresh Supabase client inside
`handleSubmit` with `persistSession: false`. This client has no auth state — the session
managed by the shared `mobileSupabaseClient` singleton is invisible to it. On a real device
the access token is therefore always null, so the Worker receives no bearer token and the
donation is rejected as `unauthenticated` even for signed-in users.

A secondary issue: `setSubmitting(false)` is called unconditionally after the await,
meaning a thrown exception leaves the form permanently disabled.

## States

No new ViewModel states. The existing `submitted`, `submitted_automated`, `failed`, `idle`,
and `submitting` states are unchanged. The fix is purely in how the access token is obtained
before calling the Worker — no UI state machine changes.

## Goal

Use `mobileSupabaseClient` (the shared singleton) to obtain the session token.
Construct `donationClient` and `ui` at the component boundary (not inside the submit
handler). Wrap the async submit in `try/finally` so `setSubmitting` is always reset.

## Acceptance Criteria

- [x] `apps/mobile/app/abrigos/[shelterId]/doar.tsx`:
  - Remove `createClient` import and `supabaseUrl`/`supabaseAnonKey` env imports
  - Import `mobileSupabaseClient` from `../../../src/supabase`
  - `donationClient` and `ui` constructed in component body (outside handler)
  - `getAccessToken` calls `mobileSupabaseClient.auth.getSession()` lazily
  - `handleSubmit` uses `try/finally` to guarantee `setSubmitting(false)`
- [x] All four gates pass: typecheck, lint, test, build

## Affected Files

- `apps/mobile/app/abrigos/[shelterId]/doar.tsx`
