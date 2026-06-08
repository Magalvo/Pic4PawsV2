# Checkpoint: Shelter Member Management Slice Complete — 2026-06-08

## What Was Completed

The full shelter member management slice is now wired end-to-end across all four layers
(Worker → Client → Web → Mobile). This is the first combined read+write domain slice,
introducing the 8-state boundary pattern.

### PRs Merged

| PR | Work Item | Description |
|---|---|---|
| #85 | `SHELTER-MEMBER-WORKER-001` | `GET /shelters/:shelterId/members`, `POST /shelters/:shelterId/members`, `DELETE /shelters/:shelterId/members/:memberId` |
| #86 | `SHELTER-MEMBER-CLIENT-001` | `createShelterMemberClient` in `@pic4paws/client` |
| #87 | `WEB-SHELTER-MEMBER-001` | Web shelter member product boundary (8 states) |
| #88 | `MOBILE-SHELTER-MEMBER-001` | Mobile shelter member product boundary (8 states) |

## New Patterns Introduced

### 8-state combined read+write boundary

Previous slices used either a pure-read boundary (idle/loading/loaded/\[not\_found\]/forbidden/failed)
or a pure-write boundary (idle/submitting/succeeded/failed). The shelter member slice combines
both in a single boundary object:

| State | Type |
|---|---|
| `idle` | Initial / neutral |
| `loading` | List operation in flight |
| `loaded` | List success (with `members[]` + `total`) |
| `forbidden` | Actor lacks shelter membership |
| `failed` | List operation failed (has `status`, `reasons`, `canRetry: true`) |
| `member_added` | Add member success (has `memberId`, `userId`, `role`) |
| `member_removed` | Remove member success (has `memberId`) |
| `action_failed` | Add/remove operation failed (has `status`, `reasons`, `canRetry: true`) |

### Soft-delete for member removal

`removeMember` sets `deleted_at` (ISO timestamp) rather than hard-deleting the row.
The `listMembers` query filters `.is('deleted_at', null)`. This preserves audit history.

### Route ordering requirement

`DELETE /shelters/:shelterId/members/:memberId` is checked BEFORE
`GET|POST /shelters/:shelterId/members` which is checked BEFORE
`GET /shelters/:shelterId`. The `matchWorkerShelterMemberShelterId` matcher returns
null for paths with extra segments (e.g. `/:memberId`), so the shelter profile check
remains safe without modification.

## Key Files

| File | Role |
|---|---|
| `apps/workers/src/shelter-member.ts` | Repository interface, matchers, handlers |
| `apps/workers/src/shelter-member-supabase.ts` | Supabase implementation |
| `packages/client/src/index.ts` | `createShelterMemberClient` |
| `apps/web/src/shelter-member.ts` | `createWebShelterMemberUi` (8 states) |
| `apps/mobile/src/shelter-member.ts` | `createMobileShelterMemberUi` (8 states) |
| `tests/workers/shelter-member.test.ts` | 32 Worker tests |
| `tests/client/shelter-member-client.test.ts` | 21 client tests |
| `tests/web/shelter-member-ui.test.ts` | 17 web UI tests |
| `tests/mobile/shelter-member-ui.test.ts` | 18 mobile UI tests (+ 1 extra repo-not-configured case) |

## Foundation Status After This Slice

| Layer | Coverage |
|---|---|
| Worker | Shelter member list + add + remove; soft-delete pattern |
| `@pic4paws/client` | `ShelterMemberClient` with loadShelterMembers / addShelterMember / removeShelterMember |
| Web | 8-state boundary, PT-PT, credential sanitization, foundation.ts entry |
| Mobile | Exact mirror with `Mobile` prefix, 8-state boundary, PT-PT, credential sanitization |

**Test count after merge: 938 passing.**

## Suggested Next

1. **Pet archival** — `PET-ARCHIVE-WORKER-001` (`PATCH /pets/:petId/status` → `{ status: 'archived' }`), shelter-membership-gated, client + Web/Mobile boundaries.
2. **Notification delivery** — Worker-side dispatch + client read boundary.
