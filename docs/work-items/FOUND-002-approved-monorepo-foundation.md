# Work-Item: FOUND-002-Approved Monorepo Foundation

## 1. Context & Problem

Phase 1 and Phase 2 are approved. The current codebase contains an exploratory React/Vite + Express boilerplate created before the final architecture was approved. We now need to revise the foundation to match the approved architecture: Turborepo/workspaces, Expo mobile app, Next.js web/dashboard, Cloudflare Workers, and shared domain/config/database/payments/ui packages.

This task prepares the repository for real product features. It should not implement pet, auth, payment or dashboard behavior yet.

## 2. Acceptance Criteria

- [x] The root monorepo is orchestrated with Turborepo and package-manager workspaces.
- [x] The target app folders exist: `apps/mobile`, `apps/web`, and `apps/workers`.
- [x] The target package folders exist: `packages/domain`, `packages/config`, `packages/database`, `packages/payments`, and `packages/ui`.
- [x] The exploratory Vite/Express code is either migrated, archived, or clearly isolated so it cannot be mistaken for approved production architecture.
- [x] Root scripts support `typecheck`, `lint`, `test`, and `build` through the monorepo pipeline.
- [x] At least one failing test is written first to encode a foundation rule before implementation.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 4. Completion Notes

- Exploratory code was preserved under `prototypes/`.
- `npm audit --omit=dev` currently reports moderate transitive vulnerabilities in Next/Expo dependency chains. The suggested audit fixes involve breaking major-version changes, so dependency hardening should be handled in a dedicated follow-up.

## 3. Non-Goals

- Do not connect Supabase.
- Do not implement database migrations.
- Do not implement real auth.
- Do not implement payments.
- Do not build product screens beyond minimal app shells.
