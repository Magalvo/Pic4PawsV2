import { describe, expect, it, vi } from 'vitest';
import {
  createPetDraftSaveFlowClient,
  type PetDraftClient,
  type PetDraftSaveFlowFileInput,
  type PetDraftSaveFlowInput,
  type PetMediaUploadAttachFlowClient,
} from '../../packages/client/src/index';

const file1: PetDraftSaveFlowFileInput = {
  name: 'becas.jpg',
  type: 'image/jpeg',
  size: 800_000,
  body: new Blob(['binary-1'], { type: 'image/jpeg' }),
};

const file2: PetDraftSaveFlowFileInput = {
  name: 'micas.jpg',
  type: 'image/jpeg',
  size: 600_000,
  body: new Blob(['binary-2'], { type: 'image/jpeg' }),
};

const baseInput: PetDraftSaveFlowInput = {
  operation: 'create',
  petId: 'pet-1',
  shelterId: 'shelter-a',
  ownerUserId: 'user-1',
  name: 'Becas',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo e sociável.',
  existingMediaIds: ['media-existing-1'],
  heroMediaId: 'media-existing-1',
  medical: { vaccinated: true, sterilized: false, microchipped: true, specialNeeds: false },
};

const makeDraftSuccess = (operation: 'create' | 'update') => ({
  ok: true as const,
  status: operation === 'create' ? ('pet_draft_created' as const) : ('pet_draft_updated' as const),
  petId: 'pet-1',
});

const makeUploadAttachSuccess = (mediaId: string, objectKey: string) => ({
  ok: true as const,
  status: 'pet_media_uploaded_and_attached' as const,
  petId: 'pet-1',
  mediaId,
  objectKey,
  mediaIds: ['media-existing-1', mediaId],
  heroMediaId: null as string | null,
  upload: { mediaId, objectKey, responseStatus: 200 },
  attach: { mediaId, mediaIds: ['media-existing-1', mediaId], heroMediaId: null as string | null },
});

// --- Group A: draft_save phase (no new files) ---

