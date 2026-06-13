import type {
  ShelterDeletionClient,
  DeleteShelterClientFailureStatus,
} from '@pic4paws/client';

export type MobileShelterDeletionUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileShelterDeletionUiContent: MobileShelterDeletionUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Eliminar abrigo',
  description: 'Esta ação é irreversível. O abrigo e os seus dados serão desativados.',
  states: [
    {
      state: 'idle',
      title: 'Eliminar abrigo',
      message: 'Tens a certeza que pretendes eliminar este abrigo?',
    },
    {
      state: 'submitting',
      title: 'A eliminar...',
      message: 'A eliminar o abrigo.',
    },
    {
      state: 'deleted',
      title: 'Abrigo eliminado',
      message: 'O abrigo foi eliminado com sucesso.',
    },
    {
      state: 'failed',
      title: 'Não foi possível eliminar',
      message: 'Ocorreu um erro ao eliminar o abrigo.',
    },
  ],
};

export type MobileShelterDeletionIdleState = {
  state: 'idle';
  title: string;
};

export type MobileShelterDeletionSubmittingState = {
  state: 'submitting';
  title: string;
};

export type MobileShelterDeletionDeletedState = {
  state: 'deleted';
  title: string;
  message: string;
  shelterId: string;
};

export type MobileShelterDeletionFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: DeleteShelterClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileShelterDeletionState =
  | MobileShelterDeletionIdleState
  | MobileShelterDeletionSubmittingState
  | MobileShelterDeletionDeletedState
  | MobileShelterDeletionFailedState;

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

export const createMobileShelterDeletionUi = ({
  shelterDeletionClient,
}: {
  shelterDeletionClient: Pick<ShelterDeletionClient, 'deleteShelter'>;
}) => ({
  getInitialState: (): MobileShelterDeletionIdleState => ({
    state: 'idle',
    title: 'Eliminar abrigo',
  }),

  deleteShelter: async (
    shelterId: string,
  ): Promise<MobileShelterDeletionDeletedState | MobileShelterDeletionFailedState> => {
    const result = await shelterDeletionClient.deleteShelter(shelterId);

    if (!result.ok) {
      if (result.status === 'forbidden') {
        return {
          state: 'failed',
          title: 'Sem permissão',
          message: 'Não tens permissão para eliminar este abrigo.',
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
        title: 'Não foi possível eliminar',
        message: 'Ocorreu um erro ao eliminar o abrigo. Tenta de novo.',
        status: result.status,
        reasons: sanitizeReasons(result.reasons, result.status),
        canRetry: true,
      };
    }

    return {
      state: 'deleted',
      title: 'Abrigo eliminado',
      message: 'O abrigo foi eliminado com sucesso.',
      shelterId: result.shelterId,
    };
  },
});
