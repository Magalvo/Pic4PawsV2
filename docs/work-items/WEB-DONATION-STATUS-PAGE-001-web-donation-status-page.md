---
id: WEB-DONATION-STATUS-PAGE-001
title: Web donation status page
status: done
---

# Work-Item: WEB-DONATION-STATUS-PAGE-001 — Web Donation Status Page

## Goal

Create the donation status page at `/doacoes/[donationId]` wired to `createWebDonationStatusUi`. Auth-gated: access token retrieved inside `useEffect` via `supabase.auth.getSession()` and passed as `getAccessToken` to `createDonationStatusClient`. Auto-loads on mount; no form submission.

## States

- `null` (local) — loading while useEffect fires
- `loaded` — show donation details (amount, kind, status, payment method)
- `not_found` — donation does not exist or was removed
- `forbidden` — authenticated but not authorised to view this donation
- `failed` — network/auth error; if `status === 'unauthenticated'`, link to `/entrar`
- `idle` / `loading` — handled defensively (not reached in practice via auto-load)

## Contract

`apps/web/app/doacoes/[donationId]/page.tsx` is a `'use client'` Next.js App Router dynamic page that:
- Unwraps `params` with `use(params)` (Next.js 15 Promise params)
- Creates `createDonationStatusClient` + `createWebDonationStatusUi` inside `useEffect([donationId])`
- Resets viewModel to null then calls `loadDonationStatus(donationId)` on each navigation
- `getAccessToken` reads from `createSupabaseBrowserClient().auth.getSession()`

## Affected Files

- `docs/work-items/WEB-DONATION-STATUS-PAGE-001-web-donation-status-page.md` (this file)
- `apps/web/app/doacoes/[donationId]/page.tsx` — new dynamic page
- `tests/web/donation-status-page.test.ts` — boundary contract tests

## Completion Notes

- Shipped in PR #165. `apps/web/app/doacoes/[donationId]/page.tsx` resets viewModel to `null` then calls `loadDonationStatus(donationId)` in `useEffect([donationId])`. Renders `loaded`, `not_found`, `forbidden`, `failed` (with `/entrar` link when unauthenticated), and defensive `idle`/`loading` branches.
