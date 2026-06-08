import type {
  AdoptionViewClient,
  AdoptionViewClientApplication,
  AdoptionViewClientFailureStatus,
} from '@pic4paws/client';

export type WebAdoptionViewUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webAdoptionViewUiContent: WebAdoptionViewUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Estado da candidatura',
  description: 'Consulta o estado da tua candidatura de adoção.',
  states: [
    {
      state: 'idle',
      title: 'Estado da candidatura',
      message: 'Consulta o estado da tua candidatura de adoção.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A obter o estado da candidatura.',
    },
    {
      state: 'loaded',
      title: 'Candidatura encontrada',
      message: 'Detalhes da tua candidatura de adoção.',
    },
    {
      state: 'not_found',
      title: 'Candidatura não encontrada',
      message: 'A candidatura que procuras não existe ou foi removida.',
    },
    {
      state: 'forbidden',
      title: 'Acesso negado',
      message: 'Não tens permissão para ver esta candidatura.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type WebAdoptionViewIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type WebAdoptionViewLoadingState = {
  state: 'loading';
  title: string;
  message: string;
};

export type WebAdoptionViewLoadedState = {
  state: 'loaded';
  title: string;
  message: string;
  application: AdoptionViewClientApplication;
};

export type WebAdoptionViewNotFoundState = {
  state: 'not_found';
  title: string;
  message: string;
};

export type WebAdoptionViewForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type WebAdoptionViewFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: AdoptionViewClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebAdoptionViewResultViewModel =
  | WebAdoptionViewIdleState
  | WebAdoptionViewLoadingState
  | WebAdoptionViewLoadedState
  | WebAdoptionViewNotFoundState
  | WebAdoptionViewForbiddenState
  | WebAdoptionViewFailedState;

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

export const createWebAdoptionViewUi = ({
  adoptionViewClient,
}: {
  adoptionViewClient: Pick<AdoptionViewClient, 'loadAdoptionView'>;
}) => ({
  getInitialState: (): WebAdoptionViewIdleState => ({
    state: 'idle',
    title: 'Estado da candidatura',
    message: 'Consulta o estado da tua candidatura de adoção.',
    primaryAction: 'Ver candidatura',
  }),

  loadAdoptionView: async (
    applicationId: string,
  ): Promise<
    | WebAdoptionViewLoadedState
    | WebAdoptionViewNotFoundState
    | WebAdoptionViewForbiddenState
    | WebAdoptionViewFailedState
  > => {
    const result = await adoptionViewClient.loadAdoptionView(applicationId);

    if (result.ok) {
      return {
        state: 'loaded',
        title: 'Candidatura encontrada',
        message: 'Detalhes da tua candidatura de adoção.',
        application: result.application,
      };
    }

    if (result.status === 'adoption_not_found') {
      return {
        state: 'not_found',
        title: 'Candidatura não encontrada',
        message: 'A candidatura que procuras não existe ou foi removida.',
      };
    }

    if (result.status === 'forbidden') {
      return {
        state: 'forbidden',
        title: 'Acesso negado',
        message: 'Não tens permissão para ver esta candidatura.',
      };
    }

    return {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },
});
