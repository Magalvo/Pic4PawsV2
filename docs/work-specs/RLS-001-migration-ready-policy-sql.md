# Work-Spec: Implementation Plan for RLS-001

## 1. Target Files

- `docs/work-items/RLS-001-migration-ready-policy-sql.md`
- `docs/work-specs/RLS-001-migration-ready-policy-sql.md`
- `packages/database/src/rls-sql.ts`
- `packages/database/src/index.ts`
- `tests/database/rls-sql.test.ts`

## 2. Proposed Technical Approach

Add a small SQL rendering layer in `packages/database` that converts `RlsPolicyDefinition` metadata into migration-ready SQL strings. Keep this deterministic and side-effect free.

Expose:

- `coreRlsTableNames`
- `renderEnableRowLevelSecuritySql`
- `renderCreatePolicySql`
- `renderRlsMigrationSql`

The wildcard admin policy should be expanded across every core protected table before SQL rendering. Identifiers should be constrained to safe SQL identifier characters so generated statements are not built from arbitrary untrusted input.

## 3. Testing Strategy

- Initial failing test: import SQL rendering helpers and assert generated SQL for public pets, adoption applications, donation transactions and expanded admin policies.
- Expected input data: existing `rlsPolicies` metadata.
- Expected output/behavior: deterministic SQL statements with `drop policy`, `create policy`, role clauses, `using`, `with check`, and no literal table `*`.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No live database access.
- No migration execution.
- SQL generation is reviewable text only.
- Keep generated policy SQL deterministic for future migration diffs.

