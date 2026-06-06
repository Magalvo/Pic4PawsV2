# Work-Item: WEB-PET-PUBLISH-001-Web Pet Publish Product Flow

## 1. Context & Problem

`PET-PUBLISH-CLIENT-001` added a shared Web/Mobile-safe client for the authenticated Worker route `POST /pets/drafts/:petId/publish`.

The Web product boundary still has no publish view model. Publishing must remain server-authoritative: the Web boundary should ask the injected client to publish a draft by pet ID only, then map safe client results into PT-PT UI states without accepting or exposing client-side claims about media validity, shelter verification, pet status or actor permissions.

## 2. Acceptance Criteria

- [x] Add a Web pet publish product boundary/view model.
- [x] The boundary consumes an injected structural pet publish client.
- [x] The boundary calls publish with only the pet draft ID.
- [x] Ready state exposes safe PT-PT copy for publishing a pet draft.
- [x] Success returns PT-PT copy confirming the pet profile was published.
- [x] Success exposes safe `petId` and `publishedAt` metadata.
- [x] Unauthenticated, unauthorized, missing draft, rejected publish, adapter and worker failures map to safe Web product failure states.
- [x] UI-facing results never expose bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.
- [x] The Web foundation content surfaces the publish product flow as ready.
- [x] Tests fail before implementation and pass after the Web product boundary is updated.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not wire real browser routing or buttons.
- Do not connect production auth/session state.
- Do not call real Worker, Supabase or R2 services in tests.
- Do not implement Mobile publish UI.
- Do not move server-side publish rules into Web.

## 4. Completion Notes

Implemented on branch `codex/WEB-PET-PUBLISH-001`.

The Web pet publish product boundary now consumes an injected structural publish client, calls publish with only the pet draft ID, maps success and known failures to safe PT-PT view models, and exposes the publish flow in Web foundation content.

Validation passed:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
