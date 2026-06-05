# Work-Spec: Implementation Plan for MIGRATIONS-001

## 1. Target Files

- `docs/work-items/MIGRATIONS-001-initial-schema-and-rls-artifacts.md`
- `docs/work-specs/MIGRATIONS-001-initial-schema-and-rls-artifacts.md`
- `packages/database/src/migration-artifacts.ts`
- `packages/database/src/index.ts`
- `tests/database/migration-artifacts.test.ts`

## 2. Proposed Technical Approach

Add a side-effect-free migration artifact module in `packages/database`. The module should expose a deterministic initial migration object containing metadata, SQL and non-destructive safety checks. The SQL should represent the approved initial schema and append the existing rendered RLS migration SQL.

Expose:

- `MigrationArtifact`
- `initialDatabaseMigration`
- `migrationArtifacts`
- `renderMigrationArtifact`
- `assertNonDestructiveMigration`

## 3. Testing Strategy

- Initial failing test: import migration artifact helpers and assert SQL contents, filename ordering, RLS inclusion and destructive SQL rejection.
- Expected input data: existing RLS renderer and static initial schema SQL.
- Expected output/behavior: deterministic, reviewable SQL string without applying anything to a database.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No live database access.
- No migration execution.
- No destructive SQL in generated artifacts.
- Keep artifacts deterministic so future migration diffs are reviewable.
