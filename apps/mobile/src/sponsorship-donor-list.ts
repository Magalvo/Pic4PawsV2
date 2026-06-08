import type {
  SponsorshipDonorListClient,
  SponsorshipDonorListClientFailureStatus,
  SponsorshipDonorListQuery,
  SponsorshipListItem,
} from '@pic4paws/client';

export type MobileSponsorshipDonorListUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileSponsorshipDonorListUiContent: MobileSponsorshipDonorListUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Os meus apadrinhamentos',
  description: 'Consulta os teus apadrinhamentos recorrentes.',
  states: [
    {
      state: 'idle',
      title: 'Os meus apadrinhamentos',
      message: 'Carrega para ver os teus apadrinhamentos.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A obter os teus apadrinhamentos.',
    },
    {
      state: 'loaded',
      title: 'Os meus apadrinhamentos',
      message: 'Lista dos teus apadrinhamentos recorrentes.',
    },
    {
      state: 'empty',
      title: 'Sem apadrinhamentos',
      message: 'Ainda não tens nenhum apadrinhamento ativo.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type MobileSponsorshipDonorListIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobileSponsorshipDonorListLoadingState = {
  state: 'loading';
  title: string;
  message: string;
};

export type MobileSponsorshipDonorListLoadedState = {
  state: 'loaded';
  title: string;
  message: string;
  sponsorships: SponsorshipListItem[];
  total: number;
};

export type MobileSponsorshipDonorListEmptyState = {
  state: 'empty';
  title: string;
  message: string;
};

export type MobileSponsorshipDonorListFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: SponsorshipDonorListClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileSponsorshipDonorListResultViewModel =
  | MobileSponsorshipDonorListIdleState
  | MobileSponsorshipDonorListLoadingState
  | MobileSponsorshipDonorListLoadedState
  | MobileSponsorshipDonorListEmptyState
  | MobileSponsorshipDonorListFailedState;

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

export const createMobileSponsorshipDonorListUi = ({
  sponsorshipDonorListClient,
}: {
  sponsorshipDonorListClient: Pick<SponsorshipDonorListClient, 'loadDonorSponsorships'>;
}) => ({
  getInitialState: (): MobileSponsorshipDonorListIdleState => ({
    state: 'idle',
    title: 'Os meus apadrinhamentos',
    message: 'Carrega para ver os teus apadrinhamentos.',
    primaryAction: 'Carregar apadrinhamentos',
  }),

  loadDonorSponsorships: async (
    query?: SponsorshipDonorListQuery,
  ): Promise<
    | MobileSponsorshipDonorListLoadedState
    | MobileSponsorshipDonorListEmptyState
    | MobileSponsorshipDonorListFailedState
  > => {
    const result = await sponsorshipDonorListClient.loadDonorSponsorships(query);

    if (result.ok) {
      if (result.sponsorships.length === 0) {
        return {
          state: 'empty',
          title: 'Sem apadrinhamentos',
          message: 'Ainda não tens nenhum apadrinhamento ativo.',
        };
      }

      return {
        state: 'loaded',
        title: 'Os meus apadrinhamentos',
        message: `${result.total} apadrinhamento(s) encontrado(s).`,
        sponsorships: result.sponsorships,
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
