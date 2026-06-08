# Work-Item: SHELTER-MEMBER-WORKER-001 — Shelter Member Management Worker Routes

## 1. Context & Problem

Shelter membership is already used for access control throughout the app (`canManageShelter`,
`ShelterMembershipRecord`). However there is no Worker route to manage membership — shelter
owners cannot list, add, or remove members via the API. This work item introduces the
member management routes under `/shelters/:shelterId/members`.

## 2. Acceptance Criteria

- [ ] Create `apps/workers/src/shelter-member.ts`:
  - `ShelterMemberRole` type: `'shelter_owner' | 'shelter_member'`
  - `ShelterMemberSummary` type: `{ memberId, userId, role, joinedAt }`
  - `ShelterMemberRepository` interface: `listMembers`, `addMember`, `removeMember`
  - `matchWorkerShelterMemberShelterId` — extracts shelterId from `/shelters/:shelterId/members`
  - `matchWorkerShelterMemberRemoveIds` — extracts `{ shelterId, memberId }` from `/shelters/:shelterId/members/:memberId`
  - `validateAddShelterMemberPayload` — validates `{ userId, role }` POST body
  - `handleWorkerShelterMemberRequest` — `GET` (list) and `POST` (add) on `/shelters/:shelterId/members`
  - `handleWorkerShelterMemberRemoveRequest` — `DELETE` on `/shelters/:shelterId/members/:memberId`
  - Access: `canManageShelter` required for all operations
- [ ] Create `apps/workers/src/shelter-member-supabase.ts`:
  - `createSupabaseShelterMemberRepositories({ client })`
  - Reads/writes `shelter_memberships` table (columns: `id`, `shelter_id`, `user_id`, `role`, `created_at`, `deleted_at`)
- [ ] Modify `apps/workers/src/dependencies.ts`:
  - Add `shelterMemberRepository?` to `WorkerRequestDependencies`
  - Wire `createSupabaseShelterMemberRepositories` in `createWorkerSupabaseDependencies`
- [ ] Modify `apps/workers/src/index.ts`:
  - Check `matchWorkerShelterMemberRemoveIds` BEFORE shelter profile check
  - Check `matchWorkerShelterMemberShelterId` AFTER remove check, BEFORE shelter profile check
  - Barrel-export all new types and functions
- [ ] Tests: `tests/workers/shelter-member.test.ts` (≥ 15 tests, fail → pass)
- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`

## 3. Route Details

### GET /shelters/:shelterId/members
- Auth: bearer + `canManageShelter`
- Query params: `limit` (default 20, max 100), `offset` (default 0)
- Response 200: `{ status: 'ok', members: ShelterMemberSummary[], total: number }`
- Error 405 (non-GET/POST on this path), 401, 403, 501

### POST /shelters/:shelterId/members
- Auth: bearer + `canManageShelter`
- Body: `{ userId: string, role: 'shelter_owner' | 'shelter_member' }`
- Response 201: `{ status: 'ok', memberId, userId, role }`
- Error 400 (invalid payload), 409 (already member), 401, 403, 501

### DELETE /shelters/:shelterId/members/:memberId
- Auth: bearer + `canManageShelter`
- Response 200: `{ status: 'ok', memberId }`
- Error 404 (member not found), 401, 403, 405 (non-DELETE), 501

## 4. Route Ordering in index.ts

```
// 1. /shelters/:shelterId/members/:memberId  → handleWorkerShelterMemberRemoveRequest (DELETE)
// 2. /shelters/:shelterId/members            → handleWorkerShelterMemberRequest (GET/POST)
// 3. /shelters/:shelterId                    → handleWorkerShelterProfileRequest (existing)
```

Both new checks must be placed BEFORE the shelter profile check.
