# Work-Spec: Implementation Plan for SIGNER-001

## 1. Target Files

- `docs/work-items/SIGNER-001-injectable-r2-upload-signer.md`
- `docs/work-specs/SIGNER-001-injectable-r2-upload-signer.md`
- `apps/workers/src/media-upload.ts`
- `apps/workers/src/index.ts`
- `tests/workers/media-upload-signer.test.ts`

## 2. Proposed Technical Approach

Extend the Worker media upload boundary with a dependency-injected signer contract. The default path remains no signer configured. Tests can inject a deterministic fake signer to validate the shape of signer input and Worker responses.

Expose:

- `MediaUploadSigner`
- `MediaUploadSignerInput`
- `createWorkerMediaUploadIntent`
- `handleWorkerRequest` dependencies for signer and clock injection

## 3. Testing Strategy

- Initial failing test: assert signer input, signed response shape, no-signer fallback, safe signer failure and route-level dependency injection.
- Expected input data: valid worker env and valid upload payload.
- Expected output/behavior: deterministic signed URL response from fake signer, with no network calls.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No real signer implementation.
- No Cloudflare calls or credentials.
- No exception message leakage from signer failures.
- Existing `upload_signer_not_configured` behavior remains available.
