import { describe, expect, it } from 'vitest';
import { createWebPetDraftUi } from '../../apps/web/src/pet-draft';
import type { PetDraftClient, LoadPetDraftClientResult } from '../../packages/client/src/index';

const notExpectedSave: PetDraftClient['createPetDraft'] = async () => {
  throw new Error('save should not be called');
};

const draftData = {
  petId: 'pet-1',
  shelterId: 'shelter-a',
  status: 'draft' as const,
  name: 'Becas',
  species: 'dog' as const,
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo e sociável.',
  mediaIds: ['media-1'],
  heroMediaId: 'media-1',
  medical: {
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    specialNeeds: false,
  },
  publishedAt: null,
  createdAt: '2026-06-10T12:00:00.000Z',
  updatedAt: '2026-06-10T12:00:00.000Z',
};

const makeUi = (loadResult: LoadPetDraftClientResult) =>
  createWebPetDraftUi({
    draftClient: {
      createPetDraft: notExpectedSave,
      updatePetDraft: notExpectedSave,
      loadPetDraft: async () => loadResult,
    },
  });

describe('web pet draft load UI boundary', () => {
  it('returns loaded state with full draft on success', async () => {
    const ui = makeUi({ ok: true, status: 'pet_draft_loaded', draft: draftData });

    const result = await ui.loadDraft('pet-1');

    expect(result).toEqual({ state: 'loaded', draft: draftData });
  });

  it('returns not_found state with PT-PT copy when draft does not exist', async () => {
    const ui = makeUi({ ok: false, status: 'pet_draft_not_found', reasons: [] });

    const result = await ui.loadDraft('pet-unknown');

    expect(result).toEqual({
      state: 'not_found',
      title: 'Rascunho não encontrado',
      message: 'Este rascunho não existe ou foi eliminado.',
    });
  });

  it('returns forbidden state with PT-PT copy when actor has no access', async () => {
    const ui = makeUi({ ok: false, status: 'forbidden', reasons: [] });

    const result = await ui.loadDraft('pet-1');

    expect(result).toEqual({
      state: 'forbidden',
      title: 'Sem permissão para ver',
      message: 'A tua conta não tem permissão para aceder a este rascunho.',
    });
  });

  it('returns failed state with PT-PT copy on unauthenticated', async () => {
    const ui = makeUi({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });

    const result = await ui.loadDraft('pet-1');

    expect(result).toMatchObject({
      state: 'failed',
      status: 'unauthenticated',
      title: 'Inicia sessão para continuar',
      message: 'Precisas de uma sessão ativa para carregar este rascunho.',
      reasons: ['missing_access_token'],
    });
  });

  it('returns failed state with PT-PT copy on worker_request_failed', async () => {
    const ui = makeUi({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['worker_request_failed'],
    });

    const result = await ui.loadDraft('pet-1');

    expect(result).toMatchObject({
      state: 'failed',
      status: 'worker_request_failed',
      title: 'Não foi possível carregar',
      message: 'O serviço de rascunhos não respondeu como esperado. Tenta novamente.',
    });
  });

  it('sanitizes bearer and service-role markers from failed state reasons', async () => {
    const ui = makeUi({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['safe_reason', 'service-role-secret', 'bearer user-token-marker'],
    });

    const result = await ui.loadDraft('pet-1');

    expect(result).toMatchObject({ state: 'failed', reasons: ['safe_reason'] });
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('does not leak service-role or bearer markers in any failed state', async () => {
    const ui = makeUi({
      ok: false,
      status: 'unauthenticated',
      reasons: ['service-role secret', 'bearer token-value'],
    });

    const result = await ui.loadDraft('pet-1');

    expect(JSON.stringify(result)).not.toContain('service-role');
    expect(JSON.stringify(result)).not.toContain('bearer ');
  });
});
