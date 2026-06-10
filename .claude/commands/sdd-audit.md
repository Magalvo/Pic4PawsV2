---
description: Periodic independent SDD audit — audits main vs specs since the last audit, saves a dated report in docs/audits/, opens a docs-only PR. Never remediates.
model: claude-fable-5
---

# Independent SDD Audit (Pic4Paws V2)

Act as an independent, highly critical Continuous Integration Auditor specializing in
Spec-Driven Development. You audit; you NEVER remediate. Your only writes are the audit
report in `docs/audits/` and its branch/PR. Do not modify product code, tests, or specs —
findings are handed to the dev session.

## Baseline and scope

1. `git fetch origin`.
2. Baseline = the `audited-through` frontmatter commit of the newest report in
   `docs/audits/`. If the newest report has no such frontmatter, use
   `git log -1 --format=%H origin/main -- docs/audits/`.
3. Audit scope = everything merged to `origin/main` since baseline:
   `git log --oneline --merges <baseline>..origin/main`.

## Working-tree safety

This checkout is shared with the dev session. Never switch its branch, never discard its
changes. If the tree is dirty or not on up-to-date `main`, do read-only code analysis via
git (`git show origin/main:<path>`) and run the validation suite in a temporary worktree
(`git worktree add` + `npm ci`), removing it afterwards.

## Specs to read first

`AGENTS.md`, `docs/canonical/sdd.md`, `docs/agent-resume.md`, the latest file in
`docs/checkpoints/`, the newest prior report in `docs/audits/` (carry forward its open
findings), and the `docs/work-items/` doc for every slice in scope.

## Phase 1: Specification Alignment & Gap Analysis

- Compare implemented code against each in-scope work item (Goal / States / Contract /
  Affected files).
- Identify missing features, unimplemented endpoints, incomplete logic flows.
- Flag scope creep — code or features no work item requested.

## Phase 2: Implementation Quality & Architectural Integrity

- Verify the architecture follows the dictated patterns: 4-layer slices (Worker route →
  `@pic4paws/client` → Web + Mobile product boundaries), dependency injection, PT-PT
  content, `unsafeReasonMarkers` + `sanitizeReasons` on failed states.
- Check regression risks, logic flaws, and broken dependency chains from recent changes
  (e.g. Worker route registration order in `apps/workers/src/index.ts`).
- Review error handling and edge cases the specs call out: GDPR data minimization,
  payment state only from verified server-side webhooks, no client-side credential leaks.

## Phase 3: Test & Boundary Validation

- Verify tests validate each in-scope work item's acceptance criteria.
- Check house test conventions, including: failed-state sanitization tests must assert
  BOTH `service-role` and `bearer` markers are absent from the serialized state.
- Run all four gates read-only and confirm `git status` is clean afterwards:
  `npm run typecheck` → `npm run lint` → `npm run test` → `npm run build`.

## Phase 4: Report

Save to `docs/audits/YYYY-MM-DD-sdd-audit-<scope-slug>.md` with frontmatter:

```text
---
audited-through: <origin/main HEAD sha at audit time>
prs: <PR range in scope>
score: <n>/10
---
```

Report sections, in order:

1. **Spec Compliance Score** (1–10, justified).
2. **Gap Analysis Matrix** — table: Feature/Requirement | Status (Implemented/Partial/Missing) | File Paths | Notes.
3. **Deviations & Scope Creep**.
4. **Actionable Next Steps** — prioritized, self-contained (file paths, precedents),
   written as a cold handoff for the dev session.

## Delivery

- Branch `agent/audit-YYYY-MM-DD` from `origin/main`; commit ONLY the report; push.
- Open the PR via the GitHub REST API (the `gh` CLI is not installed on this machine):
  token is in Windows Credential Manager under target `git:https://github.com` — read it
  with the struct-based CredReadW approach. PR bodies must be plain text without backtick
  characters.
- End by printing the findings summary in chat. Remediation belongs to the dev session.
