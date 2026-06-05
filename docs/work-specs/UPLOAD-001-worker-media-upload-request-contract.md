# Work-Spec: Implementation Plan for UPLOAD-001

## 1. Target Files

- `docs/work-items/UPLOAD-001-worker-media-upload-request-contract.md`
- `docs/work-specs/UPLOAD-001-worker-media-upload-request-contract.md`
- `packages/config/src/env.ts`
- `apps/workers/package.json`
- `apps/workers/tsconfig.json`
- `apps/workers/src/index.ts`
- `apps/workers/src/media-upload.ts`
- `tests/workers/media-upload-boundary.test.ts`

## 2. Proposed Technical Approach

Add a media upload boundary in the Worker. The boundary should parse JSON, validate request shape, call the domain media upload policy, derive the R2 bucket contract from typed config and return dry-run upload metadata. The response must make it explicit that signer integration is not configured yet and must keep `signedUrl` as `null`.

Expose:

- `createWorkerMediaUploadIntent`
- `handleWorkerRequest` route support for the configured upload path

## 3. Testing Strategy

- Initial failing test: assert env path parsing, method rejection, invalid JSON, invalid upload payload rejection and valid dry-run upload intent response.
- Expected input data: valid worker env and upload request payload.
- Expected output/behavior: deterministic R2 upload metadata with no signed URL and no network access.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No Cloudflare or R2 calls.
- No signed URL generation.
- No secrets in responses.
- No database writes.
