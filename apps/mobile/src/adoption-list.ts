import type {
  AdoptionListClient,
  AdoptionListApplication,
  AdoptionListClientFailureStatus,
  AdoptionListQuery,
} from '@pic4paws/client';

export type MobileAdoptionListUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileAdoptionListUiContent: MobileAdoptionListUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Candidaturas à adoção',
  description: 'Consulta e gere as candidaturas de adoção recebidas pelo abrigo.',
  states: [
    {
      state: 'idle',
      title: 'Candidaturas à adoção',
      message: 'Consulta as candidaturas de adoção para este abrigo.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A obter as candidaturas.',
    },
    {
      state: 'loaded',
      title: 'Candidaturas à adoção',
      message: 'Lista de candidaturas recebidas.',
    },
    {
      state: 'empty',
      title: 'Sem candidaturas',
      message: 'Ainda não existem candidaturas para este abrigo.',
    },
    {
      state: 'forbidden',
      title: 'Acesso negado',
      message: 'Não tens permissão para ver as candidaturas deste abrigo.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type MobileAdoptionListIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobileAdoptionListLoadingState = {
  state: 'loading';
  title: string;
  message: string;
};

export type MobileAdoptionListLoadedState = {
  state: 'loaded';
  title: string;
  message: string;
  applications: AdoptionListApplication[];
  total: number;
};

export type MobileAdoptionListEmptyState = {
  state: 'empty';
  title: string;
  message: string;
};

export type MobileAdoptionListForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type MobileAdoptionListFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: AdoptionListClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileAdoptionListResultViewModel =
  | MobileAdoptionListIdleState
  | MobileAdoptionListLoadingState
  | MobileAdoptionListLoadedState
  | MobileAdoptionListEmptyState
  | MobileAdoptionListForbiddenState
  | MobileAdoptionListFailedState;

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

export const createMobileAdoptionListUi = ({
  adoptionListClient,
}: {
  adoptionListClient: Pick<AdoptionListClient, 'loadApplications'>;
}) => ({
  getInitialState: (): MobileAdoptionListIdleState => ({
    state: 'idle',
    title: 'Candidaturas à adoção',
    message: 'Consulta as candidaturas de adoção para este abrigo.',
    primaryAction: 'Carregar candidaturas',
  }),

  loadApplications: async (
    shelterId: string,
    query?: AdoptionListQuery,
  ): Promise<
    | MobileAdoptionListLoadedState
    | MobileAdoptionListEmptyState
    | MobileAdoptionListForbiddenState
    | MobileAdoptionListFailedState
  > => {
    const result = await adoptionListClient.loadApplications(shelterId, query);

    if (result.ok) {
      if (result.applications.length === 0) {
        return {
          state: 'empty',
          title: 'Sem candidaturas',
          message: 'Ainda não existem candidaturas para este abrigo.',
        };
      }

      return {
        state: 'loaded',
        title: 'Candidaturas à adoção',
        message: `${result.total} candidatura(s) encontrada(s).`,
        applications: result.applications,
        total: result.total,
      };
    }

    if (result.status === 'forbidden') {
      return {
        state: 'forbidden',
        title: 'Acesso negado',
        message: 'Não tens permissão para ver as candidaturas deste abrigo.',
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
