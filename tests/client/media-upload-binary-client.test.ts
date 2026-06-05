import { describe, expect, it } from 'vitest';
import {
  createMediaUploadBinaryClient,
  type MediaUploadClientIntent,
} from '../../packages/client/src/index';

type FetchCall = {
  url: string;
  init: RequestInit;
};

const createTextResponse = (body: string, init: ResponseInit = {}) => new Response(body, init);

const uploadReadyIntent: MediaUploadClientIntent = {
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
};

describe('media upload binary client contract', () => {
  it('uploads bytes to the signed URL without bearer tokens or provider credentials', async () => {
    const calls: FetchCall[] = [];
    const body = new Blob(['binary-image'], { type: 'image/jpeg' });
    const client = createMediaUploadBinaryClient({
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });

        return createTextResponse('', { status: 200 });
      },
    });

    await expect(
      client.uploadMediaBinary({
        intent: {
          ...uploadReadyIntent,
          uploadHeaders: {
            'x-amz-meta-media-id': 'media-1',
            Authorization: 'Bearer user-access-token',
            'x-r2-secret-access-key': 'r2-secret-key',
          },
        },
        body,
        contentType: 'image/jpeg',
        byteSize: 1_200_000,
      }),
    ).resolves.toEqual({
      ok: true,
      status: 'uploaded',
      mediaId: 'media-1',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
      responseStatus: 200,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: 'https://uploads.test/signed/media-1?temporary=secret',
      init: {
        method: 'PUT',
        body,
      },
    });
    expect(calls[0]?.init.headers).toEqual({
      'Content-Type': 'image/jpeg',
      'x-amz-meta-media-id': 'media-1',
    });
    expect(JSON.stringify(calls[0]?.init.headers)).not.toContain('user-access-token');
    expect(JSON.stringify(calls[0]?.init.headers)).not.toContain('r2-secret-key');
  });

  it('rejects non-ready intents before making a network request', async () => {
    let fetchCalled = false;
    const client = createMediaUploadBinaryClient({
      fetch: async () => {
        fetchCalled = true;

        return createTextResponse('', { status: 200 });
      },
    });

    await expect(
      client.uploadMediaBinary({
        intent: {
          ...uploadReadyIntent,
          status: 'upload_signer_not_configured',
          signedUrl: null,
          dryRunOnly: true,
        },
        body: new Blob(['binary-image'], { type: 'image/jpeg' }),
        contentType: 'image/jpeg',
        byteSize: 1_200_000,
      }),
    ).resolves.toEqual({
      ok: false,
      status: 'upload_intent_not_ready',
      reasons: ['upload_intent_not_ready'],
    });
    expect(fetchCalled).toBe(false);
  });

  it('rejects content mismatches before making a network request', async () => {
    let fetchCalled = false;
    const client = createMediaUploadBinaryClient({
      fetch: async () => {
        fetchCalled = true;

        return createTextResponse('', { status: 200 });
      },
    });

    await expect(
      client.uploadMediaBinary({
        intent: uploadReadyIntent,
        body: new Blob(['binary-image'], { type: 'image/png' }),
        contentType: 'image/png',
        byteSize: 1_200_000,
      }),
    ).resolves.toEqual({
      ok: false,
      status: 'upload_content_mismatch',
      reasons: ['content_type_mismatch'],
    });

    await expect(
      client.uploadMediaBinary({
        intent: uploadReadyIntent,
        body: new Blob(['binary-image'], { type: 'image/jpeg' }),
        contentType: 'image/jpeg',
        byteSize: 42,
      }),
    ).resolves.toEqual({
      ok: false,
      status: 'upload_content_mismatch',
      reasons: ['byte_size_mismatch'],
    });

    expect(fetchCalled).toBe(false);
  });

  it('normalizes signed upload failures without leaking provider debug details', async () => {
    const client = createMediaUploadBinaryClient({
      fetch: async () =>
        createTextResponse('service-role-secret r2-secret-key user-access-token', {
          status: 403,
        }),
    });

    const result = await client.uploadMediaBinary({
      intent: uploadReadyIntent,
      body: new Blob(['binary-image'], { type: 'image/jpeg' }),
      contentType: 'image/jpeg',
      byteSize: 1_200_000,
    });

    expect(result).toEqual({
      ok: false,
      status: 'signed_upload_failed',
      reasons: ['signed_upload_rejected'],
      responseStatus: 403,
    });
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
    expect(JSON.stringify(result)).not.toContain('user-access-token');
  });
});
