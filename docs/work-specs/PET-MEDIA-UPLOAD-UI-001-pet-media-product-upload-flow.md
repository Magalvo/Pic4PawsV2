# Work-Spec: Implementation Plan for PET-MEDIA-UPLOAD-UI-001

## 1. Target Files

- `docs/work-items/PET-MEDIA-UPLOAD-UI-001-pet-media-product-upload-flow.md`
- `docs/work-specs/PET-MEDIA-UPLOAD-UI-001-pet-media-product-upload-flow.md`
- `apps/web/src/pet-media-upload.ts`
- `apps/mobile/src/pet-media-upload.ts`
- `apps/web/src/foundation.ts`
- `apps/mobile/src/foundation.ts`
- `apps/web/app/page.tsx`
- `apps/mobile/app/index.tsx`
- `tests/web/pet-media-upload-ui.test.ts`
- `tests/mobile/pet-media-upload-ui.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Create platform-specific pet media upload UI flow modules that consume the existing safe upload boundaries:

- `createWebPetMediaUploadUi`
- `createMobilePetMediaUploadUi`
- `webPetMediaUploadUiContent`
- `mobilePetMediaUploadUiContent`

Each flow will:

- accept an injected upload boundary with `uploadPetPublicImage`
- accept an injected `generateMediaId`
- expose ready-state product view models for pet draft image upload
- validate supported public image MIME types before calling the boundary
- pass selected file metadata to the platform boundary
- map boundary success/failure to safe PT-PT product view models
- expose a post-upload next action for future draft attachment without persisting it now

## 3. Testing Strategy

- Initial failing tests import the new Web and Mobile product flow modules.
- Assert ready-state PT-PT copy and accepted MIME types.
- Assert a valid selected image calls the platform upload boundary with generated media ID, pet shelter scope and file body.
- Assert unsupported MIME types are rejected before the boundary is called.
- Assert failure view models do not leak signed URLs, bearer tokens or provider credential markers.
- Assert foundation content can surface the product flow as contract-ready/product-flow-ready copy.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No real service calls.
- No real file picker.
- No production credentials.
- No draft attachment persistence.
- UI state must not contain signed URLs, bearer tokens, Supabase service-role keys, R2 access keys or R2 secret keys.

## 6. Implementation Notes

Implemented on `codex/PET-MEDIA-UPLOAD-UI-001`, stacked on `codex/MOBILE-MEDIA-UPLOAD-001`.

- `apps/web/src/pet-media-upload.ts` exposes `createWebPetMediaUploadUi` and `webPetMediaUploadUiContent`.
- `apps/mobile/src/pet-media-upload.ts` exposes `createMobilePetMediaUploadUi` and `mobilePetMediaUploadUiContent`.
- The Web and Mobile flows accept a structural upload boundary and `generateMediaId`.
- The flows validate public image MIME types before calling `uploadPetPublicImage`.
- Success returns safe media metadata and the next action `Associar imagem ao rascunho`.
- Failure sanitizes unsafe reason markers before exposing UI state.
- Foundation content and first screens now surface `Imagem do animal` as `product-flow-ready`.
