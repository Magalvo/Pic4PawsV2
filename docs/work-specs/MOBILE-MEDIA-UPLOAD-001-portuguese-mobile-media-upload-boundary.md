# Work-Spec: Implementation Plan for MOBILE-MEDIA-UPLOAD-001

## 1. Target Files

- `docs/work-items/MOBILE-MEDIA-UPLOAD-001-portuguese-mobile-media-upload-boundary.md`
- `docs/work-specs/MOBILE-MEDIA-UPLOAD-001-portuguese-mobile-media-upload-boundary.md`
- `apps/mobile/package.json`
- `apps/mobile/tsconfig.json`
- `apps/mobile/src/media-upload.ts`
- `apps/mobile/src/foundation.ts`
- `apps/mobile/app/index.tsx`
- `tests/mobile/media-upload-boundary.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Create a Mobile media upload boundary in `apps/mobile/src/media-upload.ts` that wraps `createMediaUploadFlowClient` from `@pic4paws/client`.

Expose:

- `mobileMediaUploadContent`
- `createMobileMediaUploadBoundary`
- `MobilePetPublicImageUploadInput`
- `MobileMediaUploadResult`

The boundary will:

- accept injected `fetch` and `getAccessToken`
- accept Mobile file metadata and `BodyInit`
- build a `pet_public_image` / `public` media upload request
- call the composed flow client
- map low-level result phases to PT-PT Mobile states
- return safe result data only

## 3. Testing Strategy

- Initial failing test: import `createMobileMediaUploadBoundary` and assert public pet image upload request/response shape.
- Assert the Worker request receives the bearer token but the signed URL request does not.
- Assert intent failures map to PT-PT `intent_failed` state.
- Assert binary upload failures map to PT-PT `binary_upload_failed` state.
- Assert results never leak signed URLs, bearer tokens or provider credentials.
- Assert foundation content exposes the media upload capability without linking to unimplemented product routes.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No real service calls.
- No browser-side or mobile-side Supabase SDK.
- No R2 SDK.
- No service-role or R2 credential fields.
- No real native picker or auth session coupling.

## 6. Implementation Notes

Implemented on `codex/MOBILE-MEDIA-UPLOAD-001`.

- `@pic4paws/mobile` now depends on `@pic4paws/client`.
- `apps/mobile/src/media-upload.ts` exposes `createMobileMediaUploadBoundary` and `mobileMediaUploadContent`.
- The boundary accepts injected `fetch` and `getAccessToken`, builds a `pet_public_image` / `public` request from Mobile file metadata, and delegates to the shared composed upload flow.
- The boundary maps success, intent failure and signed binary upload failure to safe PT-PT Mobile results.
- `tests/mobile/media-upload-boundary.test.ts` verifies request shape, authorization isolation, signed URL redaction and foundation readiness copy.
- The Mobile foundation screen surfaces the media upload capability as contract-ready only; it does not start real uploads or call external services.
