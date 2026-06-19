import { describe, it, expect } from 'vitest';
import { createMobilePetDraftUi } from '../../apps/mobile/src/pet-draft';
import type { PetDraftClient, PetDraftClientDraftInput, LoadPetDraftClientDraft } from '@pic4paws/client';

type DraftMock = Pick<PetDraftClient, 'createPetDraft' | 'updatePetDraft' | 'loadPetDraft'>;

const draftInput: PetDraftClientDraftInput = {
  petId: 'pet-001',
  shelterId: 'shelter-001',
  name: 'Bolinha',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Um cão simpático',
  mediaIds: [],
  heroMediaId: null,
  medical: { vaccinated: true, sterilized: false, microchipped: true, specialNeeds: false },
};

const loadedDraft: LoadPetDraftClientDraft = {
  petId: 'pet-001',
  shelterId: 'shelter-001',
  status: 'draft',
  name: 'Bolinha',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Um cão simpático',
  mediaIds: [],
  heroMediaId: null,
  medical: { vaccinated: true, sterilized: false, microchipped: true, specialNeeds: false },
  publishedAt: null,
  createdAt: '2026-06-19T00:00:00.000Z',
  updatedAt: '2026-06-19T00:00:00.000Z',
};

const makeClient = (opts: {
  createOk?: boolean;
  updateOk?: boolean;
  loadResult?: 'loaded' | 'not_found' | 'forbidden' | 'failed';
} = {}): DraftMock => ({
  createPetDraft: async () =>
    opts.createOk
      ? { ok: true as const, status: 'pet_draft_created' as const, petId: 'pet-001' }
      : { ok: false as const, status: 'unauthenticated' as const, reasons: [] },
  updatePetDraft: async () =>
    opts.updateOk
      ? { ok: true as const, status: 'pet_draft_updated' as const, petId: 'pet-001' }
      : { ok: false as const, status: 'unauthenticated' as const, reasons: [] },
  loadPetDraft: async () => {
    if (opts.loadResult === 'loaded') return { ok: true as const, status: 'pet_draft_loaded' as const, draft: loadedDraft };
    if (opts.loadResult === 'not_found') return { ok: false as const, status: 'pet_draft_not_found' as const, reasons: [] };
    if (opts.loadResult === 'forbidden') return { ok: false as const, status: 'forbidden' as const, reasons: [] };
    return { ok: false as const, status: 'unauthenticated' as const, reasons: [] };
  },
});

describe('pet draft screen — boundary contract', () => {
  it('createDraft produces saved state on success', async () => {
    const ui = createMobilePetDraftUi({ draftClient: makeClient({ createOk: true }) });
    const result = await ui.createDraft({ draft: draftInput });
    expect(result.state).toBe('saved');
    if (result.state === 'saved') {
      expect(result.operation).toBe('create');
      expect(result.petId).toBe('pet-001');
      expect(result.petName).toBe('Bolinha');
    }
  });

  it('createDraft produces failed state on error', async () => {
    const ui = createMobilePetDraftUi({ draftClient: makeClient({ createOk: false }) });
    const result = await ui.createDraft({ draft: draftInput });
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.operation).toBe('create');
  });

  it('updateDraft produces saved state on success', async () => {
    const ui = createMobilePetDraftUi({ draftClient: makeClient({ updateOk: true }) });
    const result = await ui.updateDraft({ draft: draftInput });
    expect(result.state).toBe('saved');
    if (result.state === 'saved') expect(result.operation).toBe('update');
  });

  it('updateDraft produces failed state on error', async () => {
    const ui = createMobilePetDraftUi({ draftClient: makeClient({ updateOk: false }) });
    const result = await ui.updateDraft({ draft: draftInput });
    expect(result.state).toBe('failed');
  });

  it('loadDraft produces loaded state with draft data', async () => {
    const ui = createMobilePetDraftUi({ draftClient: makeClient({ loadResult: 'loaded' }) });
    const result = await ui.loadDraft('pet-001');
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') {
      expect(result.draft.petId).toBe('pet-001');
      expect(result.draft.name).toBe('Bolinha');
    }
  });

  it('loadDraft produces not_found state', async () => {
    const ui = createMobilePetDraftUi({ draftClient: makeClient({ loadResult: 'not_found' }) });
    const result = await ui.loadDraft('pet-missing');
    expect(result.state).toBe('not_found');
  });

  it('loadDraft produces forbidden state', async () => {
    const ui = createMobilePetDraftUi({ draftClient: makeClient({ loadResult: 'forbidden' }) });
    const result = await ui.loadDraft('pet-001');
    expect(result.state).toBe('forbidden');
  });

  it('getInitialState returns ready with petName', () => {
    const ui = createMobilePetDraftUi({ draftClient: makeClient() });
    const state = ui.getInitialState({ petName: 'Bolinha' });
    expect(state.state).toBe('ready');
    expect(state.primaryAction).toBe('Guardar rascunho');
    expect(state.petName).toBe('Bolinha');
    expect(state.title).toContain('Bolinha');
  });

  it('getInitialState falls back to generic name when petName is absent', () => {
    const ui = createMobilePetDraftUi({ draftClient: makeClient() });
    const state = ui.getInitialState({});
    expect(state.petName).toBe('este animal');
  });

  it('failed state does not expose bearer or service-role in reasons', async () => {
    const poisonClient: DraftMock = {
      createPetDraft: async () => ({
        ok: false as const,
        status: 'unauthenticated' as const,
        reasons: ['Bearer eyJ...', 'service-role key leaked'],
      }),
      updatePetDraft: async () => ({ ok: false as const, status: 'unauthenticated' as const, reasons: [] }),
      loadPetDraft: async () => ({ ok: false as const, status: 'unauthenticated' as const, reasons: [] }),
    };
    const ui = createMobilePetDraftUi({ draftClient: poisonClient });
    const result = await ui.createDraft({ draft: draftInput });
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
