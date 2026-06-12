# Work-Item: MOBILE-SHELTER-REGISTER-001 — Mobile Shelter Registration Boundary

status: done

## 1. Context & Problem

`SHELTER-REGISTER-CLIENT-001` provides the client adapter. Without a Mobile product boundary,
users cannot register a shelter from the mobile app.

## 2. Goal

Expose `createMobileShelterRegistrationUi` with PT-PT states for the shelter registration form.

## 3. States / Contract

**States**: `idle | submitting | registered | failed`

Same state shape as Web boundary with `Mobile` prefix.

## 4. Acceptance Criteria

- [ ] `apps/mobile/src/shelter-register.ts` (new):
  - `MobileShelterRegistrationUiContent` type + `mobileShelterRegistrationUiContent` constant (PT-PT, product-flow-ready)
  - `createMobileShelterRegistrationUi({ shelterRegistrationClient })` returning `getInitialState()` + `registerShelter(input)`
  - Same state handling as Web boundary
- [ ] Mobile foundation entry added (`shelterRegistration`)
- [ ] Tests: getInitialState, registered, failed, sanitization (both service-role and bearer patterns absent)

## 5. Affected Files

- `apps/mobile/src/shelter-register.ts` (new)
- `apps/mobile/src/foundation.ts`
- `tests/mobile/shelter-register-ui.test.ts` (new)
