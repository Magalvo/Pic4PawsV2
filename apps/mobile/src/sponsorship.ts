import type {
  SponsorshipClient,
  SponsorshipClientFailureStatus,
  SponsorshipClientInput,
  SponsorshipClientRecurringInterval,
} from '@pic4paws/client';

export type MobileSponsorshipUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileSponsorshipUiContent: MobileSponsorshipUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Apadrinhamento',
  description: 'Torna-te padrinho de um abrigo ou de um animal com uma contribuição recorrente.',
  states: [
    {
      state: 'idle',
      title: 'Apadrinhar',
      message: 'Escolhe o valor e a frequência para o teu apadrinhamento.',
    },
    {
      state: 'submitting',
      title: 'A processar...',
      message: 'A processar o teu apadrinhamento.',
    },
    {
      state: 'submitted',
      title: 'Apadrinhamento ativo!',
      message: 'O teu apadrinhamento foi criado com sucesso. Obrigado pelo teu apoio contínuo!',
    },
    {
      state: 'failed',
      title: 'Não foi possível processar',
      message: 'Verifica os dados e tenta de novo.',
    },
  ],
};

export type MobileSponsorshipIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobileSponsorshipSubmittingState = {
  state: 'submitting';
  title: string;
  message: string;
};

export type MobileSponsorshipSubmittedState = {
  state: 'submitted';
  title: string;
  message: string;
  sponsorshipId: string;
  amountCents: number;
  currency: string;
  recurringInterval: SponsorshipClientRecurringInterval;
  shelterId: string;
  createdAt: string;
};

export type MobileSponsorshipFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: SponsorshipClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileSponsorshipResultViewModel =
  | MobileSponsorshipIdleState
  | MobileSponsorshipSubmittingState
  | MobileSponsorshipSubmittedState
  | MobileSponsorshipFailedState;

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

export const createMobileSponsorshipUi = ({
  sponsorshipClient,
}: {
  sponsorshipClient: Pick<SponsorshipClient, 'submitSponsorship'>;
}) => ({
  getInitialState: (): MobileSponsorshipIdleState => ({
    state: 'idle',
    title: 'Apadrinhar',
    message: 'Escolhe o valor e a frequência para o teu apadrinhamento.',
    primaryAction: 'Apadrinhar',
  }),

  submitSponsorship: async (
    input: SponsorshipClientInput,
  ): Promise<MobileSponsorshipSubmittedState | MobileSponsorshipFailedState> => {
    const result = await sponsorshipClient.submitSponsorship(input);

    if (result.ok) {
      return {
        state: 'submitted',
        title: 'Apadrinhamento ativo!',
        message: 'O teu apadrinhamento foi criado com sucesso. Obrigado pelo teu apoio contínuo!',
        sponsorshipId: result.sponsorshipId,
        amountCents: result.amountCents,
        currency: result.currency,
        recurringInterval: result.recurringInterval,
        shelterId: result.shelterId,
        createdAt: result.createdAt,
      };
    }

    return {
      state: 'failed',
      title: 'Não foi possível processar',
      message: 'Verifica os dados e tenta de novo.',
      status: result.status,
      reasons: sanitizeReasons(result.reasons, result.status),
      canRetry: true,
    };
  },
});
