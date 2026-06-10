import { describe, expect, it } from 'vitest';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import {
  createMobilePetMediaUploadUi,
  mobilePetMediaUploadUiContent,
} from '../../apps/mobile/src/pet-media-upload';
import type {
  PetMediaUploadAttachFlowClient,
  PetMediaUploadAttachFlowInput,
} from '../../packages/client/src/index';

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
  it('exposes a PT-PT ready state for a pet draft image upload', () => {
    const ui = createMobilePetMediaUploadUi({
      uploadAttachFlow: {
        uploadAndAttachPetMedia: async () => {
          throw new Error('Flow should not be called for ready state');
        },
      },
    });

    expect(ui.getInitialState(petContext)).toEqual({
      state: 'ready',
      title: 'Adicionar imagem de Becas',
      message: 'Escolhe uma imagem JPEG, PNG ou WebP para preparar o perfil antes da publicação.',
      primaryAction: 'Escolher imagem',
      petId: 'pet-1',
      petName: 'Becas',
      acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
    expect(mobilePetMediaUploadUiContent.locale).toBe('pt-PT');
    expect(mobilePetMediaUploadUiContent.states.map((state) => state.state)).toEqual([
      'ready',
      'choosing',
      'uploading',
      'uploaded',
      'failed',
    ]);
  });

  it('uploads and attaches a selected public pet image through the composed Mobile flow', async () => {
    const calls: PetMediaUploadAttachFlowInput[] = [];
    const uploadAttachFlow: PetMediaUploadAttachFlowClient = {
      uploadAndAttachPetMedia: async (input) => {
        calls.push(input);

        return {
          ok: true,
          status: 'pet_media_uploaded_and_attached',
          petId: input.petId,
          mediaId: 'media-mobile-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-mobile-1.webp',
          mediaIds: ['media-mobile-1'],
          heroMediaId: 'media-mobile-1',
          upload: {
            mediaId: 'media-mobile-1',
            objectKey: 'public/shelters/shelter-a/pet_public_image/media-mobile-1.webp',
            responseStatus: 200,
          },
          attach: {
            mediaId: 'media-mobile-1',
            mediaIds: ['media-mobile-1'],
            heroMediaId: 'media-mobile-1',
          },
        };
      },
    };
    const ui = createMobilePetMediaUploadUi({ uploadAttachFlow });

    await expect(ui.uploadSelectedImage({ pet: petContext, file: validFile })).resolves.toEqual({
      state: 'uploaded',
      title: 'Imagem carregada e associada',
      message: 'A imagem de Becas foi carregada e associada ao rascunho.',
      petId: 'pet-1',
      petName: 'Becas',
      media: {
        mediaId: 'media-mobile-1',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-mobile-1.webp',
      },
      draftMedia: {
        mediaIds: ['media-mobile-1'],
        heroMediaId: 'media-mobile-1',
      },
    });
    expect(calls).toEqual([
      {
        petId: 'pet-1',
        shelterId: 'shelter-a',
        ownerUserId: 'member-user',
        file: validFile,
      },
    ]);
  });

  it('rejects unsupported files before calling the Mobile upload attach flow', async () => {
    let flowCalled = false;
    const ui = createMobilePetMediaUploadUi({
      uploadAttachFlow: {
        uploadAndAttachPetMedia: async () => {
          flowCalled = true;
          throw new Error('Unsupported files should not reach upload attach flow');
        },
      },
    });

    await expect(
      ui.uploadSelectedImage({
        pet: petContext,
        file: {
          name: 'becas.pdf',
          type: 'application/pdf',
          size: 900_000,
          body: new Blob(['document'], { type: 'application/pdf' }),
        },
      }),
    ).resolves.toEqual({
      state: 'failed',
      title: 'Formato não suportado',
      message: 'Usa JPEG, PNG ou WebP para imagens públicas de animais.',
      petId: 'pet-1',
      petName: 'Becas',
      phase: 'validation',
      reasons: ['unsupported_mime_type'],
      canRetry: true,
    });
    expect(flowCalled).toBe(false);
  });

  it('maps upload intent failures without leaking provider credentials into UI state', async () => {
    const ui = createMobilePetMediaUploadUi({
      uploadAttachFlow: {
        uploadAndAttachPetMedia: async () => ({
          ok: false,
          phase: 'upload_intent',
          status: 'actor_not_authorized',
          reasons: ['actor_cannot_manage_shelter', 'r2-secret-key', 'bearer user-token-marker'],
        }),
      },
    });

    const result = await ui.uploadSelectedImage({ pet: petContext, file: validFile });

    expect(result).toEqual({
      state: 'failed',
      title: 'Não foi possível preparar o carregamento',
      message: 'Confirma as permissões e tenta novamente.',
      petId: 'pet-1',
      petName: 'Becas',
      phase: 'upload_intent',
      reasons: ['actor_cannot_manage_shelter'],
      canRetry: true,
    });
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('maps binary upload failures without leaking signed URLs or credentials into UI state', async () => {
    const ui = createMobilePetMediaUploadUi({
      uploadAttachFlow: {
        uploadAndAttachPetMedia: async () => ({
          ok: false,
          phase: 'binary_upload',
          status: 'signed_upload_failed',
          reasons: ['signed_upload_rejected', 'temporary=opaque', 'service-role-secret'],
          mediaId: 'media-mobile-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-mobile-1.webp',
        }),
      },
    });

    const result = await ui.uploadSelectedImage({ pet: petContext, file: validFile });

    expect(result).toEqual({
      state: 'failed',
      title: 'Não foi possível adicionar a imagem',
      message: 'O pedido foi preparado, mas o envio do ficheiro falhou.',
      petId: 'pet-1',
      petName: 'Becas',
      phase: 'binary_upload',
      reasons: ['signed_upload_rejected'],
      canRetry: true,
    });
    expect(JSON.stringify(result)).not.toContain('temporary=opaque');
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('signedUrl');
  });

  it('maps attach failures as a distinct safe Mobile product phase', async () => {
    const ui = createMobilePetMediaUploadUi({
      uploadAttachFlow: {
        uploadAndAttachPetMedia: async () => ({
          ok: false,
          phase: 'attach',
          status: 'pet_media_attach_rejected',
          reasons: ['media_not_public_image', 'signedUrl=https://uploads.test', 'user-access-token'],
          mediaId: 'media-mobile-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-mobile-1.webp',
        }),
      },
    });

    const result = await ui.uploadSelectedImage({ pet: petContext, file: validFile });

    expect(result).toEqual({
      state: 'failed',
      title: 'Não foi possível associar a imagem',
      message: 'A imagem foi enviada, mas não ficou associada ao rascunho.',
      petId: 'pet-1',
      petName: 'Becas',
      phase: 'attach',
      reasons: ['media_not_public_image'],
      canRetry: true,
    });
    expect(JSON.stringify(result)).not.toContain('signedUrl');
    expect(JSON.stringify(result)).not.toContain('user-access-token');
  });

  it('surfaces the pet media product flow on the Mobile foundation content', () => {
    expect(mobileFoundationContent.petMediaUpload.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.petMediaUpload.title).toBe('Imagem do animal');
    expect(JSON.stringify(mobileFoundationContent.petMediaUpload)).not.toContain('signedUrl');
  });
});
