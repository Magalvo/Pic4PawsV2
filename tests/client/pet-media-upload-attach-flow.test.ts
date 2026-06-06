import { describe, expect, it } from 'vitest';
import {
  createPetMediaUploadAttachFlowClient,
  type MediaUploadFlowClient,
  type PetMediaAttachClient,
  type PetMediaUploadAttachFlowFileInput,
} from '../../packages/client/src/index';

const file: PetMediaUploadAttachFlowFileInput = {
  name: 'becas.jpg',
  type: 'image/jpeg',
  size: 1_200_000,
  body: new Blob(['binary-image'], { type: 'image/jpeg' }),
};

const input = {
  petId: 'pet-1',
  shelterId: 'shelter-a',
  ownerUserId: 'member-user',
  file,
} as const;

describe('pet media upload attach flow client', () => {
  it('uploads a public pet image and then attaches persisted media to the pet draft', async () => {
    const calls: string[] = [];
    const uploadClient: MediaUploadFlowClient = {
      uploadMedia: async ({ request, body }) => {
        calls.push('upload');
        expect(request).toEqual({
          mediaId: 'media-generated-1',
          purpose: 'pet_public_image',
          requestedVisibility: 'public',
          mimeType: 'image/jpeg',
          byteSize: 1_200_000,
          ownerUserId: 'member-user',
          shelterId: 'shelter-a',
          originalFilename: 'becas.jpg',
        });
        expect(body).toBe(file.body);

        return {
          ok: true,
          status: 'uploaded',
          mediaId: 'media-generated-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-generated-1.jpg',
          responseStatus: 200,
          intent: {
            mediaId: 'media-generated-1',
            mediaAssetId: 'media-generated-1',
            mediaAssetPersisted: true,
            objectKey: 'public/shelters/shelter-a/pet_public_image/media-generated-1.jpg',
            contentType: 'image/jpeg',
            byteSize: 1_200_000,
            visibility: 'public',
            mediaKind: 'image',
            ownerUserId: 'member-user',
            shelterId: 'shelter-a',
            createdAt: '2026-06-06T10:00:00.000Z',
            expiresAt: '2026-06-06T10:15:00.000Z',
          },
        };
      },
    };
    const attachClient: PetMediaAttachClient = {
      attachPetMedia: async ({ petId, mediaId }) => {
        calls.push('attach');
        expect({ petId, mediaId }).toEqual({
          petId: 'pet-1',
          mediaId: 'media-generated-1',
        });

        return {
          ok: true,
          status: 'pet_media_attached',
          petId: 'pet-1',
          mediaId: 'media-generated-1',
          mediaIds: ['media-generated-1'],
          heroMediaId: 'media-generated-1',
        };
      },
    };
    const flow = createPetMediaUploadAttachFlowClient({
      uploadClient,
      attachClient,
      generateMediaId: () => 'media-generated-1',
    });

    await expect(flow.uploadAndAttachPetMedia(input)).resolves.toEqual({
      ok: true,
      status: 'pet_media_uploaded_and_attached',
      petId: 'pet-1',
      mediaId: 'media-generated-1',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-generated-1.jpg',
      mediaIds: ['media-generated-1'],
      heroMediaId: 'media-generated-1',
      upload: {
        mediaId: 'media-generated-1',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-generated-1.jpg',
        responseStatus: 200,
      },
      attach: {
        mediaId: 'media-generated-1',
        mediaIds: ['media-generated-1'],
        heroMediaId: 'media-generated-1',
      },
    });
    expect(calls).toEqual(['upload', 'attach']);
  });

  it('stops before attach when upload intent creation fails', async () => {
    let attachCalled = false;
    const flow = createPetMediaUploadAttachFlowClient({
      uploadClient: {
        uploadMedia: async () => ({
          ok: false,
          phase: 'intent',
          status: 'actor_not_authorized',
          reasons: ['actor_cannot_manage_shelter', 'service-role-secret'],
        }),
      },
      attachClient: {
        attachPetMedia: async () => {
          attachCalled = true;
          throw new Error('Attach must not run after upload intent failure');
        },
      },
      generateMediaId: () => 'media-generated-1',
    });

    const result = await flow.uploadAndAttachPetMedia(input);

    expect(result).toEqual({
      ok: false,
      phase: 'upload_intent',
      status: 'actor_not_authorized',
      reasons: ['actor_cannot_manage_shelter'],
    });
    expect(attachCalled).toBe(false);
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
  });

  it('stops before attach when signed binary upload fails', async () => {
    let attachCalled = false;
    const flow = createPetMediaUploadAttachFlowClient({
      uploadClient: {
        uploadMedia: async () => ({
          ok: false,
          phase: 'binary_upload',
          status: 'signed_upload_failed',
          reasons: ['signed_upload_rejected', 'temporary=opaque', 'r2-secret-key'],
          responseStatus: 403,
          mediaId: 'media-generated-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-generated-1.jpg',
        }),
      },
      attachClient: {
        attachPetMedia: async () => {
          attachCalled = true;
          throw new Error('Attach must not run after binary upload failure');
        },
      },
      generateMediaId: () => 'media-generated-1',
    });

    const result = await flow.uploadAndAttachPetMedia(input);

    expect(result).toEqual({
      ok: false,
      phase: 'binary_upload',
      status: 'signed_upload_failed',
      reasons: ['signed_upload_rejected'],
      responseStatus: 403,
      mediaId: 'media-generated-1',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-generated-1.jpg',
    });
    expect(attachCalled).toBe(false);
    expect(JSON.stringify(result)).not.toContain('temporary=opaque');
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
  });

  it('returns attach failures as a distinct safe phase after upload succeeds', async () => {
    const flow = createPetMediaUploadAttachFlowClient({
      uploadClient: {
        uploadMedia: async () => ({
          ok: true,
          status: 'uploaded',
          mediaId: 'media-generated-1',
          objectKey: 'public/shelters/shelter-a/pet_public_image/media-generated-1.jpg',
          responseStatus: 200,
          intent: {
            mediaId: 'media-generated-1',
            objectKey: 'public/shelters/shelter-a/pet_public_image/media-generated-1.jpg',
            contentType: 'image/jpeg',
            byteSize: 1_200_000,
            visibility: 'public',
            mediaKind: 'image',
            ownerUserId: 'member-user',
            shelterId: 'shelter-a',
            createdAt: '2026-06-06T10:00:00.000Z',
          },
        }),
      },
      attachClient: {
        attachPetMedia: async () => ({
          ok: false,
          status: 'pet_media_attach_rejected',
          reasons: ['media_not_public_image', 'signedUrl=https://uploads.test', 'user-access-token'],
        }),
      },
      generateMediaId: () => 'media-generated-1',
    });

    const result = await flow.uploadAndAttachPetMedia(input);

    expect(result).toEqual({
      ok: false,
      phase: 'attach',
      status: 'pet_media_attach_rejected',
      reasons: ['media_not_public_image'],
      mediaId: 'media-generated-1',
      objectKey: 'public/shelters/shelter-a/pet_public_image/media-generated-1.jpg',
    });
    expect(JSON.stringify(result)).not.toContain('signedUrl');
    expect(JSON.stringify(result)).not.toContain('user-access-token');
  });
});
