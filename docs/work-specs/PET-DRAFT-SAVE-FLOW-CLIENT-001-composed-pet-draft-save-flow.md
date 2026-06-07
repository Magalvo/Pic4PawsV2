# Work-Spec: Implementation Plan for PET-DRAFT-SAVE-FLOW-CLIENT-001

## 1. Target Files

- `docs/work-items/PET-DRAFT-SAVE-FLOW-CLIENT-001-composed-pet-draft-save-flow.md`
- `docs/work-specs/PET-DRAFT-SAVE-FLOW-CLIENT-001-composed-pet-draft-save-flow.md`
- `packages/client/src/index.ts`
- `tests/client/pet-draft-save-flow.test.ts`
- `docs/work-tracks/remake-foundation.md`
- `docs/agent-resume.md`

## 2. Composition Architecture

### 2.1 Clients Being Composed

This flow composes two existing typed client surfaces:

| Dependency | Source | Operation |
|---|---|---|
| `draftClient.createPetDraft(input)` | `PetDraftClient` | Creates a new draft; returns `petId` |
| `draftClient.updatePetDraft(input)` | `PetDraftClient` | Updates existing draft; returns `petId` |
| `uploadAttachClient.uploadAndAttachPetMedia(input)` | `PetMediaUploadAttachFlowClient` | Uploads file and attaches it to pet; returns `mediaId`, `objectKey`, `mediaIds`, `heroMediaId` |

`uploadAndAttachPetMedia` is itself a three-phase composed client (upload intent → binary upload → attach).
The save flow treats it as an atomic black-box dependency — it does not reach inside it.

### 2.2 Factory Signature

```ts
type CreatePetDraftSaveFlowClientInput = {
  draftClient: Pick<PetDraftClient, 'createPetDraft' | 'updatePetDraft'>;
  uploadAttachClient: Pick<PetMediaUploadAttachFlowClient, 'uploadAndAttachPetMedia'>;
};

createPetDraftSaveFlowClient(input: CreatePetDraftSaveFlowClientInput): PetDraftSaveFlowClient
```

No network calls, no fetch, no token provider. The factory only wires dependencies together.

### 2.3 Public Interface

```ts
type PetDraftSaveFlowClient = {
  savePetDraft: (input: PetDraftSaveFlowInput) => Promise<PetDraftSaveFlowResult>;
};
```

### 2.4 Input Shape

```ts
type PetDraftSaveFlowFileInput = {
  name: string;
  type: string;
  size: number;
  body: BodyInit;
};

type PetDraftSaveFlowInput = {
  operation: 'create' | 'update';
  petId: string;
  shelterId: string;
  ownerUserId?: string | null;
  name?: string | null;
  species?: PetLifecycleSpecies | null;
  locationLabel?: string | null;
  shortDescription?: string | null;
  existingMediaIds: string[];
  heroMediaId?: string | null;
  medical: PublicPetMedicalStatus;
  newFiles?: PetDraftSaveFlowFileInput[];
};
```

`existingMediaIds` is the set of already-attached media IDs forwarded verbatim to the draft client.
`newFiles` is the list of new binary files to upload and attach after a successful draft save.
`heroMediaId` references an ID from `existingMediaIds`; it is not assigned from newly uploaded files by this flow.

### 2.5 Result Shape

```ts
type PetDraftSaveFlowUploadedMedia = {
  mediaId: string;
  objectKey: string;
  mediaIds: string[];
  heroMediaId: string | null;
};

type PetDraftSaveFlowSuccess = {
  ok: true;
  status: 'pet_draft_saved';
  petId: string;
  operation: 'create' | 'update';
  uploadedMedia: PetDraftSaveFlowUploadedMedia[];
};

type PetDraftSaveFlowFailure =
  | {
      ok: false;
      phase: 'draft_save';
      status: PetDraftClientFailureStatus;
      reasons: string[];
    }
  | {
      ok: false;
      phase: 'media_upload';
      subPhase: 'upload_intent';
      status: MediaUploadClientFailureStatus;
      reasons: string[];
    }
  | {
      ok: false;
      phase: 'media_upload';
      subPhase: 'binary_upload';
      status: MediaUploadBinaryFailureStatus;
      reasons: string[];
      responseStatus?: number;
      mediaId: string;
      objectKey: string;
    }
  | {
      ok: false;
      phase: 'media_upload';
      subPhase: 'attach';
      status: PetMediaAttachClientFailureStatus;
      reasons: string[];
      mediaId: string;
      objectKey: string;
    };

type PetDraftSaveFlowResult = PetDraftSaveFlowSuccess | PetDraftSaveFlowFailure;
```

