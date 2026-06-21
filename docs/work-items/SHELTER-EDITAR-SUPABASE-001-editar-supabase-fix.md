# SHELTER-EDITAR-SUPABASE-001 — Editar Screen Supabase Singleton Fix

## Goal

Replace the inline `createClient` call in `apps/mobile/app/abrigos/[shelterId]/editar.tsx`
with the shared `mobileSupabaseClient` singleton so that auth-state changes propagate
correctly via `onAuthStateChange`. The inline client was a two-client bug: the singleton
in `apps/mobile/src/supabase.ts` is what `_layout.tsx` listens to, so any session started
by a different client instance would never trigger a navigation update.

## States

No new UI states. This is an internal wiring fix — the `editar` screen already has
`updated`, `failed`, and idle states driven by `createMobileShelterUpdateUi`; those states
are unaffected.

## Contract

- `mobileSupabaseClient` from `apps/mobile/src/supabase.ts` is used in `handleSubmit` to
  retrieve the access token via `.auth.getSession()`.
- No inline `createClient` call may remain in `editar.tsx`.
- Convention matches `verificar.tsx`, `entrar.tsx`, `recuperar-palavra-passe.tsx`, and
  `_layout.tsx`.

## Affected files

| File | Change |
|------|--------|
| `apps/mobile/app/abrigos/[shelterId]/editar.tsx` | Replace inline `createClient` with `mobileSupabaseClient` import |
| `docs/work-items/SHELTER-EDITAR-SUPABASE-001-editar-supabase-fix.md` | This file |

## Completion Notes

Fix applied in PR #216. No new tests required — the singleton itself is covered by the
existing mobile test suite, and the bug was a runtime auth-propagation failure not
detectable by unit tests. Retroactive work item created in PR #218 to satisfy the SDD
doc-per-change convention (P3-1 finding from audit `2026-06-21-sdd-audit-prs-213-216.md`).
