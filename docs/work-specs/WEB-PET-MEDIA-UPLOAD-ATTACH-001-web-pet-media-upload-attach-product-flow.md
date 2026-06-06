# Work-Spec: Implementation Plan for WEB-PET-MEDIA-UPLOAD-ATTACH-001

## 1. Target Files

- `docs/work-items/WEB-PET-MEDIA-UPLOAD-ATTACH-001-web-pet-media-upload-attach-product-flow.md`
- `docs/work-specs/WEB-PET-MEDIA-UPLOAD-ATTACH-001-web-pet-media-upload-attach-product-flow.md`
- `apps/web/src/pet-media-upload.ts`
- `tests/web/pet-media-upload-ui.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Update `createWebPetMediaUploadUi` so it accepts:

```ts
uploadAttachFlow: Pick<PetMediaUploadAttachFlowClient, 'uploadAndAttachPetMedia'>
```

The Web boundary will:

- keep the existing PT-PT ready state and MIME type guard
- call `uploadAttachFlow.uploadAndAttachPetMedia` with pet context and selected file
- map success to a Web product view model with attached media state
- map phase-specific failures to safe PT-PT product failures
- sanitize reasons before exposing UI state

## 3. Testing Strategy

- Update the Web product tests to inject a fake composed flow.
- Assert success calls the composed flow with pet context and selected file.
- Assert success returns safe media and draft attachment state.
- Assert unsupported files are rejected before the composed flow is called.
- Assert `upload_intent`, `binary_upload` and `attach` failures map to safe failure view models.
- Assert UI-facing results do not expose signed URLs, bearer tokens or provider credentials.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No real service calls.
- No production sessions.
- No signed URLs or provider credentials in UI-facing models.
- Keep the boundary structural and injectable for Web tests.

## 6. Implementation Notes

- `createWebPetMediaUploadUi` now accepts an injected structural `uploadAttachFlow` dependency exposing `uploadAndAttachPetMedia`.
- The Web boundary still rejects unsupported MIME types before invoking the composed client flow.
- Successful uploads now return safe media metadata plus the attached draft media state (`mediaIds` and `heroMediaId`).
- Upload intent, binary upload and attach failures are mapped to distinct safe PT-PT product failure states.
- UI-facing failure reasons are filtered to avoid leaking signed URL fragments, bearer tokens, Supabase service-role markers or R2 credential markers.
- Tests cover success, unsupported MIME validation, upload intent failure, binary upload failure, attach failure and safe Web foundation content exposure.
