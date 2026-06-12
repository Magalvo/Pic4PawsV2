import type {
  ShelterRegistrationClient,
  ShelterRegistrationClientInput,
  RegisterShelterClientFailureStatus,
} from '@pic4paws/client';

export type WebShelterRegistrationUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webShelterRegistrationUiContent: WebShelterRegistrationUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Registar abrigo',
  description: 'Regista o teu abrigo na plataforma Pic4Paws.',
  states: [
    {
      state: 'idle',
      title: 'Registar abrigo',
      message: 'Preenche os dados para registar o teu abrigo.',
    },
    {
      state: 'submitting',
      title: 'A registar...',
      message: 'A submeter os dados do abrigo.',
    },
    {
      state: 'registered',
      title: 'Abrigo registado!',
      message: 'O teu abrigo foi registado com sucesso.',
    },
    {
      state: 'failed',
      title: 'Não foi possível registar',
      message: 'Ocorreu um erro ao registar o abrigo.',
    },
  ],
};

export type WebShelterRegistrationIdleState = {
  state: 'idle';
  title: string;
};

export type WebShelterRegistrationSubmittingState = {
  state: 'submitting';
  title: string;
};

export type WebShelterRegistrationRegisteredState = {
  state: 'registered';
  title: string;
  message: string;
  shelterId: string;
};

export type WebShelterRegistrationFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: RegisterShelterClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebShelterRegistrationState =
  | WebShelterRegistrationIdleState
  | WebShelterRegistrationSubmittingState
  | WebShelterRegistrationRegisteredState
  | WebShelterRegistrationFailedState;

const unsafeReasonMarkers = [
  'service-role',
  'service_role',
  'bearer ',
  'r2-secret',
  'r2_secret',
  'r2-access',
  'r2_access',
];

const sanitizeReasons = (reasons: string[], fallback: string): string[] => {
  const safe = reasons.filter((r) => {
    const normalized = r.toLowerCase();
    return !unsafeReasonMarkers.some((marker) => normalized.includes(marker));
  });
  return safe.length > 0 ? safe : [fallback];
};

export const createWebShelterRegistrationUi = ({
  shelterRegistrationClient,
}: {
  shelterRegistrationClient: Pick<ShelterRegistrationClient, 'registerShelter'>;
}) => ({
  getInitialState: (): WebShelterRegistrationIdleState => ({
    state: 'idle',
    title: 'Registar abrigo',
  }),

  registerShelter: async (
    input: ShelterRegistrationClientInput,
  ): Promise<WebShelterRegistrationRegisteredState | WebShelterRegistrationFailedState> => {
    const result = await shelterRegistrationClient.registerShelter(input);

    if (!result.ok) {
      if (result.status === 'unauthenticated') {
        return {
          state: 'failed',
          title: 'Sessão expirada',
          message: 'A tua sessão expirou. Inicia sessão de novo.',
          status: result.status,
          reasons: result.reasons,
          canRetry: true,
        };
      }

      if (result.status === 'invalid_payload') {
        return {
          state: 'failed',
          title: 'Dados inválidos',
          message: 'Verifica os dados introduzidos e tenta de novo.',
          status: result.status,
          reasons: result.reasons,
          canRetry: true,
        };
      }

      return {
        state: 'failed',
        title: 'Não foi possível registar',
        message: 'Ocorreu um erro ao registar o abrigo. Tenta de novo.',
        status: result.status,
        reasons: sanitizeReasons(result.reasons, result.status),
        canRetry: true,
      };
    }

    return {
      state: 'registered',
      title: 'Abrigo registado!',
      message: 'O teu abrigo foi registado com sucesso.',
      shelterId: result.shelterId,
    };
  },
});
