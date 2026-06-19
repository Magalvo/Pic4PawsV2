---
id: PET-MEDIA-UPLOAD-SCREEN-001
title: Pet media upload screen
status: done
---

# Work-Item: PET-MEDIA-UPLOAD-SCREEN-001 — Pet Media Upload Screen

## Goal

Create the pet media upload screen at `/animais/[petId]/media` (mobile + web) wired to
`createMobilePetMediaUploadUi` / `createWebPetMediaUploadUi`. Auth-gated — requires
Supabase access token via `getSession()`. Allows a shelter manager to upload a single
image file (JPEG, PNG, WebP) and attach it to an existing pet draft. On success, shows
the returned `mediaId` and navigates back.

## States

- `ready` — initial state from `getInitialState(pet)`; shows file input and primaryAction
- `uploading` — set locally before async call (not exported by boundary)
- `uploaded` — image uploaded and attached; `media.mediaId`, `draftMedia` available
- `failed` — error with phase (`validation` | `upload_intent` | `binary_upload` | `attach`) and retry

## Affected Files

- `docs/work-items/PET-MEDIA-UPLOAD-SCREEN-001-pet-media-upload-screen.md` (this file)
- `apps/mobile/app/animais/[petId]/media.tsx` — new mobile screen
- `apps/web/app/animais/[petId]/media/page.tsx` — new web page
- `tests/mobile/pet-media-upload-screen.test.ts` — mobile boundary contract tests
- `tests/web/pet-media-upload-screen.test.ts` — web boundary contract tests

## Contract

- `createMobilePetMediaUploadUi({ uploadAttachFlow })`
- `createWebPetMediaUploadUi({ uploadAttachFlow })`
- `createPetMediaUploadAttachFlowClient({ uploadClient, attachClient, generateMediaId })`
  - `uploadClient` = `createMediaUploadFlowClient({ workerBaseUrl, mediaUploadPath: '/uploads/media', getAccessToken, fetch })`
  - `attachClient` = `createPetMediaAttachClient({ workerBaseUrl, petDraftsPath: '/pets/drafts', getAccessToken, fetch })`
  - `generateMediaId` = timestamp + random suffix (no crypto.randomUUID dependency)
- `getInitialState(pet)` → `ready` state with `title`, `message`, `primaryAction`, `petId`, `petName`, `acceptedMimeTypes`
- `uploadSelectedImage({ pet, file })` → `uploaded | failed`
- URL params: `petId` (dynamic segment), `petName` and `shelterId` as search params
- Auth: Supabase `getSession()` inside `useCallback`, `persistSession: false`

## Completion Notes

- Initial state inlined to avoid a throwaway client instance (same pattern as publicar screen)
- `acceptedMimeTypes` sourced from `mobilePetMediaUploadUiContent.acceptedMimeTypes`
- Mobile file body: URI string fetched to Blob via `globalThis.fetch(uri)` — production use requires expo-image-picker or equivalent native picker to obtain a local file URI
- Web file body: `File` from `<input type="file">` used directly as `BodyInit`
- `PetMediaUploadAttachFlowSuccess.status = 'pet_media_uploaded_and_attached'`
- Mobile import depth from `app/animais/[petId]/media.tsx`: `../../../src/`
- Web import depth from `app/animais/[petId]/media/page.tsx`: `../../../../src/`
- Dynamic route (`[petId]`) — no Suspense wrapper needed for `useSearchParams()` on web
