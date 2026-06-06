import { describe, expect, it } from 'vitest';
import { createMediaUploadFlowClient } from '../../packages/client/src/index';

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

const validRequest = {
  mediaId: 'media-1',
  purpose: 'pet_public_image',
  requestedVisibility: 'public',
  mimeType: 'image/jpeg',
  byteSize: 1_200_000,
  ownerUserId: 'user-a',
  shelterId: 'shelter-a',
  originalFilename: 'becas.jpg',
} as const;

const uploadReadyBody = {
  status: 'upload_ready',
  mediaId: 'media-1',
  bucketName: 'pic4paws-public',
  objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
  contentType: 'image/jpeg',
  byteSize: 1_200_000,
  visibility: 'public',
  mediaKind: 'image',
  ownerUserId: 'user-a',
  shelterId: 'shelter-a',
  signedUrl: 'https://uploads.test/signed/media-1?temporary=secret',
  expiresAt: '2026-06-05T10:15:00.000Z',
  dryRunOnly: false,
  createdAt: '2026-06-05T10:00:00.000Z',
  mediaAssetId: 'media-1',
  mediaAssetPersisted: true,
  uploadHeaders: {
    'x-amz-meta-media-id': 'media-1',
  },
} as const;

describe('media upload flow client contract', () => {
  it('requests an upload intent and then uploads bytes to the signed URL safely', async () => {
    const calls: FetchCall[] = [];
    const body = new Blob(['binary-image'], { type: 'image/jpeg' });
    const client = createMediaUploadFlowClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      mediaUploadPath: '/uploads/media',
      getAccessToken: async () => 'user-access-token',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });

        if (String(url).startsWith('https://worker.pic4paws.pt')) {
          return createJsonResponse(uploadReadyBody, { status: 201 });
        }

        return createTextResponse('', { status: 200 });
      },
    });

    await expect(
      client.uploadMedia({
        request: {
          ...validRequest,
          serviceRoleKey: 'service-role-secret',
          r2SecretAccessKey: 'r2-secret-key',
        } as typeof validRequest & Record<string, unknown>,
        body,
      }),
    ).resolves.toEqual({
      ok: true,
      status: 'uploaded',
      mediaId: 'media-1',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
      responseStatus: 200,
      intent: {
        mediaId: 'media-1',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
        contentType: 'image/jpeg',
        byteSize: 1_200_000,
        visibility: 'public',
        mediaKind: 'image',
        ownerUserId: 'user-a',
        shelterId: 'shelter-a',
        expiresAt: '2026-06-05T10:15:00.000Z',
        createdAt: '2026-06-05T10:00:00.000Z',
        mediaAssetId: 'media-1',
        mediaAssetPersisted: true,
      },
    });

    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({
      url: 'https://worker.pic4paws.pt/uploads/media',
      init: {
        method: 'POST',
        headers: {
          Authorization: 'Bearer user-access-token',
          'Content-Type': 'application/json',
        },
      },
    });
    expect(JSON.parse(calls[0]?.init.body as string)).toEqual(validRequest);
    expect(calls[1]).toMatchObject({
      url: 'https://uploads.test/signed/media-1?temporary=secret',
      init: {
        method: 'PUT',
        body,
        headers: {
          'Content-Type': 'image/jpeg',
          'x-amz-meta-media-id': 'media-1',
        },
      },
    });
    expect(JSON.stringify(calls[1]?.init.headers)).not.toContain('user-access-token');
    expect(JSON.stringify(calls)).not.toContain('service-role-secret');
    expect(JSON.stringify(calls)).not.toContain('r2-secret-key');
  });

  it('stops before signed URL upload when intent creation fails', async () => {
    const calls: FetchCall[] = [];
    const client = createMediaUploadFlowClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      mediaUploadPath: '/uploads/media',
      getAccessToken: async () => 'user-access-token',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });

        return createJsonResponse(
          {
            status: 'actor_not_authorized',
            reasons: ['actor_cannot_manage_shelter'],
            debug: 'service-role-secret r2-secret-key user-access-token',
          },
          { status: 403 },
        );
      },
    });

    const result = await client.uploadMedia({
      request: validRequest,
      body: new Blob(['binary-image'], { type: 'image/jpeg' }),
    });

    expect(result).toEqual({
      ok: false,
      phase: 'intent',
      status: 'actor_not_authorized',
      reasons: ['actor_cannot_manage_shelter'],
    });
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
    expect(JSON.stringify(result)).not.toContain('user-access-token');
  });

  it('returns binary upload failures with safe partial-failure details', async () => {
    const client = createMediaUploadFlowClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      mediaUploadPath: '/uploads/media',
      getAccessToken: async () => 'user-access-token',
      fetch: async (url) => {
        if (String(url).startsWith('https://worker.pic4paws.pt')) {
          return createJsonResponse(uploadReadyBody, { status: 201 });
        }

        return createTextResponse('service-role-secret r2-secret-key user-access-token', {
          status: 403,
        });
      },
    });

    const result = await client.uploadMedia({
      request: validRequest,
      body: new Blob(['binary-image'], { type: 'image/jpeg' }),
    });

    expect(result).toEqual({
      ok: false,
      phase: 'binary_upload',
      status: 'signed_upload_failed',
      reasons: ['signed_upload_rejected'],
      responseStatus: 403,
      mediaId: 'media-1',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
    });
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
    expect(JSON.stringify(result)).not.toContain('user-access-token');
    expect(JSON.stringify(result)).not.toContain('temporary=secret');
  });
});
