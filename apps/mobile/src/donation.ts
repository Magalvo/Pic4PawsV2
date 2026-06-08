import type { DonationClient, DonationClientFailureStatus, DonationClientInput } from '@pic4paws/client';

export type MobileDonationUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileDonationUiContent: MobileDonationUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Doação',
  description: 'Efetua uma doação a um abrigo ou patrocina um animal.',
  states: [
    {
      state: 'idle',
      title: 'Fazer uma doação',
      message: 'Escolhe o valor e o método de pagamento para fazer a tua doação.',
    },
    {
      state: 'submitting',
      title: 'A processar...',
      message: 'A processar a tua doação.',
    },
    {
      state: 'submitted',
      title: 'Doação recebida!',
      message: 'A tua doação foi processada com sucesso. Obrigado pelo teu apoio!',
    },
    {
      state: 'failed',
      title: 'Não foi possível processar',
      message: 'Verifica os dados e tenta de novo.',
    },
  ],
};

export type MobileDonationIdleState = {
  state: 'idle';
  title: string;
  message: string;
  primaryAction: string;
};

export type MobileDonationSubmittingState = {
  state: 'submitting';
  title: string;
  message: string;
};

export type MobileDonationSubmittedState = {
  state: 'submitted';
  title: string;
  message: string;
  donationId: string;
  amountCents: number;
  currency: string;
  kind: string;
  shelterId: string;
  createdAt: string;
};

export type MobileDonationFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: DonationClientFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileDonationResultViewModel =
  | MobileDonationIdleState
  | MobileDonationSubmittingState
  | MobileDonationSubmittedState
  | MobileDonationFailedState;

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

export const createMobileDonationUi = ({
  donationClient,
}: {
  donationClient: Pick<DonationClient, 'submitDonation'>;
}) => ({
  getInitialState: (): MobileDonationIdleState => ({
    state: 'idle',
    title: 'Fazer uma doação',
    message: 'Escolhe o valor e o método de pagamento para fazer a tua doação.',
    primaryAction: 'Doar',
  }),

  submitDonation: async (
    input: DonationClientInput,
  ): Promise<MobileDonationSubmittedState | MobileDonationFailedState> => {
    const result = await donationClient.submitDonation(input);

    if (result.ok) {
      return {
        state: 'submitted',
        title: 'Doação recebida!',
        message: 'A tua doação foi processada com sucesso. Obrigado pelo teu apoio!',
        donationId: result.donationId,
        amountCents: result.amountCents,
        currency: result.currency,
        kind: result.kind,
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
