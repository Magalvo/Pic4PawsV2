import type {
  UserRegistrationClient,
  UserRegistrationClientInput,
  RegisterUserClientFailureStatus,
} from '@pic4paws/client';

export type MobileUserRegistrationUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileUserRegistrationUiContent: MobileUserRegistrationUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Criar conta',
  description: 'Regista-te na plataforma Pic4Paws como adotante.',
  states: [
    {
      state: 'idle',
      title: 'Criar conta',
      message: 'Preenche os dados para criar a tua conta.',
    },
    {
      state: 'submitting',
      title: 'A criar conta...',
      message: 'A submeter os teus dados.',
    },
    {
      state: 'registered',
      title: 'Conta criada!',
      message: 'A tua conta foi criada com sucesso. Entra para começar.',
    },
    {
      state: 'failed',
      title: 'Não foi possível criar a conta',
      message: 'Ocorreu um erro ao criar a conta.',
    },
  ],
};

export type MobileUserRegistrationIdleState = {
  state: 'idle';
  title: string;
};

export type MobileUserRegistrationRegisteredState = {
  state: 'registered';
  title: string;
  message: string;
};

export type MobileUserRegistrationFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: RegisterUserClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileUserRegistrationState =
  | MobileUserRegistrationIdleState
  | MobileUserRegistrationRegisteredState
  | MobileUserRegistrationFailedState;

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

export const createMobileUserRegistrationUi = ({
  userRegistrationClient,
}: {
  userRegistrationClient: Pick<UserRegistrationClient, 'registerUser'>;
}) => ({
  getInitialState: (): MobileUserRegistrationIdleState => ({
    state: 'idle',
    title: 'Criar conta',
  }),

  registerUser: async (
    input: UserRegistrationClientInput,
  ): Promise<MobileUserRegistrationRegisteredState | MobileUserRegistrationFailedState> => {
    const result = await userRegistrationClient.registerUser(input);

    if (!result.ok) {
      if (result.status === 'email_already_registered') {
        return {
          state: 'failed',
          title: 'Email já registado',
          message: 'Já existe uma conta com este email. Entra na tua conta ou recupera a palavra-passe.',
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
        title: 'Não foi possível criar a conta',
        message: 'Ocorreu um erro ao criar a conta. Tenta de novo.',
        status: result.status,
        reasons: sanitizeReasons(result.reasons, result.status),
        canRetry: true,
      };
    }

    return {
      state: 'registered',
      title: 'Conta criada!',
      message: 'A tua conta foi criada com sucesso. Entra para começar.',
    };
  },
});
