import { describe, expect, it } from 'vitest';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import {
  createMobileMediaUploadBoundary,
  mobileMediaUploadContent,
} from '../../apps/mobile/src/media-upload';

type FetchCall = {
  url: string;
  init: RequestInit;
};

const createJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
  });

const createTextResponse = (body: string, init: ResponseInit = {}) => new Response(body, init);

const uploadReadyBody = {
  status: 'upload_ready',
  mediaId: 'media-1',
  bucketName: 'pic4paws-public',
  objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
  contentType: 'image/jpeg',
  byteSize: 1_200_000,
  visibility: 'public',
  mediaKind: 'image',
  ownerUserId: null,
  shelterId: 'shelter-a',
  signedUrl: 'https://uploads.test/signed/media-1?temporary=opaque',
  expiresAt: '2026-06-06T10:15:00.000Z',
  dryRunOnly: false,
  createdAt: '2026-06-06T10:00:00.000Z',
  mediaAssetId: 'media-1',
  mediaAssetPersisted: true,
} as const;

describe('mobile media upload boundary', () => {
  it('uploads a public pet image through injected dependencies and safe PT-PT states', async () => {
    const calls: FetchCall[] = [];
    const fileBody = new Blob(['binary-image'], { type: 'image/jpeg' });
    const boundary = createMobileMediaUploadBoundary({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      mediaUploadPath: '/uploads/media',
      getAccessToken: async () => 'user-token-marker',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });

        if (String(url).startsWith('https://worker.pic4paws.pt')) {
          return createJsonResponse(uploadReadyBody, { status: 201 });
        }

        return createTextResponse('', { status: 200 });
      },
    });

    await expect(
      boundary.uploadPetPublicImage({
        mediaId: 'media-1',
        shelterId: 'shelter-a',
        file: {
          name: 'becas.jpg',
          type: 'image/jpeg',
          size: 1_200_000,
          body: fileBody,
        },
      }),
    ).resolves.toEqual({
      state: 'uploaded',
      title: 'Imagem carregada',
      message: 'A imagem do animal ficou pronta para validação.',
      mediaId: 'media-1',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
    });

    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({
      url: 'https://worker.pic4paws.pt/uploads/media',
      init: {
        method: 'POST',
        headers: {
          Authorization: 'Bearer user-token-marker',
          'Content-Type': 'application/json',
        },
      },
    });
    expect(JSON.parse(calls[0]?.init.body as string)).toEqual({
      mediaId: 'media-1',
      purpose: 'pet_public_image',
      requestedVisibility: 'public',
      mimeType: 'image/jpeg',
      byteSize: 1_200_000,
      ownerUserId: null,
      shelterId: 'shelter-a',
      originalFilename: 'becas.jpg',
    });
    expect(calls[1]).toMatchObject({
      url: 'https://uploads.test/signed/media-1?temporary=opaque',
      init: {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
        },
        body: fileBody,
      },
    });
    expect(JSON.stringify(calls[1]?.init.headers)).not.toContain('user-token-marker');
    expect(JSON.stringify(calls)).not.toContain('server-only-marker');
    expect(JSON.stringify(calls)).not.toContain('r2-marker');
  });

  it('maps intent failures to safe Portuguese Mobile copy', async () => {
    const boundary = createMobileMediaUploadBoundary({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      mediaUploadPath: '/uploads/media',
      getAccessToken: async () => 'user-token-marker',
      fetch: async () =>
        createJsonResponse(
          {
            status: 'actor_not_authorized',
            reasons: ['actor_cannot_manage_shelter'],
            debug: 'server-only-marker r2-marker user-token-marker',
          },
          { status: 403 },
        ),
    });

    const result = await boundary.uploadPetPublicImage({
      mediaId: 'media-1',
      shelterId: 'shelter-a',
      file: {
        name: 'becas.jpg',
        type: 'image/jpeg',
        size: 1_200_000,
        body: new Blob(['binary-image'], { type: 'image/jpeg' }),
      },
    });

    expect(result).toEqual({
      state: 'intent_failed',
      title: 'Não foi possível preparar o carregamento',
      message: 'Confirma as permissões e tenta novamente.',
      reasons: ['actor_cannot_manage_shelter'],
    });
    expect(JSON.stringify(result)).not.toContain('server-only-marker');
    expect(JSON.stringify(result)).not.toContain('r2-marker');
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('maps signed URL upload failures without leaking temporary signed URLs', async () => {
    const boundary = createMobileMediaUploadBoundary({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      mediaUploadPath: '/uploads/media',
      getAccessToken: async () => 'user-token-marker',
      fetch: async (url) => {
        if (String(url).startsWith('https://worker.pic4paws.pt')) {
          return createJsonResponse(uploadReadyBody, { status: 201 });
        }

        return createTextResponse('server-only-marker r2-marker user-token-marker', {
          status: 403,
        });
      },
    });

    const result = await boundary.uploadPetPublicImage({
      mediaId: 'media-1',
      shelterId: 'shelter-a',
      file: {
        name: 'becas.jpg',
        type: 'image/jpeg',
        size: 1_200_000,
        body: new Blob(['binary-image'], { type: 'image/jpeg' }),
      },
    });

    expect(result).toEqual({
      state: 'binary_upload_failed',
      title: 'Falha ao enviar a imagem',
      message: 'O pedido foi preparado, mas o envio do ficheiro falhou.',
      reasons: ['signed_upload_rejected'],
      mediaId: 'media-1',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
    });
    expect(JSON.stringify(result)).not.toContain('temporary=opaque');
    expect(JSON.stringify(result)).not.toContain('server-only-marker');
    expect(JSON.stringify(result)).not.toContain('r2-marker');
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('surfaces media upload readiness on the Portuguese mobile foundation screen', () => {
    expect(mobileMediaUploadContent.locale).toBe('pt-PT');
    expect(mobileMediaUploadContent.states.map((state) => state.state)).toEqual([
      'idle',
      'uploading',
      'uploaded',
      'intent_failed',
      'binary_upload_failed',
    ]);
    expect(mobileFoundationContent.mediaUpload.status).toBe('contract-ready');
    expect(mobileFoundationContent.mediaUpload.title).toBe('Upload seguro de imagens');
    expect(JSON.stringify(mobileFoundationContent.mediaUpload)).not.toContain('signedUrl');
  });
});
