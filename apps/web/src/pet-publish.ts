import type { PetPublishClient, PetPublishClientFailureStatus } from '@pic4paws/client';

export type WebPetPublishUiState = 'ready' | 'publishing' | 'published' | 'failed';

export type WebPetPublishUiStateCopy = {
  state: WebPetPublishUiState;
  title: string;
  message: string;
};

export type WebPetPublishUiContent = {
  locale: 'pt-PT';
  title: string;
  description: string;
  status: 'product-flow-ready';
  states: WebPetPublishUiStateCopy[];
};

export type WebPetPublishContext = {
  petId: string;
  petName: string;
};

export type WebPetPublishReadyViewModel = {
  state: 'ready';
  title: string;
  message: string;
  primaryAction: string;
  petId: string;
  petName: string;
};

export type WebPetPublishResultViewModel =
  | {
      state: 'published';
      title: string;
      message: string;
      petId: string;
      petName: string;
      publishedAt: string;
    }
  | {
      state: 'failed';
      title: string;
      message: string;
      petId: string;
      petName: string;
      status: PetPublishClientFailureStatus;
      reasons: string[];
      canRetry: true;
    };

export type CreateWebPetPublishUiInput = {
  publishClient: Pick<PetPublishClient, 'publishPetDraft'>;
};

export type WebPetPublishUi = {
  getInitialState: (pet: WebPetPublishContext) => WebPetPublishReadyViewModel;
  publishPetDraft: (input: {
    pet: WebPetPublishContext;
  }) => Promise<WebPetPublishResultViewModel>;
};

const unsafeReasonMarkers = [
  'signedurl',
  'temporary=',
  'service-role',
  'service_role',
  'r2-secret',
  'r2_secret',
  'r2-access',
  'r2_access',
  'server-only-marker',
  'user-token-marker',
  'user-access-token',
  'bearer ',
];

export const webPetPublishUiContent: WebPetPublishUiContent = {
  locale: 'pt-PT',
  title: 'Publicação do perfil',
  description:
    'Fluxo de produto para publicar um rascunho de animal através do Worker seguro, mantendo as regras de publicação no servidor.',
  status: 'product-flow-ready',
  states: [
    {
      state: 'ready',
      title: 'Publicar perfil',
      message: 'Confirma que o rascunho está completo antes de publicar o perfil.',
    },
    {
      state: 'publishing',
      title: 'A publicar perfil',
      message: 'Estamos a confirmar o rascunho e a publicar o perfil.',
    },
    {
      state: 'published',
      title: 'Perfil publicado',
      message: 'O perfil foi publicado e já pode ser visto pelos adotantes.',
    },
    {
      state: 'failed',
      title: 'Não foi possível publicar',
      message: 'Confirma o rascunho e tenta novamente.',
    },
  ],
};

const isSafeReason = (reason: string): boolean => {
  const normalizedReason = reason.toLowerCase();

  return !unsafeReasonMarkers.some((marker) => normalizedReason.includes(marker));
};

const sanitizeReasons = (
  reasons: string[],
  fallback: PetPublishClientFailureStatus,
): string[] => {
  const safeReasons = reasons.filter(isSafeReason);

  return safeReasons.length > 0 ? safeReasons : [fallback];
};

const failureCopyByStatus: Record<PetPublishClientFailureStatus, { title: string; message: string }> =
  {
    unauthenticated: {
      title: 'Inicia sessão para publicar',
      message: 'Precisas de uma sessão ativa para publicar este perfil.',
    },
    actor_not_authorized: {
      title: 'Sem permissão para publicar',
      message: 'A tua conta não tem permissão para publicar este perfil.',
    },
    pet_draft_not_found: {
      title: 'Rascunho não encontrado',
      message: 'Não encontrámos este rascunho para publicação.',
    },
    pet_publish_rejected: {
      title: 'Ainda não é possível publicar',
      message: 'Completa os campos obrigatórios e confirma a imagem pública antes de publicar.',
    },
    auth_adapter_not_configured: {
      title: 'Publicação indisponível',
      message: 'O serviço de autenticação ainda não está configurado para publicar perfis.',
    },
    pet_publish_repository_not_configured: {
      title: 'Publicação indisponível',
      message: 'O serviço de publicação ainda não está configurado.',
    },
    worker_request_failed: {
      title: 'Não foi possível publicar',
      message: 'O serviço de publicação não respondeu como esperado. Tenta novamente.',
    },
  };

export const createWebPetPublishUi = ({
  publishClient,
}: CreateWebPetPublishUiInput): WebPetPublishUi => ({
  getInitialState: (pet) => ({
    state: 'ready',
    title: `Publicar perfil de ${pet.petName}`,
    message: 'Confirma que o rascunho está completo antes de publicar o perfil.',
    primaryAction: 'Publicar perfil',
    petId: pet.petId,
    petName: pet.petName,
  }),
  publishPetDraft: async ({ pet }) => {
    const result = await publishClient.publishPetDraft({ petId: pet.petId });

    if (result.ok) {
      return {
        state: 'published',
        title: 'Perfil publicado',
        message: `O perfil de ${pet.petName} foi publicado e já pode ser visto pelos adotantes.`,
        petId: result.petId,
        petName: pet.petName,
        publishedAt: result.publishedAt,
      };
    }

    const copy = failureCopyByStatus[result.status];

    return {
      state: 'failed',
      title: copy.title,
      message: copy.message,
      petId: pet.petId,
      petName: pet.petName,
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },
});
