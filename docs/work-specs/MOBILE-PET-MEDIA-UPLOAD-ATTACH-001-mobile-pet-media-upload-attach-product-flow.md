# Work-Spec: Implementation Plan for MOBILE-PET-MEDIA-UPLOAD-ATTACH-001

## 1. Target Files

- `docs/work-items/MOBILE-PET-MEDIA-UPLOAD-ATTACH-001-mobile-pet-media-upload-attach-product-flow.md`
- `docs/work-specs/MOBILE-PET-MEDIA-UPLOAD-ATTACH-001-mobile-pet-media-upload-attach-product-flow.md`
- `apps/mobile/src/pet-media-upload.ts`
- `tests/mobile/pet-media-upload-ui.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Update `createMobilePetMediaUploadUi` so it accepts:

```ts
uploadAttachFlow: Pick<PetMediaUploadAttachFlowClient, 'uploadAndAttachPetMedia'>
```

The Mobile boundary will:

- keep the existing PT-PT ready state and MIME type guard
- call `uploadAttachFlow.uploadAndAttachPetMedia` with pet context and selected file
- remove `generateMediaId` from the Mobile product boundary
- map success to a Mobile product view model with attached draft media state
- map phase-specific failures to safe PT-PT product failures
- sanitize reasons before exposing UI state

## 3. Testing Strategy

- Update the Mobile product tests to inject a fake composed flow.
- Assert success calls the composed flow with pet context and selected file.
- Assert success returns safe media metadata and draft attachment state.
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
- No native picker wiring.
- No signed URLs or provider credentials in UI-facing models.
- Keep the boundary structural and injectable for Mobile tests.

## 6. Implementation Notes

- `createMobilePetMediaUploadUi` now accepts an injected structural `uploadAttachFlow` dependency exposing `uploadAndAttachPetMedia`.
- The Mobile boundary still rejects unsupported MIME types before invoking the composed client flow.
- Product-boundary media ID generation was removed from this flow; media IDs now stay inside the composed client flow dependency.
- Successful uploads now return safe media metadata plus the attached draft media state (`mediaIds` and `heroMediaId`).
- Upload intent, binary upload and attach failures are mapped to distinct safe PT-PT product failure states.
- UI-facing failure reasons are filtered to avoid leaking signed URL fragments, bearer tokens, Supabase service-role markers or R2 credential markers.
- Tests cover success, unsupported MIME validation, upload intent failure, binary upload failure, attach failure and safe Mobile foundation content exposure.
