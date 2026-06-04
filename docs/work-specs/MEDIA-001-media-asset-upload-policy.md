# Work-Spec: Implementation Plan for MEDIA-001

## 1. Target Files

- `docs/work-items/MEDIA-001-media-asset-upload-policy.md`
- `docs/work-specs/MEDIA-001-media-asset-upload-policy.md`
- `packages/domain/src/media-policy.ts`
- `packages/domain/src/index.ts`
- `tests/domain/media-policy.test.ts`

## 2. Proposed Technical Approach

Add a pure domain module for media upload policy decisions. It should expose:

- `evaluateMediaUploadRequest`
- `buildMediaObjectKey`
- `createMediaUploadContract`

The module should distinguish public pet/shelter image uploads from private adoption documents, identity documents and medical records. It should reject unsafe MIME types, non-positive sizes and requests without owner/shelter scope. It should return object-key metadata rather than real signed URLs.

## 3. Testing Strategy

- Initial failing test: assert public pet image policy, private document policy, MIME/size rejection and object-key safety.
- Expected input data: in-memory upload request metadata.
- Expected output/behavior: valid requests produce deterministic storage contract metadata; invalid requests return reason codes.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Deny public visibility unless the purpose explicitly allows public media.
- Do not include raw filenames in storage keys.
- Keep document and medical uploads private by construction.
- Keep the module independent of R2, Supabase and UI frameworks.

