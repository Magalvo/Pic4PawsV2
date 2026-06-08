import type {
  SponsorshipListClient,
  SponsorshipListClientFailureStatus,
  SponsorshipListItem,
  SponsorshipListQuery,
} from '@pic4paws/client';

export type MobileSponsorshipListUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileSponsorshipListUiContent: MobileSponsorshipListUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Apadrinhamentos recebidos',
  description: 'Consulta e gere os apadrinhamentos recebidos pelo abrigo.',
  states: [
    {
      state: 'idle',
      title: 'Apadrinhamentos recebidos',
      message: 'Consulta os apadrinhamentos recebidos para este abrigo.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A obter os apadrinhamentos.',
    },
    {
      state: 'loaded',
      title: 'Apadrinhamentos recebidos',
      message: 'Lista de apadrinhamentos recebidos.',
    },
    {
      state: 'empty',
      title: 'Sem apadrinhamentos',
      message: 'Ainda não existem apadrinhamentos para este abrigo.',
    },
    {
      state: 'forbidden',
      title: 'Acesso negado',
      message: 'Não tens permissão para ver os apadrinhamentos deste abrigo.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type MobileSponsorshipListIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobileSponsorshipListLoadingState = {
  state: 'loading';
  title: string;
  message: string;
};

export type MobileSponsorshipListLoadedState = {
  state: 'loaded';
  title: string;
  message: string;
  sponsorships: SponsorshipListItem[];
  total: number;
};

export type MobileSponsorshipListEmptyState = {
  state: 'empty';
  title: string;
  message: string;
};

export type MobileSponsorshipListForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type MobileSponsorshipListFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: SponsorshipListClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileSponsorshipListResultViewModel =
  | MobileSponsorshipListIdleState
  | MobileSponsorshipListLoadingState
  | MobileSponsorshipListLoadedState
  | MobileSponsorshipListEmptyState
  | MobileSponsorshipListForbiddenState
  | MobileSponsorshipListFailedState;

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

export const createMobileSponsorshipListUi = ({
  sponsorshipListClient,
}: {
  sponsorshipListClient: Pick<SponsorshipListClient, 'loadSponsorships'>;
}) => ({
  getInitialState: (): MobileSponsorshipListIdleState => ({
    state: 'idle',
    title: 'Apadrinhamentos recebidos',
    message: 'Consulta os apadrinhamentos recebidos para este abrigo.',
    primaryAction: 'Carregar apadrinhamentos',
  }),

  loadSponsorships: async (
    shelterId: string,
    query?: SponsorshipListQuery,
  ): Promise<
    | MobileSponsorshipListLoadedState
    | MobileSponsorshipListEmptyState
    | MobileSponsorshipListForbiddenState
    | MobileSponsorshipListFailedState
  > => {
    const result = await sponsorshipListClient.loadSponsorships(shelterId, query);

    if (result.ok) {
      if (result.sponsorships.length === 0) {
        return {
          state: 'empty',
          title: 'Sem apadrinhamentos',
          message: 'Ainda não existem apadrinhamentos para este abrigo.',
        };
      }

      return {
        state: 'loaded',
        title: 'Apadrinhamentos recebidos',
        message: `${result.total} apadrinhamento(s) encontrado(s).`,
        sponsorships: result.sponsorships,
        total: result.total,
      };
    }

    if (result.status === 'forbidden') {
      return {
        state: 'forbidden',
        title: 'Acesso negado',
        message: 'Não tens permissão para ver os apadrinhamentos deste abrigo.',
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
