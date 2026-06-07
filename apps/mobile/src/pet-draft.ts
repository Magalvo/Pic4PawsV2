import type {
  PetDraftClient,
  PetDraftClientDraftInput,
  PetDraftClientFailureStatus,
} from '@pic4paws/client';

export type MobilePetDraftUiState = 'ready' | 'saving' | 'saved' | 'failed';

export type MobilePetDraftOperation = 'create' | 'update';

export type MobilePetDraftUiStateCopy = {
  state: MobilePetDraftUiState;
  title: string;
  message: string;
};

export type MobilePetDraftUiContent = {
  locale: 'pt-PT';
  title: string;
  description: string;
  status: 'product-flow-ready';
  states: MobilePetDraftUiStateCopy[];
};

export type MobilePetDraftContext = {
  petName?: string | null;
};

export type MobilePetDraftReadyViewModel = {
  state: 'ready';
  title: string;
  message: string;
  primaryAction: string;
  petName: string;
};

export type MobilePetDraftResultViewModel =
  | {
      state: 'saved';
      title: string;
      message: string;
      petId: string;
      petName: string;
      operation: MobilePetDraftOperation;
    }
  | {
      state: 'failed';
      title: string;
      message: string;
      petId: string;
      petName: string;
      operation: MobilePetDraftOperation;
      status: PetDraftClientFailureStatus;
      reasons: string[];
      canRetry: true;
    };

export type CreateMobilePetDraftUiInput = {
  draftClient: Pick<PetDraftClient, 'createPetDraft' | 'updatePetDraft'>;
};

export type MobilePetDraftUi = {
  getInitialState: (context: MobilePetDraftContext) => MobilePetDraftReadyViewModel;
  createDraft: (input: { draft: PetDraftClientDraftInput }) => Promise<MobilePetDraftResultViewModel>;
  updateDraft: (input: { draft: PetDraftClientDraftInput }) => Promise<MobilePetDraftResultViewModel>;
};

type PetNameSource = {
  name?: string | null;
  petName?: string | null;
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

export const mobilePetDraftUiContent: MobilePetDraftUiContent = {
  locale: 'pt-PT',
  title: 'Rascunho do perfil',
  description:
    'Fluxo mobile para criar e atualizar rascunhos de perfis de animais através do Worker seguro.',
  status: 'product-flow-ready',
  states: [
    {
      state: 'ready',
      title: 'Editar rascunho',
      message: 'Preenche os dados principais antes de guardar o rascunho.',
    },
    {
      state: 'saving',
      title: 'A guardar rascunho',
      message: 'Estamos a guardar o rascunho pelo fluxo seguro.',
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

const getPetName = (context: PetNameSource): string => {
  const maybeName = context.name ?? context.petName;

  return typeof maybeName === 'string' && maybeName.trim().length > 0
    ? maybeName.trim()
    : 'este animal';
};

const isSafeReason = (reason: string): boolean => {
  const normalizedReason = reason.toLowerCase();

  return !unsafeReasonMarkers.some((marker) => normalizedReason.includes(marker));
};

const sanitizeReasons = (
  reasons: string[],
  fallback: PetDraftClientFailureStatus,
): string[] => {
  const safeReasons = reasons.filter(isSafeReason);

  return safeReasons.length > 0 ? safeReasons : [fallback];
};

const failureCopyByStatus: Record<PetDraftClientFailureStatus, { title: string; message: string }> =
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

const sanitizeDraftInput = (draft: PetDraftClientDraftInput): PetDraftClientDraftInput => ({
  petId: draft.petId,
  shelterId: draft.shelterId,
  name: draft.name ?? null,
  species: draft.species ?? null,
  locationLabel: draft.locationLabel ?? null,
  shortDescription: draft.shortDescription ?? null,
  mediaIds: [...draft.mediaIds],
  heroMediaId: draft.heroMediaId ?? null,
  medical: draft.medical,
});

const createSavedResult = (
  draft: PetDraftClientDraftInput,
  petId: string,
  operation: MobilePetDraftOperation,
): MobilePetDraftResultViewModel => {
  const petName = getPetName(draft);

  return {
    state: 'saved',
    title: operation === 'create' ? 'Rascunho guardado' : 'Rascunho atualizado',
    message:
      operation === 'create'
        ? `O rascunho de ${petName} foi criado com segurança.`
        : `O rascunho de ${petName} foi atualizado com segurança.`,
    petId,
    petName,
    operation,
  };
};

export const createMobilePetDraftUi = ({
  draftClient,
}: CreateMobilePetDraftUiInput): MobilePetDraftUi => {
  const saveDraft = async (
    draft: PetDraftClientDraftInput,
    operation: MobilePetDraftOperation,
  ): Promise<MobilePetDraftResultViewModel> => {
    const safeDraft = sanitizeDraftInput(draft);
    const result =
      operation === 'create'
        ? await draftClient.createPetDraft(safeDraft)
        : await draftClient.updatePetDraft(safeDraft);

    if (result.ok) {
      return createSavedResult(safeDraft, result.petId, operation);
    }

    const copy = failureCopyByStatus[result.status];

    return {
      state: 'failed',
      title: copy.title,
      message: copy.message,
      petId: safeDraft.petId,
      petName: getPetName(safeDraft),
      operation,
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  };

  return {
    getInitialState: (context) => {
      const petName = getPetName(context);

      return {
        state: 'ready',
        title: `Editar rascunho de ${petName}`,
        message: 'Preenche os dados principais antes de guardar o rascunho.',
        primaryAction: 'Guardar rascunho',
        petName,
      };
    },
    createDraft: ({ draft }) => saveDraft(draft, 'create'),
    updateDraft: ({ draft }) => saveDraft(draft, 'update'),
  };
};
