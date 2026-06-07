import type {
  PetDraftClientFailureStatus,
  PetDraftSaveFlowClient,
  PetDraftSaveFlowInput,
} from '@pic4paws/client';

export type WebPetDraftSaveFlowUiState = 'ready' | 'saving' | 'saved' | 'failed';

export type WebPetDraftSaveFlowUiStateCopy = {
  state: WebPetDraftSaveFlowUiState;
  title: string;
  message: string;
};

export type WebPetDraftSaveFlowUiContent = {
  locale: 'pt-PT';
  title: string;
  description: string;
  status: 'product-flow-ready';
  states: WebPetDraftSaveFlowUiStateCopy[];
};

export type WebPetDraftSaveFlowContext = {
  petName?: string | null;
};

export type WebPetDraftSaveFlowReadyViewModel = {
  state: 'ready';
  title: string;
  message: string;
  primaryAction: string;
  petName: string;
};

export type WebPetDraftSaveFlowResultViewModel =
  | {
      state: 'saved';
      title: string;
      message: string;
      petId: string;
      petName: string;
      operation: 'create' | 'update';
      uploadedMediaCount: number;
    }
  | {
      state: 'failed';
      title: string;
      message: string;
      petId: string;
      petName: string;
      phase: 'draft_save';
      status: PetDraftClientFailureStatus;
      reasons: string[];
      canRetry: true;
    }
  | {
      state: 'failed';
      title: string;
      message: string;
      petId: string;
      petName: string;
      phase: 'media_upload';
      subPhase: 'upload_intent' | 'binary_upload' | 'attach';
      reasons: string[];
      canRetry: true;
    };

export type CreateWebPetDraftSaveFlowUiInput = {
  saveFlowClient: Pick<PetDraftSaveFlowClient, 'savePetDraft'>;
};

export type WebPetDraftSaveFlowUi = {
  getInitialState: (context: WebPetDraftSaveFlowContext) => WebPetDraftSaveFlowReadyViewModel;
  saveDraft: (input: {
    context: WebPetDraftSaveFlowContext;
    draft: PetDraftSaveFlowInput;
  }) => Promise<WebPetDraftSaveFlowResultViewModel>;
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

export const webPetDraftSaveFlowUiContent: WebPetDraftSaveFlowUiContent = {
  locale: 'pt-PT',
  title: 'Guardar rascunho com imagens',
  description:
    'Fluxo de produto para criar ou atualizar rascunhos de animais com imagens novas através do fluxo seguro.',
  status: 'product-flow-ready',
  states: [
    {
      state: 'ready',
      title: 'Editar rascunho',
      message: 'Preenche os dados e adiciona imagens antes de guardar.',
    },
    {
      state: 'saving',
      title: 'A guardar rascunho',
      message: 'Estamos a guardar o rascunho e as imagens pelo fluxo seguro.',
    },
    {
      state: 'saved',
      title: 'Rascunho guardado',
      message: 'O rascunho foi guardado com segurança.',
    },
    {
      state: 'failed',
      title: 'Não foi possível guardar',
      message: 'Confirma os dados e tenta novamente.',
    },
  ],
};

const getPetName = (context: WebPetDraftSaveFlowContext, draft: PetDraftSaveFlowInput): string => {
  const name = context.petName ?? draft.name;

  return typeof name === 'string' && name.trim().length > 0 ? name.trim() : 'este animal';
};

const isSafeReason = (reason: string): boolean => {
  const normalized = reason.toLowerCase();

  return !unsafeReasonMarkers.some((marker) => normalized.includes(marker));
};

const sanitizeReasons = (reasons: string[], fallback: string): string[] => {
  const safe = reasons.filter(isSafeReason);

  return safe.length > 0 ? safe : [fallback];
};

const draftSaveFailureCopy: Record<PetDraftClientFailureStatus, { title: string; message: string }> =
  {
    unauthenticated: {
      title: 'Inicia sessão para guardar',
      message: 'Precisas de uma sessão ativa para guardar este rascunho.',
    },
    actor_not_authorized: {
      title: 'Sem permissão para guardar',
      message: 'A tua conta não tem permissão para guardar este rascunho.',
    },
    invalid_pet_draft: {
      title: 'Rascunho incompleto',
      message: 'Revê os campos obrigatórios e confirma a imagem pública antes de guardar.',
    },
    auth_adapter_not_configured: {
      title: 'Guardar rascunho indisponível',
      message: 'O serviço de autenticação ainda não está configurado para guardar rascunhos.',
    },
    pet_draft_repository_not_configured: {
      title: 'Guardar rascunho indisponível',
      message: 'O serviço de rascunhos ainda não está configurado.',
    },
    worker_request_failed: {
      title: 'Não foi possível guardar',
      message: 'O serviço de rascunhos não respondeu como esperado. Tenta novamente.',
    },
  };

const mediaUploadFailureCopy: Record<
  'upload_intent' | 'binary_upload' | 'attach',
  { title: string; message: string }
> = {
  upload_intent: {
    title: 'Não foi possível preparar o carregamento',
    message: 'Confirma as permissões e tenta novamente.',
  },
  binary_upload: {
    title: 'Não foi possível enviar a imagem',
    message: 'O pedido foi preparado, mas o envio do ficheiro falhou.',
  },
  attach: {
    title: 'Não foi possível associar a imagem',
    message: 'A imagem foi enviada, mas não ficou associada ao rascunho.',
  },
};

export const createWebPetDraftSaveFlowUi = ({
  saveFlowClient,
}: CreateWebPetDraftSaveFlowUiInput): WebPetDraftSaveFlowUi => ({
  getInitialState: (context) => {
    const petName =
      typeof context.petName === 'string' && context.petName.trim().length > 0
        ? context.petName.trim()
        : 'este animal';

    return {
      state: 'ready',
      title: `Editar rascunho de ${petName}`,
      message: 'Preenche os dados e adiciona imagens antes de guardar.',
      primaryAction: 'Guardar rascunho',
      petName,
    };
  },
  saveDraft: async ({ context, draft }) => {
    const petName = getPetName(context, draft);
    const result = await saveFlowClient.savePetDraft(draft);

    if (result.ok) {
      return {
        state: 'saved',
        title: draft.operation === 'create' ? 'Rascunho guardado' : 'Rascunho atualizado',
        message:
          draft.operation === 'create'
            ? `O rascunho de ${petName} foi criado com segurança.`
            : `O rascunho de ${petName} foi atualizado com segurança.`,
        petId: result.petId,
        petName,
        operation: result.operation,
        uploadedMediaCount: result.uploadedMedia.length,
      };
    }

    if (result.phase === 'draft_save') {
      const copy = draftSaveFailureCopy[result.status];

      return {
        state: 'failed',
        title: copy.title,
        message: copy.message,
        petId: draft.petId,
        petName,
        phase: 'draft_save',
        status: result.status,
        reasons: sanitizeReasons(result.reasons, result.status),
        canRetry: true,
      };
    }

    const copy = mediaUploadFailureCopy[result.subPhase];

    return {
      state: 'failed',
      title: copy.title,
      message: copy.message,
      petId: draft.petId,
      petName,
      phase: 'media_upload',
      subPhase: result.subPhase,
      reasons: sanitizeReasons(result.reasons, result.subPhase),
      canRetry: true,
    };
  },
});
