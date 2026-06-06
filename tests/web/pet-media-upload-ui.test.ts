import { describe, expect, it } from 'vitest';
import {
  createWebPetMediaUploadUi,
  webPetMediaUploadUiContent,
} from '../../apps/web/src/pet-media-upload';
import type { WebMediaUploadBoundary, WebPetPublicImageUploadInput } from '../../apps/web/src/media-upload';
import { webFoundationContent } from '../../apps/web/src/foundation';

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
      uploadBoundary: {
        uploadPetPublicImage: async () => {
          throw new Error('Upload should not be called for ready state');
        },
      },
      generateMediaId: () => 'media-web-1',
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

  it('uploads a selected public pet image through the Web boundary and returns a safe product view model', async () => {
    const calls: WebPetPublicImageUploadInput[] = [];
    const uploadBoundary: WebMediaUploadBoundary = {
      uploadPetPublicImage: async (input) => {
        calls.push(input);

        return {
          state: 'uploaded',
          title: 'Imagem carregada',
          message: 'A imagem do animal ficou pronta para validação.',
          mediaId: input.mediaId,
          objectKey: `public/shelters/${input.shelterId}/pet_public_image/${input.mediaId}.jpg`,
        };
      },
    };
    const ui = createWebPetMediaUploadUi({
      uploadBoundary,
      generateMediaId: () => 'media-web-1',
    });

    await expect(ui.uploadSelectedImage({ pet: petContext, file: validFile })).resolves.toEqual({
      state: 'uploaded',
      title: 'Imagem adicionada ao rascunho',
      message: 'A imagem de Becas foi carregada e está pronta para ser associada ao perfil.',
      petId: 'pet-1',
      petName: 'Becas',
      media: {
        mediaId: 'media-web-1',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-web-1.jpg',
      },
      nextAction: 'Associar imagem ao rascunho',
    });
    expect(calls).toEqual([
      {
        mediaId: 'media-web-1',
        shelterId: 'shelter-a',
        ownerUserId: 'member-user',
        file: validFile,
      },
    ]);
  });

  it('rejects unsupported files before calling the Web upload boundary', async () => {
    let uploadCalled = false;
    const ui = createWebPetMediaUploadUi({
      uploadBoundary: {
        uploadPetPublicImage: async () => {
          uploadCalled = true;
          throw new Error('Unsupported files should not reach upload boundary');
        },
      },
      generateMediaId: () => 'media-web-1',
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
      reasons: ['unsupported_mime_type'],
      canRetry: true,
    });
    expect(uploadCalled).toBe(false);
  });

  it('maps Web boundary failures without leaking signed URLs or credentials into UI state', async () => {
    const ui = createWebPetMediaUploadUi({
      uploadBoundary: {
        uploadPetPublicImage: async () => ({
          state: 'binary_upload_failed',
          title: 'Falha ao enviar a imagem',
          message: 'O pedido foi preparado, mas o envio do ficheiro falhou.',
          reasons: ['signed_upload_rejected', 'temporary=opaque', 'service-role-secret'],
          mediaId: 'media-web-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-web-1.jpg',
        }),
      },
      generateMediaId: () => 'media-web-1',
    });

    const result = await ui.uploadSelectedImage({ pet: petContext, file: validFile });

    expect(result).toEqual({
      state: 'failed',
      title: 'Não foi possível adicionar a imagem',
      message: 'O pedido foi preparado, mas o envio do ficheiro falhou.',
      petId: 'pet-1',
      petName: 'Becas',
      reasons: ['signed_upload_rejected'],
      canRetry: true,
    });
    expect(JSON.stringify(result)).not.toContain('temporary=opaque');
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('signedUrl');
  });

  it('surfaces the pet media product flow on the Web foundation content', () => {
    expect(webFoundationContent.petMediaUpload.status).toBe('product-flow-ready');
    expect(webFoundationContent.petMediaUpload.title).toBe('Imagem do animal');
    expect(JSON.stringify(webFoundationContent.petMediaUpload)).not.toContain('signedUrl');
  });
});
