import { describe, expect, it } from 'vitest';
import {
  createMobilePetDraftSaveFlowUi,
  mobilePetDraftSaveFlowUiContent,
} from '../../apps/mobile/src/pet-draft-save-flow';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  PetDraftSaveFlowClient,
  PetDraftSaveFlowInput,
} from '../../packages/client/src/index';

const baseDraft: PetDraftSaveFlowInput = {
  operation: 'create',
  petId: 'pet-1',
  shelterId: 'shelter-a',
  ownerUserId: 'user-1',
  name: 'Becas',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo e sociável.',
  existingMediaIds: ['media-existing-1'],
  heroMediaId: 'media-existing-1',
  medical: { vaccinated: true, sterilized: false, microchipped: true, specialNeeds: false },
};

const makeSaveClient = (
  result: Awaited<ReturnType<PetDraftSaveFlowClient['savePetDraft']>>,
): Pick<PetDraftSaveFlowClient, 'savePetDraft'> => ({
  savePetDraft: async () => result,
});

describe('mobile pet draft save flow UI', () => {
  it('exposes a PT-PT ready state for saving a pet draft', () => {
    const ui = createMobilePetDraftSaveFlowUi({
      saveFlowClient: { savePetDraft: async () => { throw new Error('should not be called'); } },
    });

    expect(ui.getInitialState({ petName: 'Becas' })).toEqual({
      state: 'ready',
      title: 'Editar rascunho de Becas',
      message: 'Preenche os dados e adiciona imagens antes de guardar.',
      primaryAction: 'Guardar rascunho',
      petName: 'Becas',
    });

    expect(ui.getInitialState({})).toMatchObject({
      state: 'ready',
      petName: 'este animal',
    });

    expect(mobilePetDraftSaveFlowUiContent.locale).toBe('pt-PT');
    expect(mobilePetDraftSaveFlowUiContent.status).toBe('product-flow-ready');
    expect(mobilePetDraftSaveFlowUiContent.states.map((s) => s.state)).toEqual([
      'ready',
      'saving',
      'saved',
      'failed',
    ]);
  });

  it('returns a saved view model on create success with no new files', async () => {
    const ui = createMobilePetDraftSaveFlowUi({
      saveFlowClient: makeSaveClient({
        ok: true,
        status: 'pet_draft_saved',
        petId: 'pet-1',
        operation: 'create',
        uploadedMedia: [],
      }),
    });

    await expect(
      ui.saveDraft({ context: { petName: 'Becas' }, draft: baseDraft }),
    ).resolves.toEqual({
      state: 'saved',
      title: 'Rascunho guardado',
      message: 'O rascunho de Becas foi criado com segurança.',
      petId: 'pet-1',
      petName: 'Becas',
      operation: 'create',
      uploadedMediaCount: 0,
    });
  });

  it('returns a saved view model on update success with uploaded media', async () => {
    const ui = createMobilePetDraftSaveFlowUi({
      saveFlowClient: makeSaveClient({
        ok: true,
        status: 'pet_draft_saved',
        petId: 'pet-1',
        operation: 'update',
        uploadedMedia: [
          {
            mediaId: 'media-new-1',
            objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
            mediaIds: ['media-existing-1', 'media-new-1'],
            heroMediaId: null,
          },
          {
            mediaId: 'media-new-2',
            objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-2.jpg',
            mediaIds: ['media-existing-1', 'media-new-1', 'media-new-2'],
            heroMediaId: null,
          },
        ],
      }),
    });

    await expect(
      ui.saveDraft({ context: { petName: 'Becas' }, draft: { ...baseDraft, operation: 'update' } }),
    ).resolves.toEqual({
      state: 'saved',
      title: 'Rascunho atualizado',
      message: 'O rascunho de Becas foi atualizado com segurança.',
      petId: 'pet-1',
      petName: 'Becas',
      operation: 'update',
      uploadedMediaCount: 2,
    });
  });

  it('maps draft_save/unauthenticated failure to PT-PT Mobile state', async () => {
    const ui = createMobilePetDraftSaveFlowUi({
      saveFlowClient: makeSaveClient({
        ok: false,
        phase: 'draft_save',
        status: 'unauthenticated',
        reasons: ['missing_access_token', 'bearer user-token-marker'],
      }),
    });

    const result = await ui.saveDraft({ context: { petName: 'Becas' }, draft: baseDraft });

    expect(result).toEqual({
      state: 'failed',
      title: 'Inicia sessão para guardar',
      message: 'Precisas de uma sessão ativa para guardar este rascunho.',
      petId: 'pet-1',
      petName: 'Becas',
      phase: 'draft_save',
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
      canRetry: true,
    });
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('maps draft_save/actor_not_authorized failure to PT-PT Mobile state', async () => {
    const ui = createMobilePetDraftSaveFlowUi({
      saveFlowClient: makeSaveClient({
        ok: false,
        phase: 'draft_save',
        status: 'actor_not_authorized',
        reasons: ['actor_not_authorized'],
      }),
    });

    await expect(
      ui.saveDraft({ context: {}, draft: baseDraft }),
    ).resolves.toMatchObject({
      state: 'failed',
      title: 'Sem permissão para guardar',
      phase: 'draft_save',
      status: 'actor_not_authorized',
    });
  });

  it('maps media_upload/upload_intent failure to PT-PT Mobile state', async () => {
    const ui = createMobilePetDraftSaveFlowUi({
      saveFlowClient: makeSaveClient({
        ok: false,
        phase: 'media_upload',
        subPhase: 'upload_intent',
        status: 'worker_request_failed',
        reasons: ['worker_unavailable'],
      }),
    });

    await expect(
      ui.saveDraft({ context: { petName: 'Becas' }, draft: baseDraft }),
    ).resolves.toEqual({
      state: 'failed',
      title: 'Não foi possível preparar o carregamento',
      message: 'Confirma as permissões e tenta novamente.',
      petId: 'pet-1',
      petName: 'Becas',
      phase: 'media_upload',
      subPhase: 'upload_intent',
      reasons: ['worker_unavailable'],
      canRetry: true,
    });
  });

  it('maps media_upload/binary_upload failure to PT-PT Mobile state', async () => {
    const ui = createMobilePetDraftSaveFlowUi({
      saveFlowClient: makeSaveClient({
        ok: false,
        phase: 'media_upload',
        subPhase: 'binary_upload',
        status: 'signed_upload_failed',
        reasons: ['signed_upload_rejected'],
        responseStatus: 500,
        mediaId: 'media-new-1',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
      }),
    });

    await expect(
      ui.saveDraft({ context: { petName: 'Becas' }, draft: baseDraft }),
    ).resolves.toMatchObject({
      state: 'failed',
      title: 'Não foi possível enviar a imagem',
      phase: 'media_upload',
      subPhase: 'binary_upload',
      reasons: ['signed_upload_rejected'],
      canRetry: true,
    });
  });

  it('maps media_upload/attach failure (orphaned upload) to PT-PT Mobile state', async () => {
    const ui = createMobilePetDraftSaveFlowUi({
      saveFlowClient: makeSaveClient({
        ok: false,
        phase: 'media_upload',
        subPhase: 'attach',
        status: 'pet_media_attach_context_not_found',
        reasons: ['pet_not_found'],
        mediaId: 'media-new-1',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
      }),
    });

    await expect(
      ui.saveDraft({ context: { petName: 'Becas' }, draft: baseDraft }),
    ).resolves.toMatchObject({
      state: 'failed',
      title: 'Não foi possível associar a imagem',
      phase: 'media_upload',
      subPhase: 'attach',
      reasons: ['pet_not_found'],
      canRetry: true,
    });
  });

  it('strips credential markers from all failure reason arrays', async () => {
    const draftSaveUi = createMobilePetDraftSaveFlowUi({
      saveFlowClient: makeSaveClient({
        ok: false,
        phase: 'draft_save',
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'r2_secret key'],
      }),
    });

    const mediaUploadUi = createMobilePetDraftSaveFlowUi({
      saveFlowClient: makeSaveClient({
        ok: false,
        phase: 'media_upload',
        subPhase: 'attach',
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'signedUrl=https://r2.test', 'user-access-token'],
        mediaId: 'media-new-1',
        objectKey: 'public/shelters/shelter-a/pet_public_image/media-new-1.jpg',
      }),
    });

    const draftResult = await draftSaveUi.saveDraft({ context: {}, draft: baseDraft });
    const mediaResult = await mediaUploadUi.saveDraft({ context: {}, draft: baseDraft });

    expect(JSON.stringify(draftResult)).not.toContain('service-role-secret');
    expect(JSON.stringify(draftResult)).not.toContain('r2_secret');
    expect(JSON.stringify(mediaResult)).not.toContain('signedUrl');
    expect(JSON.stringify(mediaResult)).not.toContain('user-access-token');
  });

  it('surfaces the pet draft save flow on the Mobile foundation content', () => {
    expect(mobileFoundationContent.petDraftSaveFlow.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.petDraftSaveFlow.title).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.petDraftSaveFlow)).not.toContain('service-role');
    expect(JSON.stringify(mobileFoundationContent.petDraftSaveFlow)).not.toContain('r2-secret');
  });
});
