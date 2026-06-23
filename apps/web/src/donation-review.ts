import type {
  DonationStatusClient,
  DonationStatusClientItem,
  DonationStatusClientFailureStatus,
  ReviewDonationClient,
  ReviewDonationClientFailureStatus,
} from '@pic4paws/client';

// ─── Content ──────────────────────────────────────────────────────────────────

export type WebDonationReviewUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webDonationReviewUiContent: WebDonationReviewUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Rever donativo',
  description: 'Aprova ou rejeita o donativo após verificar o comprovativo.',
  states: [
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

export type WebDonationReviewIdleState = {
  state: 'idle';
  title: string;
  donation: DonationStatusClientItem;
};

export type WebDonationReviewApprovingState = {
  state: 'approving';
  title: string;
};

export type WebDonationReviewRejectingState = {
  state: 'rejecting';
  title: string;
};

export type WebDonationReviewApprovedState = {
  state: 'approved';
  title: string;
  message: string;
  donationId: string;
};

export type WebDonationReviewRejectedState = {
  state: 'rejected';
  title: string;
  message: string;
  donationId: string;
};

export type WebDonationReviewWrongStateState = {
  state: 'wrong_state';
  title: string;
  message: string;
  donationId: string;
};

export type WebDonationReviewForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type WebDonationReviewFailureStatus =
  | DonationStatusClientFailureStatus
  | ReviewDonationClientFailureStatus;

export type WebDonationReviewFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: WebDonationReviewFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebDonationReviewState =
  | WebDonationReviewIdleState
  | WebDonationReviewApprovingState
  | WebDonationReviewRejectingState
  | WebDonationReviewApprovedState
  | WebDonationReviewRejectedState
  | WebDonationReviewWrongStateState
  | WebDonationReviewForbiddenState
  | WebDonationReviewFailedState;

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createWebDonationReviewUi = ({
  donationStatusClient,
  reviewDonationClient,
}: {
  donationStatusClient: Pick<DonationStatusClient, 'loadDonationStatus'>;
  reviewDonationClient: Pick<ReviewDonationClient, 'reviewDonation'>;
}) => ({
  loadDonation: async (
    donationId: string,
  ): Promise<
    | WebDonationReviewIdleState
    | WebDonationReviewWrongStateState
    | WebDonationReviewForbiddenState
    | WebDonationReviewFailedState
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

  approveDonation: async (
    donationId: string,
  ): Promise<
    | WebDonationReviewApprovedState
    | WebDonationReviewWrongStateState
    | WebDonationReviewForbiddenState
    | WebDonationReviewFailedState
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

  rejectDonation: async (
    donationId: string,
  ): Promise<
    | WebDonationReviewRejectedState
    | WebDonationReviewWrongStateState
    | WebDonationReviewForbiddenState
    | WebDonationReviewFailedState
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
