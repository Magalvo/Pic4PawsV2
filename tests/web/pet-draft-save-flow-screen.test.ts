import { describe, it, expect } from 'vitest';
import { createWebPetDraftSaveFlowUi } from '../../apps/web/src/pet-draft-save-flow';
import type { PetDraftSaveFlowClient, PetDraftSaveFlowInput } from '@pic4paws/client';

type SaveFlowMock = Pick<PetDraftSaveFlowClient, 'savePetDraft'>;

const sampleDraft: PetDraftSaveFlowInput = {
  operation: 'update',
  petId: 'pet-001',
  shelterId: 'shelter-001',
  name: 'Bolinha',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Um cão muito simpático.',
  existingMediaIds: [],
  heroMediaId: null,
  medical: { vaccinated: true, sterilized: false, microchipped: true, specialNeeds: false },
};

const makeClient = (ok: boolean): SaveFlowMock => ({
  savePetDraft: async () =>
    ok
      ? {
          ok: true as const,
          status: 'pet_draft_saved' as const,
          petId: 'pet-001',
          operation: 'update' as const,
          uploadedMedia: [],
        }
      : {
          ok: false as const,
          phase: 'draft_save' as const,
          status: 'unauthenticated' as const,
          reasons: [],
        },
});

describe('pet draft save flow page — boundary contract', () => {
  it('produces saved state on success', async () => {
    const ui = createWebPetDraftSaveFlowUi({ saveFlowClient: makeClient(true) });
    const result = await ui.saveDraft({ context: { petName: 'Bolinha' }, draft: sampleDraft });
    expect(result.state).toBe('saved');
    if (result.state === 'saved') {
      expect(result.petId).toBe('pet-001');
      expect(result.operation).toBe('update');
      expect(result.uploadedMediaCount).toBe(0);
    }
  });

  it('produces failed state on draft_save error', async () => {
    const ui = createWebPetDraftSaveFlowUi({ saveFlowClient: makeClient(false) });
    const result = await ui.saveDraft({ context: { petName: 'Bolinha' }, draft: sampleDraft });
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.phase).toBe('draft_save');
    }
  });

  it('produces failed state on media_upload error', async () => {
    const mediaFailClient: SaveFlowMock = {
      savePetDraft: async () => ({
        ok: false as const,
        phase: 'media_upload' as const,
        subPhase: 'upload_intent' as const,
        status: 'unauthenticated' as const,
        reasons: [],
      }),
    };
    const ui = createWebPetDraftSaveFlowUi({ saveFlowClient: mediaFailClient });
    const result = await ui.saveDraft({ context: { petName: 'Bolinha' }, draft: sampleDraft });
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.phase).toBe('media_upload');
    }
  });

  it('getInitialState returns ready with petName', () => {
    const ui = createWebPetDraftSaveFlowUi({ saveFlowClient: makeClient(true) });
    const state = ui.getInitialState({ petName: 'Bolinha' });
    expect(state.state).toBe('ready');
    expect(state.primaryAction).toBeDefined();
    expect(state.petName).toBe('Bolinha');
  });

  it('failed state does not expose bearer or service-role in reasons', async () => {
    const poisonClient: SaveFlowMock = {
      savePetDraft: async () => ({
        ok: false as const,
        phase: 'draft_save' as const,
        status: 'unauthenticated' as const,
        reasons: ['Bearer eyJ...', 'service-role key leaked'],
      }),
    };
    const ui = createWebPetDraftSaveFlowUi({ saveFlowClient: poisonClient });
    const result = await ui.saveDraft({ context: { petName: 'Bolinha' }, draft: sampleDraft });
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
