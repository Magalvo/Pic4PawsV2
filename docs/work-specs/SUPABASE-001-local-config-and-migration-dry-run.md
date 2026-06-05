# Work-Spec: Implementation Plan for SUPABASE-001

## 1. Target Files

- `docs/work-items/SUPABASE-001-local-config-and-migration-dry-run.md`
- `docs/work-specs/SUPABASE-001-local-config-and-migration-dry-run.md`
- `supabase/config.toml`
- `supabase/README.md`
- `packages/database/src/supabase-local.ts`
- `packages/database/src/index.ts`
- `tests/database/supabase-local.test.ts`

## 2. Proposed Technical Approach

Add local Supabase configuration and side-effect-free database helpers that describe how approved migration artifacts should be reviewed and mapped into Supabase migration paths. Keep all commands local/review scoped and reject remote/project-linked commands in tests.

Expose:

- `supabaseLocalConfig`
- `renderSupabaseMigrationFile`
- `supabaseDryRunPlan`
- `assertSafeSupabaseDryRunCommand`
- `renderSupabaseDryRunGuide`

## 3. Testing Strategy

- Initial failing test: assert local config file exists without secrets, migration artifact mapping, dry-run command safety and generated guidance.
- Expected input data: existing `initialDatabaseMigration` artifact.
- Expected output/behavior: local-only Supabase contract with no production-mutating commands.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No Supabase CLI execution.
- No remote project linking.
- No access tokens or service-role keys in config/docs/contracts.
- Migration SQL remains generated/reviewable text only.
