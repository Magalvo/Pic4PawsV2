import { describe, expect, it } from 'vitest';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  MobileMediaUploadBoundary,
  MobilePetPublicImageUploadInput,
} from '../../apps/mobile/src/media-upload';
import {
  createMobilePetMediaUploadUi,
  mobilePetMediaUploadUiContent,
} from '../../apps/mobile/src/pet-media-upload';

const petContext = {
  petId: 'pet-1',
  petName: 'Becas',
  shelterId: 'shelter-a',
  ownerUserId: 'member-user',
} as const;

const validFile = {
  name: 'becas.webp',
  type: 'image/webp',
  size: 900_000,
  body: new Blob(['binary-image'], { type: 'image/webp' }),
} as const;

describe('mobile pet media upload UI flow', () => {
  it('uploads a selected image through the Mobile boundary with deterministic media IDs', async () => {
    const calls: MobilePetPublicImageUploadInput[] = [];
    const uploadBoundary: MobileMediaUploadBoundary = {
      uploadPetPublicImage: async (input) => {
        calls.push(input);

        return {
          state: 'uploaded',
          title: 'Imagem carregada',
          message: 'A imagem do animal ficou pronta para validação.',
          mediaId: input.mediaId,
          objectKey: `public/shelters/${input.shelterId}/pet_public_image/${input.mediaId}.webp`,
        };
      },
    };
    const ui = createMobilePetMediaUploadUi({
      uploadBoundary,
      generateMediaId: () => 'media-mobile-1',
    });

    await expect(ui.uploadSelectedImage({ pet: petContext, file: validFile })).resolves.toEqual({
      state: 'uploaded',
      title: 'Imagem adicionada ao rascunho',
      message: 'A imagem de Becas foi carregada e está pronta para ser associada ao perfil.',
      petId: 'pet-1',
      petName: 'Becas',
      media: {
        mediaId: 'media-mobile-1',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-mobile-1.webp',
      },
      nextAction: 'Associar imagem ao rascunho',
    });
    expect(calls).toEqual([
      {
        mediaId: 'media-mobile-1',
        shelterId: 'shelter-a',
        ownerUserId: 'member-user',
        file: validFile,
      },
    ]);
  });

  it('keeps Mobile product copy and failure states safe for UI rendering', async () => {
    const ui = createMobilePetMediaUploadUi({
      uploadBoundary: {
        uploadPetPublicImage: async () => ({
          state: 'intent_failed',
          title: 'Não foi possível preparar o carregamento',
          message: 'Confirma as permissões e tenta novamente.',
          reasons: ['actor_cannot_manage_shelter', 'temporary=opaque', 'server-only-marker'],
        }),
      },
      generateMediaId: () => 'media-mobile-1',
    });

    expect(ui.getInitialState(petContext).primaryAction).toBe('Escolher imagem');
    expect(mobilePetMediaUploadUiContent.locale).toBe('pt-PT');
    expect(mobilePetMediaUploadUiContent.states.map((state) => state.state)).toEqual([
      'ready',
      'choosing',
      'uploading',
      'uploaded',
      'failed',
    ]);

    const result = await ui.uploadSelectedImage({ pet: petContext, file: validFile });

    expect(result).toEqual({
      state: 'failed',
      title: 'Não foi possível adicionar a imagem',
      message: 'Confirma as permissões e tenta novamente.',
      petId: 'pet-1',
      petName: 'Becas',
      reasons: ['actor_cannot_manage_shelter'],
      canRetry: true,
    });
    expect(JSON.stringify(result)).not.toContain('temporary=opaque');
    expect(JSON.stringify(result)).not.toContain('server-only-marker');
    expect(JSON.stringify(result)).not.toContain('signedUrl');
  });

  it('surfaces the pet media product flow on the Mobile foundation content', () => {
    expect(mobileFoundationContent.petMediaUpload.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.petMediaUpload.title).toBe('Imagem do animal');
    expect(JSON.stringify(mobileFoundationContent.petMediaUpload)).not.toContain('signedUrl');
  });
});
