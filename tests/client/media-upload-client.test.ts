import { describe, expect, it } from 'vitest';
import { createMediaUploadClient } from '../../packages/client/src/index';

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

describe('media upload client contract', () => {
  it('requests Worker upload intents with a user bearer token and sanitized payload', async () => {
    const calls: FetchCall[] = [];
    const client = createMediaUploadClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      mediaUploadPath: '/uploads/media',
      getAccessToken: async () => 'user-access-token',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });

        return createJsonResponse(
          {
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
            signedUrl: 'https://uploads.test/signed/media-1',
            expiresAt: '2026-06-05T10:15:00.000Z',
            dryRunOnly: false,
            createdAt: '2026-06-05T10:00:00.000Z',
            mediaAssetId: 'media-1',
            mediaAssetPersisted: true,
          },
          { status: 201 },
        );
      },
    });

    await expect(
      client.requestMediaUploadIntent({
        ...validRequest,
        serviceRoleKey: 'service-role-secret',
        r2SecretAccessKey: 'r2-secret-key',
        signedUrl: 'https://client-must-not-send.test',
      } as typeof validRequest & Record<string, unknown>),
    ).resolves.toEqual({
      ok: true,
      intent: {
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
        signedUrl: 'https://uploads.test/signed/media-1',
        expiresAt: '2026-06-05T10:15:00.000Z',
        dryRunOnly: false,
        createdAt: '2026-06-05T10:00:00.000Z',
        mediaAssetId: 'media-1',
        mediaAssetPersisted: true,
      },
    });

    expect(calls).toHaveLength(1);
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
    expect(calls[0]?.init.body).not.toContain('service-role-secret');
    expect(calls[0]?.init.body).not.toContain('r2-secret-key');
    expect(calls[0]?.init.body).not.toContain('client-must-not-send');
  });

  it('rejects missing user tokens before making a network request', async () => {
    let fetchCalled = false;
    const client = createMediaUploadClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      mediaUploadPath: '/uploads/media',
      getAccessToken: async () => null,
      fetch: async () => {
        fetchCalled = true;

        return createJsonResponse({});
      },
    });

    await expect(client.requestMediaUploadIntent(validRequest)).resolves.toEqual({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    expect(fetchCalled).toBe(false);
  });

  it('normalizes Worker failure responses without leaking bearer tokens or secrets', async () => {
    const client = createMediaUploadClient({
      workerBaseUrl: 'https://worker.pic4paws.pt/',
      mediaUploadPath: '/uploads/media',
      getAccessToken: async () => 'user-access-token',
      fetch: async () =>
        createJsonResponse(
          {
            status: 'media_asset_persistence_failed',
            reasons: ['media_asset_repository_unavailable'],
            debug: 'service-role-secret r2-secret-key user-access-token',
          },
          { status: 502 },
        ),
    });

    const result = await client.requestMediaUploadIntent(validRequest);

    expect(result).toEqual({
      ok: false,
      status: 'media_asset_persistence_failed',
      reasons: ['media_asset_repository_unavailable'],
    });
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
    expect(JSON.stringify(result)).not.toContain('user-access-token');
  });
});
