# MOBILE-PET-DRAFT-LOAD-001 — Mobile pet draft load boundary

## Goal
Add `loadDraft(petId)` to `createMobilePetDraftUi` — identical contract to the web boundary.

## States
| State | Trigger |
|---|---|
| `loaded` | Draft returned successfully |
| `not_found` | 404 from worker |
| `forbidden` | 403 from worker |
| `failed` | Any other error |

## Contract
Identical to WEB-PET-DRAFT-LOAD-001 but types use `Mobile` prefix.

## Affected files
- `apps/mobile/src/pet-draft.ts` (modify) — add load state types + `loadDraft` method