describe('pet draft save flow — draft_save phase', () => {
  it('A1: returns success on create with no new files', async () => {
    const draftClient: Pick<PetDraftClient, 'createPetDraft' | 'updatePetDraft'> = {
      createPetDraft: async (draft) => {
        expect(draft.mediaIds).toEqual(['media-existing-1']);
        expect(draft.heroMediaId).toBe('media-existing-1');

        return makeDraftSuccess('create');
      },
      updatePetDraft: vi.fn(),
    };
    const uploadAttachClient: Pick<PetMediaUploadAttachFlowClient, 'uploadAndAttachPetMedia'> = {
      uploadAndAttachPetMedia: vi.fn(),
    };
    const flow = createPetDraftSaveFlowClient({ draftClient, uploadAttachClient });

    await expect(flow.savePetDraft(baseInput)).resolves.toEqual({
      ok: true,
      status: 'pet_draft_saved',
      petId: 'pet-1',
      operation: 'create',
      uploadedMedia: [],
    });
    expect(uploadAttachClient.uploadAndAttachPetMedia).not.toHaveBeenCalled();
    expect(draftClient.updatePetDraft).not.toHaveBeenCalled();
  });

  it('A2: returns success on update with no new files', async () => {
    const draftClient: Pick<PetDraftClient, 'createPetDraft' | 'updatePetDraft'> = {
      createPetDraft: vi.fn(),
      updatePetDraft: async () => makeDraftSuccess('update'),
    };
    const uploadAttachClient: Pick<PetMediaUploadAttachFlowClient, 'uploadAndAttachPetMedia'> = {
      uploadAndAttachPetMedia: vi.fn(),
    };
    const flow = createPetDraftSaveFlowClient({ draftClient, uploadAttachClient });

    await expect(
      flow.savePetDraft({ ...baseInput, operation: 'update' }),
    ).resolves.toEqual({
      ok: true,
      status: 'pet_draft_saved',
      petId: 'pet-1',
      operation: 'update',
      uploadedMedia: [],
    });
    expect(draftClient.createPetDraft).not.toHaveBeenCalled();
    expect(uploadAttachClient.uploadAndAttachPetMedia).not.toHaveBeenCalled();
  });

  it('A3: returns draft_save failure on unauthenticated — no uploads attempted', async () => {
    let uploadCalled = false;
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => ({
          ok: false,
          status: 'unauthenticated',
          reasons: ['missing_access_token'],
        }),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: {
        uploadAndAttachPetMedia: async () => {
          uploadCalled = true;
          throw new Error('upload must not run after draft_save failure');
        },
      },
    });

    const result = await flow.savePetDraft({ ...baseInput, newFiles: [file1] });

    expect(result).toEqual({
      ok: false,
      phase: 'draft_save',
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    expect(uploadCalled).toBe(false);
  });

  it('A4: returns draft_save failure on invalid_pet_draft', async () => {
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: vi.fn(),
        updatePetDraft: async () => ({
          ok: false,
          status: 'invalid_pet_draft',
          reasons: ['missing_required_field'],
        }),
      },
      uploadAttachClient: { uploadAndAttachPetMedia: vi.fn() },
    });

    await expect(
      flow.savePetDraft({ ...baseInput, operation: 'update', newFiles: [file1] }),
    ).resolves.toEqual({
      ok: false,
      phase: 'draft_save',
      status: 'invalid_pet_draft',
      reasons: ['missing_required_field'],
    });
  });

  it('A5: returns draft_save failure on actor_not_authorized', async () => {
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => ({
          ok: false,
          status: 'actor_not_authorized',
          reasons: ['actor_not_authorized'],
        }),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: { uploadAndAttachPetMedia: vi.fn() },
    });

    const result = await flow.savePetDraft(baseInput);

    expect(result).toEqual({
      ok: false,
      phase: 'draft_save',
      status: 'actor_not_authorized',
      reasons: ['actor_not_authorized'],
    });
  });
});

// --- Group B: media_upload phase, single file, draft succeeds ---

describe('pet draft save flow — media_upload phase, single file', () => {
  it('B1: returns media_upload/upload_intent failure when intent call fails', async () => {
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => makeDraftSuccess('create'),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: {
        uploadAndAttachPetMedia: async () => ({
          ok: false,
          phase: 'upload_intent',
          status: 'actor_not_authorized',
          reasons: ['actor_cannot_manage_shelter'],
        }),
      },
    });

    await expect(
      flow.savePetDraft({ ...baseInput, newFiles: [file1] }),
    ).resolves.toEqual({
      ok: false,
      phase: 'media_upload',
      subPhase: 'upload_intent',
      status: 'actor_not_authorized',
      reasons: ['actor_cannot_manage_shelter'],
    });
  });

  it('B2: returns media_upload/binary_upload failure with mediaId and objectKey', async () => {
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => makeDraftSuccess('create'),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: {
        uploadAndAttachPetMedia: async () => ({
          ok: false,
          phase: 'binary_upload',
          status: 'signed_upload_failed',
          reasons: ['signed_upload_rejected'],
          responseStatus: 403,
          mediaId: 'media-new-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
        }),
      },
    });

    await expect(
      flow.savePetDraft({ ...baseInput, newFiles: [file1] }),
    ).resolves.toEqual({
      ok: false,
      phase: 'media_upload',
      subPhase: 'binary_upload',
      status: 'signed_upload_failed',
      reasons: ['signed_upload_rejected'],
      responseStatus: 403,
      mediaId: 'media-new-1',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
    });
  });

  it('B3: returns media_upload/attach failure — orphaned upload scenario', async () => {
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => makeDraftSuccess('create'),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: {
        uploadAndAttachPetMedia: async () => ({
          ok: false,
          phase: 'attach',
          status: 'pet_media_attach_rejected',
          reasons: ['media_not_public_image'],
          mediaId: 'media-new-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
        }),
      },
    });

    await expect(
      flow.savePetDraft({ ...baseInput, newFiles: [file1] }),
    ).resolves.toEqual({
      ok: false,
      phase: 'media_upload',
      subPhase: 'attach',
      status: 'pet_media_attach_rejected',
      reasons: ['media_not_public_image'],
      mediaId: 'media-new-1',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
    });
  });

  it('B4: returns success with one uploadedMedia entry when draft and upload both succeed', async () => {
    const calls: string[] = [];
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async (draft) => {
          calls.push('draft');
          expect(draft.mediaIds).toEqual(['media-existing-1']);

          return makeDraftSuccess('create');
        },
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: {
        uploadAndAttachPetMedia: async ({ petId, shelterId, ownerUserId, file }) => {
          calls.push('upload');
          expect({ petId, shelterId, ownerUserId }).toEqual({
            petId: 'pet-1',
            shelterId: 'shelter-a',
            ownerUserId: 'user-1',
          });
          expect(file).toBe(file1);

          return makeUploadAttachSuccess(
            'media-new-1',
            'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
          );
        },
      },
    });

    await expect(
      flow.savePetDraft({ ...baseInput, newFiles: [file1] }),
    ).resolves.toEqual({
      ok: true,
      status: 'pet_draft_saved',
      petId: 'pet-1',
      operation: 'create',
      uploadedMedia: [
        {
          mediaId: 'media-new-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
          mediaIds: ['media-existing-1', 'media-new-1'],
          heroMediaId: null,
        },
      ],
    });
    expect(calls).toEqual(['draft', 'upload']);
  });
});

