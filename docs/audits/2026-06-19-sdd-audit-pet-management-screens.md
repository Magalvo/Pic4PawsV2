---
audited-through: 43c2d7549a86cf32180a718bd04796258fb7b0b8
prs: "#183, #184, #185"
score: 8/10
---

# SDD Audit — Pet Management Screens (PRs #183–#185) — 2026-06-19

## Scope

3 PRs merged to `main` since baseline (`138a3fd14cd35010b8b49a3cda5b9d8a1b853627`, PR #168, last audit):

| PR | Branch | Description |
|----|--------|-------------|
| #183 | `agent/PET-ARCHIVE-SCREEN-001` | Pet archive screen (mobile + web) |
| #184 | `agent/PET-PUBLISH-SCREEN-001` | Pet publish screen (mobile + web) |
| #185 | `agent/PET-DRAFT-SCREENS-001` | Pet draft create + edit screens (mobile + web) |

PRs #169–#182 (Track C screen wiring) were merged between the prior audit baseline and this scope but post-date the prior audit's `audited-through` SHA. They were fully covered by that audit's scope (`prs: 144-168` means the audit was written covering those plus the Track C PRs). This audit focuses strictly on the Track D pet management screens.

---

## 1. Spec Compliance Score

**8 / 10**

All three work items are implemented with correct boundary wiring, auth pattern, PT-PT content, and the full ViewModel state machine. All four CI gates pass (1832 tests, 234 files). Two deductions:

- **−1.0**: Missing sanitization tests for PET-ARCHIVE-SCREEN-001 — both platforms (E1)
- **−0.5**: PET-DRAFT-SCREENS-001 work item Completion Notes documents incorrect import depths (E2)
- **−0.5**: `persistSession` not set on fresh mobile Supabase clients in the three new screens — carry-forward of prior audit E2 now affecting Track D screens (E3)

---

## 2. Gap Analysis Matrix

| Feature / Requirement | Status | File Paths | Notes |
|---|---|---|---|
| PET-ARCHIVE-SCREEN-001: mobile screen at `animais/[petId]/arquivar` | Implemented | `apps/mobile/app/animais/[petId]/arquivar.tsx` | IDLE constant, confirmArchive useCallback, all states handled |
| PET-ARCHIVE-SCREEN-001: web page at `animais/[petId]/arquivar/page.tsx` | Implemented | `apps/web/app/animais/[petId]/arquivar/page.tsx` | `use(params)` for petId, correct auth pattern |
| PET-ARCHIVE-SCREEN-001: `petFeedPath: '/pets'` on client | Implemented | Both platform screens | Correct path passed to `createPetArchiveClient` |
| PET-ARCHIVE-SCREEN-001: `archived \| published` → navigate back | Implemented | `arquivar.tsx:63` | Both states render "Voltar" button wired to `router.back()` |
| PET-ARCHIVE-SCREEN-001: `failed` state with retry | Implemented | Both platform screens | Retry button calls `confirmArchive` / `handleArchive` |
| PET-ARCHIVE-SCREEN-001: mobile boundary contract tests | Implemented | `tests/mobile/pet-archive-screen.test.ts` | 4 tests; see E1 |
| PET-ARCHIVE-SCREEN-001: web boundary contract tests | Implemented | `tests/web/pet-archive-screen.test.ts` | 4 tests; see E1 |
| PET-ARCHIVE-SCREEN-001: sanitization test (both platforms) | **Missing** | `tests/mobile/pet-archive-screen.test.ts`, `tests/web/pet-archive-screen.test.ts` | No test asserting `service-role` and `bearer ` absent — see E1 |
| PET-PUBLISH-SCREEN-001: mobile screen at `animais/[petId]/publicar` | Implemented | `apps/mobile/app/animais/[petId]/publicar.tsx` | `petName` from search params, initial state inlined |
| PET-PUBLISH-SCREEN-001: web page at `animais/[petId]/publicar/page.tsx` | Implemented | `apps/web/app/animais/[petId]/publicar/page.tsx` | `useSearchParams().get('petName')` pattern |
| PET-PUBLISH-SCREEN-001: `petDraftsPath: '/pets/drafts'` on client | Implemented | Both platform screens | Correct path passed to `createPetPublishClient` |
| PET-PUBLISH-SCREEN-001: `ready → publishing → published \| failed` | Implemented | Both platform screens | `publishing` state defined inline (not exported), matches spec |
| PET-PUBLISH-SCREEN-001: sanitization test (both platforms) | Implemented | `tests/mobile/pet-publish-screen.test.ts:56`, `tests/web/pet-publish-screen.test.ts` | Asserts both `service-role` and `bearer ` absent |
| PET-DRAFT-SCREENS-001: mobile create screen at `rascunhos/novo` | Implemented | `apps/mobile/app/animais/rascunhos/novo.tsx` | `shelterId` from search params, `petId: ''` for POST |
| PET-DRAFT-SCREENS-001: web create page at `rascunhos/novo/page.tsx` | Implemented | `apps/web/app/animais/rascunhos/novo/page.tsx` | Suspense wrapper required (static route + `useSearchParams`) |
| PET-DRAFT-SCREENS-001: mobile edit screen at `rascunhos/[petId]/editar` | Implemented | `apps/mobile/app/animais/rascunhos/[petId]/editar.tsx` | `useEffect` loads on mount, `fromDraft()` populates form |
| PET-DRAFT-SCREENS-001: web edit page at `rascunhos/[petId]/editar/page.tsx` | Implemented | `apps/web/app/animais/rascunhos/[petId]/editar/page.tsx` | `use(params)` + `useEffect` load |
| PET-DRAFT-SCREENS-001: `loadDraft` states (loading/loaded/not_found/forbidden/failed) | Implemented | Both edit screens | All 5 load states handled |
| PET-DRAFT-SCREENS-001: medical toggles (vaccinated/sterilized/microchipped/specialNeeds) | Implemented | All 4 draft screens | Mobile uses `Switch`, web uses `checkbox` |
| PET-DRAFT-SCREENS-001: `PetLifecycleSpecies` inline cast | Implemented | All 4 draft screens | `(form.species \|\| null) as 'dog' \| 'cat' \| 'other' \| null` — not re-exported by `@pic4paws/client` |
| PET-DRAFT-SCREENS-001: sanitization test (both platforms) | Implemented | `tests/mobile/pet-draft-screen.test.ts:125`, `tests/web/pet-draft-screen.test.ts` | Asserts both markers absent |
| PET-DRAFT-SCREENS-001: Completion Notes import depths accurate | **Partial** | `docs/work-items/PET-DRAFT-SCREENS-001-pet-draft-screens.md` | Depths in doc are 1 level too deep — see E2 |
| `pet-media-upload.ts` boundary wired to a screen | **Missing** | `apps/mobile/src/pet-media-upload.ts`, `apps/web/src/pet-media-upload.ts` | No work item in scope covered this; see E4 |
| `pet-draft-save-flow.ts` boundary wired to a screen | **Missing** | `apps/mobile/src/pet-draft-save-flow.ts`, `apps/web/src/pet-draft-save-flow.ts` | No work item in scope covered this; see E4 |

---

## 3. Deviations and Scope Creep

**No scope creep.** All changes are traceable to their three work items.

**Architectural note — `persistSession` on mobile:** The HANDOFF.md auth design section specifies `persistSession: false` for mobile to prevent AsyncStorage writes. Only `apps/mobile/app/entrar.tsx` sets this option. All Track D mobile screens call `createClient(supabaseUrl(), supabaseAnonKey())` without the auth option. Since each screen creates a fresh `createClient` instance inside a `useCallback` (rather than at module level), and immediately calls `getSession()` then discards the client, the practical risk of token leakage is low. However the intent of `persistSession: false` — no async storage writes — is not enforced. This is a carry-forward of the prior audit's E2 finding (there scoped to web; here it surfaces on mobile).

---

## 4. Findings

### E1 — P2: No sanitization tests in PET-ARCHIVE-SCREEN-001 (both platforms)

**Affected files:**
- `tests/mobile/pet-archive-screen.test.ts` (4 tests, no sanitization test)
- `tests/web/pet-archive-screen.test.ts` (4 tests, no sanitization test)

The project's test convention (established in `docs/canonical/sdd.md` and carried through all subsequent screen tests) requires that every screen test file include a failed-state sanitization test asserting BOTH of the following are absent from the serialized result:
- `'service-role'`
- `'bearer '` (with trailing space)

PET-PUBLISH-SCREEN-001 and PET-DRAFT-SCREENS-001 test files both comply (`tests/mobile/pet-publish-screen.test.ts:56`, `tests/mobile/pet-draft-screen.test.ts:125`). The archive tests do not.

**Fix:** Add one test to each archive test file following the identical pattern used in `tests/mobile/pet-publish-screen.test.ts:56–69`:

```typescript
it('failed state does not expose bearer or service-role in reasons', async () => {
  const poisonClient: ArchiveMock = {
    archivePet: async () => ({
      ok: false as const,
      status: 'unauthenticated' as const,
      reasons: ['Bearer eyJ...', 'service-role key leaked'],
    }),
    republishPet: async (id) => ({ ok: true as const, status: 'ok' as const, petId: id }),
  };
  const ui = createMobilePetArchiveUi({ petArchiveClient: poisonClient });
  const result = await ui.archivePet('pet-001');
  const serialized = JSON.stringify(result).toLowerCase();
  expect(serialized).not.toContain('service-role');
  expect(serialized).not.toContain('bearer ');
});
```

Apply the same pattern in `tests/web/pet-archive-screen.test.ts` substituting `createWebPetArchiveUi`.

---

### E2 — P3: PET-DRAFT-SCREENS-001 Completion Notes documents wrong import depths

**Affected file:** `docs/work-items/PET-DRAFT-SCREENS-001-pet-draft-screens.md`

The Completion Notes section states:

> Mobile import depths: `../../../../src/` (novo), `../../../../../src/` (editar)
> Web import depths: `../../../../../src/` (novo), `../../../../../../src/` (editar)

The actual code (confirmed by passing typecheck) uses depths one level shallower:

| Screen | Documented (wrong) | Actual (correct) |
|---|---|---|
| `apps/mobile/app/animais/rascunhos/novo.tsx` | `../../../../src/` | `../../../src/` |
| `apps/mobile/app/animais/rascunhos/[petId]/editar.tsx` | `../../../../../src/` | `../../../../src/` |
| `apps/web/app/animais/rascunhos/novo/page.tsx` | `../../../../../src/` | `../../../../src/` |
| `apps/web/app/animais/rascunhos/[petId]/editar/page.tsx` | `../../../../../../src/` | `../../../../../src/` |

The code is correct — typecheck and build pass. The work item doc is wrong.

**Fix:** Update the Completion Notes in `docs/work-items/PET-DRAFT-SCREENS-001-pet-draft-screens.md` to reflect the actual depths.

---

### E3 — P3 (carry-forward): `persistSession` not set on Track D mobile Supabase clients

**Affected files:**
- `apps/mobile/app/animais/[petId]/arquivar.tsx:40`
- `apps/mobile/app/animais/[petId]/publicar.tsx` (createClient call)
- `apps/mobile/app/animais/rascunhos/novo.tsx:61`
- `apps/mobile/app/animais/rascunhos/[petId]/editar.tsx:72` (useEffect client)
- `apps/mobile/app/animais/rascunhos/[petId]/editar.tsx:95` (handleSave client)

The HANDOFF.md states: `persistSession: false — no localStorage/AsyncStorage writes; token from React state only`. Only `apps/mobile/app/entrar.tsx` sets `{ auth: { persistSession: false } }` on its Supabase client.

All Track D screens call `createClient(supabaseUrl(), supabaseAnonKey())` without this option. Since these clients are created fresh inside callbacks (not at module scope), and immediately call `getSession()` before being discarded, the practical token-leak risk is low. However, on React Native, Supabase defaults to using `AsyncStorage` for session persistence, which requires `@react-native-async-storage/async-storage`. If that package is absent, Supabase falls back silently but the intent of the auth design (no storage writes) is not enforced.

This finding was first raised in the prior audit (2026-06-17, E2) for the web auth screen. It now surfaces on mobile for Track D screens.

**Fix:** Add `{ auth: { persistSession: false } }` to all `createClient` calls in Track D mobile screens. Example from `arquivar.tsx:40`:

```typescript
const supabase = createClient(supabaseUrl(), supabaseAnonKey(), {
  auth: { persistSession: false },
});
```

Apply to all 5 affected call sites listed above.

---

### E4 — P4 (out of scope, noted for planning): Two boundary modules without screens

**Affected files:**
- `apps/mobile/src/pet-media-upload.ts` (`createMobilePetMediaUploadUi` — degree 2 in graph, no screen calls it)
- `apps/web/src/pet-media-upload.ts` (same)
- `apps/mobile/src/pet-draft-save-flow.ts` (`createMobilePetDraftSaveFlowUi` — degree 2 in graph, no screen calls it)
- `apps/web/src/pet-draft-save-flow.ts` (same)

These boundary modules exist and have boundary-contract tests but no routes wire to them. The PET-DRAFT-SCREENS-001 work item covered only create (`rascunhos/novo`) and edit (`rascunhos/[petId]/editar`); it did not include media upload or the save flow composition layer.

`pet-media-upload.ts` likely corresponds to a future `/animais/[petId]/media` route (shelter uploads hero image / gallery). `pet-draft-save-flow.ts` appears to be a higher-level composition of the draft create/update flow used as a multi-step wizard — but has no work item yet.

**No fix required in current PRs.** Create separate work items:
- `PET-MEDIA-UPLOAD-SCREEN-001` — wire `pet-media-upload.ts` to `/animais/[petId]/media`
- `PET-DRAFT-SAVE-FLOW-SCREEN-001` (or confirm this module is a library component, not a screen)

---

## 5. CI Gate Summary

| Gate | Result | Notes |
|---|---|---|
| `npm run typecheck` | ✅ Pass | 15/15 tasks (all cached) |
| `npm run lint` | ✅ Pass | SDD work-item hygiene check passed |
| `npm run test` | ✅ Pass | 1832 tests, 234 files |
| `npm run build` | ✅ Pass | 9/9 tasks (all cached) |
| `npx tsc --noEmit -p tests/tsconfig.json` | ✅ Pass | No errors (clean output) |
| `git status` after gates | ✅ Clean | Working tree unmodified |

---

## 6. Actionable Next Steps (prioritised)

1. **[P2] Add sanitization tests to archive screen test files** (E1)
   - `tests/mobile/pet-archive-screen.test.ts` — add 5th test following template from `tests/mobile/pet-publish-screen.test.ts:56`
   - `tests/web/pet-archive-screen.test.ts` — add 5th test following same template with `createWebPetArchiveUi`
   - Precedent: every other screen test file in scope has this test

2. **[P3] Fix import depths in PET-DRAFT-SCREENS-001 Completion Notes** (E2)
   - `docs/work-items/PET-DRAFT-SCREENS-001-pet-draft-screens.md` — correct the 4 depth values in Completion Notes

3. **[P3] Add `persistSession: false` to Track D mobile screens** (E3)
   - 5 `createClient` call sites (see E3 list above)
   - Use existing `apps/mobile/app/entrar.tsx` as reference implementation

4. **[P4] Create work items for unwired boundary modules** (E4)
   - `PET-MEDIA-UPLOAD-SCREEN-001` for `pet-media-upload.ts`
   - Investigate `pet-draft-save-flow.ts` to determine if it needs a screen or is a library helper
