import type {
  SponsorshipClientStatus,
  SponsorshipManageClient,
  SponsorshipManageClientFailureStatus,
} from '@pic4paws/client';

export type WebSponsorshipManageUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webSponsorshipManageUiContent: WebSponsorshipManageUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Gerir apadrinhamento',
  description: 'Cancela, pausa ou retoma um apadrinhamento recorrente.',
  states: [
    {
      state: 'idle',
      title: 'Gerir apadrinhamento',
      message: 'Seleciona a ação a aplicar ao apadrinhamento.',
    },
    {
      state: 'submitting',
      title: 'A processar...',
      message: 'A atualizar o estado do apadrinhamento.',
    },
    {
      state: 'succeeded',
      title: 'Apadrinhamento atualizado!',
      message: 'O estado do apadrinhamento foi atualizado com sucesso.',
    },
    {
      state: 'failed',
      title: 'Não foi possível atualizar',
      message: 'Verifica a tua ligação e tenta de novo.',
    },
  ],
};

export type WebSponsorshipManageIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type WebSponsorshipManageSubmittingState = {
  state: 'submitting';
  title: string;
  message: string;
};

export type WebSponsorshipManageSucceededState = {
  state: 'succeeded';
  title: string;
  message: string;
  sponsorshipId: string;
  newStatus: SponsorshipClientStatus;
};

export type WebSponsorshipManageFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: SponsorshipManageClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebSponsorshipManageResultViewModel =
  | WebSponsorshipManageIdleState
  | WebSponsorshipManageSubmittingState
  | WebSponsorshipManageSucceededState
  | WebSponsorshipManageFailedState;

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

export const createWebSponsorshipManageUi = ({
  sponsorshipManageClient,
}: {
  sponsorshipManageClient: Pick<SponsorshipManageClient, 'manageSponsorship'>;
}) => ({
  getInitialState: (): WebSponsorshipManageIdleState => ({
    state: 'idle',
    title: 'Gerir apadrinhamento',
    message: 'Seleciona a ação a aplicar ao apadrinhamento.',
    primaryAction: 'Gerir apadrinhamento',
  }),

  manageSponsorship: async (
    sponsorshipId: string,
    status: SponsorshipClientStatus,
  ): Promise<WebSponsorshipManageSucceededState | WebSponsorshipManageFailedState> => {
    const result = await sponsorshipManageClient.manageSponsorship(sponsorshipId, status);

    if (result.ok) {
      return {
        state: 'succeeded',
        title: 'Apadrinhamento atualizado!',
        message: 'O estado do apadrinhamento foi atualizado com sucesso.',
        sponsorshipId: result.sponsorshipId,
        newStatus: result.newStatus,
      };
    }

    return {
      state: 'failed',
      title: 'Não foi possível atualizar',
      message: 'Verifica a tua ligação e tenta de novo.',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },
});
