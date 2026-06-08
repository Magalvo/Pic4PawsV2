# Checkpoint: Adoption Status Slice Complete + Adoption View Worker — 2026-06-08

## PRs Merged (since previous checkpoint)

| PR  | Work Item                    | Description                                                                    |
| --- | ---------------------------- | ------------------------------------------------------------------------------ |
| #70 | WEB-SPONSORSHIP-MANAGE-001   | Web sponsorship manage UI boundary (was deferred; merged after rebase)         |
| #77 | ADOPTION-STATUS-CLIENT-001   | `createAdoptionStatusClient` in `@pic4paws/client`                             |
| #78 | WEB-ADOPTION-STATUS-001      | Web adoption status product boundary for shelter staff                         |
| #79 | MOBILE-ADOPTION-STATUS-001   | Mobile adoption status product boundary for shelter staff                      |
| TBD | ADOPTION-VIEW-WORKER-001     | `GET /adoptions/:applicationId` dual-access Worker route + Supabase repository |

## What Was Built

### Client (`ADOPTION-STATUS-CLIENT-001`)
- `createAdoptionStatusClient({ workerBaseUrl, adoptionsPath, getAccessToken, fetch })`
- `manageAdoptionStatus(applicationId, status)` → `AdoptionStatusClientResult`
- 5 failure statuses: `unauthenticated | adoption_status_repository_not_configured | auth_adapter_not_configured | worker_request_failed | worker_response_invalid`
- Uses `createWorkerSubUrl(adoptionsPath, applicationId)` for the PATCH URL

### Web Boundary (`WEB-ADOPTION-STATUS-001`)
- `createWebAdoptionStatusUi({ adoptionStatusClient })`
- 4 states: `idle / submitting / succeeded / failed`
- `WebAdoptionStatusSucceededState` includes `applicationId` + `newStatus`
- `WebAdoptionStatusFailedState` includes `status`, `reasons`, `canRetry`
- `unsafeReasonMarkers` + `sanitizeReasons` — credential stripping at product boundary
- PT-PT copy; `webAdoptionStatusUiContent.locale === 'pt-PT'`, `status === 'product-flow-ready'`
- Exposed via `apps/web/src/foundation.ts` → `webFoundationContent.adoptionStatus`
- 11 tests

### Mobile Boundary (`MOBILE-ADOPTION-STATUS-001`)
- `createMobileAdoptionStatusUi({ adoptionStatusClient })`
- 4 states: `idle / submitting / succeeded / failed` + `unauthenticated` case
- Exact mirror of web boundary with `Mobile` prefix
- `mobileAdoptionStatusUiContent.locale === 'pt-PT'`, `status === 'product-flow-ready'`
- Exposed via `apps/mobile/src/foundation.ts` → `mobileFoundationContent.adoptionStatus`
- 12 tests

### Worker (`ADOPTION-VIEW-WORKER-001`)
- `GET /adoptions/:applicationId` authenticated route — dual access (applicant OR shelter member)
- Access: `actor.id === record.applicantUserId` OR `canManageShelter(actor, record.shelterId)`
- `AdoptionViewRecord`: `applicationId`, `shelterId`, `applicantUserId`, `petId`, `applicationStatus`
- `applicantUserId` used only for access control — deliberately omitted from the 200 response
- `AdoptionViewRepository`: `getAdoptionView(applicationId)` → `AdoptionViewRecord | null`
- Route registered at the same path as `PATCH /adoptions/:applicationId` — method-switched in `index.ts`
  using `matchWorkerAdoptionStatusId` (existing matcher, reused for GET)
- Supabase repository in `adoption-view-supabase.ts`
  - Table: `adoption_applications`, columns: `id`, `shelter_id`, `user_id`, `pet_id`, `status`
- `adoptionViewRepository` wired into `WorkerRequestDependencies` + `createWorkerSupabaseDependencies`
- Barrel exports added to `apps/workers/src/index.ts`
- 14 tests

## Validation

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 815 tests passing (108 files)
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
| Adoption view (read)        | ✅     | —      | —   | —      |
| Donation                    | ✅     | ✅     | ✅  | ✅     |
| Donation list               | ✅     | ✅     | ✅  | ✅     |
| Payment webhook             | ✅     | —      | —   | —      |
| Donation status             | ✅     | ✅     | ✅  | ✅     |
| Sponsorship                 | ✅     | ✅     | ✅  | ✅     |
| Sponsorship list            | ✅     | ✅     | ✅  | ✅     |
| Sponsorship manage          | ✅     | ✅     | ✅  | ✅     |
| Sponsorship donor list      | ✅     | ✅     | ✅  | ✅     |

## Recommended Next

Continue the adoption view slice with client + Web/Mobile boundaries:
- `ADOPTION-VIEW-CLIENT-001` — `createAdoptionViewClient` in `@pic4paws/client`
- `WEB-ADOPTION-VIEW-001` — Web adoption view product boundary (adopter status page)
- `MOBILE-ADOPTION-VIEW-001` — Mobile adoption view product boundary
