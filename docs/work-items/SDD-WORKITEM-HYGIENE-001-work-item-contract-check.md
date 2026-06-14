---
id: SDD-WORKITEM-HYGIENE-001
title: Work item contract check
status: done
---

# Work-Item: SDD-WORKITEM-HYGIENE-001 - Work Item Contract Check

## Goal

Keep implemented work items aligned with the approved SDD requirement that feature work starts from an enriched work item with Goal, States, Contract and Affected files.

## States

- `unchecked`: documentation has not been validated.
- `valid`: every implemented work item matches the required envelope.
- `invalid`: at least one implemented work item is missing a required section or has empty completion notes.

## Contract

- Implemented work items are Markdown files under `docs/work-items/` marked with `status: done`.
- Implemented work items must include `Goal`, `States`, `Contract` or legacy `Acceptance Criteria`, and `Affected files`.
- If a `Completion Notes` section is present, it must contain non-placeholder content.
- `npm run lint` must run the documentation check so drift fails the normal quality gate.

## Affected files

- `scripts/check-work-items.mjs`
- `package.json`
- `tests/foundation/work-item-hygiene.test.ts`
- `docs/work-items/*.md` sensitive or already-done documentation gaps

## Completion Notes

- Added `scripts/check-work-items.mjs` and `npm run check:sdd-work-items`.
- Wired the documentation check into `npm run lint`.
- Added focused tests covering valid work items, missing required sections and pending completion notes.
- Retro-documented completed payment and operational work items that were missing required SDD sections.
