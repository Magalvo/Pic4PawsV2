# SHELTER-VERIFY-MOBILE-001 — Shelter Verification Mobile UI

## Goal

Provide a React Native screen at `abrigos/:shelterId/verificar` (Expo Router) that lets shelter members submit for review and lets admins approve, reject, suspend, or reinstate shelters. Uses `mobileSupabaseClient` singleton for auth.

## States

| State | Trigger | Description |
|-------|---------|-------------|
| null (loading) | on mount | No loading screen needed; actions are immediate |
| updated | successful PATCH | Shows PT-PT success message and "Ver abrigo" button |
| failed | failed PATCH | Shows PT-PT error with "Tentar de novo" and "Voltar" |

## Contract

- `PATCH /shelters/:id/verification` via `ShelterVerificationClient.updateVerificationStatus`
- Auth via `mobileSupabaseClient.auth.getSession()` (singleton, no persistSession)
- Same PT-PT content as web boundary
- Credentials sanitized: `service-role` and `bearer ` never appear in serialized state

## Affected files

| File | Change |
|------|--------|
| `apps/mobile/src/shelter-verify.ts` | New — `createMobileShelterVerifyUi` factory, `MobileShelterVerifyState` union |
| `apps/mobile/app/abrigos/[shelterId]/verificar.tsx` | New — React Native screen, `ScrollView` layout, teal/dark colour scheme |
| `tests/mobile/shelter-verify-ui.test.ts` | New — 10 tests covering all success/failure paths and sanitization |

## Dependencies

- Depends on `SHELTER-VERIFY-001` (worker route)
- Depends on `SHELTER-VERIFY-WEB-001` (client types added to `packages/client/src/shelters.ts`)
- Uses existing `mobileSupabaseClient` from `apps/mobile/src/supabase.ts`

## Acceptance criteria

- [ ] Screen mounts without error
- [ ] Success for each target status renders updated state with title and message
- [ ] `forbidden` maps to "Sem permissão"
- [ ] `invalid_transition` maps to "Transição inválida"
- [ ] `unauthenticated` maps to "Sessão expirada"
- [ ] Failed state serialization never contains `service-role` or `bearer `
- [ ] "Voltar" navigates back; "Ver abrigo" navigates to `/abrigos/:shelterId`
