import type {
  SavePaymentConfigClient,
  LoadPaymentConfigClient,
  ShelterPaymentConfigClientInput,
  ShelterPaymentConfigClientFailureStatus,
  LoadPaymentConfigClientFailureStatus,
} from '@pic4paws/client';

// ─── Content ──────────────────────────────────────────────────────────────────

export type WebShelterPaymentConfigUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webShelterPaymentConfigUiContent: WebShelterPaymentConfigUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Configuração de pagamento',
  description: 'Configura o IBAN e o telefone MB WAY para receber donativos.',
  states: [
    {
      state: 'idle',
      title: 'Configuração de pagamento',
      message: 'Introduz os dados de pagamento do abrigo.',
    },
    {
      state: 'saving',
      title: 'A guardar...',
      message: 'A guardar a configuração de pagamento.',
    },
    {
      state: 'saved',
      title: 'Configuração guardada',
      message: 'Os dados de pagamento foram guardados com sucesso.',
    },
    {
      state: 'failed',
      title: 'Não foi possível guardar',
      message: 'Ocorreu um erro ao guardar a configuração.',
    },
    {
      state: 'forbidden',
      title: 'Sem permissão',
      message: 'Não tens permissão para configurar os pagamentos deste abrigo.',
    },
  ],
};

// ─── State types ──────────────────────────────────────────────────────────────

export type WebShelterPaymentConfigIdleState = {
  state: 'idle';
  title: string;
  iban: string;
  mbWayPhone: string;
};

export type WebShelterPaymentConfigSavingState = {
  state: 'saving';
  title: string;
};

export type WebShelterPaymentConfigSavedState = {
  state: 'saved';
  title: string;
  message: string;
};

export type WebShelterPaymentConfigFailureStatus =
  | ShelterPaymentConfigClientFailureStatus
  | LoadPaymentConfigClientFailureStatus;

export type WebShelterPaymentConfigFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: WebShelterPaymentConfigFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebShelterPaymentConfigForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type WebShelterPaymentConfigState =
  | WebShelterPaymentConfigIdleState
  | WebShelterPaymentConfigSavingState
  | WebShelterPaymentConfigSavedState
  | WebShelterPaymentConfigFailedState
  | WebShelterPaymentConfigForbiddenState;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createWebShelterPaymentConfigUi = ({
  saveConfigClient,
  loadConfigClient,
}: {
  saveConfigClient: Pick<SavePaymentConfigClient, 'savePaymentConfig'>;
  loadConfigClient: Pick<LoadPaymentConfigClient, 'loadPaymentConfig'>;
}) => ({
  loadConfig: async (
    shelterId: string,
  ): Promise<
    | WebShelterPaymentConfigIdleState
    | WebShelterPaymentConfigFailedState
    | WebShelterPaymentConfigForbiddenState
  > => {
    const result = await loadConfigClient.loadPaymentConfig(shelterId);

    if (!result.ok) {
      if (result.status === 'forbidden') {
        return {
          state: 'forbidden',
          title: 'Sem permissão',
          message: 'Não tens permissão para ver a configuração de pagamento deste abrigo.',
        };
      }

      if (result.status === 'unauthenticated') {
        return {
          state: 'failed',
          title: 'Sessão expirada',
          message: 'A tua sessão expirou. Inicia sessão de novo.',
          status: result.status,
          reasons: sanitizeReasons(result.reasons, result.status),
          canRetry: true,
        };
      }

      return {
        state: 'failed',
        title: 'Não foi possível carregar',
        message: 'Ocorreu um erro ao carregar a configuração. Tenta de novo.',
        status: result.status,
        reasons: sanitizeReasons(result.reasons, result.status),
        canRetry: true,
      };
    }

    return {
      state: 'idle',
      title: 'Configuração de pagamento',
      iban: result.iban ?? '',
      mbWayPhone: result.mbWayPhone ?? '',
    };
  },

  saveConfig: async (
    shelterId: string,
    input: ShelterPaymentConfigClientInput,
  ): Promise<
    | WebShelterPaymentConfigSavedState
    | WebShelterPaymentConfigFailedState
    | WebShelterPaymentConfigForbiddenState
  > => {
    const result = await saveConfigClient.savePaymentConfig(shelterId, input);

    if (!result.ok) {
      if (result.status === 'forbidden') {
        return {
          state: 'forbidden',
          title: 'Sem permissão',
          message: 'Não tens permissão para configurar os pagamentos deste abrigo.',
        };
      }

      if (result.status === 'unauthenticated') {
        return {
          state: 'failed',
          title: 'Sessão expirada',
          message: 'A tua sessão expirou. Inicia sessão de novo.',
          status: result.status,
          reasons: sanitizeReasons(result.reasons, result.status),
          canRetry: true,
        };
      }

      if (result.status === 'invalid_config') {
        return {
          state: 'failed',
          title: 'Dados inválidos',
          message: 'Verifica o IBAN e o número de telefone introduzidos.',
          status: result.status,
          reasons: sanitizeReasons(result.reasons, result.status),
          canRetry: true,
        };
      }

      return {
        state: 'failed',
        title: 'Não foi possível guardar',
        message: 'Ocorreu um erro ao guardar a configuração. Tenta de novo.',
        status: result.status,
        reasons: sanitizeReasons(result.reasons, result.status),
        canRetry: true,
      };
    }

    return {
      state: 'saved',
      title: 'Configuração guardada',
      message: 'Os dados de pagamento foram guardados com sucesso.',
    };
  },
});
