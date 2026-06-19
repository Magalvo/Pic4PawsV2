import { describe, it, expect } from 'vitest';
import { createWebPetMediaUploadUi } from '../../apps/web/src/pet-media-upload';
import type { PetMediaUploadAttachFlowClient, PetMediaUploadAttachFlowFileInput } from '@pic4paws/client';

type UploadMock = Pick<PetMediaUploadAttachFlowClient, 'uploadAndAttachPetMedia'>;

const samplePet = { petId: 'pet-001', petName: 'Bolinha', shelterId: 'shelter-001' };

const sampleFile: PetMediaUploadAttachFlowFileInput = {
  name: 'bolinha.jpg',
  type: 'image/jpeg',
  size: 12345,
  body: new Blob(['test']),
};

const makeClient = (ok: boolean): UploadMock => ({
  uploadAndAttachPetMedia: async () =>
    ok
      ? {
          ok: true as const,
          status: 'pet_media_uploaded_and_attached' as const,
          petId: 'pet-001',
          mediaId: 'media-001',
          objectKey: 'pets/pet-001/media-001.jpg',
          mediaIds: ['media-001'],
          heroMediaId: 'media-001',
          upload: { mediaId: 'media-001', objectKey: 'pets/pet-001/media-001.jpg', responseStatus: 200 },
          attach: { mediaId: 'media-001', mediaIds: ['media-001'], heroMediaId: 'media-001' },
        }
      : {
          ok: false as const,
          phase: 'upload_intent' as const,
          status: 'unauthenticated' as const,
          reasons: [],
        },
});

describe('pet media upload page — boundary contract', () => {
  it('produces uploaded state on success', async () => {
    const ui = createWebPetMediaUploadUi({ uploadAttachFlow: makeClient(true) });
    const result = await ui.uploadSelectedImage({ pet: samplePet, file: sampleFile });
    expect(result.state).toBe('uploaded');
    if (result.state === 'uploaded') {
      expect(result.media.mediaId).toBe('media-001');
      expect(result.petId).toBe('pet-001');
    }
  });

  it('produces failed state on upload_intent error', async () => {
    const ui = createWebPetMediaUploadUi({ uploadAttachFlow: makeClient(false) });
    const result = await ui.uploadSelectedImage({ pet: samplePet, file: sampleFile });
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.phase).toBe('upload_intent');
    }
  });

  it('produces failed state with validation phase on unsupported mime type', async () => {
    const ui = createWebPetMediaUploadUi({ uploadAttachFlow: makeClient(true) });
    const badFile: PetMediaUploadAttachFlowFileInput = { ...sampleFile, type: 'video/mp4' };
    const result = await ui.uploadSelectedImage({ pet: samplePet, file: badFile });
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.phase).toBe('validation');
    }
  });

  it('getInitialState returns ready with petName in title', () => {
    const ui = createWebPetMediaUploadUi({ uploadAttachFlow: makeClient(true) });
    const state = ui.getInitialState(samplePet);
    expect(state.state).toBe('ready');
    expect(state.primaryAction).toBe('Escolher imagem');
    expect(state.petId).toBe('pet-001');
    expect(state.title).toContain('Bolinha');
  });

  it('failed state does not expose bearer or service-role in reasons', async () => {
    const poisonClient: UploadMock = {
      uploadAndAttachPetMedia: async () => ({
        ok: false as const,
        phase: 'upload_intent' as const,
        status: 'unauthenticated' as const,
        reasons: ['Bearer eyJ...', 'service-role key leaked'],
      }),
    };
    const ui = createWebPetMediaUploadUi({ uploadAttachFlow: poisonClient });
    const result = await ui.uploadSelectedImage({ pet: samplePet, file: sampleFile });
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
