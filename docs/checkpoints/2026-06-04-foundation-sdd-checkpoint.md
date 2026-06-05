# Checkpoint: Foundation SDD Progress - 2026-06-04

## Current Git State

- Current branch: `codex/PET-SUPABASE-001`
- Base commit: `6e70d28`
- Remote: `origin` -> `https://github.com/Magalvo/Pic4PawsV2.git`
- `main`, `origin/main` and every created `codex/*` branch currently point to the same commit: `6e70d28`.
- The implemented work is currently in the working tree as uncommitted tracked and untracked changes.

Important implication: the created branches do not yet preserve separate work item snapshots. Pushing those branches before committing would not send the implemented code. To resume from another computer, commit and push the current working tree first.

## Completed Work Items In Working Tree

- `DB-001`: core Drizzle schema and RLS metadata.
- `AUTH-001`: role-aware auth domain contracts.
- `PETS-001`: pet draft publish lifecycle.
- `PAY-001`: donation transaction and webhook idempotency contracts.
- `MEDIA-001`: media upload policy.
- `RLS-001`: migration-ready RLS SQL rendering.
- `ENV-001`: typed environment contracts and redaction.
- `WORKERS-001`: validated Worker boundaries.
- `WEB-001`: Portuguese-first web foundation.
- `MOBILE-001`: Portuguese-first mobile foundation.
- `MIGRATIONS-001`: initial schema/RLS migration artifacts.
- `SUPABASE-001`: local Supabase config and migration dry-run contract.
- `R2-001`: R2 bucket contracts and upload dry-run.
- `UPLOAD-001`: Worker media upload request contract.
- `SIGNER-001`: injectable R2 upload signer boundary.
- `MEDIA-DB-001`: media asset persistence contract.
- `PET-MEDIA-001`: persisted media for pet publishing.
- `PET-DB-001`: pet draft persistence contract.
- `PET-WORKER-001`: authenticated Worker create/update draft contract.
- `PET-PUBLISH-WORKER-001`: authenticated Worker publish draft contract.
- `PET-SUPABASE-001`: injectable Supabase-like pet repository adapters.

## Latest Validation

The latest full validation after `PET-SUPABASE-001` passed:

- `turbo run typecheck`
- `turbo run lint`
- root `eslint .`
- `turbo run test`
- root `vitest run`: `23` test files, `107` tests
- `turbo run build`

Node runtime used locally: `v22.22.3`.

## Current Next Step

Recommended next work item in `docs/work-tracks/remake-foundation.md`:

`AUTH-SUPABASE-001`: define an injectable Supabase auth adapter for resolving active users and shelter memberships at Worker boundaries without exposing service-role secrets to clients.

## Recommended Repository Procedure

Preferred simple path:

1. Keep current branch or rename/create an integration branch such as `codex/foundation-sdd-batch`.
2. Stage all tracked and untracked work with `git add -A`.
3. Commit once with a message such as `Complete foundation SDD contracts through PET-SUPABASE-001`.
4. Push the branch to `origin`.
5. Open one PR to `main` with the full foundation batch.

Why one PR is recommended now: the repository has cumulative uncommitted changes and all created `codex/*` branches point to the same base commit. Splitting into one clean PR per work item would require reconstructing commits from the current working tree.

Alternative if small PRs are required:

1. Keep the current working tree unchanged.
2. Create sequential commits manually by staging files per work item.
3. Push either one branch with multiple commits or reconstruct separate branches from those commits.

This is possible, but slower and easier to get wrong because many later work items build on files introduced by earlier items.
