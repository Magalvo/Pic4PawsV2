# Work-Spec: Implementation Plan for R2-001

## 1. Target Files

- `docs/work-items/R2-001-r2-bucket-contracts-and-upload-dry-run.md`
- `docs/work-specs/R2-001-r2-bucket-contracts-and-upload-dry-run.md`
- `docs/infra/r2-local-dry-run.md`
- `packages/config/src/r2.ts`
- `packages/config/src/index.ts`
- `tests/config/r2-storage-contract.test.ts`

## 2. Proposed Technical Approach

Add a side-effect-free R2 contract module in `packages/config`. The module should derive bucket contracts from parsed environment config, map media upload contracts to dry-run upload intents, and expose safe guidance helpers that reject destructive or remote Cloudflare commands.

Expose:

- `createR2BucketContract`
- `createR2UploadDryRun`
- `r2DryRunPlan`
- `assertSafeR2DryRunCommand`
- `renderR2DryRunGuide`

## 3. Testing Strategy

- Initial failing test: assert bucket mapping, same-bucket rejection, dry-run upload intent metadata, command safety and guide hygiene.
- Expected input data: valid parsed environment config and valid media upload contract.
- Expected output/behavior: deterministic local-only R2 contract with no network calls and no secrets.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No Cloudflare CLI execution.
- No remote flags or token-based commands in guidance.
- No bucket or object deletion commands.
- No signed URL generation until a worker/API adapter work item exists.