// --- Group C: multi-file scenarios ---

describe('pet draft save flow — multi-file scenarios', () => {
  it('C1: succeeds with two files — uploadedMedia has two entries in order', async () => {
    let uploadCount = 0;
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => makeDraftSuccess('create'),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: {
        uploadAndAttachPetMedia: async ({ file }) => {
          uploadCount += 1;
          const mediaId = `media-new-${uploadCount}`;
          const objectKey = `public/shelters/shelter-a/pet_public_image/${mediaId}.jpg`;
          expect(file).toBe(uploadCount === 1 ? file1 : file2);

          return makeUploadAttachSuccess(mediaId, objectKey);
        },
      },
    });

    await expect(
      flow.savePetDraft({ ...baseInput, newFiles: [file1, file2] }),
    ).resolves.toEqual({
      ok: true,
      status: 'pet_draft_saved',
      petId: 'pet-1',
      operation: 'create',
      uploadedMedia: [
        {
          mediaId: 'media-new-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
          mediaIds: ['media-existing-1', 'media-new-1'],
          heroMediaId: null,
        },
        {
          mediaId: 'media-new-2',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-2.jpg',
          mediaIds: ['media-existing-1', 'media-new-2'],
          heroMediaId: null,
        },
      ],
    });
    expect(uploadCount).toBe(2);
  });

  it('C2: stops at second file when its upload_intent fails — first file upload not reverted', async () => {
    let uploadCount = 0;
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => makeDraftSuccess('create'),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: {
        uploadAndAttachPetMedia: async () => {
          uploadCount += 1;
          if (uploadCount === 1) {
            return makeUploadAttachSuccess(
              'media-new-1',
              'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
            );
          }

          return {
            ok: false,
            phase: 'upload_intent',
            status: 'worker_request_failed',
            reasons: ['worker_unavailable'],
          };
        },
      },
    });

    const result = await flow.savePetDraft({ ...baseInput, newFiles: [file1, file2] });

    expect(result).toEqual({
      ok: false,
      phase: 'media_upload',
      subPhase: 'upload_intent',
      status: 'worker_request_failed',
      reasons: ['worker_unavailable'],
    });
    expect(uploadCount).toBe(2);
  });

  it('C3: stops at second file when its attach fails — orphaned upload from second file', async () => {
    let uploadCount = 0;
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => makeDraftSuccess('create'),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: {
        uploadAndAttachPetMedia: async () => {
          uploadCount += 1;
          if (uploadCount === 1) {
            return makeUploadAttachSuccess(
              'media-new-1',
              'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
            );
          }

          return {
            ok: false,
            phase: 'attach',
            status: 'pet_media_attach_context_not_found',
            reasons: ['pet_not_found'],
            mediaId: 'media-new-2',
            objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-2.jpg',
          };
        },
      },
    });

    const result = await flow.savePetDraft({ ...baseInput, newFiles: [file1, file2] });

    expect(result).toEqual({
      ok: false,
      phase: 'media_upload',
      subPhase: 'attach',
      status: 'pet_media_attach_context_not_found',
      reasons: ['pet_not_found'],
      mediaId: 'media-new-2',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-2.jpg',
    });
    expect(uploadCount).toBe(2);
  });
});

