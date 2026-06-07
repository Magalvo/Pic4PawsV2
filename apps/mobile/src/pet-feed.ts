import type {
  PetFeedClient,
  PetFeedClientFailureStatus,
  PetFeedClientQuery,
  PetFeedPet,
} from '@pic4paws/client';

export type MobilePetFeedUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobilePetFeedUiContent: MobilePetFeedUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Feed de animais',
  description: 'Explora animais publicados disponíveis para adoção.',
  states: [
    {
      state: 'idle',
      title: 'Explorar animais',
      message: 'Descobre os animais disponíveis para adoção.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A procurar animais disponíveis.',
    },
    {
      state: 'loaded',
      title: 'Animais disponíveis',
      message: '',
    },
    {
      state: 'empty',
      title: 'Nenhum animal encontrado',
      message: 'Tenta ajustar os filtros ou volta mais tarde.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type MobilePetFeedIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobilePetFeedLoadedState = {
  state: 'loaded';
  title: string;
  pets: PetFeedPet[];
  total: number;
  query: PetFeedClientQuery;
};

export type MobilePetFeedEmptyState = {
  state: 'empty';
  title: string;
  message: string;
  query: PetFeedClientQuery;
};

export type MobilePetFeedFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: PetFeedClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobilePetFeedResultViewModel =
  | MobilePetFeedIdleState
  | MobilePetFeedLoadedState
  | MobilePetFeedEmptyState
  | MobilePetFeedFailedState;

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

export const createMobilePetFeedUi = ({
  feedClient,
}: {
  feedClient: Pick<PetFeedClient, 'loadFeed'>;
}) => ({
  getInitialState: (): MobilePetFeedIdleState => ({
    state: 'idle',
    title: 'Explorar animais',
    message: 'Descobre os animais disponíveis para adoção.',
    primaryAction: 'Ver animais',
  }),
  loadFeed: async ({
    query,
  }: {
    query: PetFeedClientQuery;
  }): Promise<MobilePetFeedResultViewModel> => {
    const result = await feedClient.loadFeed(query);

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

    if (result.pets.length === 0) {
      return {
        state: 'empty',
        title: 'Nenhum animal encontrado',
        message: 'Tenta ajustar os filtros ou volta mais tarde.',
        query,
      };
    }

    return {
      state: 'loaded',
      title: 'Animais disponíveis',
      pets: result.pets,
      total: result.total,
      query,
    };
  },
});
