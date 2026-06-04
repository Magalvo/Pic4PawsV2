import { describe, expect, it } from 'vitest';
import {
  createPetDraftInsertContract,
  createPetDraftUpdateContract,
  initialDatabaseMigration,
  renderMigrationArtifact,
} from '../../packages/database/src/index';
import type { PetDraftRecord, PetMediaAssetRecord } from '@pic4paws/domain';

const incompleteDraft: PetDraftRecord = {
  id: 'pet-1',
  shelterId: 'shelter-a',
  status: 'draft',
  name: null,
  species: null,
  locationLabel: null,
  shortDescription: null,
  mediaIds: [],
  heroMediaId: null,
  medical: {},
  publishedAt: null,
};

const publicImage: PetMediaAssetRecord = {
  id: 'media-1',
  shelterId: 'shelter-a',
  ownerUserId: 'member-user',
  visibility: 'public',
  mediaKind: 'image',
  r2ObjectKey: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
  deletedAt: null,
};

describe('pet draft persistence contract', () => {
  it('creates insert contracts for incomplete drafts with nullable listing fields', () => {
    expect(
      createPetDraftInsertContract({
        pet: incompleteDraft,
        now: '2026-06-04T13:00:00.000Z',
      }),
    ).toEqual({
      ok: true,
      insert: {
        id: 'pet-1',
        shelterId: 'shelter-a',
        status: 'draft',
        name: null,
        species: null,
        locationLabel: null,
        shortDescription: null,
        mediaIds: [],
        heroMediaId: null,
        medical: {},
        sponsorship: {
          enabled: false,
          monthlyGoalCents: null,
          publicNotes: null,
        },
        publishedAt: null,
        createdAt: '2026-06-04T13:00:00.000Z',
        updatedAt: '2026-06-04T13:00:00.000Z',
        deletedAt: null,
      },
    });
  });

  it('creates update contracts when attached media resolves to public images from the same shelter', () => {
    const pet: PetDraftRecord = {
      ...incompleteDraft,
      name: 'Becas',
      mediaIds: ['media-1'],
      heroMediaId: 'media-1',
    };

    expect(
      createPetDraftUpdateContract({
        pet,
        mediaAssets: [publicImage],
        now: '2026-06-04T13:05:00.000Z',
      }),
    ).toEqual({
      ok: true,
      update: {
        status: 'draft',
        name: 'Becas',
        species: null,
        locationLabel: null,
        shortDescription: null,
        mediaIds: ['media-1'],
        heroMediaId: 'media-1',
        medical: {},
        sponsorship: {
          enabled: false,
          monthlyGoalCents: null,
          publicNotes: null,
        },
        publishedAt: null,
        updatedAt: '2026-06-04T13:05:00.000Z',
      },
    });
  });

  it('rejects non-draft pets, duplicate media IDs and invalid hero media', () => {
    expect(
      createPetDraftUpdateContract({
        pet: {
          ...incompleteDraft,
          status: 'published',
          mediaIds: ['media-1', 'media-1'],
          heroMediaId: 'media-2',
        },
        mediaAssets: [publicImage],
        now: '2026-06-04T13:05:00.000Z',
      }),
    ).toEqual({
      ok: false,
      reasons: ['pet_not_draft', 'duplicate_media_ids', 'hero_media_not_attached'],
    });
  });

  it('rejects media IDs that do not resolve to same-shelter public image assets', () => {
    expect(
      createPetDraftUpdateContract({
        pet: {
          ...incompleteDraft,
          mediaIds: ['media-private', 'media-deleted', 'media-other-shelter', 'media-missing'],
          heroMediaId: null,
        },
        mediaAssets: [
          {
            ...publicImage,
            id: 'media-private',
            visibility: 'private',
          },
          {
            ...publicImage,
            id: 'media-deleted',
            deletedAt: '2026-06-04T12:00:00.000Z',
          },
          {
            ...publicImage,
            id: 'media-other-shelter',
            shelterId: 'shelter-b',
          },
        ],
        now: '2026-06-04T13:05:00.000Z',
      }),
    ).toEqual({
      ok: false,
      reasons: [
        'media_not_public_image',
        'media_deleted',
        'media_shelter_mismatch',
        'media_asset_missing',
      ],
    });
  });

  it('keeps initial pet draft columns nullable in SQL artifacts', () => {
    const sql = renderMigrationArtifact(initialDatabaseMigration);
    const petsTableSql = sql.slice(
      sql.indexOf('create table public.pets'),
      sql.indexOf('create table public.adoption_applications'),
    );

    expect(petsTableSql).toContain('name text,');
    expect(petsTableSql).toContain('species public.pet_species,');
    expect(petsTableSql).toContain('location_label text,');
    expect(petsTableSql).toContain('short_description text,');
    expect(petsTableSql).not.toContain('name text not null,');
    expect(petsTableSql).not.toContain('species public.pet_species not null,');
    expect(petsTableSql).not.toContain('location_label text not null,');
    expect(petsTableSql).not.toContain('short_description text not null,');
  });
});
