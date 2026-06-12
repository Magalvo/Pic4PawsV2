# Work-Item: WEB-SHELTER-REGISTER-001 — Web Shelter Registration Boundary

status: done

## 1. Context & Problem

`SHELTER-REGISTER-CLIENT-001` provides the client adapter. Without a Web product boundary,
users cannot register a shelter from the web app.

## 2. Goal

Expose `createWebShelterRegistrationUi` with PT-PT states for the shelter registration form.

## 3. States / Contract

**States**: `idle | submitting | registered | failed`

- `idle`: initial state — form ready for input; has `title`
- `submitting`: request in flight; has `title`
- `registered`: success — has `title`, `message`, `shelterId`
- `failed`: error — has `title`, `message`, `status`, `reasons`; `canRetry: true`

## 4. Acceptance Criteria

- [ ] `apps/web/src/shelter-register.ts` (new):
  - `WebShelterRegistrationUiContent` type + `webShelterRegistrationUiContent` constant (PT-PT, product-flow-ready)
  - `createWebShelterRegistrationUi({ shelterRegistrationClient })` returning `getInitialState()` + `registerShelter(input)`
  - `invalid_payload` → `failed` with PT-PT copy
  - `unauthenticated` → `failed` with PT-PT copy (distinct from generic failure)
  - generic failures → `failed` with `sanitizeReasons`, `canRetry: true`
  - `unsafeReasonMarkers` including `service-role`, `bearer`, `r2-secret`, `r2-access`
- [ ] Web foundation entry added (`shelterRegistration`)
- [ ] Tests: getInitialState, registered success, invalid_payload failed, unauthenticated failed, generic failed, sanitization (both service-role and bearer patterns absent)

## 5. Affected Files

- `apps/web/src/shelter-register.ts` (new)
- `apps/web/src/foundation.ts`
- `tests/web/shelter-register-ui.test.ts` (new)
