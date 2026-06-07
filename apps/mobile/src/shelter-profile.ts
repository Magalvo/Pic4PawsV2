import type {
  ShelterProfileClient,
  ShelterProfileClientFailureStatus,
  ShelterProfileClientShelter,
} from '@pic4paws/client';

export type MobileShelterProfileUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileShelterProfileUiContent: MobileShelterProfileUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Perfil do abrigo',
  description: 'Visualiza o perfil completo de um abrigo.',
  states: [
    {
      state: 'idle',
      title: 'Perfil do abrigo',
      message: 'Pesquisa um abrigo para ver o seu perfil.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A carregar o perfil do abrigo.',
    },
    {
      state: 'loaded',
      title: 'Perfil carregado',
      message: '',
    },
    {
      state: 'not_found',
      title: 'Abrigo não encontrado',
      message: 'Este abrigo pode ter sido removido ou não está disponível.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type MobileShelterProfileIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobileShelterProfileLoadedState = {
  state: 'loaded';
  title: string;
  shelter: ShelterProfileClientShelter;
};

export type MobileShelterProfileNotFoundState = {
  state: 'not_found';
  title: string;
  message: string;
};

export type MobileShelterProfileFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: ShelterProfileClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileShelterProfileResultViewModel =
  | MobileShelterProfileIdleState
  | MobileShelterProfileLoadedState
  | MobileShelterProfileNotFoundState
  | MobileShelterProfileFailedState;

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

export const createMobileShelterProfileUi = ({
  shelterProfileClient,
}: {
  shelterProfileClient: Pick<ShelterProfileClient, 'loadProfile'>;
}) => ({
  getInitialState: (): MobileShelterProfileIdleState => ({
    state: 'idle',
    title: 'Perfil do abrigo',
    message: 'Pesquisa um abrigo para ver o seu perfil.',
    primaryAction: 'Ver abrigo',
  }),
  loadProfile: async (shelterId: string): Promise<MobileShelterProfileResultViewModel> => {
    const result = await shelterProfileClient.loadProfile(shelterId);

    if (result.ok) {
      return {
        state: 'loaded',
        title: result.shelter.name,
        shelter: result.shelter,
      };
    }

    if (result.status === 'shelter_not_found') {
      return {
        state: 'not_found',
        title: 'Abrigo não encontrado',
        message: 'Este abrigo pode ter sido removido ou não está disponível.',
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
