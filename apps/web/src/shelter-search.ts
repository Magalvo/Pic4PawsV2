import type {
  ShelterSearchClient,
  ShelterSearchClientFailureStatus,
  ShelterSearchClientQuery,
  ShelterSearchClientShelter,
} from '@pic4paws/client';

export type WebShelterSearchUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webShelterSearchUiContent: WebShelterSearchUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Pesquisa de abrigos',
  description: 'Explora abrigos verificados disponíveis na plataforma.',
  states: [
    {
      state: 'idle',
      title: 'Pesquisar abrigos',
      message: 'Descobre os abrigos verificados disponíveis.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A procurar abrigos disponíveis.',
    },
    {
      state: 'loaded',
      title: 'Abrigos disponíveis',
      message: '',
    },
    {
      state: 'empty',
      title: 'Nenhum abrigo encontrado',
      message: 'Tenta ajustar os filtros ou volta mais tarde.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type WebShelterSearchIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type WebShelterSearchLoadedState = {
  state: 'loaded';
  title: string;
  shelters: ShelterSearchClientShelter[];
  total: number;
  query: ShelterSearchClientQuery;
};

export type WebShelterSearchEmptyState = {
  state: 'empty';
  title: string;
  message: string;
  query: ShelterSearchClientQuery;
};

export type WebShelterSearchFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: ShelterSearchClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebShelterSearchResultViewModel =
  | WebShelterSearchLoadedState
  | WebShelterSearchEmptyState
  | WebShelterSearchFailedState;

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

export const createWebShelterSearchUi = ({
  shelterSearchClient,
}: {
  shelterSearchClient: Pick<ShelterSearchClient, 'searchShelters'>;
}) => ({
  getInitialState: (): WebShelterSearchIdleState => ({
    state: 'idle',
    title: 'Pesquisar abrigos',
    message: 'Descobre os abrigos verificados disponíveis.',
    primaryAction: 'Ver abrigos',
  }),
  searchShelters: async (
    query: ShelterSearchClientQuery,
  ): Promise<WebShelterSearchResultViewModel> => {
    const result = await shelterSearchClient.searchShelters(query);

    if (!result.ok) {
      return {
        state: 'failed',
        title: 'Não foi possível carregar',
        message: 'Verifica a tua ligação e tenta de novo.',
        status: result.status,
        reasons: sanitizeReasons(result.reasons, result.status),
        canRetry: true,
      };
    }

    if (result.shelters.length === 0) {
      return {
        state: 'empty',
        title: 'Nenhum abrigo encontrado',
        message: 'Tenta ajustar os filtros ou volta mais tarde.',
        query,
      };
    }

    return {
      state: 'loaded',
      title: 'Abrigos disponíveis',
      shelters: result.shelters,
      total: result.total,
      query,
    };
  },
});
