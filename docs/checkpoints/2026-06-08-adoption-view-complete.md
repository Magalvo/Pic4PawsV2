# Checkpoint: Adoption View Slice Complete — 2026-06-08

## PRs Merged

| PR  | Work Item                   | Description                                                                               |
| --- | --------------------------- | ----------------------------------------------------------------------------------------- |
| #80 | ADOPTION-VIEW-WORKER-001    | `GET /adoptions/:applicationId` dual-access Worker route + Supabase repository            |
| #81 | ADOPTION-VIEW-CLIENT-001    | `createAdoptionViewClient` in `@pic4paws/client`                                          |
| #82 | WEB-ADOPTION-VIEW-001       | Web adoption view product boundary (6 states, adopter status page)                        |
| #83 | MOBILE-ADOPTION-VIEW-001    | Mobile adoption view product boundary (6 states, mirrors web)                             |

## What Was Built

### Worker (`ADOPTION-VIEW-WORKER-001`)
- `GET /adoptions/:applicationId` authenticated route — dual access (applicant OR shelter member)
- Access control: `actor.id === record.applicantUserId` OR `canManageShelter(actor, record.shelterId)`
- `AdoptionViewRecord`: `applicationId`, `shelterId`, `applicantUserId`, `petId`, `applicationStatus`
- `applicantUserId` used only for access control — deliberately omitted from the 200 response
- Flat 200 response: `{ status: 'ok', applicationId, applicationStatus, shelterId, petId }`
- `AdoptionViewRepository`: `getAdoptionView(applicationId)` → `AdoptionViewRecord | null`
- Route method-switched at the same path as `PATCH /adoptions/:applicationId`, reusing `matchWorkerAdoptionStatusId`
- Supabase repository (`adoption-view-supabase.ts`) mapping `adoption_applications` columns
- `adoptionViewRepository` wired into `WorkerRequestDependencies` + `createWorkerSupabaseDependencies`
- 14 tests

### Client (`ADOPTION-VIEW-CLIENT-001`)
- `createAdoptionViewClient({ workerBaseUrl, adoptionsPath, getAccessToken, fetch })`
- `loadAdoptionView(applicationId)` → `AdoptionViewClientResult`
- 7 failure statuses: `unauthenticated | forbidden | adoption_not_found | adoption_view_repository_not_configured | auth_adapter_not_configured | worker_request_failed | worker_response_invalid`
- Flat Worker response wrapped client-side into `{ ok: true, status: 'ok', application: { applicationId, applicationStatus, shelterId, petId } }`
- `parseAdoptionViewSuccess` validates shape and assembles the nested `application` object
- `parseAdoptionViewFailureStatus` maps Worker error codes to typed client failure statuses
- Three-layer credential sanitization: `unsafeReasonMarkers` + `sanitizeReasons` + `parseReasons`
- GET request — `init.body` is `undefined` (no request body)
- `createWorkerSubUrl(workerBaseUrl, adoptionsPath, applicationId)` for URL construction
- 12 tests

### Web Boundary (`WEB-ADOPTION-VIEW-001`)
- `createWebAdoptionViewUi({ adoptionViewClient })`
- 6 states: `idle / loading / loaded / not_found / forbidden / failed`
- `WebAdoptionViewLoadedState` includes `application: AdoptionViewClientApplication`
- `WebAdoptionViewFailedState` includes `status`, `reasons`, `canRetry: true`
- `adoption_not_found` → `not_found`; `forbidden` → `forbidden`; all others → `failed`
- `unsafeReasonMarkers` + `sanitizeReasons` — credential stripping at product boundary
- PT-PT copy; `webAdoptionViewUiContent.locale === 'pt-PT'`, `status === 'product-flow-ready'`
- Exposed via `apps/web/src/foundation.ts` → `webFoundationContent.adoptionView`
- 11 tests

### Mobile Boundary (`MOBILE-ADOPTION-VIEW-001`)
- `createMobileAdoptionViewUi({ adoptionViewClient })`
- 6 states: `idle / loading / loaded / not_found / forbidden / failed` — exact mirror of web with `Mobile` prefix
- `MobileAdoptionViewLoadedState` includes `application: AdoptionViewClientApplication`
- Same failure routing and credential sanitization
- `mobileAdoptionViewUiContent.locale === 'pt-PT'`, `status === 'product-flow-ready'`
- Exposed via `apps/mobile/src/foundation.ts` → `mobileFoundationContent.adoptionView`
- 12 tests (includes extra `adoption_view_repository_not_configured` → `failed` case)

## Validation

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 850 tests passing
- `npm run build` ✅

## Foundation Status

| Slice                       | Worker | Client | Web | Mobile |
| --------------------------- | ------ | ------ | --- | ------ |
| Media upload                | ✅     | ✅     | ✅  | ✅     |
| Pet media upload+attach     | ✅     | ✅     | ✅  | ✅     |
| Pet publish                 | ✅     | ✅     | ✅  | ✅     |
| Pet draft                   | ✅     | ✅     | ✅  | ✅     |
| Pet draft save flow         | ✅     | ✅     | ✅  | ✅     |
| Pet feed (public)           | ✅     | ✅     | ✅  | ✅     |
| Pet profile (public)        | ✅     | ✅     | ✅  | ✅     |
| Shelter profile (public)    | ✅     | ✅     | ✅  | ✅     |
| Adoption application        | ✅     | ✅     | ✅  | ✅     |
| Adoption list               | ✅     | ✅     | ✅  | ✅     |
| Adoption status (manage)    | ✅     | ✅     | ✅  | ✅     |
| Adoption view (read)        | ✅     | ✅     | ✅  | ✅     |
| Donation                    | ✅     | ✅     | ✅  | ✅     |
| Donation list               | ✅     | ✅     | ✅  | ✅     |
| Payment webhook             | ✅     | —      | —   | —      |
| Donation status             | ✅     | ✅     | ✅  | ✅     |
| Sponsorship                 | ✅     | ✅     | ✅  | ✅     |
| Sponsorship list            | ✅     | ✅     | ✅  | ✅     |
| Sponsorship manage          | ✅     | ✅     | ✅  | ✅     |
| Sponsorship donor list      | ✅     | ✅     | ✅  | ✅     |

## What's Complete

The adopter end-to-end read flow is now fully wired:
**feed → pet profile → shelter profile → submit adoption application → view adoption status**

All core domain slices are wired end-to-end through all four layers (Worker → client → Web → Mobile).

## Recommended Next

Begin a new domain slice. Priority candidates (in order):
1. **Shelter member management** — invite/list/remove shelter members; `GET /shelters/:shelterId/members` + `POST /shelters/:shelterId/members` + `DELETE /shelters/:shelterId/members/:userId`
2. **Pet archival / status transitions** — `PATCH /pets/:petId/status` to move a published pet to `archived`
3. **Notification delivery** — Worker-side notification dispatch + client read
