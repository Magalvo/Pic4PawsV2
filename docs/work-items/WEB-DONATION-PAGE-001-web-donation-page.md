---
id: WEB-DONATION-PAGE-001
title: Web donation page
status: in-progress
---

# Work-Item: WEB-DONATION-PAGE-001 — Web Donation Page

## Goal

Create the donation form page at `/abrigos/[shelterId]/doar` wired to `createWebDonationUi`. Auth-gated: access token retrieved inside the submit handler via `supabase.auth.getSession()` and passed as `getAccessToken` to `createDonationClient`.

## States

- `null` (local) — loading while useEffect initialises the UI
- `idle` — show donation form (amount, kind, payment method, consent)
- `submitted` — donation processed successfully
- `failed` — network/auth error; if `status === 'unauthenticated'`, link to `/entrar`

## Contract

`apps/web/app/abrigos/[shelterId]/doar/page.tsx` is a `'use client'` Next.js App Router dynamic page that:
- Unwraps `params` with `use(params)` (Next.js 15 Promise params)
- Stores the UI instance in a `useRef`; `useEffect([shelterId])` creates `createDonationClient` + `createWebDonationUi`, stores in ref, sets `viewModel` to `getInitialState()`
- `getAccessToken` calls `supabase.auth.getSession()` via `createSupabaseBrowserClient()`
- On form submit: calls `uiRef.current.submitDonation(input)` with `dataProcessingAccepted: true` set at submit time
- `amountCents` derived from a euro-denominated number input (× 100)

## Affected Files

- `docs/work-items/WEB-DONATION-PAGE-001-web-donation-page.md` (this file)
- `apps/web/app/abrigos/[shelterId]/doar/page.tsx` — new dynamic form page
- `tests/web/donation-page.test.ts` — boundary contract tests
