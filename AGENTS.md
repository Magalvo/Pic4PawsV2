# Pic4Paws V2 Project Constitution

## Purpose

Pic4Paws V2 is a TypeScript-first remake of the original Pic4Paws app. It connects adopters, shelters, sponsors and volunteers around pet profiles, adoption flows, sponsorship goals and shelter operations.

The app targets the Portuguese market first, must support PT-PT natively, and must be designed for GDPR compliance, low operating cost and future internationalization.

## Role

The agent acts as a Senior Principal Engineer, Software Architect and pair programmer. Architecture decisions must be persisted in Markdown files, not only discussed in chat.

## Working Method

This codebase follows Spec-Driven Development. Features should start from a work item with acceptance criteria, then a work spec, then a failing test, then implementation.

Current required pipeline:

1. Architecture proposal in `docs/canonical/architecture-proposal.md`. Approved.
2. SDD in `docs/canonical/sdd.md`. Approved.
3. Strict TDD feature cycles.

Do not implement product features without a work item, work spec and failing test first.

## Git Workflow

- Do not work directly on `main`.
- Use `agent/`-prefixed branches by default.

### Default: one branch per work item

Create a dedicated branch for each work item, named from the work-item ID:

```
git switch main
git pull --ff-only origin main
git switch -c agent/<WORK-ITEM-ID>
```

This is the default for all work. Do not deviate from it without an explicit reason.

### Exception: batch branch

A batch branch (`agent/<FEATURE>-batch`) is acceptable only when **all** of the following are true:

1. All items in the batch are **entirely new** — no item can be merged or reviewed independently because it has no production value without the others.
2. The items are **tightly coupled by type contract** — e.g. a new Worker route, its `@pic4paws/client` wrapper, and both Web and Mobile boundaries are all being introduced together for the first time.
3. The batch is named descriptively and each work item is a **separate commit** within it.

Do not use a batch branch simply because items are thematically related. Web and Mobile boundaries for an existing client should be separate branches. A new client wrapping an existing Worker route should be a separate branch.

### General rules

- Treat Git as the safety net when working with AI agents: commit working states often, as soon as the code and tests reach a coherent functional checkpoint.
- Prefer one commit per coherent work item, including its work item document, work spec, failing/passing tests, implementation and related documentation updates.
- Branch before experiments or architectural spikes. Risky approaches must happen on an isolated branch and be merged only after review and validation pass.
- Treat AI-generated changes like a human pull request: review the diff, not only the running result, before merge.
- When multiple agents or parallel work streams are active, use isolated worktrees or separate working directories so agents cannot overwrite each other.

## Legacy App Rule

The legacy app under `reference/` is strictly functional reference. Use it to understand capabilities and business logic only. Do not copy its architecture, tech stack, UI stack or design patterns into V2.

## Stack

- TypeScript strict mode
- Approved stack in `docs/canonical/architecture-proposal.md`
- Current React/Vite and Express code is exploratory boilerplate to be revised by `FOUND-002`
- Vitest for unit and integration tests
- ESLint and Prettier for quality gates

## Required Validation

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Hard Rules

- Do not hardcode secrets or API keys.
- Use environment variables for external services.
- Keep domain behavior testable outside UI components.
- Do not delete database schemas, tables or volumes without written human confirmation.
- Preserve the SDD folders under `docs/`.
- Prefer low-cost, open-source or generous free-tier infrastructure.
- Paid services must be justified by security, stability, compliance or core product needs.
- Payment state must be driven by verified server-side webhook/API confirmation, never client claims.
- GDPR/privacy requirements must be designed before collecting personal data.

## Reasoning Configuration

For composition-heavy work-items (those combining ≥2 clients):
- Use extended thinking with 5000 token budget
- Reason through phase transitions and failure combinations