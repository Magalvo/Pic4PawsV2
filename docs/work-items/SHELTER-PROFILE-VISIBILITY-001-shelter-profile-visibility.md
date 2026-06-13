# SHELTER-PROFILE-VISIBILITY-001 — Public Shelter Profile Verification Gate

**status**: done
**decision**: Option A — public route filters by `verification_status = 'verified'`; draft/rejected shelters return 404
**created**: 2026-06-13
**priority**: P2

## Goal

Decide and enforce the public visibility rule for `GET /shelters/:shelterId`. Currently
`shelterProfileRepository.loadShelterProfile` filters only by `id` and `deleted_at IS NULL`,
exposing draft and rejected shelters to anyone who knows the shelter ID. This may expose
contact fields before the shelter completes review.

## Finding being addressed

- **D5**: `shelterProfileRepository.loadShelterProfile` in `apps/workers/src/shelter-supabase.ts`
  does not filter by `verification_status`. A `draft` shelter created by `register_shelter`
  is immediately accessible through the public profile route.

## Decision required

Choose one of:

**Option A — Public-only**: Filter by `verification_status = 'verified'`. Draft/rejected
shelters return 404 on the public route. Shelter owners cannot preview their unverified
profile unless they use a separate authenticated route.

**Option B — Public verified + authenticated preview**: Public route filters by
`verification_status = 'verified'`. A new authenticated `GET /shelters/:shelterId/preview`
route returns the shelter regardless of status, gated by `canManageShelter`.

The recommended default is **Option A** unless a product requirement for an owner preview
flow already exists. Document the decision in this work item before implementing.

## Contract (Option A)

### Supabase adapter change (in `apps/workers/src/shelter-supabase.ts`)

Add `.eq('verification_status', 'verified')` to the `loadShelterProfile` query alongside
the existing `.is('deleted_at', null)` filter.

### Tests (in `tests/workers/shelter-supabase.test.ts` or new file)

- Add test: profile query for a `draft` shelter returns `null`.
- Add test: profile query for a `rejected` shelter returns `null`.
- Add test: profile query for a `verified` shelter returns the shelter data.

## Affected files (Option A)

| File | Change |
|---|---|
| `apps/workers/src/shelter-supabase.ts` | add `verification_status = 'verified'` filter to `loadShelterProfile` |
| `tests/workers/shelter-supabase.test.ts` | add verification_status filter tests |
