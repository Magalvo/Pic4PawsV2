import type {
  AdminPendingShelterClientSummary,
  AdminPendingSheltersClient,
  AdminPendingSheltersClientFailureStatus,
  AdminPendingSheltersClientQuery,
} from '@pic4paws/client';

export type MobileAdminPendingSheltersUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileAdminPendingSheltersUiContent: MobileAdminPendingSheltersUiContent = {
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

export type MobileAdminPendingSheltersIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobileAdminPendingShelterListItem = AdminPendingShelterClientSummary & {
  reviewHref: string;
};

export type MobileAdminPendingSheltersLoadedState = {
  state: 'loaded';
  title: string;
  shelters: MobileAdminPendingShelterListItem[];
  total: number;
  query: AdminPendingSheltersClientQuery;
};

export type MobileAdminPendingSheltersEmptyState = {
  state: 'empty';
  title: string;
  message: string;
  query: AdminPendingSheltersClientQuery;
};

export type MobileAdminPendingSheltersForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type MobileAdminPendingSheltersFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: Exclude<AdminPendingSheltersClientFailureStatus, 'forbidden'>;
  reasons: string[];
  canRetry: true;
};

export type MobileAdminPendingSheltersState =
  | MobileAdminPendingSheltersIdleState
  | MobileAdminPendingSheltersLoadedState
  | MobileAdminPendingSheltersEmptyState
  | MobileAdminPendingSheltersForbiddenState
  | MobileAdminPendingSheltersFailedState;

export type MobileAdminPendingSheltersResultViewModel =
  | MobileAdminPendingSheltersLoadedState
  | MobileAdminPendingSheltersEmptyState
  | MobileAdminPendingSheltersForbiddenState
  | MobileAdminPendingSheltersFailedState;

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
): MobileAdminPendingShelterListItem => ({
  ...shelter,
  reviewHref: `/abrigos/${shelter.id}/verificar`,
});

export const createMobileAdminPendingSheltersUi = ({
  adminPendingSheltersClient,
}: {
  adminPendingSheltersClient: Pick<AdminPendingSheltersClient, 'loadPendingShelters'>;
}) => ({
  getInitialState: (): MobileAdminPendingSheltersIdleState => ({
    state: 'idle',
    title: 'Abrigos por rever',
    message: 'Carrega a fila de abrigos que aguardam decisão.',
    primaryAction: 'Carregar abrigos',
  }),

  loadPendingShelters: async (
    query: AdminPendingSheltersClientQuery = {},
  ): Promise<MobileAdminPendingSheltersResultViewModel> => {
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
