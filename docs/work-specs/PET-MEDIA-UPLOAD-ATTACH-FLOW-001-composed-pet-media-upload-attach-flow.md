# Work-Spec: Implementation Plan for PET-MEDIA-UPLOAD-ATTACH-FLOW-001

## 1. Target Files

- `docs/work-items/PET-MEDIA-UPLOAD-ATTACH-FLOW-001-composed-pet-media-upload-attach-flow.md`
- `docs/work-specs/PET-MEDIA-UPLOAD-ATTACH-FLOW-001-composed-pet-media-upload-attach-flow.md`
- `packages/client/src/index.ts`
- `tests/client/pet-media-upload-attach-flow.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/codex-resume.md`

## 2. Proposed Technical Approach

Add `createPetMediaUploadAttachFlowClient` to `@pic4paws/client`.

Dependencies:

- `uploadClient: Pick<MediaUploadFlowClient, 'uploadMedia'>`
- `attachClient: Pick<PetMediaAttachClient, 'attachPetMedia'>`
- `generateMediaId: () => string`

Flow method:

```ts
uploadAndAttachPetMedia({ petId, shelterId, ownerUserId, file })
```

It will:

- generate a media ID once
- build a `pet_public_image` / `public` upload request
- call the composed upload client
- stop before attach when upload fails
- attach the persisted media asset after upload success
- use `intent.mediaAssetId ?? mediaId` as the media ID sent to attach
- return safe typed results with phases: `upload_intent`, `binary_upload`, `attach`

## 3. Testing Strategy

- Assert success calls upload first and attach second with deterministic media ID.
- Assert upload intent failure stops before attach.
- Assert binary upload failure stops before attach.
- Assert attach failure returns phase `attach`.
- Assert safe results never contain signed URLs, bearer tokens or provider credential markers.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- No real service calls.
- No signed URLs in result models.
- No provider credential fields in returned bodies.
- The flow composes existing safe clients instead of duplicating Worker or signed URL logic.

## 6. Implementation Notes

Implemented on `codex/PET-MEDIA-UPLOAD-ATTACH-FLOW-001`, stacked on `codex/PET-MEDIA-ATTACH-CLIENT-001`.

- `packages/client/src/index.ts` now exports `createPetMediaUploadAttachFlowClient`.
- The flow accepts injected `uploadClient`, `attachClient` and `generateMediaId`.
- `uploadAndAttachPetMedia` builds the public pet image upload request, uploads media, and only attaches after upload success.
- Upload intent, binary upload and attach failures are returned as distinct safe phases.
- Success returns safe upload metadata and attached draft media state.
- `tests/client/pet-media-upload-attach-flow.test.ts` covers success and each failure phase.
