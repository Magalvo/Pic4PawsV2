# Work-Item: MOBILE-PET-DRAFT-001-Mobile Pet Draft Product Flow

## 1. Context & Problem

`PET-DRAFT-CLIENT-001` added a shared Web/Mobile-safe client for authenticated pet draft create/update Worker routes, and `WEB-PET-DRAFT-001` exposed that flow through a Web product boundary.

The Mobile product boundary still has no draft editing view model. The Mobile boundary should consume an injected structural draft client, expose PT-PT states for draft editing, and map safe client results without moving Worker-side persistence validation into the frontend.

## 2. Acceptance Criteria

- [x] Add a Mobile pet draft product boundary/view model.
- [x] The boundary consumes injected structural create/update pet draft dependencies.
- [x] The boundary forwards only the safe draft payload expected by the shared client.
- [x] Ready state exposes safe PT-PT copy for editing a pet draft.
- [x] Create success returns PT-PT copy and safe `petId` metadata.
- [x] Update success returns PT-PT copy and safe `petId` metadata.
- [x] Unauthenticated, unauthorized, invalid draft, adapter and worker failures map to safe Mobile product failure states.
- [x] UI-facing results never expose bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] The Mobile foundation content surfaces the draft product flow as ready.
- [x] Tests fail before implementation and pass after the Mobile product boundary is updated.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not wire real native forms, navigation or buttons.
- Do not connect production auth/session state.
- Do not call real Worker, Supabase or R2 services in tests.
- Do not implement Web draft UI.
- Do not move server-side draft validation into Mobile.

## 4. Completion Notes

Implemented on branch `codex/MOBILE-PET-DRAFT-001`.

The Mobile pet draft product boundary now consumes injected structural create/update draft dependencies, sanitizes draft input before forwarding it, maps success and known failures to safe PT-PT view models, and exposes the draft flow in Mobile foundation content.

Validation passed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