## 3. Failure Phase Transitions

### Phase 1 — draft_save

The draft save is always the first operation. It uses `draftClient.createPetDraft` or `draftClient.updatePetDraft`
depending on `input.operation`. The existing media IDs and all metadata fields are forwarded.

If it fails:

```
savePetDraft({ operation: 'create', ... })
  → draftClient.createPetDraft fails (e.g. unauthenticated)
  ← { ok: false, phase: 'draft_save', status: 'unauthenticated', reasons: [...] }
  No file uploads attempted.
```

### Phase 2 — media_upload (per file, sequential)

If the draft save succeeds, the flow iterates over `newFiles` in order.
For each file it calls `uploadAttachClient.uploadAndAttachPetMedia({ petId, shelterId, ownerUserId, file })`.

**Sub-phase: upload_intent failure**

The upload intent call to the Worker failed before a signed URL was issued.
No binary data was sent. No media asset was created.

```
uploadAndAttachPetMedia → { ok: false, phase: 'upload_intent', status, reasons }
← { ok: false, phase: 'media_upload', subPhase: 'upload_intent', status, reasons }
```

**Sub-phase: binary_upload failure (intent succeeded, binary failed)**

A signed URL was obtained and a media asset record was persisted, but the binary PUT to R2 was rejected.
The media asset record exists in the database but has no binary content. This is a dangling state;
cleanup is a server-side concern.

```
uploadAndAttachPetMedia → { ok: false, phase: 'binary_upload', status, reasons, mediaId, objectKey }
← { ok: false, phase: 'media_upload', subPhase: 'binary_upload', status, reasons, mediaId, objectKey, responseStatus? }
```

**Sub-phase: attach failure (upload succeeded, attach failed)**

The file was written to R2 successfully, but the Worker's attach route rejected the attachment.
The file now exists in R2 storage but is not attached to the pet draft.
This is an orphaned upload. The draft save is committed. The caller is responsible for deciding whether
to retry the attach or to surface an error state to the user.

```
uploadAndAttachPetMedia → { ok: false, phase: 'attach', status, reasons, mediaId, objectKey }
← { ok: false, phase: 'media_upload', subPhase: 'attach', status, reasons, mediaId, objectKey }
```

**Fail-fast on first failure**

If any file in `newFiles` fails at any sub-phase, the flow returns immediately.
Files after the failing one are not attempted.

### Sequential ordering rationale

Sequential file uploads are used to:
- Provide deterministic failure attribution (we know exactly which file failed)
- Avoid orphaning multiple uploads when a single failure occurs
- Keep the composition logic simple without parallel coordination overhead

Concurrent uploads can be introduced in a future work item once the attach route supports idempotent retry.

## 4. Result Sanitization

### Layer 1 — dependency clients already strip credentials

`PetMediaUploadAttachFlowClient` returns `PetMediaUploadAttachFlowResult`, which:
- Never includes `signedUrl` (replaced by `SafeMediaUploadIntentMetadata` that omits it)
- Never includes `uploadHeaders` (filtered out before the binary upload, not propagated to callers)
- Never includes bearer tokens (result fields are structural, not raw response bodies)

`PetDraftClient` returns `PetDraftClientResult`, which:
- Has reasons pre-sanitized through `sanitizeReasons` against `unsafeClientReasonMarkers`

### Layer 2 — flow applies `sanitizeReasons` on all forwarded reason arrays

Before placing any reasons from sub-flow failures into the final result, the flow calls `sanitizeReasons`
with an appropriate fallback string. This double-pass is defense-in-depth: if a future dependency
change introduces a credential-leaking reason string, the flow layer catches it.

### Layer 3 — result type design excludes credential fields

`PetDraftSaveFlowSuccess.uploadedMedia` contains only:
- `mediaId` — an opaque UUID
- `objectKey` — a storage path, not a signed URL
- `mediaIds` — array of attached IDs
- `heroMediaId` — an ID or null

No result field is named or typed to carry: `signedUrl`, `bearerToken`, `accessToken`,
`serviceRoleKey`, `r2AccessKey`, `r2SecretKey`, or `uploadHeaders`.

TypeScript strict mode will catch accidental additions to these types.

## 5. Test Matrix

All tests use injected fakes — no real fetch, no real Worker calls, no real Supabase or R2 calls.

