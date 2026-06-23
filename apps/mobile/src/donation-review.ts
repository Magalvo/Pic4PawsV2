import type {
  DonationStatusClient,
  DonationStatusClientItem,
  DonationStatusClientFailureStatus,
  ReviewDonationClient,
  ReviewDonationClientFailureStatus,
} from '@pic4paws/client';

// ─── Content ──────────────────────────────────────────────────────────────────

export type MobileDonationReviewUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileDonationReviewUiContent: MobileDonationReviewUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Rever donativo',
  description: 'Aprova ou rejeita o donativo após verificar o comprovativo.',
  states: [
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A obter os detalhes do donativo.',
    },
    {
      state: 'idle',
      title: 'Rever donativo',
      message: 'Verifica o comprovativo e decide se aprovas ou rejeitas o donativo.',
    },
    {
      state: 'approving',
      title: 'A aprovar...',
      message: 'A processar a aprovação do donativo.',
    },
    {
      state: 'rejecting',
      title: 'A rejeitar...',
      message: 'A processar a rejeição do donativo.',
    },
    {
      state: 'approved',
      title: 'Donativo aprovado',
      message: 'O donativo foi aprovado com sucesso.',
    },
    {
      state: 'rejected',
      title: 'Donativo rejeitado',
      message: 'O donativo foi rejeitado.',
    },
    {
      state: 'failed',
      title: 'Não foi possível processar',
      message: 'Ocorreu um erro. Tenta de novo.',
    },
    {
      state: 'forbidden',
      title: 'Sem permissão',
      message: 'Não tens permissão para rever este donativo.',
    },
    {
      state: 'wrong_state',
      title: 'Revisão não permitida',
      message: 'Este donativo não está a aguardar revisão.',
    },
  ],
};

// ─── State types ──────────────────────────────────────────────────────────────

export type MobileDonationReviewIdleState = {
  state: 'idle';
  title: string;
  donation: DonationStatusClientItem;
};

export type MobileDonationReviewApprovingState = {
  state: 'approving';
  title: string;
};

export type MobileDonationReviewRejectingState = {
  state: 'rejecting';
  title: string;
};

export type MobileDonationReviewApprovedState = {
  state: 'approved';
  title: string;
  message: string;
  donationId: string;
};

export type MobileDonationReviewRejectedState = {
  state: 'rejected';
  title: string;
  message: string;
  donationId: string;
};

export type MobileDonationReviewWrongStateState = {
  state: 'wrong_state';
  title: string;
  message: string;
  donationId: string;
};

export type MobileDonationReviewForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type MobileDonationReviewFailureStatus =
  | DonationStatusClientFailureStatus
  | ReviewDonationClientFailureStatus;

export type MobileDonationReviewFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: MobileDonationReviewFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileDonationReviewViewModel =
  | MobileDonationReviewIdleState
  | MobileDonationReviewApprovingState
  | MobileDonationReviewRejectingState
  | MobileDonationReviewApprovedState
  | MobileDonationReviewRejectedState
  | MobileDonationReviewWrongStateState
  | MobileDonationReviewForbiddenState
  | MobileDonationReviewFailedState;

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createMobileDonationReviewUi = ({
  donationStatusClient,
  reviewDonationClient,
}: {
  donationStatusClient: Pick<DonationStatusClient, 'loadDonationStatus'>;
  reviewDonationClient: Pick<ReviewDonationClient, 'reviewDonation'>;
}) => ({
  loadDonation: async (
    donationId: string,
  ): Promise<
    | MobileDonationReviewIdleState
    | MobileDonationReviewWrongStateState
    | MobileDonationReviewForbiddenState
    | MobileDonationReviewFailedState
  > => {
    const result = await donationStatusClient.loadDonationStatus(donationId);

    if (!result.ok) {
      if (result.status === 'forbidden') {
        return {
          state: 'forbidden',
          title: 'Sem permissão',
          message: 'Não tens permissão para rever este donativo.',
        };
      }

      return {
        state: 'failed',
        title: 'Não foi possível carregar',
        message: 'Ocorreu um erro ao carregar o donativo. Tenta de novo.',
        status: result.status,
        reasons: result.reasons,
        canRetry: true,
      };
    }

    if (result.donation.donationStatus !== 'pending_review') {
      return {
        state: 'wrong_state',
        title: 'Revisão não permitida',
        message: 'Este donativo não está a aguardar revisão.',
        donationId,
      };
    }

    return {
      state: 'idle',
      title: 'Rever donativo',
      donation: result.donation,
    };
  },

  approve: async (
    donationId: string,
  ): Promise<
    | MobileDonationReviewApprovedState
    | MobileDonationReviewWrongStateState
    | MobileDonationReviewForbiddenState
    | MobileDonationReviewFailedState
  > => {
    const result = await reviewDonationClient.reviewDonation(donationId, { decision: 'approved' });

    if (!result.ok) {
      if (result.status === 'forbidden') {
        return {
          state: 'forbidden',
          title: 'Sem permissão',
          message: 'Não tens permissão para aprovar este donativo.',
        };
      }

      if (result.status === 'donation_wrong_state') {
        return {
          state: 'wrong_state',
          title: 'Aprovação não permitida',
          message: 'Este donativo não está a aguardar revisão.',
          donationId,
        };
      }

      return {
        state: 'failed',
        title: 'Não foi possível aprovar',
        message: 'Ocorreu um erro ao aprovar o donativo. Tenta de novo.',
        status: result.status,
        reasons: result.reasons,
        canRetry: true,
      };
    }

    return {
      state: 'approved',
      title: 'Donativo aprovado',
      message: 'O donativo foi aprovado. O doador foi notificado.',
      donationId,
    };
  },

  reject: async (
    donationId: string,
  ): Promise<
    | MobileDonationReviewRejectedState
    | MobileDonationReviewWrongStateState
    | MobileDonationReviewForbiddenState
    | MobileDonationReviewFailedState
  > => {
    const result = await reviewDonationClient.reviewDonation(donationId, { decision: 'rejected' });

    if (!result.ok) {
      if (result.status === 'forbidden') {
        return {
          state: 'forbidden',
          title: 'Sem permissão',
          message: 'Não tens permissão para rejeitar este donativo.',
        };
      }

      if (result.status === 'donation_wrong_state') {
        return {
          state: 'wrong_state',
          title: 'Rejeição não permitida',
          message: 'Este donativo não está a aguardar revisão.',
          donationId,
        };
      }

      return {
        state: 'failed',
        title: 'Não foi possível rejeitar',
        message: 'Ocorreu um erro ao rejeitar o donativo. Tenta de novo.',
        status: result.status,
        reasons: result.reasons,
        canRetry: true,
      };
    }

    return {
      state: 'rejected',
      title: 'Donativo rejeitado',
      message: 'O donativo foi rejeitado.',
      donationId,
    };
  },
});
