# Work-Spec: Implementation Plan for WEB-MEDIA-UPLOAD-001

## 1. Target Files

- `docs/work-items/WEB-MEDIA-UPLOAD-001-portuguese-web-media-upload-boundary.md`
- `docs/work-specs/WEB-MEDIA-UPLOAD-001-portuguese-web-media-upload-boundary.md`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/src/media-upload.ts`
- `apps/web/src/foundation.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/styles.css`
- `tests/web/media-upload-boundary.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Create a Web media upload boundary in `apps/web/src/media-upload.ts` that wraps `createMediaUploadFlowClient` from `@pic4paws/client`.

Expose:

- `webMediaUploadContent`
- `createWebMediaUploadBoundary`
- `WebPetPublicImageUploadInput`
- `WebMediaUploadResult`

The boundary will:

- accept injected `fetch` and `getAccessToken`
- accept Web file metadata and `BodyInit`
- build a `pet_public_image` / `public` media upload request
- call the composed flow client
- map low-level result phases to PT-PT Web states
- return safe result data only

## 3. Testing Strategy

- Initial failing test: import `createWebMediaUploadBoundary` and assert public pet image upload request/response shape.
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
- No browser-side Supabase SDK.
- No R2 SDK.
- No service-role or R2 credential fields.
- No real file picker or auth session coupling.

## 6. Implementation Notes

Implemented a Web media upload boundary in `apps/web/src/media-upload.ts`.

The boundary:

- wraps `createMediaUploadFlowClient`
- injects `fetch` and `getAccessToken`
- builds a `pet_public_image` / `public` request from file metadata
- maps success, intent failures and binary upload failures to safe PT-PT copy
- returns no signed URLs, bearer tokens or provider credentials

The foundation page now includes contract-ready copy for secure image uploads. A real file picker, auth session wiring and post-upload confirmation remain out of scope for later work items.
