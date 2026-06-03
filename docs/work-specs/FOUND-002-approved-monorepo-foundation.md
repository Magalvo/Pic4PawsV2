# Work-Spec: Implementation Plan for FOUND-002

## 1. Target Files

- `package.json`
- `turbo.json`
- `tsconfig.base.json`
- `tsconfig.json`
- `eslint.config.js`
- `apps/mobile/**`
- `apps/web/**`
- `apps/workers/**`
- `packages/domain/**`
- `packages/config/**`
- `packages/database/**`
- `packages/payments/**`
- `packages/ui/**`
- `tests/foundation/**`

## 2. Proposed Technical Approach

Use the approved architecture as the source of truth. The current exploratory code should be reviewed before removal or migration. Because the workspace is not currently a Git repository, avoid destructive cleanup until replacement paths are in place and validation is green.

Implementation direction:

- Add Turborepo orchestration at the root.
- Keep package-manager workspaces active. Prefer staying on npm workspaces for this task unless we explicitly decide to switch to pnpm.
- Create minimal TypeScript package shells for `config`, `database`, `payments`, and `ui`.
- Convert `apps/web` toward a Next.js shell or isolate the existing Vite prototype under a clearly named prototype location.
- Create an Expo mobile shell under `apps/mobile`.
- Create a Cloudflare Workers shell under `apps/workers`.
- Preserve shared domain contracts in `packages/domain`, then refactor toward the SDD entity/rules structure.
- Add tests that enforce the approved workspace layout and the existence of required package manifests.

## 3. Testing Strategy

- Initial failing test: create a foundation test that asserts the approved workspace apps/packages exist with `package.json` manifests and expected package names.
- Expected input data: repository filesystem structure.
- Expected output/behavior: the test fails before the folders/manifests are created or corrected, then passes after the approved structure exists.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Do not delete exploratory implementation before the approved replacement validates.
- Keep docs as the source of truth for architecture and SDD.
- Do not add paid-service credentials or real provider configuration in this task.
