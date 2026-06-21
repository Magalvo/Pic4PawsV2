import type {
  AdminPendingShelterClientSummary,
  AdminPendingSheltersClient,
  AdminPendingSheltersClientFailureStatus,
  AdminPendingSheltersClientQuery,
} from '@pic4paws/client';

export type WebAdminPendingSheltersUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webAdminPendingSheltersUiContent: WebAdminPendingSheltersUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Revisão de abrigos',
  description: 'Acompanha os abrigos submetidos para verificação pela equipa Pic4Paws.',
  states: [
    {
      state: 'idle',
      title: 'Abrigos por rever',
      message: 'Carrega a fila de abrigos que aguardam decisão.',
    },
    {
      state: 'loaded',
      title: 'Abrigos por rever',
      message: 'Existem abrigos pendentes de análise.',
    },
    {
      state: 'empty',
      title: 'Sem abrigos pendentes',
      message: 'Não existem abrigos à espera de revisão.',
    },
    {
      state: 'forbidden',
      title: 'Acesso reservado',
      message: 'Esta fila está disponível apenas para administradores.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Ocorreu um erro ao carregar os abrigos pendentes.',
    },
  ],
};

export type WebAdminPendingSheltersIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type WebAdminPendingShelterListItem = AdminPendingShelterClientSummary & {
  reviewHref: string;
};

export type WebAdminPendingSheltersLoadedState = {
  state: 'loaded';
  title: string;
  shelters: WebAdminPendingShelterListItem[];
  total: number;
  query: AdminPendingSheltersClientQuery;
};

export type WebAdminPendingSheltersEmptyState = {
  state: 'empty';
  title: string;
  message: string;
  query: AdminPendingSheltersClientQuery;
};

export type WebAdminPendingSheltersForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type WebAdminPendingSheltersFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: Exclude<AdminPendingSheltersClientFailureStatus, 'forbidden'>;
  reasons: string[];
  canRetry: true;
};

export type WebAdminPendingSheltersState =
  | WebAdminPendingSheltersIdleState
  | WebAdminPendingSheltersLoadedState
  | WebAdminPendingSheltersEmptyState
  | WebAdminPendingSheltersForbiddenState
  | WebAdminPendingSheltersFailedState;

export type WebAdminPendingSheltersResultViewModel =
  | WebAdminPendingSheltersLoadedState
  | WebAdminPendingSheltersEmptyState
  | WebAdminPendingSheltersForbiddenState
  | WebAdminPendingSheltersFailedState;

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
  const safe = reasons.filter((reason) => {
    const normalized = reason.toLowerCase();
    return !unsafeReasonMarkers.some((marker) => normalized.includes(marker));
  });

  return safe.length > 0 ? safe : [fallback];
};

const toListItem = (
  shelter: AdminPendingShelterClientSummary,
): WebAdminPendingShelterListItem => ({
  ...shelter,
  reviewHref: `/abrigos/${shelter.id}/verificar`,
});

export const createWebAdminPendingSheltersUi = ({
  adminPendingSheltersClient,
}: {
  adminPendingSheltersClient: Pick<AdminPendingSheltersClient, 'loadPendingShelters'>;
}) => ({
  getInitialState: (): WebAdminPendingSheltersIdleState => ({
    state: 'idle',
    title: 'Abrigos por rever',
    message: 'Carrega a fila de abrigos que aguardam decisão.',
    primaryAction: 'Carregar abrigos',
  }),

  loadPendingShelters: async (
    query: AdminPendingSheltersClientQuery = {},
  ): Promise<WebAdminPendingSheltersResultViewModel> => {
    const result = await adminPendingSheltersClient.loadPendingShelters(query);

    if (!result.ok) {
      if (result.status === 'forbidden') {
        return {
          state: 'forbidden',
          title: 'Acesso reservado',
          message: 'Esta fila está disponível apenas para administradores.',
        };
      }

      return {
        state: 'failed',
        title: 'Não foi possível carregar',
        message: 'Ocorreu um erro ao carregar os abrigos pendentes.',
        status: result.status,
        reasons: sanitizeReasons(result.reasons, result.status),
        canRetry: true,
      };
    }

    if (result.shelters.length === 0) {
      return {
        state: 'empty',
        title: 'Sem abrigos pendentes',
        message: 'Não existem abrigos à espera de revisão.',
        query,
      };
    }

    return {
      state: 'loaded',
      title: 'Abrigos por rever',
      shelters: result.shelters.map(toListItem),
      total: result.total,
      query,
    };
  },
});