// --- Group D: sanitization ---

describe('pet draft save flow — sanitization', () => {
  it('D1: strips bearer token markers from draft_save failure reasons', async () => {
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => ({
          ok: false,
          status: 'worker_request_failed',
          reasons: ['safe_reason', 'bearer user-token-marker', 'service-role-secret'],
        }),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: { uploadAndAttachPetMedia: vi.fn() },
    });

    const result = await flow.savePetDraft(baseInput);

    expect(result).toMatchObject({ ok: false, phase: 'draft_save' });
    expect(JSON.stringify(result)).not.toContain('bearer');
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('D2: strips signed URL and R2 markers from media_upload failure reasons', async () => {
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => makeDraftSuccess('create'),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: {
        uploadAndAttachPetMedia: async () => ({
          ok: false,
          phase: 'upload_intent',
          status: 'upload_signer_failed',
          reasons: ['safe_reason', 'signedUrl=https://r2.test/signed', 'r2-access-key'],
        }),
      },
    });

    const result = await flow.savePetDraft({ ...baseInput, newFiles: [file1] });

    expect(result).toMatchObject({ ok: false, phase: 'media_upload' });
    expect(JSON.stringify(result)).not.toContain('signedUrl');
    expect(JSON.stringify(result)).not.toContain('r2-access-key');
  });

  it('D3: success result contains no credential-like fields', async () => {
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => makeDraftSuccess('create'),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: {
        uploadAndAttachPetMedia: async () =>
          makeUploadAttachSuccess(
            'media-new-1',
            'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
          ),
      },
    });

    const result = await flow.savePetDraft({ ...baseInput, newFiles: [file1] });
    const serialized = JSON.stringify(result);

    expect(result.ok).toBe(true);
    expect(serialized).not.toContain('signedUrl');
    expect(serialized).not.toContain('bearerToken');
    expect(serialized).not.toContain('serviceRoleKey');
    expect(serialized).not.toContain('r2AccessKey');
    expect(serialized).not.toContain('r2SecretKey');
    expect(serialized).not.toContain('uploadHeaders');
  });

  it('D4: worker_request_failed from draft client produces sanitized reasons fallback', async () => {
    const flow = createPetDraftSaveFlowClient({
      draftClient: {
        createPetDraft: async () => ({
          ok: false,
          status: 'worker_request_failed',
          reasons: ['service-role key leaked', 'r2_secret exposed'],
        }),
        updatePetDraft: vi.fn(),
      },
      uploadAttachClient: { uploadAndAttachPetMedia: vi.fn() },
    });

    const result = await flow.savePetDraft(baseInput);

    expect(result).toMatchObject({ ok: false, phase: 'draft_save', status: 'worker_request_failed' });
    if (!result.ok) {
      expect(result.reasons.every((r) => typeof r === 'string')).toBe(true);
      expect(JSON.stringify(result)).not.toContain('service-role');
      expect(JSON.stringify(result)).not.toContain('r2_secret');
    }
  });
});
