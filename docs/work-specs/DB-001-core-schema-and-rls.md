# Work-Spec: Implementation Plan for DB-001

## 1. Target Files

- `docs/work-items/DB-001-core-schema-and-rls.md`
- `docs/work-specs/DB-001-core-schema-and-rls.md`
- `packages/database/package.json`
- `packages/database/src/index.ts`
- `packages/database/src/schema.ts`
- `packages/database/src/rls-policies.ts`
- `tests/database/core-schema.test.ts`

## 2. Proposed Technical Approach

Add Drizzle PostgreSQL table definitions in `packages/database`, aligned with the approved SDD contracts for:

- users
- shelters
- shelter memberships
- media assets
- pets
- adoption applications
- donation transactions
- sponsorships
- payment webhook events
- audit events

Keep the first implementation contract-only. The schema should be importable and testable locally without a Supabase connection. RLS policies should be represented as named SQL policy definitions that can later be assembled into migrations, while tests assert their coverage and core predicates.

## 3. Testing Strategy

- Initial failing test: assert the database package exports the required schema tables, sensitive adoption fields, integer-cent payment fields, idempotency fields and named RLS policies.
- Expected input data: imported schema and policy metadata from `packages/database`.
- Expected output/behavior: missing placeholder exports fail before implementation; Drizzle schema and policy metadata pass after implementation.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Do not apply migrations or delete data.
- Keep service-role assumptions out of client-accessible code.
- Keep personal adoption data private by default.
- Keep payment state transitions traceable through webhook event IDs and audit events.
