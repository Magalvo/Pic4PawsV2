---
id: SHELTER-VERIFY-001
title: Shelter verification workflow
status: done
---

# Work-Item: SHELTER-VERIFY-001 — Shelter Verification Workflow

## Goal

Implement the shelter verification state machine so that:

1. A shelter owner/member can submit their shelter for review (`draft → pending_review`).
2. A platform admin can approve (`pending_review → verified`), reject (`pending_review → rejected`), suspend (`verified → suspended`), or reinstate (`suspended → verified`) a shelter.
3. A rejected shelter can resubmit (`rejected → pending_review`).

This gates pet publishing and payments behind `verified` status (already enforced in `canPublishPet` and the SDD).

## States

`ShelterVerificationStatus` was already defined in domain: `draft | pending_review | verified | rejected | suspended`. No new domain types needed.

## Contract

### Route

`PATCH /shelters/:id/verification`

Body: `{ "status": "pending_review" | "verified" | "rejected" | "suspended" }`

### Authorization

| Target status | Required |
|---|---|
| `pending_review` | `canManageShelter` (shelter_owner or shelter_member of that shelter, or admin) |
| `verified` / `rejected` / `suspended` | `canVerifyShelter` (admin only) |

### Allowed transitions

| From | To |
|---|---|
| `draft` | `pending_review` |
| `rejected` | `pending_review` |
| `pending_review` | `verified` |
| `pending_review` | `rejected` |
| `verified` | `suspended` |
| `suspended` | `verified` |

Any other transition → 422 `invalid_transition`.

### Success response (200)

```json
{ "status": "updated", "shelterId": "<uuid>", "verificationStatus": "<new-status>" }
```

### Failure statuses

`unauthenticated` · `forbidden` · `invalid_payload` · `shelter_not_found` · `invalid_transition` · `shelter_verification_repository_not_configured` · `auth_adapter_not_configured`

### `ShelterVerificationRepository`

```ts
type ShelterVerificationRepository = {
  loadVerificationStatus(shelterId: string): Promise<{ currentStatus: ShelterVerificationStatus } | null>;
  updateVerificationStatus(shelterId: string, targetStatus: ShelterVerificationStatus, actorUserId: string): Promise<{ shelterId: string } | null>;
};
```

## New domain function

`canVerifyShelter(actor): boolean` — returns `actor.role === 'admin'`. Exported from `@pic4paws/domain` via `export * from './auth'`.

## Affected Files

- `docs/work-items/SHELTER-VERIFY-001-shelter-verification.md`
- `packages/domain/src/auth.ts` — `canVerifyShelter`
- `apps/workers/src/shelter-verify.ts` — handler, repo type, route matcher
- `apps/workers/src/shelter-verify-supabase.ts` — Supabase implementation
- `apps/workers/src/dependencies.ts` — `shelterVerificationRepository` field + wiring
- `apps/workers/src/routes/shelters.ts` — route wired before `matchWorkerShelterProfileId`
- `apps/workers/src/index.ts` — exports
- `packages/client/src/shelters.ts` — `ShelterVerificationClient` + factory
- `tests/workers/shelter-verify.test.ts` — 20 tests

## Completion Notes

- Route matcher `matchWorkerShelterVerificationId` inserted before `matchWorkerShelterProfileId` in `routes/shelters.ts` to avoid the PATCH-for-update handler swallowing the request.
- `canVerifyShelter` is a pure `actor.role === 'admin'` check, consistent with `canDeleteShelter`.
- `pending_review` authorization uses the existing `canManageShelter` (admin also passes).
- Transition guard loads current status first; if shelter is deleted/missing, returns 404 before attempting the update.
- No migration needed: `verification_status` column already exists in the `shelters` table.
