import type {
  PetProfileClient,
  PetProfileClientFailureStatus,
  PetProfilePet,
} from '@pic4paws/client';

export type MobilePetProfileUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobilePetProfileUiContent: MobilePetProfileUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Perfil do animal',
  description: 'Visualiza o perfil completo de um animal publicado.',
  states: [
    {
      state: 'idle',
      title: 'Perfil do animal',
      message: 'Pesquisa um animal para ver o seu perfil.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A carregar o perfil do animal.',
    },
    {
      state: 'loaded',
      title: 'Perfil carregado',
      message: '',
    },
    {
      state: 'not_found',
      title: 'Animal não encontrado',
      message: 'Este animal pode ter sido removido ou não está disponível.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type MobilePetProfileIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobilePetProfileLoadedState = {
  state: 'loaded';
  title: string;
  pet: PetProfilePet;
};

export type MobilePetProfileNotFoundState = {
  state: 'not_found';
  title: string;
  message: string;
};

export type MobilePetProfileFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: PetProfileClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobilePetProfileResultViewModel =
  | MobilePetProfileIdleState
  | MobilePetProfileLoadedState
  | MobilePetProfileNotFoundState
  | MobilePetProfileFailedState;

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

export const createMobilePetProfileUi = ({
  profileClient,
}: {
  profileClient: Pick<PetProfileClient, 'loadProfile'>;
}) => ({
  getInitialState: (): MobilePetProfileIdleState => ({
    state: 'idle',
    title: 'Perfil do animal',
    message: 'Pesquisa um animal para ver o seu perfil.',
    primaryAction: 'Ver perfil',
  }),
  loadProfile: async (petId: string): Promise<MobilePetProfileResultViewModel> => {
    const result = await profileClient.loadProfile(petId);

    if (result.ok) {
      return {
        state: 'loaded',
        title: result.pet.name ?? 'Animal',
        pet: result.pet,
      };
    }

    if (result.status === 'pet_not_found') {
      return {
        state: 'not_found',
        title: 'Animal não encontrado',
        message: 'Este animal pode ter sido removido ou não está disponível.',
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
