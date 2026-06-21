# SHELTER-VERIFY-WEB-001 — Shelter Verification Web UI

## Goal

Provide a web page at `/abrigos/:shelterId/verificar` that lets shelter members submit for review and lets admins approve, reject, suspend, or reinstate shelters. Route is already protected by the existing middleware (no explicit listing required for sub-paths under `/abrigos`).

## States

| State | Trigger | Description |
|-------|---------|-------------|
| idle | on load | Shows all available actions (server enforces role auth) |
| updated | successful PATCH | Shows PT-PT success message and link back to shelter |
| failed | failed PATCH | Shows PT-PT error with canRetry, sanitized reasons |

## Contract

- `PATCH /shelters/:id/verification` via `ShelterVerificationClient.updateVerificationStatus`
- Auth enforced server-side: shelter members may submit (`pending_review`); admins may verify, reject, suspend
- `invalid_transition` → "Transição inválida" copy
- `forbidden` → "Sem permissão" copy
- `unauthenticated` → "Sessão expirada" with sign-in link
- Credentials sanitized: `service-role` and `bearer ` never appear in serialized state

## Affected files

| File | Change |
|------|--------|
| `packages/client/src/shelters.ts` | Added `ShelterVerificationTargetStatus`, `UpdateVerificationClientResult`, `ShelterVerificationClient`, `createShelterVerificationClient` |
| `apps/web/src/shelter-verify.ts` | New — `createWebShelterVerifyUi` factory, `WebShelterVerifyState` union, PT-PT content |
| `apps/web/app/abrigos/[shelterId]/verificar/page.tsx` | New — `'use client'` page, role-agnostic action panel |
| `tests/web/shelter-verify-ui.test.ts` | New — 14 tests covering content, getInitialState, all success/failure paths, sanitization |

## Dependencies

- Depends on `SHELTER-VERIFY-001` (worker route `PATCH /shelters/:id/verification`)
- Client package already exports `ShelterVerificationClient` via `export * from './shelters'`

## Acceptance criteria

- [ ] `webShelterVerifyUiContent` has `locale: 'pt-PT'` and `status: 'product-flow-ready'`
- [ ] `getInitialState()` returns `{ state: 'idle', title: ..., description: ... }`
- [ ] Success for each target status returns `{ state: 'updated', verificationStatus: ... }`
- [ ] `forbidden` maps to "Sem permissão"
- [ ] `invalid_transition` maps to "Transição inválida"
- [ ] `unauthenticated` maps to "Sessão expirada"
- [ ] Failed state serialization never contains `service-role` or `bearer `
- [ ] Page renders without error and shows the idle action panel
