import { describe, expect, it } from 'vitest';
import {
  createWebPetMediaUploadUi,
  webPetMediaUploadUiContent,
} from '../../apps/web/src/pet-media-upload';
import { webFoundationContent } from '../../apps/web/src/foundation';
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
  name: 'becas.jpg',
  type: 'image/jpeg',
  size: 1_200_000,
  body: new Blob(['binary-image'], { type: 'image/jpeg' }),
} as const;

describe('web pet media upload UI flow', () => {
  it('exposes a PT-PT ready state for a pet draft image upload', () => {
    const ui = createWebPetMediaUploadUi({
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
    expect(webPetMediaUploadUiContent.locale).toBe('pt-PT');
    expect(webPetMediaUploadUiContent.states.map((state) => state.state)).toEqual([
      'ready',
      'choosing',
      'uploading',
      'uploaded',
      'failed',
    ]);
  });

  it('uploads and attaches a selected public pet image through the composed Web flow', async () => {
    const calls: PetMediaUploadAttachFlowInput[] = [];
    const uploadAttachFlow: PetMediaUploadAttachFlowClient = {
      uploadAndAttachPetMedia: async (input) => {
        calls.push(input);

        return {
          ok: true,
          status: 'pet_media_uploaded_and_attached',
          petId: input.petId,
          mediaId: 'media-web-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-web-1.jpg',
          mediaIds: ['media-web-1'],
          heroMediaId: 'media-web-1',
          upload: {
            mediaId: 'media-web-1',
            objectKey: 'public/shelters/shelter-a/pet_public_image/media-web-1.jpg',
            responseStatus: 200,
          },
          attach: {
            mediaId: 'media-web-1',
            mediaIds: ['media-web-1'],
            heroMediaId: 'media-web-1',
          },
        };
      },
    };
    const ui = createWebPetMediaUploadUi({ uploadAttachFlow });

    await expect(ui.uploadSelectedImage({ pet: petContext, file: validFile })).resolves.toEqual({
      state: 'uploaded',
      title: 'Imagem carregada e associada',
      message: 'A imagem de Becas foi carregada e associada ao rascunho.',
      petId: 'pet-1',
      petName: 'Becas',
      media: {
        mediaId: 'media-web-1',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-web-1.jpg',
      },
      draftMedia: {
        mediaIds: ['media-web-1'],
        heroMediaId: 'media-web-1',
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

  it('rejects unsupported files before calling the Web upload attach flow', async () => {
    let flowCalled = false;
    const ui = createWebPetMediaUploadUi({
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
          size: 1_200_000,
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
    const ui = createWebPetMediaUploadUi({
      uploadAttachFlow: {
        uploadAndAttachPetMedia: async () => ({
          ok: false,
          phase: 'upload_intent',
          status: 'upload_intent_rejected',
          reasons: ['not_shelter_member', 'r2-secret-key', 'bearer user-token-marker'],
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
      reasons: ['not_shelter_member'],
      canRetry: true,
    });
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('maps binary upload failures without leaking signed URLs or credentials into UI state', async () => {
    const ui = createWebPetMediaUploadUi({
      uploadAttachFlow: {
        uploadAndAttachPetMedia: async () => ({
          ok: false,
          phase: 'binary_upload',
          status: 'signed_upload_failed',
          reasons: ['signed_upload_rejected', 'temporary=opaque', 'service-role-secret'],
          mediaId: 'media-web-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-web-1.jpg',
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

  it('maps attach failures as a distinct safe Web product phase', async () => {
    const ui = createWebPetMediaUploadUi({
      uploadAttachFlow: {
        uploadAndAttachPetMedia: async () => ({
          ok: false,
          phase: 'attach',
          status: 'pet_media_attach_rejected',
          reasons: ['media_not_public_image', 'signedUrl=https://uploads.test', 'user-access-token'],
          mediaId: 'media-web-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-web-1.jpg',
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

  it('surfaces the pet media product flow on the Web foundation content', () => {
    expect(webFoundationContent.petMediaUpload.status).toBe('product-flow-ready');
    expect(webFoundationContent.petMediaUpload.title).toBe('Imagem do animal');
    expect(JSON.stringify(webFoundationContent.petMediaUpload)).not.toContain('signedUrl');
  });
});
