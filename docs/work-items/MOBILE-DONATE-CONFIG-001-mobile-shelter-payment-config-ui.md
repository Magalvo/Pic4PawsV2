# Work-Item: MOBILE-DONATE-CONFIG-001 — Mobile Shelter Payment Config UI

status: done

## Goal

Create the mobile shelter payment configuration screen at `/abrigos/[shelterId]/pagamento`.
Shelter owners enter their IBAN and optionally their MB WAY phone number. On success,
donations to this shelter become enabled.

## States

- `loading`: useEffect is fetching the current config.
- `idle`: form shown with current values (or blank if not yet configured).
- `saving`: save request in flight.
- `saved`: config saved successfully; display confirmation.
- `failed`: network/validation error with retry.
- `forbidden`: actor is not a shelter member.

## Contract

Create `apps/mobile/src/shelter-payment-config.ts`:
- `MobileShelterPaymentConfigUiContent` type + `mobileShelterPaymentConfigUiContent`
  constant (locale `pt-PT`, status `product-flow-ready`).
- State types: `Idle` (with `iban: string | null`, `mbWayPhone: string | null`), `Saving`,
  `Saved`, `Failed`, `Forbidden`.
- `MobileShelterPaymentConfigViewModel` — union of all states.
- `createMobileShelterPaymentConfigUi({ saveConfigClient, loadConfigClient })`:
  - `loadConfig(shelterId)` → sets state from API response.
  - `saveConfig(shelterId, input)` → `Saved | Failed`.

Create `apps/mobile/app/abrigos/[shelterId]/pagamento.tsx`:
- Uses `useLocalSearchParams` for `shelterId`.
- `useEffect` on mount calls `ui.loadConfig(shelterId)`.
- Form fields: IBAN (text input) + MB WAY phone (optional text input).
- Submit calls `ui.saveConfig(shelterId, { iban, mbWayPhone })`.
- All copy in PT-PT.

Tests in `tests/mobile/shelter-payment-config-ui.test.ts`. Final validation must pass.

## Affected Files

- `apps/mobile/src/shelter-payment-config.ts`
- `apps/mobile/app/abrigos/[shelterId]/pagamento.tsx`
- `tests/mobile/shelter-payment-config-ui.test.ts`

## Completion Notes

Created `apps/mobile/src/shelter-payment-config.ts` with `mobileShelterPaymentConfigUiContent` (pt-PT, product-flow-ready, 5 states: idle/saving/saved/failed/forbidden), `MobileShelterPaymentConfigViewModel` union, and `createMobileShelterPaymentConfigUi({ saveConfigClient, loadConfigClient })`. `loadConfig` maps configured → `idle` (iban/mbWayPhone from response, both nullable), unconfigured → `idle` (nulls), `forbidden` → `forbidden` state, other failures → `failed` with sanitized reasons. `saveConfig` maps success → `saved`, `forbidden` → `forbidden`, `invalid_config`/`unauthenticated`/network → `failed`. Added `shelterPaymentConfig` to `apps/mobile/src/foundation.ts`. Screen at `pagamento.tsx` uses `useEffect` + `useLocalSearchParams`; `null` viewModel renders loading state; IBAN + optional MB WAY phone form fields; submit calls `saveConfig`. 15 new tests, 2365 total, full pipeline green.
