import type {
  ShelterPetListClient,
  ShelterPetListClientFailureStatus,
  ShelterPetClientSummary,
  ShelterPetListQuery,
} from '@pic4paws/client';

export type WebShelterPetListUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webShelterPetListUiContent: WebShelterPetListUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Animais do abrigo',
  description: 'Gere os perfis de animais do teu abrigo.',
  states: [
    {
      state: 'idle',
      title: 'Animais do abrigo',
      message: 'Carrega a lista de animais para começar a gerir.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A carregar a lista de animais.',
    },
    {
      state: 'loaded',
      title: 'Animais do abrigo',
      message: '',
    },
    {
      state: 'empty',
      title: 'Nenhum animal encontrado',
      message: 'Ainda não há animais neste abrigo. Cria o primeiro rascunho.',
    },
    {
      state: 'forbidden',
      title: 'Sem permissão',
      message: 'Não tens permissão para ver os animais deste abrigo.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type WebShelterPetListIdleState = {
  state: 'idle';
  title: string;
  message: string;
};

export type WebShelterPetListLoadedState = {
  state: 'loaded';
  title: string;
  pets: ShelterPetClientSummary[];
  total: number;
  query: ShelterPetListQuery;
};

export type WebShelterPetListEmptyState = {
  state: 'empty';
  title: string;
  message: string;
  query: ShelterPetListQuery;
};

export type WebShelterPetListForbiddenState = {
  state: 'forbidden';
  message: string;
};

export type WebShelterPetListFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: ShelterPetListClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebShelterPetListResultViewModel =
  | WebShelterPetListLoadedState
  | WebShelterPetListEmptyState
  | WebShelterPetListForbiddenState
  | WebShelterPetListFailedState;

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

export const createWebShelterPetListUi = ({
  shelterPetListClient,
}: {
  shelterPetListClient: Pick<ShelterPetListClient, 'loadShelterPets'>;
}) => ({
  getInitialState: (): WebShelterPetListIdleState => ({
    state: 'idle',
    title: 'Animais do abrigo',
    message: 'Carrega a lista de animais para começar a gerir.',
  }),

  loadShelterPets: async (
    shelterId: string,
    query: ShelterPetListQuery = {},
  ): Promise<WebShelterPetListResultViewModel> => {
    const result = await shelterPetListClient.loadShelterPets(shelterId, query);

    if (!result.ok) {
      if (result.status === 'forbidden') {
        return {
          state: 'forbidden',
          message: 'Não tens permissão para ver os animais deste abrigo.',
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
    }

    if (result.pets.length === 0) {
      return {
        state: 'empty',
        title: 'Nenhum animal encontrado',
        message: 'Ainda não há animais neste abrigo. Cria o primeiro rascunho.',
        query,
      };
    }

    return {
      state: 'loaded',
      title: 'Animais do abrigo',
      pets: result.pets,
      total: result.total,
      query,
    };
  },
});
