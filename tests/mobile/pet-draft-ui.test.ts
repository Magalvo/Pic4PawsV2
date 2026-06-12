import { describe, expect, it } from 'vitest';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import {
  createMobilePetDraftUi,
  mobilePetDraftUiContent,
} from '../../apps/mobile/src/pet-draft';
import type {
  PetDraftClient,
  PetDraftClientDraftInput,
} from '../../packages/client/src/index';

const draftInput = {
  petId: 'pet-1',
  shelterId: 'shelter-a',
  name: 'Becas',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo, sociável e pronto para uma família.',
  mediaIds: ['media-1'] as string[],
  heroMediaId: 'media-1',
  medical: {
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    specialNeeds: false,
  },
} as const;

const notExpectedLoad: PetDraftClient['loadPetDraft'] = async () => {
  throw new Error('loadPetDraft should not be called');
};

describe('mobile pet draft UI flow', () => {
  it('exposes a PT-PT ready state for editing a pet draft', () => {
    const ui = createMobilePetDraftUi({
      draftClient: {
        createPetDraft: async () => {
          throw new Error('Create should not be called for ready state');
        },
        updatePetDraft: async () => {
          throw new Error('Update should not be called for ready state');
        },
        loadPetDraft: notExpectedLoad,
      },
    });

    expect(ui.getInitialState({ petName: 'Becas' })).toEqual({
      state: 'ready',
      title: 'Editar rascunho de Becas',
      message: 'Preenche os dados principais antes de guardar o rascunho.',
      primaryAction: 'Guardar rascunho',
      petName: 'Becas',
    });
    expect(mobilePetDraftUiContent.locale).toBe('pt-PT');
    expect(mobilePetDraftUiContent.states.map((state) => state.state)).toEqual([
      'ready',
      'saving',
      'saved',
      'failed',
    ]);
  });

  it('creates pet drafts through the injected Mobile draft client with safe payload only', async () => {
    const calls: PetDraftClientDraftInput[] = [];
    const draftClient: PetDraftClient = {
      createPetDraft: async (draft) => {
        calls.push(draft);

        return {
          ok: true,
          status: 'pet_draft_created',
          petId: draft.petId,
        };
      },
      updatePetDraft: async () => {
        throw new Error('Update should not be called for create');
      },
      loadPetDraft: notExpectedLoad,
    };
    const ui = createMobilePetDraftUi({ draftClient });

    await expect(
      ui.createDraft({
        draft: {
          ...draftInput,
          status: 'published',
          serviceRoleKey: 'service-role-secret',
        } as typeof draftInput & Record<string, unknown>,
      }),
    ).resolves.toEqual({
      state: 'saved',
      title: 'Rascunho guardado',
      message: 'O rascunho de Becas foi criado com segurança.',
      petId: 'pet-1',
      petName: 'Becas',
      operation: 'create',
    });
    expect(calls).toEqual([draftInput]);
    expect(JSON.stringify(calls[0])).not.toContain('published');
    expect(JSON.stringify(calls[0])).not.toContain('service-role-secret');
  });

  it('updates pet drafts through the injected Mobile draft client with safe payload only', async () => {
    const calls: PetDraftClientDraftInput[] = [];
    const draftClient: PetDraftClient = {
      createPetDraft: async () => {
        throw new Error('Create should not be called for update');
      },
      updatePetDraft: async (draft) => {
        calls.push(draft);

        return {
          ok: true,
          status: 'pet_draft_updated',
          petId: draft.petId,
        };
      },
      loadPetDraft: notExpectedLoad,
    };
    const ui = createMobilePetDraftUi({ draftClient });

    await expect(ui.updateDraft({ draft: draftInput })).resolves.toEqual({
      state: 'saved',
      title: 'Rascunho atualizado',
      message: 'O rascunho de Becas foi atualizado com segurança.',
      petId: 'pet-1',
      petName: 'Becas',
      operation: 'update',
    });
    expect(calls).toEqual([draftInput]);
  });

  it('maps unauthenticated failures to safe Mobile product state', async () => {
    const ui = createMobilePetDraftUi({
      draftClient: {
        createPetDraft: async () => ({
          ok: false,
          status: 'unauthenticated',
          reasons: ['missing_access_token', 'bearer user-token-marker'],
        }),
        updatePetDraft: async () => {
          throw new Error('Update should not be called');
        },
        loadPetDraft: notExpectedLoad,
      },
    });

    const result = await ui.createDraft({ draft: draftInput });

    expect(result).toEqual({
      state: 'failed',
      title: 'Inicia sessão para guardar',
      message: 'Precisas de uma sessão ativa para guardar este rascunho.',
      petId: 'pet-1',
      petName: 'Becas',
      operation: 'create',
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
      canRetry: true,
    });
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('maps invalid draft failures without leaking provider credentials into UI state', async () => {
    const ui = createMobilePetDraftUi({
      draftClient: {
        createPetDraft: async () => ({
          ok: false,
          status: 'invalid_pet_draft',
          reasons: [
            'media_asset_missing',
            'service-role-secret',
            'r2-secret-key',
            'bearer user-token-marker',
          ],
        }),
        updatePetDraft: async () => {
          throw new Error('Update should not be called');
        },
        loadPetDraft: notExpectedLoad,
      },
    });

    const result = await ui.createDraft({ draft: draftInput });

    expect(result).toEqual({
      state: 'failed',
      title: 'Rascunho incompleto',
      message: 'Revê os campos obrigatórios e confirma a imagem pública antes de guardar.',
      petId: 'pet-1',
      petName: 'Becas',
      operation: 'create',
      status: 'invalid_pet_draft',
      reasons: ['media_asset_missing'],
      canRetry: true,
    });
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('maps authorization and worker failures to distinct safe Mobile copy', async () => {
    const makeUi = (result: Awaited<ReturnType<PetDraftClient['createPetDraft']>>) =>
      createMobilePetDraftUi({
        draftClient: {
          createPetDraft: async () => result,
          updatePetDraft: async () => result,
          loadPetDraft: notExpectedLoad,
        },
      });

    await expect(
      makeUi({
        ok: false,
        status: 'actor_not_authorized',
        reasons: ['actor_not_authorized'],
      }).updateDraft({ draft: draftInput }),
    ).resolves.toMatchObject({
      state: 'failed',
      title: 'Sem permissão para guardar',
      message: 'A tua conta não tem permissão para guardar este rascunho.',
      operation: 'update',
      status: 'actor_not_authorized',
      reasons: ['actor_not_authorized'],
    });

    await expect(
      makeUi({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['worker_request_failed'],
      }).createDraft({ draft: draftInput }),
    ).resolves.toMatchObject({
      state: 'failed',
      title: 'Não foi possível guardar',
      message: 'O serviço de rascunhos não respondeu como esperado. Tenta novamente.',
      operation: 'create',
      status: 'worker_request_failed',
      reasons: ['worker_request_failed'],
    });
  });

  it('surfaces the pet draft product flow on the Mobile foundation content', () => {
    expect(mobileFoundationContent.petDraft.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.petDraft.title).toBe('Rascunho do perfil');
    expect(JSON.stringify(mobileFoundationContent.petDraft)).not.toContain('service-role');
    expect(JSON.stringify(mobileFoundationContent.petDraft)).not.toContain('r2-secret');
  });
});
