# Work-Item: MOBILE-PET-PUBLISH-001-Mobile Pet Publish Product Flow

## 1. Context & Problem

`PET-PUBLISH-CLIENT-001` added a shared Web/Mobile-safe client for the authenticated Worker route `POST /pets/drafts/:petId/publish`, and `WEB-PET-PUBLISH-001` exposed that flow through a Web product boundary.

The Mobile product boundary still has no publish view model. Publishing must remain server-authoritative: the Mobile boundary should ask the injected client to publish a draft by pet ID only, then map safe client results into PT-PT UI states without accepting or exposing client-side claims about media validity, shelter verification, pet status or actor permissions.

## 2. Acceptance Criteria

- [x] Add a Mobile pet publish product boundary/view model.
- [x] The boundary consumes an injected structural pet publish client.
- [x] The boundary calls publish with only the pet draft ID.
- [x] Ready state exposes safe PT-PT copy for publishing a pet draft.
- [x] Success returns PT-PT copy confirming the pet profile was published.
- [x] Success exposes safe `petId` and `publishedAt` metadata.
- [x] Unauthenticated, unauthorized, missing draft, rejected publish, adapter and worker failures map to safe Mobile product failure states.
- [x] UI-facing results never expose bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] The Mobile foundation content surfaces the publish product flow as ready.
- [x] Tests fail before implementation and pass after the Mobile product boundary is updated.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not wire real native navigation or buttons.
- Do not connect production auth/session state.
- Do not call real Worker, Supabase or R2 services in tests.
- Do not implement Web publish UI.
- Do not move server-side publish rules into Mobile.

## 4. Completion Notes

Implemented on branch `codex/MOBILE-PET-PUBLISH-001`.

The Mobile pet publish product boundary now consumes an injected structural publish client, calls publish with only the pet draft ID, maps success and known failures to safe PT-PT view models, and exposes the publish flow in Mobile foundation content.

Validation passed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
