import type {
  AdoptionDonorListClient,
  AdoptionDonorListClientFailureStatus,
  AdoptionDonorListItem,
  AdoptionDonorListQuery,
} from '@pic4paws/client';

export type MobileAdoptionDonorListUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileAdoptionDonorListUiContent: MobileAdoptionDonorListUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Os meus pedidos de adoção',
  description: 'Consulta os teus pedidos de adoção e o estado de cada um.',
  states: [
    {
      state: 'idle',
      title: 'Os meus pedidos de adoção',
      message: 'Carrega para ver os teus pedidos de adoção.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A obter os teus pedidos de adoção.',
    },
    {
      state: 'loaded',
      title: 'Os meus pedidos de adoção',
      message: 'Lista dos teus pedidos de adoção.',
    },
    {
      state: 'empty',
      title: 'Sem pedidos de adoção',
      message: 'Ainda não submeteste nenhum pedido de adoção.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

// ─── State types ──────────────────────────────────────────────────────────────

export type MobileAdoptionDonorListIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobileAdoptionDonorListLoadingState = {
  state: 'loading';
  title: string;
  message: string;
};

export type MobileAdoptionDonorListLoadedState = {
  state: 'loaded';
  title: string;
  message: string;
  applications: AdoptionDonorListItem[];
  total: number;
};

export type MobileAdoptionDonorListEmptyState = {
  state: 'empty';
  title: string;
  message: string;
};

export type MobileAdoptionDonorListFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: AdoptionDonorListClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileAdoptionDonorListResultViewModel =
  | MobileAdoptionDonorListIdleState
  | MobileAdoptionDonorListLoadingState
  | MobileAdoptionDonorListLoadedState
  | MobileAdoptionDonorListEmptyState
  | MobileAdoptionDonorListFailedState;

// ─── Reason sanitizer ─────────────────────────────────────────────────────────

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

// ─── UI factory ───────────────────────────────────────────────────────────────

export const createMobileAdoptionDonorListUi = ({
  adoptionDonorListClient,
}: {
  adoptionDonorListClient: Pick<AdoptionDonorListClient, 'loadDonorAdoptions'>;
}) => ({
  getInitialState: (): MobileAdoptionDonorListIdleState => ({
    state: 'idle',
    title: 'Os meus pedidos de adoção',
    message: 'Carrega para ver os teus pedidos de adoção.',
    primaryAction: 'Carregar pedidos',
  }),

  loadDonorAdoptions: async (
    query?: AdoptionDonorListQuery,
  ): Promise<
    | MobileAdoptionDonorListLoadedState
    | MobileAdoptionDonorListEmptyState
    | MobileAdoptionDonorListFailedState
  > => {
    const result = await adoptionDonorListClient.loadDonorAdoptions(query);

    if (result.ok) {
      if (result.applications.length === 0) {
        return {
          state: 'empty',
          title: 'Sem pedidos de adoção',
          message: 'Ainda não submeteste nenhum pedido de adoção.',
        };
      }

      return {
        state: 'loaded',
        title: 'Os meus pedidos de adoção',
        message: `${result.total} pedido(s) encontrado(s).`,
        applications: result.applications,
        total: result.total,
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
