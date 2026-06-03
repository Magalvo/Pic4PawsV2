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
