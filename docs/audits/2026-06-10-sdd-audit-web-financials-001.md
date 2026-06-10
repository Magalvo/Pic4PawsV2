# Periodic SDD Audit Report — 2026-06-10

- **Auditor**: Independent CI Audit (Claude Code), Spec-Driven Development compliance review
- **Audit target**: branch `agent/WEB-FINANCIALS-001` @ `36cb51a` (1 commit ahead of `main` at audit time), plus repo-wide process compliance
- **Specs reviewed**: `AGENTS.md`, `.instructions.md`, `docs/canonical/sdd.md`, `docs/agent-resume.md`, and the financials-slice work items (`WEB-FINANCIALS-001`, `FINANCIALS-CLIENT-001`, `FINANCIALS-WORKER-001`)
- **CI gates run during audit (branch HEAD)**: typecheck ✅ · lint ✅ · test ✅ (140 files / 1220 tests) · build ✅ · working tree clean after
- **Note**: no OpenAPI spec exists in this repo; work items are the per-feature contract source.

## Post-audit addendum (2026-06-10)

This audit was performed against `agent/WEB-FINANCIALS-001` before merge. The branch was
subsequently merged to `main` via PR #113 (merge commit `8826804`) **prior to remediation**.
Findings 1 and 2 (missing `loading` state; weak bearer-leak test assertion) therefore now
apply to `main` and should be remediated on a follow-up branch.

## 1. Spec Compliance Score: 8 / 10

Architecture, layering, security sanitization, and route conventions conform tightly to
spec, with zero scope creep and all validation gates green. Deductions: the audited branch
omits an explicitly listed acceptance state (`loading`), one security test assertion is
materially weaker than the house standard, and there is systemic drift between the written
SDD process (separate work specs) and actual practice.

## 2. Gap Analysis Matrix

| Feature / Requirement | Status | File Paths | Notes |
|---|---|---|---|
| WEB-FINANCIALS-001 — `loading` state | **Partial** | `apps/web/src/financials.ts` | Work item States line lists `idle / loading / loaded / forbidden / failed` (5); implementation has 4 — no `loading` union member, no PT-PT loading copy, no test. See Deviations #1. |
| WEB-FINANCIALS-001 — idle/loaded/forbidden/failed contract | Implemented | `apps/web/src/financials.ts` | `getInitialState() → idle`, `loadFinancials → loaded/forbidden/failed` exactly as the Contract section specifies. No `empty` state, per spec — zero summary renders as `loaded`. |
| WEB-FINANCIALS-001 — PT-PT content, `product-flow-ready`, foundation entry | Implemented | `apps/web/src/financials.ts`, `apps/web/src/foundation.ts` | Foundation `financialsDashboard` entry wired with the established `Pick<>` pattern. |
| WEB-FINANCIALS-001 — `unsafeReasonMarkers` + `sanitizeReasons` | Implemented | `apps/web/src/financials.ts` | Marker list copied verbatim from sibling boundaries, per the standing security pattern. |
| WEB-FINANCIALS-001 — credential-leak test coverage | **Partial** | `tests/web/financials-dashboard-ui.test.ts` | `service-role` asserted on the failed state, but `bearer` is asserted only against static foundation content (which never contains reasons — a vacuous check). All 13+ sibling boundary tests assert `bearer abc123` sanitization on the **failed state** (e.g. `tests/web/shelter-search-ui.test.ts`). |
| FINANCIALS-WORKER-001 — route, matcher, auth ladder, response shape | Implemented | `apps/workers/src/financials.ts`, `apps/workers/src/index.ts` | Matcher rejects extra segments; registered before the shelter-profile matcher; 405/401/403/501 ladder and JSON shape match the work item exactly; aggregate-only response (no donor PII) satisfies SDD GDPR rules; integer cents throughout. |
| FINANCIALS-CLIENT-001 — `createFinancialsClient` | Implemented | `packages/client/src/index.ts` | Failure-status union matches the work item's six statuses; web boundary maps them correctly. |
| MOBILE-FINANCIALS-001 — mobile boundary | Missing (planned) | — | Not a gap: roadmap item #2 in `docs/agent-resume.md`; no work item file exists yet. |
| SDD process — separate work spec per feature | **Missing (systemic)** | `docs/work-specs/` | `AGENTS.md`, `sdd.md` §3, `.instructions.md` and `agent-resume.md` §3 all mandate "work item, work spec and failing test." No work spec exists for any item after roughly the donation era (~60+ items incl. all FINANCIALS-*, SPONSORSHIP-*, NOTIF-PREFS-*, SHELTER-SEARCH-*, WEB-FINANCIALS-001). Work items have absorbed the spec content (States/Contract/Affected files). Code and docs disagree about the process itself. |
| Work-item status hygiene | **Partial** | `docs/work-items/FINANCIALS-WORKER-001-payment-reconciliation-worker.md` | Still `status: in-progress` despite merging in PR #110 — the docs catch-up PR #112 flipped FINANCIALS-CLIENT-001 (`done, pr: 111`) but missed this one. ~10 older pet-draft-era items carry no status frontmatter at all. |

