---
id: PET-STATUS-HISTORY-001
title: Pet lifecycle event audit log
status: in-progress
---

## Goal

Record an immutable audit entry every time a pet's lifecycle status transitions
via the archive/republish route (`PATCH /pets/:petId/status`). Provides a full
status history (who changed it, from which status, to which status, and when)
without mutating any existing table.

## Contract

```typescript
// Extension to PetArchiveRepository
recordLifecycleEvent: (input: {
  petId: string;
  shelterId: string;
  actorUserId: string;
  fromStatus: string;
  toStatus: string;
  now: string;
}) => Promise<void>
```

- Called only on success (after `archivePet` / `republishPet` return a result)
- NOT called when archive/republish returns null (conflict cases)
- Handler passes `actor.id` as `actorUserId`

## Affected files

- `packages/database/src/schema.ts` — add `petLifecycleEvents` table
- `apps/workers/src/pet-archive.ts` — extend repository interface + handler
- `apps/workers/src/pet-archive-supabase.ts` — implement `recordLifecycleEvent`
- `tests/workers/pet-archive.test.ts` — add no-op default to `makeRepository`
- `tests/workers/pet-status-history.test.ts` — new tests for event recording
