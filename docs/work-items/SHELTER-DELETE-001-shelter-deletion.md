# SHELTER-DELETE-001 — Shelter Deletion

**status**: done
**created**: 2026-06-13
**branch**: agent/SHELTER-DELETE-001

## Goal

Allow a shelter owner to soft-delete their shelter. The shelter is marked with a
`deleted_at` timestamp; its pets are hidden from the public feed via a join filter
without stamping individual pet rows.

## States

| State | Description |
|---|---|
| `idle` | Form ready to confirm deletion |
| `submitting` | Deletion request in flight |
| `deleted` | Shelter successfully soft-deleted |
| `failed` | Deletion failed — distinct copy for `forbidden`, `shelter_not_found`, `unauthenticated` |

## Contract

### Worker — `DELETE /shelters/:shelterId`

Auth ladder (405 → 401 → 501 → 401 → 403 → 501 → 404 → 200):
- **405** for any method other than `DELETE`
- **401** if no `Authorization: Bearer` header
- **501** if authenticator not configured
- **401** if auth fails
- **403** if `canDeleteShelter(actor, shelterId)` is false (not owner, not admin)
- **501** if `shelterDeletionRepository` not configured
- **404** if shelter row not found (already deleted or never existed)
- **200** `{ status: 'deleted', shelterId }`

### Domain — `canDeleteShelter`

Restricts deletion to `shelter_owner` role + admins (members cannot delete):
```
canDeleteShelter(actor, shelterId):
  admin → true
  shelter membership with role === 'shelter_owner' && !deletedAt → true
  otherwise → false
```

### Repository — `ShelterDeletionRepository`

```typescript
type ShelterDeletionRepository = {
  deleteShelter: (shelterId: string, actorUserId: string) => Promise<{ shelterId: string } | null>;
};
```

### Supabase adapter

`UPDATE shelters SET deleted_at = now() WHERE id = :id AND deleted_at IS NULL`
via `.update({ deleted_at: <now> }).eq('id', shelterId).is('deleted_at', null).select('id').maybeSingle()`.
Returns `null` if no row matched (already deleted / not found).

### Pet feed join-filter

`loadPublishedPets` in `pet-supabase.ts` adds `shelters!inner(deleted_at)` to the
select and `.is('shelters.deleted_at', null)` to both count and data queries.
No changes to `PublishedPetSummary`, `PetFeedQuery`, or `PetFeedRepository`.

### Client — `createShelterDeletionClient`

```typescript
type ShelterDeletionClient = {
  deleteShelter: (shelterId: string) => Promise<DeleteShelterClientResult>;
};
```
`DELETE` to `{workerBaseUrl}{shelterPath}/{shelterId}`.
Maps `200 deleted` → `{ ok: true, status: 'deleted', shelterId }`.
`sanitizeReasons` on all failure paths.

### Web boundary — `createWebShelterDeletionUi`

4 states: `idle / submitting / deleted / failed`.
Distinct failure copy for `forbidden`, `shelter_not_found`, `unauthenticated`.
`unsafeReasonMarkers` + `sanitizeReasons` on generic failures.

### Mobile boundary — `createMobileShelterDeletionUi`

Same as web boundary with `Mobile` prefix.

## Affected files

| File | Change |
|---|---|
| `packages/domain/src/auth.ts` | add `canDeleteShelter` |
| `packages/domain/src/index.ts` | export `canDeleteShelter` |
| `apps/workers/src/shelter-delete.ts` | new |
| `apps/workers/src/shelter-delete-supabase.ts` | new |
| `apps/workers/src/pet-supabase.ts` | add shelter join-filter to pet feed |
| `apps/workers/src/dependencies.ts` | add `shelterDeletionRepository` |
| `apps/workers/src/index.ts` | import + dispatch + exports |
| `packages/client/src/index.ts` | add `createShelterDeletionClient` |
| `apps/web/src/shelter-delete.ts` | new |
| `apps/mobile/src/shelter-delete.ts` | new |
| `tests/workers/shelter-delete.test.ts` | new |
| `tests/workers/shelter-delete-supabase.test.ts` | new |
| `tests/workers/pet-feed-supabase.test.ts` | new — verifies shelter join-filter |
| `tests/web/shelter-delete-ui.test.ts` | new |
| `tests/mobile/shelter-delete-ui.test.ts` | new |
