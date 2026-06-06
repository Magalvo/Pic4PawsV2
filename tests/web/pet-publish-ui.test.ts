import { describe, expect, it } from 'vitest';
import { webFoundationContent } from '../../apps/web/src/foundation';
import {
  createWebPetPublishUi,
  webPetPublishUiContent,
} from '../../apps/web/src/pet-publish';
import type { PetPublishClient, PetPublishClientRequest } from '../../packages/client/src/index';

const petContext = {
  petId: 'pet-1',
  petName: 'Becas',
} as const;

describe('web pet publish UI flow', () => {
  it('exposes a PT-PT ready state for publishing a pet draft', () => {
    const ui = createWebPetPublishUi({
      publishClient: {
        publishPetDraft: async () => {
          throw new Error('Publish client should not be called for ready state');
        },
      },
    });

    expect(ui.getInitialState(petContext)).toEqual({
      state: 'ready',
      title: 'Publicar perfil de Becas',
      message: 'Confirma que o rascunho está completo antes de publicar o perfil.',
      primaryAction: 'Publicar perfil',
      petId: 'pet-1',
      petName: 'Becas',
    });
    expect(webPetPublishUiContent.locale).toBe('pt-PT');
    expect(webPetPublishUiContent.states.map((state) => state.state)).toEqual([
      'ready',
      'publishing',
      'published',
      'failed',
    ]);
  });

  it('publishes a pet draft through the injected Web publish client', async () => {
    const calls: PetPublishClientRequest[] = [];
    const publishClient: PetPublishClient = {
      publishPetDraft: async (request) => {
        calls.push(request);

        return {
          ok: true,
          status: 'pet_published',
          petId: request.petId,
          publishedAt: '2026-06-04T15:00:00.000Z',
        };
      },
    };
    const ui = createWebPetPublishUi({ publishClient });

    await expect(ui.publishPetDraft({ pet: petContext })).resolves.toEqual({
      state: 'published',
      title: 'Perfil publicado',
      message: 'O perfil de Becas foi publicado e já pode ser visto pelos adotantes.',
      petId: 'pet-1',
      petName: 'Becas',
      publishedAt: '2026-06-04T15:00:00.000Z',
    });
    expect(calls).toEqual([{ petId: 'pet-1' }]);
  });

  it('maps unauthenticated failures to safe Web product state', async () => {
    const ui = createWebPetPublishUi({
      publishClient: {
        publishPetDraft: async () => ({
          ok: false,
          status: 'unauthenticated',
          reasons: ['missing_access_token', 'bearer user-token-marker'],
        }),
      },
    });

    const result = await ui.publishPetDraft({ pet: petContext });

    expect(result).toEqual({
      state: 'failed',
      title: 'Inicia sessão para publicar',
      message: 'Precisas de uma sessão ativa para publicar este perfil.',
      petId: 'pet-1',
      petName: 'Becas',
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
      canRetry: true,
    });
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('maps rejected publish failures without leaking provider credentials into UI state', async () => {
    const ui = createWebPetPublishUi({
      publishClient: {
        publishPetDraft: async () => ({
          ok: false,
          status: 'pet_publish_rejected',
          reasons: [
            'missing_mediaIds',
            'service-role-secret',
            'r2-secret-key',
            'bearer user-token-marker',
          ],
        }),
      },
    });

    const result = await ui.publishPetDraft({ pet: petContext });

    expect(result).toEqual({
      state: 'failed',
      title: 'Ainda não é possível publicar',
      message: 'Completa os campos obrigatórios e confirma a imagem pública antes de publicar.',
      petId: 'pet-1',
      petName: 'Becas',
      status: 'pet_publish_rejected',
      reasons: ['missing_mediaIds'],
      canRetry: true,
    });
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('maps authorization, missing draft and worker failures to distinct safe Web copy', async () => {
    const makeUi = (result: Awaited<ReturnType<PetPublishClient['publishPetDraft']>>) =>
      createWebPetPublishUi({
        publishClient: {
          publishPetDraft: async () => result,
        },
      });

    await expect(
      makeUi({
        ok: false,
        status: 'actor_not_authorized',
        reasons: ['actor_not_authorized'],
      }).publishPetDraft({ pet: petContext }),
    ).resolves.toMatchObject({
      state: 'failed',
      title: 'Sem permissão para publicar',
      message: 'A tua conta não tem permissão para publicar este perfil.',
      status: 'actor_not_authorized',
      reasons: ['actor_not_authorized'],
    });

    await expect(
      makeUi({
        ok: false,
        status: 'pet_draft_not_found',
        reasons: ['pet_draft_not_found'],
      }).publishPetDraft({ pet: petContext }),
    ).resolves.toMatchObject({
      state: 'failed',
      title: 'Rascunho não encontrado',
      message: 'Não encontrámos este rascunho para publicação.',
      status: 'pet_draft_not_found',
      reasons: ['pet_draft_not_found'],
    });

    await expect(
      makeUi({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['worker_request_failed'],
      }).publishPetDraft({ pet: petContext }),
    ).resolves.toMatchObject({
      state: 'failed',
      title: 'Não foi possível publicar',
      message: 'O serviço de publicação não respondeu como esperado. Tenta novamente.',
      status: 'worker_request_failed',
      reasons: ['worker_request_failed'],
    });
  });

  it('surfaces the pet publish product flow on the Web foundation content', () => {
    expect(webFoundationContent.petPublish.status).toBe('product-flow-ready');
    expect(webFoundationContent.petPublish.title).toBe('Publicação do perfil');
    expect(JSON.stringify(webFoundationContent.petPublish)).not.toContain('service-role');
    expect(JSON.stringify(webFoundationContent.petPublish)).not.toContain('r2-secret');
  });
});
