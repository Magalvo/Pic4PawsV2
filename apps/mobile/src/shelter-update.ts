import type {
  ShelterUpdateClient,
  ShelterUpdateClientInput,
  UpdateShelterClientFailureStatus,
} from '@pic4paws/client';

export type MobileShelterUpdateUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileShelterUpdateUiContent: MobileShelterUpdateUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Editar abrigo',
  description: 'Atualiza os dados do teu abrigo.',
  states: [
    {
      state: 'idle',
      title: 'Editar abrigo',
      message: 'Altera os campos que pretendes atualizar.',
    },
    {
      state: 'submitting',
      title: 'A guardar...',
      message: 'A guardar as alterações.',
    },
    {
      state: 'updated',
      title: 'Dados guardados',
      message: 'As alterações foram guardadas com sucesso.',
    },
    {
      state: 'failed',
      title: 'Não foi possível guardar',
      message: 'Ocorreu um erro ao guardar as alterações.',
    },
  ],
};

export type MobileShelterUpdateIdleState = {
  state: 'idle';
  title: string;
};

export type MobileShelterUpdateSubmittingState = {
  state: 'submitting';
  title: string;
};

export type MobileShelterUpdateUpdatedState = {
  state: 'updated';
  title: string;
  message: string;
  shelterId: string;
};

export type MobileShelterUpdateFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: UpdateShelterClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileShelterUpdateState =
  | MobileShelterUpdateIdleState
  | MobileShelterUpdateSubmittingState
  | MobileShelterUpdateUpdatedState
  | MobileShelterUpdateFailedState;

const unsafeReasonMarkers = [
  'service-role',
  'service_role',
  'bearer ',
  'r2-secret',
  'r2_secret',
  'r2-access',
  'r2_access',
];

const sanitizeReasons = (reasons: string[], fallback: string): string[] => {
  const safe = reasons.filter((r) => {
    const normalized = r.toLowerCase();
    return !unsafeReasonMarkers.some((marker) => normalized.includes(marker));
  });
  return safe.length > 0 ? safe : [fallback];
};

export const createMobileShelterUpdateUi = ({
  shelterUpdateClient,
}: {
  shelterUpdateClient: Pick<ShelterUpdateClient, 'updateShelter'>;
}) => ({
  getInitialState: (): MobileShelterUpdateIdleState => ({
    state: 'idle',
    title: 'Editar abrigo',
  }),

  updateShelter: async (
    shelterId: string,
    input: ShelterUpdateClientInput,
  ): Promise<MobileShelterUpdateUpdatedState | MobileShelterUpdateFailedState> => {
    const result = await shelterUpdateClient.updateShelter(shelterId, input);

    if (!result.ok) {
      if (result.status === 'forbidden') {
        return {
          state: 'failed',
          title: 'Sem permissão',
          message: 'Não tens permissão para editar este abrigo.',
          status: result.status,
          reasons: result.reasons,
          canRetry: true,
        };
      }

      if (result.status === 'shelter_not_found') {
        return {
          state: 'failed',
          title: 'Abrigo não encontrado',
          message: 'O abrigo não foi encontrado.',
          status: result.status,
          reasons: result.reasons,
          canRetry: true,
        };
      }

      if (result.status === 'invalid_payload') {
        return {
          state: 'failed',
          title: 'Dados inválidos',
          message: 'Verifica os dados introduzidos e tenta de novo.',
          status: result.status,
          reasons: result.reasons,
          canRetry: true,
        };
      }

      if (result.status === 'unauthenticated') {
        return {
          state: 'failed',
          title: 'Sessão expirada',
          message: 'A tua sessão expirou. Inicia sessão de novo.',
          status: result.status,
          reasons: result.reasons,
          canRetry: true,
        };
      }

      return {
        state: 'failed',
        title: 'Não foi possível guardar',
        message: 'Ocorreu um erro ao guardar as alterações. Tenta de novo.',
        status: result.status,
        reasons: sanitizeReasons(result.reasons, result.status),
        canRetry: true,
      };
    }

    return {
      state: 'updated',
      title: 'Dados guardados',
      message: 'As alterações foram guardadas com sucesso.',
      shelterId: result.shelterId,
    };
  },
});