### Group A — draft_save phase (no new files)

| # | Scenario | Expected result |
|---|---|---|
| A1 | Create, draft succeeds, no new files | `ok: true`, `status: 'pet_draft_saved'`, `operation: 'create'`, `uploadedMedia: []` |
| A2 | Update, draft succeeds, no new files | `ok: true`, `status: 'pet_draft_saved'`, `operation: 'update'`, `uploadedMedia: []` |
| A3 | Create, draft fails `unauthenticated` | `ok: false`, `phase: 'draft_save'`, `status: 'unauthenticated'` |
| A4 | Update, draft fails `invalid_pet_draft` | `ok: false`, `phase: 'draft_save'`, `status: 'invalid_pet_draft'` |
| A5 | Create, draft fails `actor_not_authorized` | `ok: false`, `phase: 'draft_save'`, `status: 'actor_not_authorized'` |

### Group B — media_upload phase, single file, draft succeeds

| # | Scenario | Expected result |
|---|---|---|
| B1 | Upload intent fails | `ok: false`, `phase: 'media_upload'`, `subPhase: 'upload_intent'` |
| B2 | Binary upload fails (intent succeeded) | `ok: false`, `phase: 'media_upload'`, `subPhase: 'binary_upload'`, includes `mediaId` and `objectKey` |
| B3 | Attach fails (upload succeeded) | `ok: false`, `phase: 'media_upload'`, `subPhase: 'attach'`, includes `mediaId` and `objectKey` |
| B4 | All phases succeed, one file | `ok: true`, `uploadedMedia` has one entry with correct `mediaId` and `objectKey` |

### Group C — multi-file scenarios, draft succeeds

| # | Scenario | Expected result |
|---|---|---|
| C1 | Two files, both succeed | `ok: true`, `uploadedMedia` has two entries in order |
| C2 | Two files, first succeeds, second upload_intent fails | `ok: false`, `phase: 'media_upload'`, `subPhase: 'upload_intent'` — second file stopped flow |
| C3 | Two files, first succeeds, second attach fails | `ok: false`, `phase: 'media_upload'`, `subPhase: 'attach'` — orphaned upload from second file |

### Group D — sanitization assertions

| # | Scenario | Expected result |
|---|---|---|
| D1 | Draft failure reason contains `bearer ` token marker | Reason is stripped; fallback returned |
| D2 | Upload flow failure reason contains `signedurl` marker | Reason is stripped; fallback returned |
| D3 | Success result fields contain no `signedUrl`, `bearerToken`, `serviceRoleKey`, `r2AccessKey` | Pass |
| D4 | Draft failure with `worker_request_failed`, no exposed service-role | Sanitized safe reasons |

### Summary

4 phase groups × ~4 scenarios each = **~16 test cases** covering all phase combinations.

## 6. Implementation Steps

1. Add types to `packages/client/src/index.ts`:
   - `PetDraftSaveFlowFileInput`
   - `PetDraftSaveFlowInput`
   - `PetDraftSaveFlowUploadedMedia`
   - `PetDraftSaveFlowSuccess`
   - `PetDraftSaveFlowFailure`
   - `PetDraftSaveFlowResult`
   - `CreatePetDraftSaveFlowClientInput`
   - `PetDraftSaveFlowClient`

2. Write failing tests in `tests/client/pet-draft-save-flow.test.ts` covering all groups above.

3. Implement `createPetDraftSaveFlowClient`:
   - Select `createPetDraft` or `updatePetDraft` based on `input.operation`
   - Build `PetDraftClientDraftInput` from flow input (`existingMediaIds` → `mediaIds`)
   - On draft failure: map to `{ ok: false, phase: 'draft_save', ... }` with sanitized reasons
   - On draft success: iterate `newFiles`; call `uploadAttachClient.uploadAndAttachPetMedia` for each
   - Map `PetMediaUploadAttachFlowFailure` sub-phases to the `media_upload` phase result
   - On all successes: return `{ ok: true, status: 'pet_draft_saved', petId, operation, uploadedMedia }`

4. Run validation:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`

5. Commit as one coherent checkpoint including work item, work spec, tests and implementation.

## 7. Risk Controls

- No real service calls in tests or implementation.
- No production auth/session state.
- No Supabase service-role key or R2 credentials in client-facing result types.
- Fail-fast on first file failure; no concurrent uploads that could orphan multiple assets.
- Double-pass `sanitizeReasons` for defense-in-depth.
- Result type design enforced by TypeScript strict mode.
