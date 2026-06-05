import { describe, expect, it } from 'vitest';
import {
  buildMediaObjectKey,
  createMediaUploadContract,
  evaluateMediaUploadRequest,
  type MediaUploadRequest,
} from '@pic4paws/domain';

const publicPetImageRequest: MediaUploadRequest = {
  id: 'media-1',
  purpose: 'pet_public_image',
  requestedVisibility: 'public',
  mimeType: 'image/jpeg',
  byteSize: 1_200_000,
  ownerUserId: 'user-a',
  shelterId: 'shelter-a',
  originalFilename: 'becas no sofa.jpg',
};

describe('evaluateMediaUploadRequest', () => {
  it('allows public pet images with safe image MIME types', () => {
    expect(evaluateMediaUploadRequest(publicPetImageRequest)).toEqual({
      allowed: true,
      visibility: 'public',
      mediaKind: 'image',
      reasons: [],
    });
  });

  it('forces adoption and medical documents to private visibility', () => {
    expect(
      evaluateMediaUploadRequest({
        ...publicPetImageRequest,
        purpose: 'adoption_document',
        requestedVisibility: 'public',
        mimeType: 'application/pdf',
      }),
    ).toEqual({
      allowed: true,
      visibility: 'private',
      mediaKind: 'document',
      reasons: [],
    });

    expect(
      evaluateMediaUploadRequest({
        ...publicPetImageRequest,
        purpose: 'medical_record',
        requestedVisibility: 'public',
        mimeType: 'image/png',
      }),
    ).toEqual({
      allowed: true,
      visibility: 'private',
      mediaKind: 'image',
      reasons: [],
    });
  });

  it('rejects unsupported MIME types, invalid size and missing scope', () => {
    expect(
      evaluateMediaUploadRequest({
        ...publicPetImageRequest,
        mimeType: 'text/html',
        byteSize: 0,
        ownerUserId: null,
        shelterId: null,
      }),
    ).toEqual({
      allowed: false,
      visibility: 'public',
      mediaKind: 'unknown',
      reasons: ['unsupported_mime_type', 'invalid_byte_size', 'missing_owner_or_shelter_scope'],
    });
  });
});

describe('media object keys', () => {
  it('builds tenant-scoped object keys without raw filenames', () => {
    expect(
      buildMediaObjectKey({
        mediaId: 'media-1',
        shelterId: 'shelter-a',
        ownerUserId: 'user-a',
        visibility: 'public',
        purpose: 'pet_public_image',
        mimeType: 'image/jpeg',
      }),
    ).toBe('public/shelters/shelter-a/pet_public_image/media-1.jpg');
  });

  it('creates a complete upload contract for valid requests', () => {
    expect(
      createMediaUploadContract({
        request: publicPetImageRequest,
        now: '2026-06-04T12:30:00.000Z',
      }),
    ).toEqual({
      ok: true,
      contract: {
        mediaId: 'media-1',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
        visibility: 'public',
        mediaKind: 'image',
        mimeType: 'image/jpeg',
        byteSize: 1_200_000,
        ownerUserId: 'user-a',
        shelterId: 'shelter-a',
        createdAt: '2026-06-04T12:30:00.000Z',
      },
    });
  });
});