## 3. Deviations & Scope Creep

**Scope creep: none.** The branch diff is exactly the three files named in the work item's
"Affected files" plus the work item document itself. Repo-wide, every recent slice traces
to a work item.

**Deviations:**

1. **The `loading` state (the one real spec-code conflict).** The work item is internally
   inconsistent: its States line lists `loading`, but its Contract line shows
   `loadFinancials` returning only `loaded | forbidden | failed`. Precedent resolves this
   two ways — older read boundaries put a `LoadingState` in the union (adoption-list,
   donation-list, adoption-view, etc.); newer ones put it in PT-PT content copy
   (shelter-search's `states` array, notification-preferences' `loadingMessage`). The
   financials boundary is the only one of 26 web boundaries with **neither**, leaving the
   future UI layer no contract or copy for the in-flight state. Either the code or the
   work item must change — spec and code must agree.
2. **Worker error handling (systemic, not slice-specific).** `handleWorkerFinancialsRequest`
   awaits `getFinancials` uncaught; the Supabase impl throws
   `SupabaseFinancialsRepositoryError` on query failure, which escapes to the runtime as an
   opaque 500. This matches the prevailing pattern across all read routes (no
   dispatcher-level catch exists in `apps/workers/src/index.ts`), and clients degrade
   gracefully to `worker_request_failed` — accepted architectural debt, not a regression
   introduced by this slice.
3. **Minor, for the record:** `currency` is derived from the first donation row (defaults
   `'EUR'`) and would silently aggregate across currencies — safe while the SDD pins
   `CurrencyCode = 'EUR'`, worth revisiting if that expands. The failed state's `status`
   type admits `'forbidden'` though runtime intercepts it first (same shape as siblings).

## 4. Actionable Next Steps (prioritized)

1. **Follow-up branch — reconcile the `loading` state** (now on `main` via PR #113).
   Recommended: add the loading representation (union member and/or PT-PT `states` copy,
   matching either precedent) plus a test; alternatively amend the work item's States line
   to `idle | loaded | forbidden | failed` and record why. Smallest change that restores
   spec-code agreement.
2. **Same follow-up branch — strengthen the bearer assertion.** Add `'bearer abc123'` to
   the sanitize test's reasons and assert its absence from the serialized failed state,
   matching the convention in every sibling test.
3. **Docs hygiene (one-line fix):** flip FINANCIALS-WORKER-001 to `status: done, pr: 110`.
   Also flip WEB-FINANCIALS-001 to `status: done, pr: 113` now that it is merged.
4. **Resolve the work-spec policy drift (decision, then 15-min edit):** either backfill
   specs (high cost, low value) or — recommended, since it matches 60+ items of consistent
   practice — amend `AGENTS.md`, `sdd.md` §3, `.instructions.md` and `agent-resume.md` §3
   to declare the enriched work item (Goal/States/Contract/Affected files) the single
   per-feature spec artifact.
5. **Schedule one architecture work item:** a dispatcher-level try/catch in the Worker
   fetch handler returning a structured `{ status: 'internal_error' }` 500, so repository
   throws stop surfacing as raw runtime errors across all ~25 routes.
6. **Then proceed per roadmap:** MOBILE-FINANCIALS-001, then pet status-transition audit
   logging.
