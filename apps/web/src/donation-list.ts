import type {
  DonationListClient,
  DonationListApplication,
  DonationListClientFailureStatus,
  DonationListQuery,
} from '@pic4paws/client';

export type WebDonationListUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webDonationListUiContent: WebDonationListUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Donativos recebidos',
  description: 'Consulta e gere os donativos recebidos pelo abrigo.',
  states: [
    {
      state: 'idle',
      title: 'Donativos recebidos',
      message: 'Consulta os donativos recebidos para este abrigo.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A obter os donativos.',
    },
    {
      state: 'loaded',
      title: 'Donativos recebidos',
      message: 'Lista de donativos recebidos.',
    },
    {
      state: 'empty',
      title: 'Sem donativos',
      message: 'Ainda não existem donativos para este abrigo.',
    },
    {
      state: 'forbidden',
      title: 'Acesso negado',
      message: 'Não tens permissão para ver os donativos deste abrigo.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type WebDonationListIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type WebDonationListLoadingState = {
  state: 'loading';
  title: string;
  message: string;
};

export type WebDonationListLoadedState = {
  state: 'loaded';
  title: string;
  message: string;
  donations: DonationListApplication[];
  total: number;
};

export type WebDonationListEmptyState = {
  state: 'empty';
  title: string;
  message: string;
};

export type WebDonationListForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type WebDonationListFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: DonationListClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebDonationListResultViewModel =
  | WebDonationListIdleState
  | WebDonationListLoadingState
  | WebDonationListLoadedState
  | WebDonationListEmptyState
  | WebDonationListForbiddenState
  | WebDonationListFailedState;

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

export const createWebDonationListUi = ({
  donationListClient,
}: {
  donationListClient: Pick<DonationListClient, 'loadDonations'>;
}) => ({
  getInitialState: (): WebDonationListIdleState => ({
    state: 'idle',
    title: 'Donativos recebidos',
    message: 'Consulta os donativos recebidos para este abrigo.',
    primaryAction: 'Carregar donativos',
  }),

  loadDonations: async (
    shelterId: string,
    query?: DonationListQuery,
  ): Promise<
    | WebDonationListLoadedState
    | WebDonationListEmptyState
    | WebDonationListForbiddenState
    | WebDonationListFailedState
  > => {
    const result = await donationListClient.loadDonations(shelterId, query);

    if (result.ok) {
      if (result.donations.length === 0) {
        return {
          state: 'empty',
          title: 'Sem donativos',
          message: 'Ainda não existem donativos para este abrigo.',
        };
      }

      return {
        state: 'loaded',
        title: 'Donativos recebidos',
        message: `${result.total} donativo(s) encontrado(s).`,
        donations: result.donations,
        total: result.total,
      };
    }

    if (result.status === 'forbidden') {
      return {
        state: 'forbidden',
        title: 'Acesso negado',
        message: 'Não tens permissão para ver os donativos deste abrigo.',
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
