# Work-Spec: Implementation Plan for PET-DB-001

## 1. Target Files

- `docs/work-items/PET-DB-001-pet-draft-persistence-contract.md`
- `docs/work-specs/PET-DB-001-pet-draft-persistence-contract.md`
- `packages/database/src/pet-drafts.ts`
- `packages/database/src/schema.ts`
- `packages/database/src/migration-artifacts.ts`
- `packages/database/src/index.ts`
- `tests/database/pet-draft-persistence.test.ts`
- `docs/work-tracks/remake-foundation.md`

## 2. Proposed Technical Approach

Add pure database contract helpers that translate domain `PetDraftRecord` values into insert and update payloads suitable for the `pets` table. The helpers validate draft-only writes, media attachment consistency and hero media consistency, then return plain objects without opening any database connections.

Expose:

- `createPetDraftInsertContract`
- `createPetDraftUpdateContract`
- `PetDraftPersistenceRejectionReason`

Update the schema and initial SQL artifact so draft listing fields are nullable while publishing rules stay enforced in the domain layer.

## 3. Testing Strategy

- Initial failing test: assert an incomplete draft can generate an insert contract with nullable listing fields.
- Assert update contracts accept only persisted same-shelter public image media.
- Assert invalid media, duplicate IDs, non-draft status and invalid hero media are rejected deterministically.
- Assert the initial SQL artifact no longer marks draft listing fields as `not null`.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Pure functions only.
- No Supabase access.
- No R2 access.
- No UI or Worker routing.
- Preserve domain publishing validation as the source of truth for public publishability.
