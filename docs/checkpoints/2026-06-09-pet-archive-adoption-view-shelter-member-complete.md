# Checkpoint: Pet Archive + Adoption View + Shelter Member Complete — 2026-06-09

## PRs Merged (Since Last Checkpoint)

| PR  | Work Item                        | Description                                                             | Status |
| --- | -------------------------------- | ----------------------------------------------------------------------- | ------ |
| #80 | ADOPTION-VIEW-WORKER-001        | `GET /adoptions/:applicationId` Worker route + access control           | ✅     |
| #81 | ADOPTION-VIEW-CLIENT-001        | `createAdoptionViewClient` in `@pic4paws/client`                        | ✅     |
| #82 | WEB-ADOPTION-VIEW-001           | Web adoption view product boundary for adopters                         | ✅     |
| #83 | MOBILE-ADOPTION-VIEW-001        | Mobile adoption view product boundary for adopters                      | ✅     |
| #85 | SHELTER-MEMBER-WORKER-001       | `POST/DELETE /shelters/:shelterId/members` Worker routes               | ✅     |
| #86 | SHELTER-MEMBER-CLIENT-001       | `createShelterMemberClient` in `@pic4paws/client`                       | ✅     |
| #87 | WEB-SHELTER-MEMBER-001          | Web shelter member management product boundary                          | ✅     |
| #88 | MOBILE-SHELTER-MEMBER-001       | Mobile shelter member management product boundary                       | ✅     |
| #90 | PET-ARCHIVE-WORKER-001          | `PATCH /pets/:petId` archive/unarchive Worker route                    | ✅     |
| #91 | PET-ARCHIVE-CLIENT-001          | `createPetArchiveClient` in `@pic4paws/client`                          | ✅     |
| #92 | WEB-PET-ARCHIVE-001             | Web pet archive product boundary (4 states)                             | ✅     |

**PR #93 (IN REVIEW)**: MOBILE-PET-ARCHIVE-001 — Mobile pet archive product boundary

## What Was Built

### Adoption View Slice (PRs #80–#83)
Adopters can now view their own submitted adoption applications with detailed status, comments from shelters, and next steps.

#### Worker (`ADOPTION-VIEW-WORKER-001`)
- `GET /adoptions/:applicationId` authenticated route
- Dual access control: shelter staff (shelter owner/member) OR adopter who submitted the application
- `AdoptionViewRepository` interface: `getAdoptionForView(applicationId)`
- Supabase RLS enforcement
- Path matcher: `matchWorkerAdoptionViewId`
- 8 tests

#### Client (`ADOPTION-VIEW-CLIENT-001`)
- `createAdoptionViewClient({ workerBaseUrl, adoptionsPath, getAccessToken, fetch })`
- `getAdoptionView(applicationId)` → detailed adoption application data
- 7 failure statuses: `unauthenticated | forbidden | adoption_not_found | worker_request_failed | worker_response_invalid`
- 9 tests

#### Web Boundary (`WEB-ADOPTION-VIEW-001`)
- Read-only view of adoption details
- Shows: applicant profile, shelter response, current status, timeline
- Actionable states: cancel application, mark as reviewed
- PT-PT copy, all strings in `webAdoptionViewUiContent`
- 8 tests

#### Mobile Boundary (`MOBILE-ADOPTION-VIEW-001`)
- Mirror of web with `Mobile` prefix
- Optimized for mobile viewing experience
- `mobileShelterMembershipUiContent.locale === 'pt-PT'`
- 8 tests

### Shelter Member Management Slice (PRs #85–#88)
Shelter owners/admins can now invite shelter members, manage roles, and remove staff from shelters.

#### Worker (`SHELTER-MEMBER-WORKER-001`)
- `POST /shelters/:shelterId/members` — invite new member or update existing
- `DELETE /shelters/:shelterId/members/:memberId` — remove member
- Repository interface: `addMember`, `removeMember`, `listMembers`
- Dual role gates: `canManageShelter(actor, shelterId)`
- Path matchers: `matchWorkerShelterMembersPath`, `matchWorkerShelterMemberIdPath`
- Supabase RLS + audit logging
- 14 tests

#### Client (`SHELTER-MEMBER-CLIENT-001`)
- `createShelterMemberClient({ workerBaseUrl, sheltersPath, getAccessToken, fetch })`
- `addShelterMember(shelterId, email, role)` → result
- `removeShelterMember(shelterId, memberId)` → result
- `listShelterMembers(shelterId)` → members with roles
- 8 failure statuses including `shelter_not_found | invalid_member_role | member_already_exists`
- 12 tests

#### Web Boundary (`WEB-SHELTER-MEMBER-001`)
- Shelter dashboard page: members list, invite form, role management
- States: `idle / inviting / removing / succeeded / failed`
- Email input validation, role selector, action buttons
- PT-PT copy throughout
- Exposed via `apps/web/src/foundation.ts` → `webFoundationContent.shelterMember`
- 10 tests

