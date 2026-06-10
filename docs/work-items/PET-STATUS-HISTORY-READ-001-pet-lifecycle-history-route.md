---
id: PET-STATUS-HISTORY-READ-001
title: Pet lifecycle history read route
status: done
pr: 118
---

## Goal

Expose `GET /pets/:petId/status-history` so shelter staff can read the full audit
trail of lifecycle transitions for a pet. Auth-gated to shelter members of the
pet's shelter.

## Contract

```typescript
// GET /pets/:petId/status-history
// 200: { status: 'ok', petId, events: PetLifecycleEvent[] }
// 401: unauthenticated
// 403: forbidden
// 404: pet_not_found
// 501: pet_archive_repository_not_configured | auth_adapter_not_configured

// Extension to PetArchiveRepository
getLifecycleEvents: (petId: string) => Promise<PetLifecycleEvent[]>

// PetLifecycleEvent
{ id: string; petId: string; shelterId: string; actorUserId: string;
  fromStatus: string; toStatus: string; createdAt: string }
```

- Events ordered newest-first
- Reuses the existing `PetArchiveRepository` (same dependency, same auth)

## Affected files

- `apps/workers/src/pet-archive.ts` — add `PetLifecycleEvent`, `getLifecycleEvents`, new matcher + handler
- `apps/workers/src/pet-archive-supabase.ts` — implement `getLifecycleEvents`
- `apps/workers/src/index.ts` — wire new route (before archive matcher)
- `tests/workers/pet-archive.test.ts` — add `getLifecycleEvents` no-op to `makeRepository`
- `tests/workers/pet-status-history-route.test.ts` — new tests
