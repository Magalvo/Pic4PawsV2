# Work-Item: WEB-DONATE-CONFIG-001 — Web Shelter Payment Config UI

status: done

## Goal

Create the web shelter payment configuration page at `/abrigos/[shelterId]/pagamento`.
Mirror of `MOBILE-DONATE-CONFIG-001`. Shelter owners enter IBAN and optionally MB WAY
phone; on success, the shelter becomes eligible to receive donations.

## States

- `null` (local) — loading while useEffect initialises the UI.
- `idle` — form with current IBAN/phone (or empty if unconfigured).
- `saving` — POST in flight.
- `saved` — confirmation displayed.
- `failed` — error with retry.
- `forbidden` — actor is not a shelter member.

## Contract

Create `apps/web/src/shelter-payment-config.ts`:
- `WebShelterPaymentConfigUiContent` + `webShelterPaymentConfigUiContent` (locale `pt-PT`).
- Same state types as the mobile module, following the established web boundary pattern.
- `createWebShelterPaymentConfigUi({ saveConfigClient, loadConfigClient })`.

Create `apps/web/app/abrigos/[shelterId]/pagamento/page.tsx`:
- `'use client'` at top.
- `use(params)` for `shelterId`.
- `useEffect` on mount: `createLoadPaymentConfigClient(...)`, call `loadConfig(shelterId)`.
- Form with IBAN + optional MB WAY phone inputs; submit calls `saveConfig`.
- `workerUrl()` from `../../../../../src/env` (depth: count from `pagamento/page.tsx`).
- All copy in PT-PT.

Tests in `tests/web/shelter-payment-config-ui.test.ts`. Final validation must pass.

## Affected Files

- `apps/web/src/shelter-payment-config.ts`
- `apps/web/app/abrigos/[shelterId]/pagamento/page.tsx`
- `tests/web/shelter-payment-config-ui.test.ts`

## Completion Notes

Created `apps/web/src/shelter-payment-config.ts` with `webShelterPaymentConfigUiContent` (pt-PT, product-flow-ready, 5 states: idle/saving/saved/failed/forbidden), `WebShelterPaymentConfigState` union, and `createWebShelterPaymentConfigUi({ saveConfigClient, loadConfigClient })`. `loadConfig` maps configured → `idle` (with iban/mbWayPhone pre-filled), unconfigured → `idle` (empty strings), `forbidden` → `forbidden` state, other failures → `failed` with sanitized reasons. `saveConfig` maps success → `saved`, `forbidden` → `forbidden`, `invalid_config`/`unauthenticated`/network errors → `failed`. Added `shelterPaymentConfig` entry to `foundation.ts`. Page at `/abrigos/[shelterId]/pagamento` uses `useEffect` to call `loadConfig` and pre-populate IBAN/phone fields; form submit calls `saveConfig`. 15 new tests, 2350 total, full pipeline green.