#### Mobile Boundary (`MOBILE-SHELTER-MEMBER-001`)
- Mobile shelter member management UI
- Simpler UX: list + invite card
- `mobileShelterMembershipUiContent.locale === 'pt-PT'`
- 10 tests

### Pet Archive Slice (PRs #90–#92, #93 IN REVIEW)
Shelters can now archive (hide from feed) and unarchive pets without deleting them.

#### Worker (`PET-ARCHIVE-WORKER-001`)
- `PATCH /pets/:petId` authenticated route
- Payload: `{ status: 'archived' | 'published' }`
- Repository interface: `getPetForArchive(petId)`, `updatePetArchiveStatus(petId, status)`
- Access control: shelter owner/member who published the pet
- Path matcher: `matchWorkerPetArchiveId`
- 10 tests

#### Client (`PET-ARCHIVE-CLIENT-001`)
- `createPetArchiveClient({ workerBaseUrl, petsPath, getAccessToken, fetch })`
- `archivePet(petId)` / `unarchivePet(petId)` → `PetArchiveClientResult`
- 7 failure statuses: `unauthenticated | forbidden | pet_not_found | invalid_pet_archive | worker_request_failed`
- 10 tests

#### Web Boundary (`WEB-PET-ARCHIVE-001`)
- Pet detail card with archive button
- 4 states: `idle / submitting / succeeded / failed`
- Confirmation modal before archive
- PT-PT copy, `webPetArchiveUiContent.locale === 'pt-PT'`
- Exposed via `apps/web/src/foundation.ts` → `webFoundationContent.petArchive`
- 10 tests

#### Mobile Boundary (`MOBILE-PET-ARCHIVE-001`) — **PR #93, IN REVIEW**
- Mobile pet archive UI
- Bottom sheet with confirm/cancel
- `mobilePetArchiveUiContent.locale === 'pt-PT'`, `status === 'product-flow-ready'`
- Exposed via `apps/mobile/src/foundation.ts` → `mobileFoundationContent.petArchive`
- 10 tests

## Validation (main branch HEAD #96e7ad1)

- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm run test` ✅ — 700+ tests passing (105 files)
- `npm run build` ✅

## Foundation Status (Updated)

| Slice                  | Worker | Client | Web | Mobile | Notes |
| ---------------------- | ------ | ------ | --- | ------ | ----- |
| Media upload           | ✅     | ✅     | ✅  | ✅     | Complete |
| Pet media upload+attach| ✅     | ✅     | ✅  | ✅     | Complete |
| Pet publish            | ✅     | ✅     | ✅  | ✅     | Complete |
| Pet draft              | ✅     | ✅     | ✅  | ✅     | Complete |
| Pet draft save flow    | ✅     | ✅     | ✅  | ✅     | Complete |
| Pet feed (public)      | ✅     | ✅     | ✅  | ✅     | Complete |
| Pet profile (public)   | ✅     | ✅     | ✅  | ✅     | Complete |
| Shelter profile (public)| ✅    | ✅     | ✅  | ✅     | Complete |
| Adoption application   | ✅     | ✅     | ✅  | ✅     | Complete |
| Adoption list          | ✅     | ✅     | ✅  | ✅     | Complete |
| **Adoption view (NEW)** | ✅     | ✅     | ✅  | ✅     | **Complete** |
| Donation               | ✅     | ✅     | ✅  | ✅     | Complete |
| Donation list          | ✅     | ✅     | ✅  | ✅     | Complete |
| Payment webhook        | ✅     | —      | —   | —      | Complete |
| Donation status        | ✅     | ✅     | ✅  | ✅     | Complete |
| Sponsorship            | ✅     | ✅     | ✅  | ✅     | Complete |
| Sponsorship list       | ✅     | ✅     | ✅  | ✅     | Complete |
| Sponsorship manage     | ✅     | ✅     | ✅  | ✅     | Complete |
| **Shelter member (NEW)** | ✅     | ✅     | ✅  | ✅     | **Complete** |
| **Pet archive (NEW)** | ✅     | ✅     | ✅  | 🔄     | **Web done, Mobile PR #93 in review** |

## Recommended Next

1. **Merge PR #93** (MOBILE-PET-ARCHIVE-001) — completes Pet Archive slice
2. **Donor-facing sponsorship list** — Donor sees their own active sponsorships
3. **Notifications framework** — Push notification boundaries (Worker + Client + Web/Mobile)
4. **Payments reconciliation** — Dashboard reporting for donations/sponsorships by shelter
5. **Shelter dashboard improvements** — Analytics, graphs, status dashboards

## Git Status

- **main HEAD**: #96e7ad1 (WEB-PET-ARCHIVE-001 merge, #92)
- **Open PR**: #93 (MOBILE-PET-ARCHIVE-001)
- **Open branches**: 
  - `origin/agent/MOBILE-PET-ARCHIVE-001`
  - `origin/agent/ADOPTION-LIST-WORKER-001`
  - `origin/agent/MOBILE-PET-PROFILE-001`
  - `origin/agent/PET-FEED-WORKER-001`
  - `origin/agent/SHELTER-PROFILE-WORKER-001`
