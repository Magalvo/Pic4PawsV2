import type {
  AdoptionStatusClient,
  AdoptionStatusClientFailureStatus,
  AdoptionStatusShelterManageStatus,
} from '@pic4paws/client';

export type WebAdoptionStatusUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webAdoptionStatusUiContent: WebAdoptionStatusUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Estado da candidatura',
  description: 'Actualiza o estado de uma candidatura de adoção.',
  states: [
    {
      state: 'idle',
      title: 'Estado da candidatura',
      message: 'Seleciona o estado a aplicar à candidatura.',
    },
    {
      state: 'submitting',
      title: 'A processar...',
      message: 'A atualizar o estado da candidatura.',
    },
    {
      state: 'succeeded',
      title: 'Candidatura atualizada!',
      message: 'O estado da candidatura foi atualizado com sucesso.',
    },
    {
      state: 'failed',
      title: 'Não foi possível atualizar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type WebAdoptionStatusIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type WebAdoptionStatusSubmittingState = {
  state: 'submitting';
  title: string;
  message: string;
};

export type WebAdoptionStatusSucceededState = {
  state: 'succeeded';
  title: string;
  message: string;
  applicationId: string;
  newStatus: AdoptionStatusShelterManageStatus;
};

export type WebAdoptionStatusFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: AdoptionStatusClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebAdoptionStatusResultViewModel =
  | WebAdoptionStatusIdleState
  | WebAdoptionStatusSubmittingState
  | WebAdoptionStatusSucceededState
  | WebAdoptionStatusFailedState;

const unsafeReasonMarkers = [
  'signedurl',
  'temporary=',
  'service-role',
  'service_role',
  'r2-secret',
  'r2_secret',
  'r2-access',
  'r2_access',
  'user-access-token',
  'bearer ',
];

const sanitizeReasons = (reasons: string[], fallback: string): string[] => {
  const safe = reasons.filter((r) => {
    const normalized = r.toLowerCase();

    return !unsafeReasonMarkers.some((marker) => normalized.includes(marker));
  });

  return safe.length > 0 ? safe : [fallback];
};

export const createWebAdoptionStatusUi = ({
  adoptionStatusClient,
}: {
  adoptionStatusClient: Pick<AdoptionStatusClient, 'manageAdoptionStatus'>;
}) => ({
  getInitialState: (): WebAdoptionStatusIdleState => ({
    state: 'idle',
    title: 'Estado da candidatura',
    message: 'Seleciona o estado a aplicar à candidatura.',
    primaryAction: 'Atualizar estado',
  }),

  manageAdoptionStatus: async (
    applicationId: string,
    status: AdoptionStatusShelterManageStatus,
  ): Promise<WebAdoptionStatusSucceededState | WebAdoptionStatusFailedState> => {
    const result = await adoptionStatusClient.manageAdoptionStatus(applicationId, status);

    if (result.ok) {
      return {
        state: 'succeeded',
        title: 'Candidatura atualizada!',
        message: 'O estado da candidatura foi atualizado com sucesso.',
        applicationId: result.applicationId,
        newStatus: result.newStatus,
      };
    }

    return {
      state: 'failed',
      title: 'Não foi possível atualizar',
      message: 'Verifica a tua ligação e tenta de novo.',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },
});
