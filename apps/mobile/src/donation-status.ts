import type {
  DonationStatusClient,
  DonationStatusClientFailureStatus,
  DonationStatusClientItem,
} from '@pic4paws/client';

export type MobileDonationStatusUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileDonationStatusUiContent: MobileDonationStatusUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Estado do donativo',
  description: 'Consulta o estado do teu donativo.',
  states: [
    {
      state: 'idle',
      title: 'Estado do donativo',
      message: 'Consulta o estado do teu donativo.',
    },
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A obter o estado do donativo.',
    },
    {
      state: 'loaded',
      title: 'Donativo encontrado',
      message: 'Detalhes do donativo.',
    },
    {
      state: 'not_found',
      title: 'Donativo não encontrado',
      message: 'O donativo que procuras não existe ou foi removido.',
    },
    {
      state: 'forbidden',
      title: 'Acesso negado',
      message: 'Não tens permissão para ver este donativo.',
    },
    {
      state: 'failed',
      title: 'Não foi possível carregar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type MobileDonationStatusIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobileDonationStatusLoadingState = {
  state: 'loading';
  title: string;
  message: string;
};

export type MobileDonationStatusLoadedState = {
  state: 'loaded';
  title: string;
  message: string;
  donation: DonationStatusClientItem;
};

export type MobileDonationStatusNotFoundState = {
  state: 'not_found';
  title: string;
  message: string;
};

export type MobileDonationStatusForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type MobileDonationStatusFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: DonationStatusClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileDonationStatusResultViewModel =
  | MobileDonationStatusIdleState
  | MobileDonationStatusLoadingState
  | MobileDonationStatusLoadedState
  | MobileDonationStatusNotFoundState
  | MobileDonationStatusForbiddenState
  | MobileDonationStatusFailedState;

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

export const createMobileDonationStatusUi = ({
  donationStatusClient,
}: {
  donationStatusClient: Pick<DonationStatusClient, 'loadDonationStatus'>;
}) => ({
  getInitialState: (): MobileDonationStatusIdleState => ({
    state: 'idle',
    title: 'Estado do donativo',
    message: 'Consulta o estado do teu donativo.',
    primaryAction: 'Ver donativo',
  }),

  loadDonationStatus: async (
    donationId: string,
  ): Promise<
    | MobileDonationStatusLoadedState
    | MobileDonationStatusNotFoundState
    | MobileDonationStatusForbiddenState
    | MobileDonationStatusFailedState
  > => {
    const result = await donationStatusClient.loadDonationStatus(donationId);

    if (result.ok) {
      return {
        state: 'loaded',
        title: 'Donativo encontrado',
        message: 'Detalhes do donativo.',
        donation: result.donation,
      };
    }

    if (result.status === 'donation_not_found') {
      return {
        state: 'not_found',
        title: 'Donativo não encontrado',
        message: 'O donativo que procuras não existe ou foi removido.',
      };
    }

    if (result.status === 'forbidden') {
      return {
        state: 'forbidden',
        title: 'Acesso negado',
        message: 'Não tens permissão para ver este donativo.',
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
